import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException, ERROR_CODES } from '../../common/errors';
import { Page } from '../../common/interceptors';
import { PrismaService } from '../../prisma/prisma.service';
import { AvisStatut, EvenementType } from '../../generated/prisma';
import type { RepondreAvisDto } from './dto/repondre-avis.dto';
import type { TransitionDemandeDto } from './dto/transition-demande.dto';

const PAR_PAGE = 20;

/**
 * Espace connecté établissement — livrable 11 §3.2.
 *
 * TOUT EST SCOPÉ À `etablissementId`, JAMAIS À UN PARAMÈTRE D'URL. La session
 * porte l'établissement rattaché (RG25) ; accepter un `:id` dans l'URL
 * ouvrirait la porte à consulter la fiche d'un autre établissement en
 * changeant un chiffre. C'est `PorteeEspaceGuard` qui a déjà vérifié le
 * rattachement — ce service ne fait que l'utiliser.
 */
@Injectable()
export class EspaceService {
  constructor(private readonly db: PrismaService) {}

  /** KPIs du mois — livrable 11 §3.2. */
  async tableauDeBord(etablissementId: bigint) {
    const depuis = new Date();
    depuis.setDate(depuis.getDate() - 30);

    const [etablissement, vues30j, demandesRecentes, avisRecents, parType] = await Promise.all([
      this.db.etablissement.findUniqueOrThrow({
        where: { id: etablissementId },
        select: { note_moy: true, nb_avis: true },
      }),
      this.db.evenementTrace.count({
        where: {
          etablissement_id: etablissementId,
          type: EvenementType.vue,
          survenu_le: { gte: depuis },
        },
      }),
      this.db.demandeContact.findMany({
        where: { etablissement_id: etablissementId },
        orderBy: { recue_le: 'desc' },
        take: 5,
        select: {
          id: true,
          parent_nom: true,
          message: true,
          canal: true,
          statut: true,
          recue_le: true,
        },
      }),
      this.db.avis.findMany({
        where: { etablissement_id: etablissementId, statut: AvisStatut.publie },
        orderBy: { depose_le: 'desc' },
        take: 3,
        select: { id: true, auteur_nom: true, note: true, commentaire: true, depose_le: true },
      }),
      this.db.evenementTrace.groupBy({
        by: ['type'],
        where: { etablissement_id: etablissementId, survenu_le: { gte: depuis } },
        _count: { _all: true },
      }),
    ]);

    // Séries mensuelles des vues, six derniers mois — alimente le graphique du
    // tableau de bord (BarChart du design system).
    const vuesParMois = await this.vuesParMois(etablissementId, 6);

    return {
      note_moy: etablissement.note_moy.toString(),
      nb_avis: etablissement.nb_avis,
      vues_30j: vues30j,
      vues_par_mois: vuesParMois,
      canaux: parType.map((ligne) => ({ type: ligne.type, total: ligne._count._all })),
      dernieres_demandes: demandesRecentes,
      derniers_avis: avisRecents,
    };
  }

  private async vuesParMois(etablissementId: bigint, nombreDeMois: number) {
    const debut = new Date();
    debut.setDate(1);
    debut.setMonth(debut.getMonth() - (nombreDeMois - 1));
    debut.setHours(0, 0, 0, 0);

    const evenements = await this.db.evenementTrace.findMany({
      where: {
        etablissement_id: etablissementId,
        type: { in: [EvenementType.vue, EvenementType.vue_sponsorisee] },
        survenu_le: { gte: debut },
      },
      select: { survenu_le: true },
    });

    const compteurs = new Map<string, number>();
    const mois: string[] = [];
    const curseur = new Date(debut);

    for (let i = 0; i < nombreDeMois; i++) {
      const cle = `${curseur.getFullYear()}-${String(curseur.getMonth() + 1).padStart(2, '0')}`;
      mois.push(cle);
      compteurs.set(cle, 0);
      curseur.setMonth(curseur.getMonth() + 1);
    }

    for (const evenement of evenements) {
      const d = evenement.survenu_le;
      const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (compteurs.has(cle)) {
        compteurs.set(cle, (compteurs.get(cle) ?? 0) + 1);
      }
    }

    return mois.map((cle) => ({ mois: cle, vues: compteurs.get(cle) ?? 0 }));
  }

  /** Fiche complète (tous les champs, y compris privés) — c'est le propriétaire. */
  async fiche(etablissementId: bigint) {
    return this.db.etablissement.findUniqueOrThrow({
      where: { id: etablissementId },
      include: {
        ville: { select: { nom: true, slug: true } },
        photos: {
          select: { id: true, chemin: true, alt: true, ordre: true },
          orderBy: { ordre: 'asc' },
        },
        niveaux: { select: { niveau: { select: { id: true, libelle: true, categorie: true } } } },
      },
    });
  }

  /** Avis reçus, tous statuts confondus — le propriétaire voit aussi ceux en attente. */
  async avis(etablissementId: bigint, page = 1): Promise<Page<unknown>> {
    const where = { etablissement_id: etablissementId };

    const [total, lignes] = await this.db.$transaction([
      this.db.avis.count({ where }),
      this.db.avis.findMany({
        where,
        orderBy: { depose_le: 'desc' },
        skip: (page - 1) * PAR_PAGE,
        take: PAR_PAGE,
        select: {
          id: true,
          auteur_nom: true,
          note: true,
          commentaire: true,
          statut: true,
          verifie: true,
          reponse: true,
          reponse_le: true,
          depose_le: true,
        },
      }),
    ]);

    return new Page(lignes, total, page, PAR_PAGE);
  }

  /** Réponse à un avis — RG07 : une seule, jamais réécrite. */
  async repondreAvis(etablissementId: bigint, avisId: bigint, dto: RepondreAvisDto): Promise<void> {
    const avis = await this.db.avis.findFirst({
      where: { id: avisId, etablissement_id: etablissementId },
      select: { id: true, reponse: true },
    });

    if (!avis) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cet avis n'existe pas.",
      );
    }

    if (avis.reponse) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ERROR_CODES.CONFLIT_METIER,
        'Une réponse existe déjà pour cet avis.',
      );
    }

    await this.db.avis.update({
      where: { id: avisId },
      data: { reponse: dto.reponse, reponse_le: new Date() },
    });
  }

  /** Demandes de contact reçues — file de traitement (RG09). */
  async demandes(etablissementId: bigint, page = 1): Promise<Page<unknown>> {
    const where = { etablissement_id: etablissementId };

    const [total, lignes] = await this.db.$transaction([
      this.db.demandeContact.count({ where }),
      this.db.demandeContact.findMany({
        where,
        orderBy: { recue_le: 'desc' },
        skip: (page - 1) * PAR_PAGE,
        take: PAR_PAGE,
        select: {
          id: true,
          parent_nom: true,
          parent_tel: true,
          message: true,
          canal: true,
          statut: true,
          recue_le: true,
          traitee_le: true,
        },
      }),
    ]);

    return new Page(lignes, total, page, PAR_PAGE);
  }

  /** Transition nouvelle → en_cours → traitee (RG09), horodatée à l'arrivée en `traitee`. */
  async transitionDemande(
    etablissementId: bigint,
    demandeId: bigint,
    traiteePar: bigint,
    dto: TransitionDemandeDto,
  ): Promise<void> {
    const demande = await this.db.demandeContact.findFirst({
      where: { id: demandeId, etablissement_id: etablissementId },
      select: { id: true },
    });

    if (!demande) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cette demande n'existe pas.",
      );
    }

    await this.db.demandeContact.update({
      where: { id: demandeId },
      data: {
        statut: dto.statut,
        traitee_par: traiteePar,
        traitee_le: dto.statut === 'traitee' ? new Date() : undefined,
      },
    });
  }
}
