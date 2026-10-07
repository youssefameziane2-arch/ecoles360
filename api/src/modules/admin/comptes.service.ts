import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Algorithm, hash } from '@node-rs/argon2';
import { randomBytes } from 'node:crypto';
import { AuditService } from '../../common/audit/audit.service';
import { AppException, ERROR_CODES } from '../../common/errors';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { RoleCode, UserStatut } from '../../generated/prisma';
import { CreerCompteDto } from './dto/creer-compte.dto';

/**
 * Création et réinitialisation des comptes de personnel — écrans
 * `isAdminUsers` et `isAdminCommerciaux`.
 *
 * QUI A LE DROIT DE CRÉER : l'administration, et elle seule. Ce n'est pas une
 * règle inventée — les notes du client du 28 septembre 2026 l'écrivent :
 * « l'admin, lorsqu'il ajoute le secrétaire, il lui donne du privilège ».
 *
 * COMMENT LE MOT DE PASSE ATTEINT SON TITULAIRE — la question qui bloquait cet
 * écran. Il est TIRÉ AU SORT et rendu UNE SEULE FOIS, à l'administrateur qui
 * vient de créer le compte, à charge pour lui de le transmettre. Ce n'est pas
 * la meilleure réponse possible : un lien de première connexion envoyé par
 * courriel vaudrait mieux, et c'est ce qu'il faudra faire. Mais il n'y a aucun
 * envoi d'e-mail dans ce projet, et c'est exactement la convention déjà posée
 * par `compte:creer` en ligne de commande — un seul usage, jamais stocké en
 * clair, la base n'en gardant qu'un hachage Argon2id.
 *
 * LE MOT DE PASSE N'EST PAS JOURNALISÉ, et ne doit jamais l'être. Le journal
 * garde qui a créé quel compte, pour quel rôle ; il ne garde pas le secret.
 */
@Injectable()
export class ComptesService {
  private readonly logger = new Logger('Comptes');

  constructor(
    private readonly db: PrismaService,
    private readonly audit: AuditService,
    private readonly auth: AuthService,
  ) {}

  async creer(dto: CreerCompteDto, adminId: bigint) {
    const email = dto.email.trim().toLowerCase();

    const existant = await this.db.user.findUnique({ where: { email }, select: { id: true } });

    if (existant) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ERROR_CODES.CONFLIT_METIER,
        'Un compte existe déjà avec cette adresse.',
      );
    }

    const role = await this.db.role.findUniqueOrThrow({ where: { code: dto.role } });

    /**
     * LE RATTACHEMENT N'EST ACCEPTÉ QUE POUR UN SECRÉTARIAT. Posé sur un
     * commercial, il n'aurait aucun effet — aucune de ses routes ne le lit —
     * mais laisserait croire, en relisant la base, qu'un commercial « est » à
     * une école. Le silence serait pire que le refus.
     */
    if (dto.etablissement_id && dto.role !== RoleCode.secretariat) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ECHOUEE,
        'Seul un compte de secrétariat se rattache à un établissement.',
      );
    }

    let rattachement: bigint | null = null;

    if (dto.etablissement_id) {
      const etablissement = await this.db.etablissement.findUnique({
        where: { id: BigInt(dto.etablissement_id) },
        select: { id: true },
      });

      if (!etablissement) {
        throw new AppException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ERROR_CODES.VALIDATION_ECHOUEE,
          "Cet établissement n'existe pas.",
        );
      }

      rattachement = etablissement.id;
    }

    const motDePasse = this.motDePasseTireAuSort();

    const compte = await this.db.$transaction(async (tx) => {
      const cree = await tx.user.create({
        data: {
          email,
          name: dto.nom.trim(),
          role_id: role.id,
          passwordHash: await hash(motDePasse, { algorithm: Algorithm.Argon2id }),
          statut: UserStatut.actif,
          telephone: dto.telephone?.trim() || null,
          etablissement_rattache_id: rattachement,
        },
        select: { id: true, email: true, name: true },
      });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'compte.cree',
        cibleType: 'user',
        cibleId: cree.id,
        // Le rôle et le rattachement, jamais le mot de passe.
        details: {
          email: cree.email,
          role: dto.role,
          etablissement_rattache: rattachement?.toString() ?? null,
        },
      });

      return cree;
    });

    this.logger.log(`Compte créé : ${compte.email} (${dto.role})`);

    /**
     * UN SECRÉTARIAT NAÎT SANS AUCUNE PORTÉE (RG05). Lui en accorder
     * d'office — même les trois — déciderait à la place de l'administrateur ce
     * qu'il délègue, alors que c'est précisément le geste que l'écran lui
     * demande ensuite, ligne par ligne.
     */
    return { ...compte, mot_de_passe: motDePasse };
  }

  /**
   * Réinitialise le mot de passe d'un compte de personnel.
   *
   * LES SESSIONS EN COURS SONT DÉTRUITES. Réinitialiser parce qu'un mot de
   * passe a fuité et laisser vivre la session ouverte avec lui ne protégerait
   * de rien — c'est la même exigence que la suspension (RG25).
   */
  async reinitialiser(userId: bigint, adminId: bigint) {
    const compte = await this.db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: { select: { code: true } } },
    });

    if (!compte) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Ce compte n'existe pas.",
      );
    }

    /**
     * PAS SUR UN SUPERADMIN. Un administrateur qui pourrait réinitialiser le
     * mot de passe d'un autre administrateur prendrait son compte ; la
     * commande en ligne reste le chemin, et elle suppose un accès au serveur.
     */
    if (compte.role.code === RoleCode.superadmin) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        ERROR_CODES.ACCES_REFUSE,
        'Le mot de passe d’un administrateur se réinitialise depuis le serveur, par « compte:creer ».',
      );
    }

    const motDePasse = this.motDePasseTireAuSort();

    await this.db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: compte.id },
        data: { passwordHash: await hash(motDePasse, { algorithm: Algorithm.Argon2id }) },
      });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'compte.mot_de_passe_reinitialise',
        cibleType: 'user',
        cibleId: compte.id,
        details: { email: compte.email },
      });
    });

    await this.auth.revoquerSessions(compte.id);

    this.logger.log(`Mot de passe réinitialisé : ${compte.email}`);

    return { id: compte.id, email: compte.email, nom: compte.name, mot_de_passe: motDePasse };
  }

  /**
   * 24 caractères tirés au sort, en base64url.
   *
   * NI RÈGLE DE COMPLEXITÉ NI CHOIX HUMAIN : on ne juge pas de la « force »
   * d'un mot de passe composé à la hâte le jour d'une mise en service. Du
   * hasard cryptographique vaut mieux que n'importe quelle politique.
   */
  private motDePasseTireAuSort(): string {
    return randomBytes(18).toString('base64url');
  }
}
