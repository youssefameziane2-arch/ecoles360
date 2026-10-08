import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EtablissementType, Prisma } from '../../generated/prisma';
import type { PeriodeStatistiques, StatistiquesAdminDto } from './dto/statistiques-admin.dto';
import {
  joursAvant,
  regrouper,
  serieJournaliere,
  TYPES_VUE,
  type Granularite,
} from '../../common/statistiques/series-temporelles';

/** Lignes du classement — six dans la maquette, quatre de marge pour trier. */
const TOP_ETABLISSEMENTS = 10;

/** Villes du bloc « Recherches par ville » — six barres dans la maquette. */
const TOP_VILLES = 6;

/**
 * Durée et granularité de chaque période — celles de la maquette : un point
 * par jour sur 7 et 30 jours, par semaine sur 90, par mois sur l'année.
 */
const PERIODES: Record<
  PeriodeStatistiques,
  { depuis: (maintenant: Date) => Date; granularite: Granularite }
> = {
  '7j': { depuis: (maintenant) => joursAvant(maintenant, 7), granularite: 'jour' },
  '30j': { depuis: (maintenant) => joursAvant(maintenant, 30), granularite: 'jour' },
  '90j': { depuis: (maintenant) => joursAvant(maintenant, 90), granularite: 'semaine' },
  '12m': {
    depuis: (maintenant) => {
      const date = new Date(maintenant);
      date.setMonth(date.getMonth() - 12);
      return date;
    },
    granularite: 'mois',
  },
};

/**
 * Statistiques de la plateforme — maquette `isAdminStats`.
 *
 * LES FILTRES COMMANDENT TOUT L'ÉCRAN, indicateurs compris : une courbe
 * filtrée sur Rabat à côté d'un total national ferait lire deux chiffres qui
 * ne parlent pas de la même chose.
 *
 * CE QUI MANQUE ENCORE, ET POURQUOI (B-40). Les recherches sont désormais
 * tracées (`traces_recherche`), ce qui remplit « Recherches effectuées », le
 * « taux de transformation » et « Recherches par ville ». RESTENT LES
 * « VISITES DU SITE », et elles manquent faute de DÉFINITION, non faute de
 * code : une visite peut être une session, un visiteur unique du jour, ou une
 * page vue — trois chiffres qui diffèrent d'un facteur dix. Choisir à la place
 * du client produirait un indicateur qui compile et qui mentira à la recette.
 * La courbe porte donc les vues de fiches, et le dit.
 *
 * LE TAUX DE TRANSFORMATION EST INDICATIF DÈS QU'UN TYPE EST FILTRÉ, et
 * l'écran doit le dire. Les deux termes suivent le même périmètre que le reste
 * de l'écran, mais une recherche n'est typée que si le parent a coché un
 * cycle : chercher « Casablanca » sans cycle puis demander un lycée compte au
 * numérateur et pas au dénominateur. Le rapport peut donc dépasser 100 % sur
 * un type donné. On le rend tel quel — borner le chiffre le rendrait faux
 * sans le rendre juste.
 */
@Injectable()
export class StatistiquesAdminService {
  constructor(private readonly db: PrismaService) {}

  async lire(filtres: StatistiquesAdminDto) {
    const maintenant = new Date();
    const { depuis: calculerDepuis, granularite } = PERIODES[filtres.periode];
    const depuis = calculerDepuis(maintenant);

    // Même périmètre de fiches pour chaque bloc — la condition de l'en-tête.
    const fiche: Prisma.EtablissementWhereInput = {
      ...(filtres.ville ? { ville: { slug: filtres.ville } } : {}),
      ...(filtres.type ? { type: filtres.type } : {}),
    };

    // Le même périmètre, écrit pour les deux requêtes regroupées en SQL.
    const conditions = Prisma.join(
      [
        Prisma.sql`t.\`type\` IN ('vue', 'vue_sponsorisee')`,
        Prisma.sql`t.survenu_le >= ${depuis}`,
        ...(filtres.ville ? [Prisma.sql`v.slug = ${filtres.ville}`] : []),
        ...(filtres.type ? [Prisma.sql`e.\`type\` = ${filtres.type}`] : []),
      ],
      ' AND ',
    );

    // Périmètre des recherches — le même que celui des fiches, exprimé sur la
    // trace : la ville CHERCHÉE, et le cycle coché s'il l'a été.
    const recherche: Prisma.TraceRechercheWhereInput = {
      survenu_le: { gte: depuis },
      ...(filtres.ville ? { ville: { slug: filtres.ville } } : {}),
      ...(filtres.type ? { type: filtres.type } : {}),
    };

    const [
      vues,
      demandes,
      avis,
      recherches,
      vuesParJour,
      vuesParType,
      classement,
      recherchesParVille,
      villes,
    ] = await Promise.all([
      this.db.evenementTrace.count({
        where: { type: { in: TYPES_VUE }, survenu_le: { gte: depuis }, etablissement: fiche },
      }),
      this.db.demandeContact.count({
        where: { recue_le: { gte: depuis }, etablissement: fiche },
      }),
      // Tous statuts : l'indicateur mesure ce que les parents déposent, pas
      // ce que la modération a déjà traité.
      this.db.avis.count({
        where: { depose_le: { gte: depuis }, etablissement: fiche },
      }),
      this.db.traceRecherche.count({ where: recherche }),

      this.db.$queryRaw<{ jour: Date; total: bigint }[]>`
        SELECT DATE(t.survenu_le) AS jour, COUNT(*) AS total
          FROM evenement_traces t
          JOIN etablissements e ON e.id = t.etablissement_id
          JOIN villes v ON v.id = e.ville_id
         WHERE ${conditions}
         GROUP BY DATE(t.survenu_le)
      `,

      this.db.$queryRaw<{ type: EtablissementType; total: bigint }[]>`
        SELECT e.\`type\` AS type, COUNT(*) AS total
          FROM evenement_traces t
          JOIN etablissements e ON e.id = t.etablissement_id
          JOIN villes v ON v.id = e.ville_id
         WHERE ${conditions}
         GROUP BY e.\`type\`
      `,

      this.db.evenementTrace.groupBy({
        by: ['etablissement_id'],
        where: { type: { in: TYPES_VUE }, survenu_le: { gte: depuis }, etablissement: fiche },
        _count: { _all: true },
        // Départage stable : à égalité de vues, l'ordre ne doit pas changer
        // d'un rechargement à l'autre.
        orderBy: [{ _count: { etablissement_id: 'desc' } }, { etablissement_id: 'asc' }],
        take: TOP_ETABLISSEMENTS,
      }),

      // « Recherches par ville » — en SQL plutôt qu'en `groupBy` Prisma, qui
      // rendrait des `ville_id` à rejoindre ensuite pour obtenir un nom.
      // LES RECHERCHES SANS VILLE SONT ÉCARTÉES : « 1 240 recherches, dont
      // 300 sans ville » n'a pas de ligne dans un classement de villes, et le
      // total de la tuile, lui, les compte déjà.
      this.db.$queryRaw<{ nom: string; slug: string; total: bigint }[]>`
        SELECT v.nom AS nom, v.slug AS slug, COUNT(*) AS total
          FROM traces_recherche r
          JOIN villes v ON v.id = r.ville_id
         WHERE ${Prisma.join(
           [
             Prisma.sql`r.survenu_le >= ${depuis}`,
             ...(filtres.ville ? [Prisma.sql`v.slug = ${filtres.ville}`] : []),
             ...(filtres.type ? [Prisma.sql`r.\`type\` = ${filtres.type}`] : []),
           ],
           ' AND ',
         )}
         GROUP BY v.id, v.nom, v.slug
         ORDER BY total DESC, v.nom ASC
         LIMIT ${TOP_VILLES}
      `,

      // Dans la même réponse : l'écran n'a pas à attendre une seconde requête
      // pour remplir son sélecteur de ville.
      this.db.ville.findMany({ orderBy: { nom: 'asc' }, select: { nom: true, slug: true } }),
    ]);

    const ids = classement.map((ligne) => ligne.etablissement_id);

    const [fiches, contacts] = await Promise.all([
      this.db.etablissement.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          nom: true,
          slug: true,
          type: true,
          statut: true,
          note_moy: true,
          nb_avis: true,
          ville: { select: { nom: true, slug: true } },
        },
      }),
      this.db.demandeContact.groupBy({
        by: ['etablissement_id'],
        where: { etablissement_id: { in: ids }, recue_le: { gte: depuis } },
        _count: { _all: true },
      }),
    ]);

    return {
      periode: filtres.periode,
      granularite,
      depuis,

      indicateurs: {
        vues_fiches: vues,
        demandes,
        nouveaux_avis: avis,
        recherches,
        // NUL ET NON ZÉRO QUAND IL N'Y A AUCUNE RECHERCHE : « 0 % » se lirait
        // comme « personne ne nous contacte », quand la réalité est « on n'a
        // rien à diviser ». L'écran affiche un tiret.
        taux_transformation: recherches > 0 ? demandes / recherches : null,
      },

      courbe: regrouper(serieJournaliere(depuis, maintenant, vuesParJour), granularite),

      vues_par_type: vuesParType
        .map((ligne) => ({ type: ligne.type, vues: Number(ligne.total) }))
        .sort((a, b) => b.vues - a.vues),

      // `fiches` revient dans l'ordre de la base : on rejoue celui du
      // classement, et une fiche supprimée entre-temps disparaît sans trou.
      top_etablissements: classement.flatMap((ligne) => {
        const f = fiches.find((candidate) => candidate.id === ligne.etablissement_id);
        if (!f) return [];

        return [
          {
            ...f,
            vues: ligne._count._all,
            contacts:
              contacts.find((c) => c.etablissement_id === ligne.etablissement_id)?._count._all ?? 0,
          },
        ];
      }),

      recherches_par_ville: recherchesParVille.map((ligne) => ({
        nom: ligne.nom,
        slug: ligne.slug,
        recherches: Number(ligne.total),
      })),

      options: { villes },
    };
  }
}
