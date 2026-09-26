/**
 * Numéros de téléphone marocains — affichage et liens.
 *
 * EXTRAIT DU MOBILIER D'ASSISTANCE parce que deux écrans en ont besoin : la
 * bannière d'aide et les cartes de résultats. Deux copies auraient fini par
 * diverger — et une divergence ici, c'est un appel qui part au mauvais endroit.
 */

/**
 * Forme internationale, dérivée du numéro affiché.
 *
 * Un « 06 12 34 56 78 » marocain devient « 212612345678 » : `tel:` et `wa.me`
 * n'acceptent ni espace ni zéro initial. On DÉRIVE plutôt que de stocker les
 * deux formes — sinon un numéro corrigé à l'affichage continuerait d'appeler
 * l'ancien.
 *
 * Un numéro déjà international (« +212… » ou « 00212… ») est laissé tel quel,
 * et un numéro d'un autre pays traverse sans être maquillé en marocain.
 */
export function versInternational(numero: string): string {
  const chiffres = numero.replace(/\D/g, '');

  // « 00212… » — préfixe international à l'ancienne.
  if (chiffres.startsWith('00')) return chiffres.slice(2);
  if (chiffres.startsWith('212')) return chiffres;
  // Zéro initial marocain : « 0612… » devient « 212612… ».
  if (chiffres.startsWith('0')) return `212${chiffres.slice(1)}`;

  return chiffres;
}

/** Lien `tel:` prêt à poser sur une ancre. */
export const lienTelephone = (numero: string): string => `tel:+${versInternational(numero)}`;

/** Lien WhatsApp prêt à poser sur une ancre. */
export const lienWhatsApp = (numero: string): string =>
  `https://wa.me/${versInternational(numero)}`;
