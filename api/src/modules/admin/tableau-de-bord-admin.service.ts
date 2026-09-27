import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ArticleStatut, AvisStatut, PropositionStatut } from '../../generated/prisma';
import { AuditLectureService } from './audit-lecture.service';
import { joursAvant, serieJournaliere, TYPES_VUE } from './series-temporelles';

/** Même fenêtre que le tableau de bord de l'espace établissement. */
const FENETRE_JOURS = 30;

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
 * DEUX BLOCS DE LA MAQUETTE N'Y SONT PAS — le pipeline CRM et les derniers
 * encaissements. Leurs modèles existent, aucune route ne les expose encore, et
 * « Encaisser » est une écriture qui touche à la RG14 : ce n'est pas la place
 * d'un écran de lecture (voir BACKLOG). La tuile « Recherches effectuées » est
 * absente aussi : aucune trace ne les compte.
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
      vuesParJour,
      classement,
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
        vues_par_jour: serieJournaliere(depuis, maintenant, vuesParJour),
      },

      // `fiches` revient dans l'ordre de la base, pas du classement : on le
      // reconstruit, et une fiche supprimée entre-temps disparaît sans trou.
      top_etablissements: classement.flatMap((ligne) => {
        const fiche = fiches.find((f) => f.id === ligne.etablissement_id);
        return fiche ? [{ ...fiche, vues: ligne._count._all }] : [];
      }),
    };
  }
}
