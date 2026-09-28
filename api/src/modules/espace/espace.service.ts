import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException, ERROR_CODES } from '../../common/errors';
import { Page } from '../../common/interceptors';
import { PrismaService } from '../../prisma/prisma.service';
import { AvisStatut, EvenementType } from '../../generated/prisma';
import {
  debutDeMois,
  regrouper,
  serieJournaliere,
  TYPES_VUE,
} from '../../common/statistiques/series-temporelles';
import type { RepondreAvisDto } from './dto/repondre-avis.dto';
import type { TransitionDemandeDto } from './dto/transition-demande.dto';

const PAR_PAGE = 20;

/** Les six barres de « Vues mensuelles » (maquette `etabChartData`). */
const MOIS_DE_STATISTIQUES = 6;

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

  /**
   * KPIs du mois — livrable 11 §3.2.
   *
   * « VUES CE MOIS » A LA DÉFINITION DES STATISTIQUES (B-43) : mois
   * calendaire, vues simples et sponsorisées. Le tableau de bord comptait
   * trente jours glissants et les seules vues simples : l'établissement lisait
   * sous le même libellé deux nombres différents, selon l'écran.
   *
   * `canaux` garde ses trente jours glissants : l'écran les annonce comme tels.
   */
  async tableauDeBord(etablissementId: bigint) {
    const maintenant = new Date();
    const depuis = new Date(maintenant);
    depuis.setDate(depuis.getDate() - 30);

    const [etablissement, vuesCeMois, vuesParMois, demandesRecentes, avisRecents, parType] =
      await Promise.all([
        this.db.etablissement.findUniqueOrThrow({
          where: { id: etablissementId },
          select: { note_moy: true, nb_avis: true },
        }),
        this.db.evenementTrace.count({
          where: {
            etablissement_id: etablissementId,
            type: { in: TYPES_VUE },
            survenu_le: { gte: debutDeMois(maintenant) },
          },
        }),
        this.vuesMensuelles(etablissementId, maintenant),
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

    return {
      note_moy: etablissement.note_moy.toString(),
      nb_avis: etablissement.nb_avis,
      vues_ce_mois: vuesCeMois,
      vues_par_mois: vuesParMois.map((point) => ({
        mois: point.debut.slice(0, 7),
        vues: point.vues,
      })),
      canaux: parType.map((ligne) => ({ type: ligne.type, total: ligne._count._all })),
      dernieres_demandes: demandesRecentes,
      derniers_avis: avisRecents,
    };
  }

  /**
   * Statistiques de la fiche — maquette `isEtabStats`.
   *
   * LE MOIS EN COURS EST COMPARÉ AU MÊME NOMBRE DE JOURS DU MOIS PRÉCÉDENT,
   * pas au mois précédent entier : le 3, trois jours de vues face à trente
   * afficheraient une chute qui n'existe pas.
   *
   * Tout est en UTC, comme `DATE()` côté MySQL et `serieJournaliere` : la
   * dernière barre des vues mensuelles est ainsi exactement la tuile « Vues
   * ce mois », et la somme des barres le total des six mois.
   */
  async statistiques(etablissementId: bigint) {
    const maintenant = new Date();
    const debutMois = debutDeMois(maintenant);
    const debutMoisPrecedent = debutDeMois(maintenant, 1);
    const debutSerie = debutDeMois(maintenant, MOIS_DE_STATISTIQUES - 1);

    // Le 31 mars, « un mois plus tôt » déborderait sur le 3 mars : borné au
    // premier du mois, le mois précédent ne mord jamais sur le mois en cours.
    const memeJourPrecedent = new Date(maintenant);
    memeJourPrecedent.setUTCMonth(maintenant.getUTCMonth() - 1);
    const finPrecedent = memeJourPrecedent < debutMois ? memeJourPrecedent : debutMois;

    const compter = (types: EvenementType[], depuis: Date, jusqua?: Date) =>
      this.db.evenementTrace.count({
        where: {
          etablissement_id: etablissementId,
          type: { in: types },
          survenu_le: { gte: depuis, ...(jusqua ? { lt: jusqua } : {}) },
        },
      });

    const [
      vues,
      vuesPrecedent,
      appels,
      appelsPrecedent,
      whatsapp,
      whatsappPrecedent,
      totalVues,
      vuesParMois,
      origines,
    ] = await Promise.all([
      compter(TYPES_VUE, debutMois),
      compter(TYPES_VUE, debutMoisPrecedent, finPrecedent),
      compter([EvenementType.appel], debutMois),
      compter([EvenementType.appel], debutMoisPrecedent, finPrecedent),
      compter([EvenementType.whatsapp], debutMois),
      compter([EvenementType.whatsapp], debutMoisPrecedent, finPrecedent),
      compter(TYPES_VUE, debutSerie),

      this.vuesMensuelles(etablissementId, maintenant),

      // Un contact, c'est un clic « Appeler » ou « WhatsApp ». La demande par
      // formulaire n'en est pas : elle ne porte pas de source, et la ranger
      // d'office sous « page de l'établissement » gonflerait cette part.
      this.db.evenementTrace.groupBy({
        by: ['source'],
        where: {
          etablissement_id: etablissementId,
          type: { in: [EvenementType.appel, EvenementType.whatsapp] },
          survenu_le: { gte: debutSerie },
        },
        _count: { _all: true },
      }),
    ]);

    const origineContacts = origines
      .map((ligne) => ({ source: ligne.source, contacts: ligne._count._all }))
      .sort((a, b) => b.contacts - a.contacts);

    return {
      mois_courant: debutMois.toISOString().slice(0, 7),
      depuis: debutSerie,
      indicateurs: {
        vues: { courant: vues, precedent: vuesPrecedent },
        appels: { courant: appels, precedent: appelsPrecedent },
        whatsapp: { courant: whatsapp, precedent: whatsappPrecedent },
      },
      vues_par_mois: vuesParMois,
      total_vues: totalVues,
      origine_contacts: origineContacts,
      total_contacts: origineContacts.reduce((total, ligne) => total + ligne.contacts, 0),
    };
  }

  /**
   * Vues des six derniers mois, en UTC — une seule série pour le tableau de
   * bord et les statistiques, qui montrent le même graphique : deux calculs
   * finiraient par dessiner deux barres différentes pour le même mois.
   *
   * Comptée au jour en SQL puis regroupée : chaque jour tombe dans un seul
   * mois, et la dernière barre est exactement la tuile « Vues ce mois ».
   */
  private async vuesMensuelles(etablissementId: bigint, maintenant: Date) {
    const debutSerie = debutDeMois(maintenant, MOIS_DE_STATISTIQUES - 1);

    const vuesParJour = await this.db.$queryRaw<{ jour: Date; total: bigint }[]>`
      SELECT DATE(survenu_le) AS jour, COUNT(*) AS total
        FROM evenement_traces
       WHERE etablissement_id = ${etablissementId}
         AND \`type\` IN ('vue', 'vue_sponsorisee')
         AND survenu_le >= ${debutSerie}
       GROUP BY DATE(survenu_le)
    `;

    return regrouper(serieJournaliere(debutSerie, maintenant, vuesParJour), 'mois');
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
