import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AppException, ERROR_CODES } from '../../common/errors';
import { Page } from '../../common/interceptors';
import { PrismaService } from '../../prisma/prisma.service';
import { AvisStatut, EtablissementStatut, SignalementStatut } from '../../generated/prisma';
import type { DeposerAvisDto } from './dto/deposer-avis.dto';
import type { SignalerAvisDto } from './dto/signaler-avis.dto';

/** 10 avis par page sur la fiche publique. */
const PAR_PAGE = 10;

/**
 * Avis et signalements — livrable 11 §3.1, RG06 à RG08.
 *
 * Trois invariants, et chacun protège quelqu'un.
 *
 * UN AVIS N'EST JAMAIS PUBLIÉ DIRECTEMENT (RG06). Il naît `en_attente` et
 * attend une décision humaine. C'est ce qui protège un établissement d'une
 * campagne de dénigrement, et un parent d'un faux avis élogieux.
 *
 * UNE SEULE RÉPONSE PAR AVIS (RG07). L'établissement répond une fois ; il ne
 * peut pas transformer le fil en tribune ni réécrire sa réponse après coup.
 *
 * LA NOTE EST RECALCULÉE DANS LA MÊME TRANSACTION QUE LA DÉCISION (RG08). La
 * dénormalisation `note_moy` / `nb_avis` existe pour la recherche ; si elle
 * était recalculée à part, une panne entre les deux écritures laisserait une
 * fiche affichant une note qui ne correspond à aucun avis.
 */
@Injectable()
export class AvisService {
  private readonly logger = new Logger(AvisService.name);

  constructor(private readonly db: PrismaService) {}

  /**
   * Avis publiés d'une fiche — les seuls visibles (RG06).
   *
   * `auteur_contact` n'est JAMAIS projeté : c'est une donnée personnelle
   * collectée pour la vérification, pas pour l'affichage (loi 09-08).
   */
  async publies(slug: string, page = 1): Promise<Page<AvisPublic>> {
    const etablissement = await this.fichePubliee(slug);

    const where = { etablissement_id: etablissement.id, statut: AvisStatut.publie };

    const [total, lignes] = await this.db.$transaction([
      this.db.avis.count({ where }),
      this.db.avis.findMany({
        where,
        orderBy: [{ en_avant: 'desc' }, { depose_le: 'desc' }],
        skip: (page - 1) * PAR_PAGE,
        take: PAR_PAGE,
        select: {
          id: true,
          auteur_nom: true,
          note: true,
          commentaire: true,
          verifie: true,
          en_avant: true,
          reponse: true,
          reponse_le: true,
          depose_le: true,
        },
      }),
    ]);

    return new Page(lignes, total, page, PAR_PAGE);
  }

  /**
   * Dépôt d'un avis par un parent, sans compte (RG06).
   *
   * Créé `en_attente` — aucun chemin ne permet de naître publié.
   */
  /**
   * Avis mis en avant sur l'accueil (RG27).
   *
   * CHOISIS PAR L'ADMINISTRATEUR, pas par un algorithme : la maquette réserve
   * trois emplacements sur l'accueil, et c'est une décision éditoriale.
   * Prendre « les trois meilleures notes » reviendrait à afficher trois fois
   * cinq étoiles, ce qu'aucun parent ne croit.
   *
   * Filtré sur `publie` en plus de `en_avant` : un avis retiré par la
   * modération ne doit pas survivre sur l'accueil parce qu'il y avait été
   * épinglé avant (le service de modération l'enlève déjà, ce filtre est la
   * ceinture qui double la bretelle).
   */
  async enAvant() {
    const avis = await this.db.avis.findMany({
      where: {
        en_avant: true,
        statut: AvisStatut.publie,
        etablissement: { statut: EtablissementStatut.validee },
      },
      orderBy: { depose_le: 'desc' },
      take: 3,
      select: {
        id: true,
        auteur_nom: true,
        note: true,
        commentaire: true,
        depose_le: true,
        etablissement: { select: { nom: true, slug: true } },
      },
    });

    // Le contact de l'auteur n'est jamais sélectionné ici (loi 09-08).
    return avis.map((a) => ({ ...a, id: a.id.toString() }));
  }

  async deposer(slug: string, dto: DeposerAvisDto): Promise<{ id: bigint; statut: AvisStatut }> {
    const etablissement = await this.fichePubliee(slug);

    const avis = await this.db.avis.create({
      data: {
        etablissement_id: etablissement.id,
        auteur_nom: dto.auteur_nom,
        auteur_contact: dto.auteur_contact,
        note: dto.note,
        commentaire: dto.commentaire,
        // Explicite, bien que ce soit le défaut du schéma : cette ligne est la
        // règle RG06 elle-même, et elle doit sauter aux yeux à la relecture.
        statut: AvisStatut.en_attente,
      },
      select: { id: true, statut: true },
    });

    this.logger.log(`Avis ${avis.id} déposé sur ${slug}, en attente de modération`);

    return avis;
  }

  /**
   * Signalement public — RG07.
   *
   * Replace l'avis en file de modération, quel que soit son statut : un avis
   * déjà publié redevient examinable. Le signalement et le retour en file
   * partagent une transaction, sinon un incident entre les deux laisserait un
   * signalement enregistré sur un avis toujours visible.
   */
  async signaler(avisId: bigint, dto: SignalerAvisDto): Promise<void> {
    const avis = await this.db.avis.findFirst({
      where: { id: avisId, statut: AvisStatut.publie },
      select: { id: true, etablissement_id: true, note: true },
    });

    if (!avis) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cet avis n'existe pas ou n'est pas publié.",
      );
    }

    await this.db.$transaction(async (tx) => {
      await tx.signalement.create({
        data: {
          avis_id: avis.id,
          motif: dto.motif,
          contact: dto.contact,
          statut: SignalementStatut.nouveau,
        },
      });

      await tx.avis.update({
        where: { id: avis.id },
        data: { statut: AvisStatut.en_attente },
      });

      // L'avis quitte l'affichage public : la note de la fiche doit suivre
      // immédiatement, sinon elle refléterait un avis qui n'est plus visible.
      await this.recalculerNote(tx, avis.etablissement_id);
    });

    this.logger.warn(`Avis ${avisId} signalé, retourné en file de modération`);
  }

  /**
   * Recalcule `note_moy` et `nb_avis` à partir des seuls avis publiés (RG08).
   *
   * Exposé pour que les services de modération (lot back-office) l'appellent
   * DANS leur propre transaction — le recalcul ne doit jamais être une
   * écriture séparée de la décision qui le motive.
   */
  async recalculerNote(
    tx: Pick<PrismaService, 'avis' | 'etablissement'>,
    etablissementId: bigint,
  ): Promise<void> {
    const agregat = await tx.avis.aggregate({
      where: { etablissement_id: etablissementId, statut: AvisStatut.publie },
      _avg: { note: true },
      _count: { _all: true },
    });

    await tx.etablissement.update({
      where: { id: etablissementId },
      data: {
        // Arrondi à une décimale : le schéma est Decimal(2,1), et l'affichage
        // des maquettes est « ★ 4,8 ».
        note_moy: agregat._avg.note ? Math.round(agregat._avg.note * 10) / 10 : 0,
        nb_avis: agregat._count._all,
      },
    });
  }

  /** Une fiche non validée n'accepte ni consultation ni dépôt (RG03). */
  private async fichePubliee(slug: string): Promise<{ id: bigint }> {
    const etablissement = await this.db.etablissement.findFirst({
      where: { slug, statut: EtablissementStatut.validee },
      select: { id: true },
    });

    if (!etablissement) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cet établissement n'existe pas ou n'est pas encore publié.",
      );
    }

    return etablissement;
  }
}

export interface AvisPublic {
  id: bigint;
  auteur_nom: string;
  note: number;
  commentaire: string;
  verifie: boolean;
  en_avant: boolean;
  reponse: string | null;
  reponse_le: Date | null;
  depose_le: Date;
}
