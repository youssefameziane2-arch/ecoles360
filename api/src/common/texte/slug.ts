/**
 * Fabrique d'identifiants d'URL.
 *
 * Le slug d'une fiche est son ADRESSE PUBLIQUE : une fois indexée, la changer
 * casse les liens entrants. D'où la normalisation stricte ici — accents
 * dépliés, tout le reste réduit au tiret — plutôt qu'un simple `toLowerCase()`
 * qui laisserait passer « Lycée » et produirait `lyc%C3%A9e` dans la barre
 * d'adresse.
 */

/** Translittère un libellé en segment d'URL : `Lycée Al Massira` → `lycee-al-massira`. */
export function versSlug(libelle: string, longueurMax = 180): string {
  return (
    libelle
      .normalize('NFD')
      // Retire les diacritiques isolés par la décomposition NFD.
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, longueurMax)
  );
}

/**
 * Cherche un slug libre en suffixant plutôt qu'en laissant échouer l'insertion.
 *
 * Deux écoles peuvent porter le même nom dans la même ville — c'est fréquent
 * pour les groupes (« Groupe Al Amal — Maternelle », « … — Primaire »). Faire
 * remonter une violation de contrainte unique jusqu'à l'utilisateur lui
 * demanderait de trouver lui-même un nom qui n'entre pas en collision, alors
 * que la collision est sur l'URL, pas sur le nom.
 */
export async function slugLibre(
  libelle: string,
  estPris: (candidat: string) => Promise<boolean>,
  options: { repli: string; longueurMax?: number },
): Promise<string> {
  const base = versSlug(libelle, options.longueurMax) || options.repli;

  for (let suffixe = 0; suffixe < 50; suffixe += 1) {
    const candidat = suffixe === 0 ? base : `${base}-${suffixe + 1}`;

    if (!(await estPris(candidat))) {
      return candidat;
    }
  }

  // Cinquante homonymes : on cesse de compter et on horodate. Laid, mais
  // unique — et cette branche ne doit jamais être atteinte en pratique.
  return `${base}-${Date.now()}`;
}
