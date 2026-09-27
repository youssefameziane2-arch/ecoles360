import { EvenementType } from '../../generated/prisma';

/**
 * Séries temporelles de l'administration — tableau de bord et statistiques.
 *
 * PARTAGÉES PLUTÔT QUE RECOPIÉES : les deux écrans montrent la même audience,
 * et deux calculs voisins finiraient par afficher deux totaux différents pour
 * la même période.
 */

/**
 * « Vues » regroupe les vues simples et sponsorisées, comme
 * `AuditLectureService.statistiques()` : la distinction sert à la facturation
 * (RG18), pas à la vue d'ensemble. N'en compter qu'une sous-estimerait
 * l'audience le jour où la seconde sera émise.
 */
export const TYPES_VUE = [EvenementType.vue, EvenementType.vue_sponsorisee];

export function joursAvant(reference: Date, jours: number): Date {
  const date = new Date(reference);
  date.setDate(date.getDate() - jours);
  return date;
}

export type Granularite = 'jour' | 'semaine' | 'mois';

/** Un point de courbe : la date de son premier jour, et les vues qu'il couvre. */
export interface PointDeCourbe {
  debut: string;
  vues: number;
}

/**
 * Une entrée par jour de la fenêtre, jours sans vue compris.
 *
 * Les jours à zéro sont écrits ici plutôt que laissés absents : un graphique
 * qui saute les jours creux relie deux points éloignés et efface précisément
 * la chute qu'il devait montrer. Les clés sont en UTC, comme `DATE()` côté
 * MySQL : la somme des barres égale le total affiché au-dessus.
 */
export function serieJournaliere(
  depuis: Date,
  jusqua: Date,
  lignes: { jour: Date; total: bigint }[],
): { jour: string; vues: number }[] {
  const parJour = new Map(
    lignes.map((ligne) => [new Date(ligne.jour).toISOString().slice(0, 10), Number(ligne.total)]),
  );

  const serie: { jour: string; vues: number }[] = [];
  const curseur = new Date(
    Date.UTC(depuis.getUTCFullYear(), depuis.getUTCMonth(), depuis.getUTCDate()),
  );

  while (curseur <= jusqua) {
    const cle = curseur.toISOString().slice(0, 10);
    serie.push({ jour: cle, vues: parJour.get(cle) ?? 0 });
    curseur.setUTCDate(curseur.getUTCDate() + 1);
  }

  return serie;
}

/**
 * Regroupe une série journalière par semaine ou par mois.
 *
 * REGROUPÉ APRÈS COUP, PAS EN SQL : une seule requête journalière sert les
 * quatre périodes, et le total ne peut pas diverger d'une granularité à
 * l'autre — chaque jour tombe dans exactement un paquet.
 *
 * Les semaines partent du premier jour de la fenêtre, pas du lundi : la
 * dernière est ainsi toujours complète et finit aujourd'hui, et c'est la
 * première, la plus ancienne, qui peut être entamée.
 */
export function regrouper(
  serie: { jour: string; vues: number }[],
  granularite: Granularite,
): PointDeCourbe[] {
  if (granularite === 'jour') {
    return serie.map((point) => ({ debut: point.jour, vues: point.vues }));
  }

  // Décalage qui aligne les semaines sur la FIN de la fenêtre.
  const decalage = (7 - (serie.length % 7)) % 7;
  const cleDe = (jour: string, rang: number) =>
    granularite === 'mois' ? jour.slice(0, 7) : String(Math.floor((rang + decalage) / 7));

  const paquets: (PointDeCourbe & { cle: string })[] = [];

  serie.forEach((point, rang) => {
    const cle = cleDe(point.jour, rang);
    const dernier = paquets[paquets.length - 1];

    if (dernier?.cle === cle) {
      dernier.vues += point.vues;
    } else {
      paquets.push({ cle, debut: point.jour, vues: point.vues });
    }
  });

  return paquets.map(({ debut, vues }) => ({ debut, vues }));
}
