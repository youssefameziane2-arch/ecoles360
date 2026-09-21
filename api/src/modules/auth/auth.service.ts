import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// @node-rs/argon2 plutôt que le paquet `argon2` : même algorithme Argon2id,
// mais des binaires précompilés pour linux-musl. Le paquet natif n'en publie
// pas et tentait de compiler dans l'image, qui n'a ni Python ni g++ — la
// construction échouait (docs/BACKLOG.md, B-20).
import { Algorithm, hash, verify } from '@node-rs/argon2';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { AppException, ERROR_CODES } from '../../common/errors';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { PermissionPortee, UserStatut, type RoleCode } from '../../generated/prisma';
import { prefixeSession } from './session.constants';
import type { UtilisateurAuthentifie } from './session.types';

/**
 * Haché Argon2id d'un mot de passe qui n'existe pas.
 *
 * Vérifié quand l'adresse est inconnue, pour que la réponse coûte le même
 * temps qu'une vérification réelle. Sans lui, un e-mail inconnu répondrait en
 * une milliseconde et un e-mail connu en cinquante : la seule durée suffirait
 * à distinguer les comptes inscrits.
 */
const HACHE_FACTICE =
  '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$5xLEvKQBOgpuGBLPqLMYQvnBXYRPTcEMFqoW+3xhKFo';

/** Durée de vie d'un jeton de réinitialisation — livrable 7 §6. */
const TTL_JETON_RESET_MS = 60 * 60 * 1000;

/**
 * Authentification — livrable 11 §2.
 *
 * Passport + sessions Redis. Deux principes gouvernent ce service.
 *
 * L'IDENTITÉ EST RECHARGÉE, JAMAIS MÉMORISÉE. La session ne contient qu'un
 * identifiant ; rôle, portées et rattachement sont relus en base à chaque
 * requête. Recopier ces valeurs dans le cookie les figerait à l'ouverture de
 * session — une portée révoquée ou un compte suspendu resteraient actifs
 * jusqu'à la reconnexion, ce que la RG25 interdit explicitement.
 *
 * LES ÉCHECS D'AUTHENTIFICATION NE RENSEIGNENT PAS L'ATTAQUANT. Mot de passe
 * faux, e-mail inconnu, compte suspendu : même réponse, même code, même temps
 * de calcul. Un message plus précis transformerait le formulaire de connexion
 * en outil d'énumération de comptes.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Vérifie un couple e-mail / mot de passe.
   *
   * Retourne l'identité complète ou lève un 401 indifférencié.
   */
  async validerIdentifiants(email: string, motDePasse: string): Promise<UtilisateurAuthentifie> {
    const utilisateur = await this.db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { role: true },
    });

    // Compte inexistant : on vérifie quand même un haché factice. Sans cela, la
    // réponse reviendrait en une milliseconde au lieu de cinquante, et la seule
    // durée suffirait à distinguer un e-mail connu d'un e-mail inconnu.
    if (!utilisateur) {
      await this.hachageFactice();
      throw this.identifiantsInvalides();
    }

    const correspond = await verify(utilisateur.passwordHash, motDePasse).catch(() => false);

    if (!correspond) {
      throw this.identifiantsInvalides();
    }

    // Compte suspendu : il conserve ses données mais perd tout accès (RG25).
    // Réponse identique à un mot de passe faux — l'état d'un compte n'a pas à
    // être déductible depuis l'écran de connexion.
    if (utilisateur.statut === UserStatut.suspendu) {
      throw this.identifiantsInvalides();
    }

    await this.db.user.update({
      where: { id: utilisateur.id },
      data: { derniere_connexion_le: new Date() },
    });

    return this.chargerIdentite(utilisateur.id);
  }

  /**
   * Recharge l'identité depuis la base — appelé à CHAQUE requête authentifiée.
   *
   * Retourne `null` si le compte a disparu ou a été suspendu depuis l'ouverture
   * de session : c'est le point exact où une révocation prend effet.
   */
  async chargerIdentite(userId: bigint): Promise<UtilisateurAuthentifie> {
    const utilisateur = await this.db.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        role: true,
        permissions: { where: { revoquee_le: null } }, // RG05 — révocation immédiate
        etablissementsPossedes: { select: { id: true }, take: 1 },
      },
    });

    // Un établissement est rattaché soit parce qu'il possède la fiche (compte
    // établissement), soit par `etablissement_rattache_id` (secrétariat, RG25).
    const etablissementId =
      utilisateur.etablissement_rattache_id ?? utilisateur.etablissementsPossedes[0]?.id ?? null;

    return {
      userId: utilisateur.id,
      email: utilisateur.email,
      role: utilisateur.role.code,
      permissions: utilisateur.permissions.map((permission) => permission.portee),
      etablissementId,
    };
  }

  /** `true` si le compte est toujours actif — contrôlé à chaque requête (RG25). */
  async compteActif(userId: bigint): Promise<boolean> {
    const utilisateur = await this.db.user.findUnique({
      where: { id: userId },
      select: { statut: true },
    });

    return utilisateur?.statut === UserStatut.actif;
  }

  // ---------------------------------------------------------------------------
  //  Réinitialisation de mot de passe (RG25, livrable 7 §6)
  // ---------------------------------------------------------------------------

  /**
   * Émet un jeton de réinitialisation à usage unique, TTL 1 h.
   *
   * Ne dit JAMAIS si l'adresse existe : la réponse du controller est identique
   * dans les deux cas. Un formulaire de mot de passe oublié qui distingue les
   * deux est un annuaire de comptes offert à qui le demande.
   *
   * Seul le HACHÉ du jeton est stocké. Une fuite de la table ne permet donc pas
   * de réinitialiser un mot de passe — c'est le même raisonnement que pour les
   * mots de passe eux-mêmes.
   */
  async demanderReinitialisation(email: string): Promise<string | null> {
    const utilisateur = await this.db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, statut: true },
    });

    if (!utilisateur || utilisateur.statut === UserStatut.suspendu) {
      return null;
    }

    const jeton = randomBytes(32).toString('hex');

    // Les jetons encore valides du compte sont consommés : une nouvelle demande
    // doit invalider la précédente, sinon un lien intercepté reste utilisable.
    await this.db.passwordResetToken.updateMany({
      where: { user_id: utilisateur.id, utilise_le: null },
      data: { utilise_le: new Date() },
    });

    await this.db.passwordResetToken.create({
      data: {
        user_id: utilisateur.id,
        token_hash: this.hacherJeton(jeton),
        expire_le: new Date(Date.now() + TTL_JETON_RESET_MS),
      },
    });

    this.logger.log(`Jeton de réinitialisation émis pour le compte ${utilisateur.id}`);

    // Le jeton est retourné au controller, qui le confiera à la file `mail`
    // (livrable 11 §6). Il n'est jamais journalisé.
    return jeton;
  }

  /**
   * Consomme un jeton et remplace le mot de passe.
   *
   * Les sessions actives du compte sont DÉTRUITES (RG25) : le titulaire d'un
   * cookie volé perd l'accès au moment même où la victime reprend la main.
   * C'est la raison d'être des sessions en Redis plutôt qu'en cookie signé.
   */
  async reinitialiserMotDePasse(jeton: string, nouveauMotDePasse: string): Promise<void> {
    const enregistrement = await this.db.passwordResetToken.findUnique({
      where: { token_hash: this.hacherJeton(jeton) },
    });

    const invalide =
      !enregistrement ||
      enregistrement.utilise_le !== null ||
      enregistrement.expire_le < new Date();

    if (invalide) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ECHOUEE,
        'Ce lien de réinitialisation est invalide ou a expiré. Demandez-en un nouveau.',
      );
    }

    await this.db.$transaction([
      this.db.user.update({
        where: { id: enregistrement.user_id },
        data: { passwordHash: await hash(nouveauMotDePasse, { algorithm: Algorithm.Argon2id }) },
      }),
      // Usage unique : consommé dans la même transaction que le changement, pour
      // qu'un double envoi ne puisse pas réinitialiser deux fois.
      this.db.passwordResetToken.update({
        where: { id: enregistrement.id },
        data: { utilise_le: new Date() },
      }),
    ]);

    await this.revoquerSessions(enregistrement.user_id);

    this.logger.warn(`Mot de passe réinitialisé pour le compte ${enregistrement.user_id}`);
  }

  /**
   * Détruit toutes les sessions Redis d'un compte (RG25).
   *
   * Appelée à la réinitialisation d'un mot de passe et à la suspension d'un
   * compte. Le balayage passe par `SCAN` et non `KEYS` : `KEYS` bloque Redis le
   * temps de parcourir l'espace de clés entier, ce qui, sur une instance qui
   * porte aussi les files BullMQ et le cache, suspendrait tout le service.
   */
  async revoquerSessions(userId: bigint): Promise<number> {
    const prefixe = prefixeSession(this.config);
    const client = this.redis.instance;
    const cible = userId.toString();

    let curseur = '0';
    let detruites = 0;

    do {
      const [suivant, cles] = await client.scan(curseur, 'MATCH', `${prefixe}*`, 'COUNT', 200);
      curseur = suivant;

      for (const cle of cles) {
        const brut = await client.get(cle);

        if (brut && this.sessionAppartientA(brut, cible)) {
          await client.del(cle);
          detruites += 1;
        }
      }
    } while (curseur !== '0');

    if (detruites > 0) {
      this.logger.warn(`${detruites} session(s) révoquée(s) pour le compte ${cible}`);
    }

    return detruites;
  }

  // ---------------------------------------------------------------------------
  //  Outillage interne
  // ---------------------------------------------------------------------------

  /** Vrai si la charge utile de session désigne ce compte. */
  private sessionAppartientA(brut: string, userId: string): boolean {
    try {
      const donnees = JSON.parse(brut) as { passport?: { user?: { userId?: string } } };
      return donnees.passport?.user?.userId === userId;
    } catch {
      // Une session illisible n'est pas la nôtre : on la laisse expirer plutôt
      // que de supprimer une clé dont on ignore la nature.
      return false;
    }
  }

  private hacherJeton(jeton: string): string {
    // SHA-256 et non Argon2 : le jeton est déjà 32 octets aléatoires, il n'a
    // pas la faible entropie d'un mot de passe choisi par un humain. Un hachage
    // lent ici ne protégerait de rien et ralentirait chaque vérification.
    return createHash('sha256').update(jeton).digest('hex');
  }

  /**
   * Consomme le même temps qu'une vérification réelle, sur un compte inexistant.
   */
  private async hachageFactice(): Promise<void> {
    await verify(HACHE_FACTICE, 'mot-de-passe-factice').catch(() => false);
  }

  private identifiantsInvalides(): AppException {
    return new AppException(
      HttpStatus.UNAUTHORIZED,
      ERROR_CODES.NON_AUTHENTIFIE,
      'Identifiants incorrects.',
    );
  }

  /** Comparaison à temps constant — utilisée par la vérification CSRF. */
  static comparerEnTempsConstant(attendu: string, recu: string): boolean {
    const a = Buffer.from(attendu);
    const b = Buffer.from(recu);

    return a.length === b.length && timingSafeEqual(a, b);
  }
}

/** Portées connues — réexportées pour les guards et les décorateurs. */
export { PermissionPortee, type RoleCode };
