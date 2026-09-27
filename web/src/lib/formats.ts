/**
 * Formats fr-MA — livrable 13 §3.
 *
 * « virgule décimale (★ 4,8), espace fine des milliers (8 420),
 *   « 2 500 MAD/mois », dates fr-MA : testé exhaustivement — c'est la vitrine
 *   des conventions du produit. »
 *
 * Ces fonctions ne sont pas cosmétiques. Un montant affiché « 25000 » au lieu
 * de « 25 000 » sur une page de tarifs, ou une note « 4.8 » au lieu de « 4,8 »,
 * signalent à un parent marocain que le site n'a pas été fait pour lui.
 */

/** Espace fine insécable — séparateur de milliers du français. */
const ESPACE_FINE = ' ';

/**
 * Note sur 5, virgule décimale : `"4.8"` → `« 4,8 »`.
 *
 * L'API rend un décimal en CHAÎNE (livrable 11 §1) ; on ne le convertit jamais
 * en nombre au passage, pour ne pas réintroduire l'imprécision que cette
 * sérialisation évite précisément.
 */
export function formaterNote(note: string | number): string {
  const brut = typeof note === 'number' ? note.toFixed(1) : note;
  const [entier = '0', decimale] = brut.split('.');

  return decimale ? `${entier},${decimale[0]}` : `${entier},0`;
}

/** Entier avec espace fine : `8420` → `« 8 420 »`. */
export function formaterNombre(valeur: number): string {
  return Math.round(valeur)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ESPACE_FINE);
}

/**
 * Montant en dirhams : `2500` → `« 2 500 MAD »`.
 *
 * La devise se place APRÈS le montant, conformément à l'usage marocain et aux
 * maquettes (« 2 500 MAD/mois »).
 */
export function formaterMad(montant: number | string): string {
  const valeur = typeof montant === 'string' ? Number.parseFloat(montant) : montant;

  return Number.isFinite(valeur) ? `${formaterNombre(valeur)}${ESPACE_FINE}MAD` : '—';
}

/** Date longue fr-MA : `« 12 septembre 2026 »`. */
export function formaterDate(iso: string): string {
  const date = new Date(iso);

  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('fr-MA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
}

/**
 * Date et heure : `« 12 sept. 2026 · 14:32 »`.
 *
 * Le journal d'audit a besoin de L'HEURE, pas seulement du jour : départager
 * deux décisions prises le même après-midi est tout l'intérêt d'un registre.
 */
export function formaterDateHeure(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return '—';

  const jour = new Intl.DateTimeFormat('fr-MA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);

  const heure = new Intl.DateTimeFormat('fr-MA', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  return `${jour}${ESPACE_FINE}· ${heure}`;
}

/** Date relative courte : `« il y a 3 jours »`. */
export function formaterDepuis(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return '—';

  const jours = Math.floor((Date.now() - date.getTime()) / 86_400_000);

  if (jours < 1) return "aujourd'hui";
  if (jours === 1) return 'hier';
  if (jours < 31) return `il y a ${jours} jours`;
  if (jours < 365) return `il y a ${Math.floor(jours / 30)} mois`;

  return formaterDate(iso);
}

/**
 * Ordre d'affichage des jours de la semaine.
 *
 * MYSQL NE CONSERVE PAS L'ORDRE DES CLÉS d'un objet JSON — il les réordonne à
 * l'écriture. Sans ce tri, les horaires s'affichent « Samedi, Dimanche,
 * Vendredi, Lundi – Jeudi », illisible pour un parent qui cherche une heure
 * d'ouverture. Partagé entre la fiche publique et son aperçu dans l'espace :
 * les deux rendent les mêmes horaires et doivent les ranger pareil.
 */
const ORDRE_JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

export function rangJour(libelle: string): number {
  const index = ORDRE_JOURS.findIndex((jour) => libelle.toLowerCase().startsWith(jour));

  // Un libellé non reconnu passe en fin de liste plutôt que de remonter en tête.
  return index === -1 ? ORDRE_JOURS.length : index;
}

/**
 * Mois abrégés des axes de graphique, comme la maquette (« Juin », « Juil ») :
 * `toLocaleDateString` rendrait « juin » et « juil. », en minuscules et
 * ponctués, qui ne sont pas les libellés dessinés.
 */
export const MOIS_COURTS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
