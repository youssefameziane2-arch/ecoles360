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
 * CE QUI MANQUE, ET POURQUOI (B-40). La maquette pose des « visites du site »,
 * des « recherches effectuées », un « taux de transformation » (demandes ÷
 * recherches) et un bloc « Recherches par ville ». Aucune trace ne compte les
 * recherches ni les visites : ces blocs sont absents plutôt qu'à zéro. La
 * courbe « Visites du site » porte donc les vues de fiches, et le dit.
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

    const [vues, demandes, avis, vuesParJour, vuesParType, classement, villes] = await Promise.all([
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

      indicateurs: { vues_fiches: vues, demandes, nouveaux_avis: avis },

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

      options: { villes },
    };
  }
}
