import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ArticleStatut, AvisStatut, PropositionStatut } from '../../generated/prisma';
import { AuditLectureService } from './audit-lecture.service';
// LE MÊME ORDRE QUE L'ÉCRAN CRM, réutilisé plutôt que recopié : deux listes
// d'étapes finiraient par diverger, et le tableau de bord montrerait un
// pipeline rangé autrement que celui qu'on ouvre en cliquant dessus.
import { COLONNES_PIPELINE as ETAPES_PIPELINE } from '../crm/crm-lecture.service';
import {
  joursAvant,
  serieJournaliere,
  TYPES_VUE,
} from '../../common/statistiques/series-temporelles';

/** Même fenêtre que le tableau de bord de l'espace établissement. */
const FENETRE_JOURS = 30;

/** Dernières factures du tableau de bord — la maquette en montre quatre. */
const DERNIERES_FACTURES = 4;

/** Entrées d'activité récente — la maquette en montre cinq ou six. */
const ACTIVITE_RECENTE = 6;

/** Établissements du classement — quatre dans la maquette, un de marge. */
const TOP_ETABLISSEMENTS = 5;

/**
 * Tableau de bord de l'administration — maquette `isAdminDash`.
 *
 * LECTURE SEULE, UN SEUL ALLER-RETOUR. Un tableau de bord qui se remplit bloc
 * par bloc clignote sous les yeux de l'administrateur : toutes les requêtes
 * partent ensemble, et l'écran s'affiche d'un coup.
 *
 * LE PIPELINE CRM ET LES DERNIÈRES FACTURES Y SONT DEPUIS LE 8 OCTOBRE 2026
 * (B-38, B-39). Ils manquaient parce que ni le CRM ni la facturation
 * n'existaient ; les deux modules sont construits, et ces blocs ne sont plus
 * qu'une lecture de plus.
 *
 * « ENCAISSER » N'EST PAS ICI, et n'y sera pas. La maquette pose le bouton sur
 * chaque ligne de facture, mais l'encaissement est une ÉCRITURE qui débloque
 * la publication d'une fiche (RG14) : il a sa route, sa transaction et sa
 * trace au journal. Un second chemin depuis un écran de lecture serait un
 * second endroit où la RG14 pourrait céder. L'écran renvoie vers « Abonnement
 * & facturation », qui le fait correctement.
 *
 * « RECHERCHES EFFECTUÉES » N'A PAS DE PÉRIODE PRÉCÉDENTE, à la différence des
 * vues et des demandes. La table `traces_recherche` commence le jour de sa
 * migration : comparer la fenêtre courante à une fenêtre antérieure
 * annoncerait une hausse de l'infini pendant les trente premiers jours. Le
 * chiffre est donc rendu seul, comme dans la maquette, qui ne lui met aucune
 * variation.
 */
@Injectable()
export class TableauDeBordAdminService {
  constructor(
    private readonly db: PrismaService,
    private readonly audit: AuditLectureService,
  ) {}

  async lire() {
    const maintenant = new Date();
    const depuis = joursAvant(maintenant, FENETRE_JOURS);
    const periodePrecedente = joursAvant(maintenant, FENETRE_JOURS * 2);

    const [
      activite,
      propositions,
      avis,
      articles,
      vuesCourantes,
      vuesPrecedentes,
      demandesCourantes,
      demandesPrecedentes,
      recherchesCourantes,
      vuesParJour,
      classement,
      pipeline,
      dernieresFactures,
    ] = await Promise.all([
      // Réutilise la lecture du journal plutôt qu'une seconde requête : même
      // tri, mêmes champs, et l'écran « Journal d'audit » ne peut pas diverger.
      this.audit.lister({ parPage: ACTIVITE_RECENTE }),

      // Mêmes filtres que les files qui les traitent (propositions, modération,
      // blog) : la pastille annonce exactement ce que l'écran visé affichera.
      this.db.propositionFiche.aggregate({
        where: { statut: PropositionStatut.en_attente },
        _count: { _all: true },
        _min: { proposee_le: true },
      }),
      this.db.avis.aggregate({
        where: { statut: AvisStatut.en_attente },
        _count: { _all: true },
        _min: { depose_le: true },
      }),
      this.db.article.aggregate({
        where: { statut: ArticleStatut.en_attente },
        _count: { _all: true },
        _min: { soumis_le: true },
      }),

      this.db.evenementTrace.count({
        where: { type: { in: TYPES_VUE }, survenu_le: { gte: depuis } },
      }),
      this.db.evenementTrace.count({
        where: { type: { in: TYPES_VUE }, survenu_le: { gte: periodePrecedente, lt: depuis } },
      }),
      this.db.demandeContact.count({ where: { recue_le: { gte: depuis } } }),
      this.db.demandeContact.count({
        where: { recue_le: { gte: periodePrecedente, lt: depuis } },
      }),
      this.db.traceRecherche.count({ where: { survenu_le: { gte: depuis } } }),

      // Regroupé en SQL : sur toute la plateforme, rapatrier chaque trace pour
      // la compter en mémoire coûterait une ligne transférée par vue.
      this.db.$queryRaw<{ jour: Date; total: bigint }[]>`
        SELECT DATE(survenu_le) AS jour, COUNT(*) AS total
          FROM evenement_traces
         WHERE \`type\` IN ('vue', 'vue_sponsorisee')
           AND survenu_le >= ${depuis}
         GROUP BY DATE(survenu_le)
      `,

      this.db.evenementTrace.groupBy({
        by: ['etablissement_id'],
        where: { type: { in: TYPES_VUE }, survenu_le: { gte: depuis } },
        _count: { _all: true },
        // Départage stable : à égalité de vues, l'ordre ne doit pas changer
        // d'un rechargement à l'autre.
        orderBy: [{ _count: { etablissement_id: 'desc' } }, { etablissement_id: 'asc' }],
        take: TOP_ETABLISSEMENTS,
      }),

      /**
       * Pipeline de prospection — `adminPipe` de la maquette (B-38).
       *
       * SANS FILTRE DE COMMERCIAL : c'est le tableau de bord de
       * l'administration, qui voit tout le portefeuille. Le même décompte
       * borné à un commercial vit dans `CrmLectureService.indicateurs()`, et
       * les deux ne doivent pas être confondus.
       */
      this.db.prospect.groupBy({ by: ['statut_pipeline'], _count: true }),

      /**
       * Dernières factures — `facturesMini` (B-39).
       *
       * LECTURE SEULE ICI. La maquette pose un bouton « Encaisser » sur chaque
       * ligne ; l'encaissement est une écriture qui débloque la publication
       * d'une fiche (RG14), et elle a sa route, sa transaction et sa trace au
       * journal dans `FacturationService`. Ce bloc y renvoie plutôt que de la
       * rejouer — un second chemin d'encaissement serait un second endroit où
       * la RG14 pourrait céder.
       */
      this.db.facture.findMany({
        orderBy: { emise_le: 'desc' },
        take: DERNIERES_FACTURES,
        select: {
          id: true,
          numero: true,
          objet: true,
          total_ttc: true,
          statut_paiement: true,
          emise_le: true,
          etablissement: { select: { id: true, nom: true, slug: true } },
        },
      }),
    ]);

    const fiches = await this.db.etablissement.findMany({
      where: { id: { in: classement.map((ligne) => ligne.etablissement_id) } },
      select: {
        id: true,
        nom: true,
        slug: true,
        type: true,
        statut: true,
        quartier: true,
        note_moy: true,
        nb_avis: true,
        ville: { select: { nom: true } },
      },
    });

    return {
      fenetre_jours: FENETRE_JOURS,

      activite: activite.elements,

      a_traiter: [
        {
          file: 'propositions' as const,
          en_attente: propositions._count._all,
          plus_ancienne: propositions._min.proposee_le,
        },
        { file: 'avis' as const, en_attente: avis._count._all, plus_ancienne: avis._min.depose_le },
        {
          file: 'articles' as const,
          en_attente: articles._count._all,
          plus_ancienne: articles._min.soumis_le,
        },
      ],

      visites: {
        vues_fiches: { courant: vuesCourantes, precedent: vuesPrecedentes },
        demandes: { courant: demandesCourantes, precedent: demandesPrecedentes },
        recherches: recherchesCourantes,
        vues_par_jour: serieJournaliere(depuis, maintenant, vuesParJour),
      },

      // `fiches` revient dans l'ordre de la base, pas du classement : on le
      // reconstruit, et une fiche supprimée entre-temps disparaît sans trou.
      top_etablissements: classement.flatMap((ligne) => {
        const fiche = fiches.find((f) => f.id === ligne.etablissement_id);
        return fiche ? [{ ...fiche, vues: ligne._count._all }] : [];
      }),

      /**
       * LES SIX ÉTAPES SONT TOUJOURS RENDUES, dans l'ordre du pipeline, même à
       * zéro. `groupBy` ne rend que les étapes peuplées : s'en contenter
       * ferait disparaître une colonne du graphique dès qu'elle se vide, et la
       * barre d'à côté paraîtrait s'élargir.
       */
      pipeline: ETAPES_PIPELINE.map((etape) => ({
        etape,
        total: pipeline.find((ligne) => ligne.statut_pipeline === etape)?._count ?? 0,
      })),

      dernieres_factures: dernieresFactures.map((facture) => ({
        ...facture,
        id: facture.id.toString(),
        // Décimal rendu en chaîne, comme partout : un `Decimal(10,2)` relu en
        // nombre JavaScript perd des centimes sur les grands montants.
        total_ttc: facture.total_ttc.toString(),
      })),
    };
  }
}
