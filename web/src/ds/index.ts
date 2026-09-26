import type { ComponentType } from 'react';

/**
 * Design system écoles360 — 44 composants (livrable 12 §1).
 *
 * LE BUNDLE EST UN SCRIPT GLOBAL, pas un module. Il a été produit par l'outil
 * de conception : il attend un `React` global et s'attache à
 * `window.Coles360DesignSystem_66e6db`. Le réécrire en modules ES prendrait des
 * jours et ferait diverger le code des maquettes validées — ce module charge
 * donc le bundle tel quel et l'expose derrière un accès typé.
 *
 * Le chargement est explicite (`chargerDesignSystem`) et non un effet de bord
 * d'import : il faut que `window.React` soit posé AVANT que le script ne
 * s'exécute, et un ordre d'import ne garantit pas cela de façon lisible.
 */

interface BundleDesignSystem {
  [nom: string]: unknown;
  __errors?: unknown[];
}

const NAMESPACE = 'Coles360DesignSystem_66e6db';
const CHEMIN_BUNDLE = '/ds/bundle.js';

let promesseChargement: Promise<BundleDesignSystem> | null = null;

/**
 * Charge le bundle une seule fois et rend le namespace.
 *
 * Idempotent : plusieurs appels concurrents partagent la même promesse, sinon
 * le script serait injecté deux fois et les composants redéfinis en vol.
 */
export function chargerDesignSystem(): Promise<BundleDesignSystem> {
  promesseChargement ??= new Promise<BundleDesignSystem>((resoudre, rejeter) => {
    const deja = (window as unknown as Record<string, BundleDesignSystem | undefined>)[NAMESPACE];

    if (deja) {
      resoudre(deja);
      return;
    }

    const script = document.createElement('script');
    script.src = CHEMIN_BUNDLE;
    script.async = false;

    script.onload = () => {
      const ns = (window as unknown as Record<string, BundleDesignSystem | undefined>)[NAMESPACE];

      if (!ns) {
        rejeter(new Error(`Le design system n'a pas exposé « ${NAMESPACE} ».`));
        return;
      }

      // Le bundle capture ses propres erreurs de composant plutôt que d'échouer
      // en bloc : les remonter permet de savoir lequel manque, au lieu de
      // découvrir un `undefined` au moment du rendu.
      if (ns.__errors?.length) {
        console.warn('Design system — composants en erreur :', ns.__errors);
      }

      resoudre(ns);
    };

    script.onerror = () => rejeter(new Error(`Chargement impossible de ${CHEMIN_BUNDLE}.`));

    document.head.appendChild(script);
  });

  return promesseChargement;
}

/**
 * Accès typé à un composant du design system.
 *
 * Lève si le composant est absent plutôt que de rendre `undefined` : un nom mal
 * orthographié doit échouer bruyamment au premier rendu, pas produire une page
 * blanche sans message.
 */
export function composant<P = Record<string, unknown>>(nom: string): ComponentType<P> {
  const ns = (window as unknown as Record<string, BundleDesignSystem | undefined>)[NAMESPACE];
  const trouve = ns?.[nom];

  if (typeof trouve !== 'function') {
    throw new Error(
      `Composant « ${nom} » absent du design system. ` +
        `Disponibles : ${Object.keys(ns ?? {}).filter((c) => c !== '__errors').join(', ')}`,
    );
  }

  return trouve as ComponentType<P>;
}
