import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AppException, ERROR_CODES } from '../../common/errors';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, PropositionStatut, RoleCode, type Prisma } from '../../generated/prisma';
import type { ProposerFicheDto } from './dto/proposer-fiche.dto';

/**
 * Champs de la fiche qu'une proposition peut porter — miroir de
 * `ProposerFicheDto`.
 *
 * EXPORTÉE, ET CE N'EST PAS UNE COMMODITÉ. Le back-office écrit le même
 * profil directement (`AdminEtablissementsService.ecrireProfil`) : deux
 * whitelists finiraient par diverger, et c'est celle qu'on oublierait de
 * mettre à jour qui laisserait passer un attribut de plateforme (RG27).
 */
export const CHAMPS_PROPOSABLES = [
  'nom',
  'description',
  'adresse',
  'quartier',
  'tel',
  'whatsapp',
  'email',
  'budget_min',
  'budget_max',
  'chiffres',
  'faq',
  'horaires',
  'socials',
  'autres_projets',
  'facilites',
  'equipe',
  'video_url',
  'gamme_label',
  'devis_label',
  'langues',
  'site_web',
  'projet_pedagogique',
] as const;

interface DiffChamp {
  avant: unknown;
  apres: unknown;
}

/**
 * `FicheProposalService` — livrable 11 §3.2/§3.4/§4, RG20, RG27.
 *
 * TOUTE MODIFICATION DE FICHE PAR SON PROPRIÉTAIRE PASSE PAR UNE PROPOSITION,
 * JAMAIS PAR UNE ÉCRITURE DIRECTE. C'est la différence entre « publié » et
 * « proposé » : un établissement ne peut jamais faire apparaître un contenu
 * sur le site public sans qu'un Super Admin l'ait vu. Seul `PUT
 * /admin/etablissements/{id}` (admin) écrit directement (hors périmètre de
 * cette passe).
 *
 * UNE SEULE PROPOSITION EN ATTENTE PAR ÉTABLISSEMENT (RG27) — garantie sous
 * verrou de ligne, PAS par un index unique partiel (indisponible en MySQL 8).
 * Le verrou porte sur la ligne `etablissements`, pas sur les lignes
 * `propositions_fiche` : verrouiller des lignes qui n'existent pas encore ne
 * verrouille rien — un « SELECT … FOR UPDATE » sans résultat ne bloque aucune
 * transaction concurrente. Verrouiller l'établissement, qui existe toujours,
 * sérialise correctement deux dépôts simultanés.
 */
@Injectable()
export class FicheProposalService {
  private readonly logger = new Logger(FicheProposalService.name);

  constructor(
    private readonly db: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async proposer(
    etablissementId: bigint,
    auteurId: bigint,
    roleActeur: RoleCode,
    dto: ProposerFicheDto,
  ) {
    const proposition = await this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM etablissements WHERE id = ${etablissementId} FOR UPDATE`;

      const dejaEnAttente = await tx.propositionFiche.findFirst({
        where: { etablissement_id: etablissementId, statut: PropositionStatut.en_attente },
        select: { id: true },
      });

      if (dejaEnAttente) {
        throw new AppException(
          HttpStatus.CONFLICT,
          ERROR_CODES.CONFLIT_METIER,
          'Une modification est déjà en attente de validation pour cette fiche.',
        );
      }

      const actuelle = await tx.etablissement.findUniqueOrThrow({
        where: { id: etablissementId },
        select: Object.fromEntries(CHAMPS_PROPOSABLES.map((champ) => [champ, true])),
      });

      const champsModifies = this.calculerDiff(actuelle, dto);

      if (Object.keys(champsModifies).length === 0) {
        throw new AppException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ERROR_CODES.VALIDATION_ECHOUEE,
          'Aucune modification à proposer : les valeurs envoyées sont identiques à la fiche actuelle.',
        );
      }

      const proposition = await tx.propositionFiche.create({
        data: {
          etablissement_id: etablissementId,
          proposee_par: auteurId,
          champs_modifies: champsModifies as unknown as Prisma.InputJsonValue,
          payload: dto as unknown as Prisma.InputJsonValue,
        },
      });

      await this.audit.journaliser(tx, {
        userId: auteurId,
        roleActeur,
        action: 'proposition_fiche.creee',
        cibleType: 'etablissement',
        cibleId: etablissementId,
        details: { proposition_id: proposition.id.toString(), champs: Object.keys(champsModifies) },
      });

      this.logger.log(
        `Proposition ${proposition.id} créée pour l'établissement ${etablissementId}`,
      );

      return proposition;
    });

    /**
     * APRÈS LA TRANSACTION, ET SANS POUVOIR LA ROMPRE. La proposition est le
     * bien : elle attend déjà dans la file, et la pastille de l'écran la
     * compte. La notification ne fait qu'avancer le moment où on la voit.
     *
     * LE NOM DE L'ÉTABLISSEMENT, PAS SON IDENTIFIANT : une notification se lit
     * hors de l'écran qui donnerait le contexte.
     */
    await this.notifications.sansRompre(async () => {
      const fiche = await this.db.etablissement.findUnique({
        where: { id: etablissementId },
        select: { nom: true },
      });

      await this.notifications.pourAdministration(
        this.db,
        NotificationType.proposition_fiche,
        `${fiche?.nom ?? 'Un établissement'} propose une modification de sa fiche.`,
      );
    });

    return proposition;
  }

  /** Annulation par l'auteur, tant qu'elle est en attente (avenant 3). */
  async annuler(etablissementId: bigint, propositionId: bigint, auteurId: bigint): Promise<void> {
    const proposition = await this.db.propositionFiche.findFirst({
      where: {
        id: propositionId,
        etablissement_id: etablissementId,
        proposee_par: auteurId,
        statut: PropositionStatut.en_attente,
      },
      select: { id: true },
    });

    if (!proposition) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cette proposition n'existe pas, n'est plus en attente, ou n'est pas la vôtre.",
      );
    }

    await this.db.propositionFiche.update({
      where: { id: propositionId },
      data: { statut: PropositionStatut.rejetee, annulee_le: new Date() },
    });
  }

  /** Proposition en attente d'un établissement, pour l'écran fiche (statut affiché). */
  async enAttentePour(etablissementId: bigint) {
    return this.db.propositionFiche.findFirst({
      where: { etablissement_id: etablissementId, statut: PropositionStatut.en_attente },
      orderBy: { proposee_le: 'desc' },
    });
  }

  /** File des propositions en attente — écran admin (livrable 11 §3.4). */
  async listerEnAttente() {
    return this.db.propositionFiche.findMany({
      where: { statut: PropositionStatut.en_attente },
      orderBy: { proposee_le: 'asc' },
      include: {
        etablissement: { select: { id: true, nom: true, slug: true } },
        auteur: { select: { id: true, email: true } },
      },
    });
  }

  /**
   * Approuve intégralement une proposition : applique `payload` à la fiche et
   * publie (RG20). L'approbation partielle, champ par champ, vue dans la
   * maquette, n'est pas construite dans cette passe — approuver publie le
   * payload complet, refuser ne publie rien.
   */
  async approuver(propositionId: bigint, adminId: bigint): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const proposition = await tx.propositionFiche.findFirst({
        where: { id: propositionId, statut: PropositionStatut.en_attente },
      });

      if (!proposition) {
        throw new AppException(
          HttpStatus.NOT_FOUND,
          ERROR_CODES.RESSOURCE_INTROUVABLE,
          "Cette proposition n'existe pas ou a déjà été traitée.",
        );
      }

      await tx.etablissement.update({
        where: { id: proposition.etablissement_id },
        data: proposition.payload as Record<string, unknown>,
      });

      await tx.propositionFiche.update({
        where: { id: propositionId },
        data: { statut: PropositionStatut.validee, validee_par: adminId, traitee_le: new Date() },
      });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'proposition_fiche.approuvee',
        cibleType: 'etablissement',
        cibleId: proposition.etablissement_id,
        details: { proposition_id: propositionId.toString() },
      });
    });
  }

  async refuser(propositionId: bigint, adminId: bigint, motif: string): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const proposition = await tx.propositionFiche.findFirst({
        where: { id: propositionId, statut: PropositionStatut.en_attente },
      });

      if (!proposition) {
        throw new AppException(
          HttpStatus.NOT_FOUND,
          ERROR_CODES.RESSOURCE_INTROUVABLE,
          "Cette proposition n'existe pas ou a déjà été traitée.",
        );
      }

      await tx.propositionFiche.update({
        where: { id: propositionId },
        data: {
          statut: PropositionStatut.rejetee,
          decision_motif: motif,
          validee_par: adminId,
          traitee_le: new Date(),
        },
      });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'proposition_fiche.refusee',
        cibleType: 'etablissement',
        cibleId: proposition.etablissement_id,
        details: { proposition_id: propositionId.toString(), motif },
      });
    });
  }

  /** Ne retient que les champs réellement différents — c'est le contenu du diff admin. */
  private calculerDiff(
    actuelle: Record<string, unknown>,
    dto: ProposerFicheDto,
  ): Record<string, DiffChamp> {
    const diff: Record<string, DiffChamp> = {};

    for (const champ of CHAMPS_PROPOSABLES) {
      const valeur = (dto as Record<string, unknown>)[champ];

      if (valeur === undefined) continue;

      const avant = actuelle[champ] ?? null;

      if (JSON.stringify(avant) !== JSON.stringify(valeur)) {
        diff[champ] = { avant, apres: valeur };
      }
    }

    return diff;
  }
}
