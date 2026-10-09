/**
 * Filtre des adresses avant de les poser dans un `href`.
 *
 * SECONDE BARRIÈRE, PAS LA PREMIÈRE. L'API valide déjà les réseaux sociaux
 * d'une fiche (`ReseauxSociauxValides`), et c'est là que la règle appartient.
 * Mais des liens saisis AVANT cette validation dorment en base, et React rend
 * un `href="javascript:…"` sans broncher — il se contente d'un avertissement
 * en développement, que personne ne lit en production.
 *
 * Une donnée déjà stockée ne redevient pas sûre parce qu'on a corrigé
 * l'entrée : ce qui est affiché doit se défendre aussi.
 */
/**
 * Les plateformes de la maquette (`socDefs`), dans son ordre.
 *
 * LA MÊME LISTE QUE CELLE DU SERVEUR — `ReseauxSociauxValides` refuse tout le
 * reste en 422. Les deux doivent bouger ensemble ; en ajouter une ici seule
 * produirait un menu qui propose ce que l'enregistrement rejettera.
 *
 * (`x` figurait côté front sans avoir jamais existé côté serveur, et la
 * maquette ne le pose pas : il n'est pas repris. Une fiche qui en porterait
 * un garde sa valeur, signalée « à corriger ».)
 */
export const RESEAUX_SOCIAUX = [
  { valeur: 'facebook', libelle: 'Facebook' },
  { valeur: 'instagram', libelle: 'Instagram' },
  { valeur: 'linkedin', libelle: 'LinkedIn' },
  { valeur: 'youtube', libelle: 'YouTube' },
  { valeur: 'tiktok', libelle: 'TikTok' },
  { valeur: 'web', libelle: 'Site web' },
] as const;

export function lienExterneSur(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const analysee = new URL(url.trim());

    return analysee.protocol === 'http:' || analysee.protocol === 'https:' ? analysee.href : null;
  } catch {
    // Pas une adresse absolue : on ne devine pas, on n'affiche pas. Deviner
    // « https:// » devant une saisie libre produirait des liens morts.
    return null;
  }
}
