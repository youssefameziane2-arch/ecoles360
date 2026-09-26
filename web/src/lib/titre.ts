import { useEffect } from 'react';

const SUFFIXE = 'écoles360';

/**
 * Titre et description de la page courante.
 *
 * SUR UN ANNUAIRE, LE TITRE EST LE PRODUIT. C'est lui qui s'affiche dans les
 * résultats de recherche, dans un onglet, et dans un lien partagé sur
 * WhatsApp — le canal par lequel la plupart des parents marocains se passent
 * une adresse. Un site dont les 8 000 fiches partagent le même titre est
 * indistinguable de lui-même partout où il compte.
 *
 * `titre` à `null` signifie « pas encore chargé » : on laisse alors le titre
 * précédent en place plutôt que d'afficher un intitulé provisoire qui
 * clignoterait à chaque navigation.
 */
export function useTitrePage(titre: string | null, description?: string): void {
  useEffect(() => {
    if (titre === null) return;

    document.title = titre === SUFFIXE ? titre : `${titre} — ${SUFFIXE}`;
  }, [titre]);

  useEffect(() => {
    if (!description) return;

    const balise =
      document.querySelector<HTMLMetaElement>('meta[name="description"]') ??
      document.head.appendChild(
        Object.assign(document.createElement('meta'), { name: 'description' }),
      );

    balise.content = description;
  }, [description]);
}
