import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { AppException, ERROR_CODES } from '../../common/errors';
import { PrismaService } from '../../prisma/prisma.service';
import { AvisStatut, RoleCode, SignalementStatut } from '../../generated/prisma';
import { AvisService } from './avis.service';
import type { DecisionAvisDto } from './dto/decision-avis.dto';

/** Ce que voit un modérateur — contact de l'auteur compris, jamais le public. */
const SELECTION_MODERATION = {
  id: true,
  auteur_nom: true,
  auteur_contact: true,
  note: true,
  commentaire: true,
  statut: true,
  verifie: true,
  en_avant: true,
  decision_motif: true,
  reponse: true,
  depose_le: true,
  modere_le: true,
  etablissement: { select: { id: true, nom: true, slug: true } },
  moderateur: { select: { name: true } },
  signalements: {
    select: { id: true, motif: true, statut: true, signale_le: true },
    orderBy: { signale_le: 'desc' as const },
  },
} as const;

/**
 * Modération des avis — livrable 11 §3.3, RG06, RG07, RG08.
 *
 * AUCUN AVIS NE PARAÎT SANS DÉCISION HUMAINE (RG06). C'est l'engagement le
 * plus exposé du produit : un annuaire payé par les établissements qui
 * publierait les avis sans relecture serait soupçonné de les filtrer à
 * l'avantage de ses clients — et un qui les filtrerait vraiment le mériterait.
 * D'où la trace systématique : chaque décision porte son auteur, sa date et,
 * au rejet, son motif.
 *
 * LA NOTE EST RECALCULÉE DANS LA MÊME TRANSACTION QUE LA DÉCISION (RG08). Une
 * moyenne qui ne correspondrait pas aux avis affichés est pire qu'une moyenne
 * absente : elle se remarque, et elle ne s'explique pas.
 */
@Injectable()
export class ModerationAvisService {
  constructor(
    private readonly db: PrismaService,
    private readonly avis: AvisService,
    private readonly audit: AuditService,
  ) {}

  /**
   * File de modération.
   *
   * Les plus anciens d'abord : un avis qui attend depuis trois semaines doit
   * remonter, pas se faire doubler par celui déposé ce matin.
   */
  lister(statut?: AvisStatut) {
    return this.db.avis.findMany({
      where: statut ? { statut } : {},
      orderBy: [{ statut: 'asc' }, { depose_le: 'asc' }],
      select: SELECTION_MODERATION,
    });
  }

  /** Compteur de la pastille du menu — avis en attente de décision. */
  compterEnAttente() {
    return this.db.avis.count({ where: { statut: AvisStatut.en_attente } });
  }

  /**
   * Publie ou rejette un avis.
   *
   * UN REJET EXIGE UN MOTIF, comme le refus d'un article : c'est ce qui rend
   * la modération auditable. Sans lui, « rejeté » et « censuré » deviennent
   * indistinguables dans le journal.
   */
  async decider(id: bigint, dto: DecisionAvisDto, adminId: bigint) {
    return this.db.$transaction(async (tx) => {
      const avis = await tx.avis.findUnique({
        where: { id },
        select: { id: true, statut: true, etablissement_id: true, auteur_nom: true, note: true },
      });

      if (!avis) {
        throw new AppException(
          HttpStatus.NOT_FOUND,
          ERROR_CODES.RESSOURCE_INTROUVABLE,
          "Cet avis n'existe pas.",
        );
      }

      if (avis.statut === dto.decision) {
        throw new AppException(
          HttpStatus.CONFLICT,
          ERROR_CODES.CONFLIT_METIER,
          'Cet avis porte déjà cette décision.',
        );
      }

      const publie = dto.decision === AvisStatut.publie;

      const misAJour = await tx.avis.update({
        where: { id },
        data: {
          statut: dto.decision,
          modere_par: adminId,
          modere_le: new Date(),
          decision_motif: publie ? null : dto.motif,
          // Un avis rejeté ne peut pas rester en avant sur l'accueil.
          en_avant: publie ? undefined : false,
        },
        select: SELECTION_MODERATION,
      });

      // Décider un avis CLÔT SES SIGNALEMENTS : le modérateur vient de
      // trancher, laisser les alertes ouvertes ferait reparaître l'avis dans
      // la file au prochain rechargement (RG07).
      await tx.signalement.updateMany({
        where: { avis_id: id, statut: SignalementStatut.nouveau },
        data: { statut: SignalementStatut.traite },
      });

      await this.avis.recalculerNote(tx, avis.etablissement_id);

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: publie ? 'avis.publie' : 'avis.rejete',
        cibleType: 'avis',
        cibleId: id,
        severite: publie ? undefined : 'avertissement',
        details: publie
          ? { auteur: avis.auteur_nom, note: avis.note }
          : { auteur: avis.auteur_nom, note: avis.note, motif: dto.motif },
      });

      return misAJour;
    });
  }

  /**
   * Met un avis en avant sur l'accueil, ou l'en retire (RG27).
   *
   * Seul un avis PUBLIÉ peut l'être : mettre en avant un avis en attente
   * reviendrait à le publier par une porte dérobée, sans décision de
   * modération.
   */
  async basculerEnAvant(id: bigint, enAvant: boolean, adminId: bigint): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const avis = await tx.avis.findUnique({ where: { id }, select: { statut: true } });

      if (!avis) {
        throw new AppException(
          HttpStatus.NOT_FOUND,
          ERROR_CODES.RESSOURCE_INTROUVABLE,
          "Cet avis n'existe pas.",
        );
      }

      if (enAvant && avis.statut !== AvisStatut.publie) {
        throw new AppException(
          HttpStatus.CONFLICT,
          ERROR_CODES.CONFLIT_METIER,
          'Seul un avis publié peut être mis en avant.',
        );
      }

      await tx.avis.update({ where: { id }, data: { en_avant: enAvant } });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: enAvant ? 'avis.mis_en_avant' : 'avis.retire_de_lavant',
        cibleType: 'avis',
        cibleId: id,
      });
    });
  }
}
