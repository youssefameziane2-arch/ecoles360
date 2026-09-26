import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { chargerDesignSystem } from './ds';
import { App } from './App';
import './styles.css';

/**
 * Amorçage — livrable 12 §1.
 *
 * `window.React` est posé AVANT le chargement du design system : le bundle a
 * été produit par l'outil de conception et attend un React global, comme dans
 * les maquettes. Sans cette ligne, les 44 composants échouent à l'évaluation.
 */
(window as unknown as { React: typeof React }).React = React;

const client = new QueryClient({
  defaultOptions: {
    queries: {
      // Les fiches changent rarement : une minute de fraîcheur évite de
      // relancer la recherche à chaque retour arrière du navigateur.
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

async function demarrer(): Promise<void> {
  await chargerDesignSystem();

  const racine = document.getElementById('root');

  if (!racine) {
    throw new Error('Élément #root introuvable.');
  }

  createRoot(racine).render(
    <React.StrictMode>
      <QueryClientProvider client={client}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

void demarrer().catch((erreur: unknown) => {
  // Un échec d'amorçage laisse une page blanche : mieux vaut un message lisible
  // qu'un écran vide sur lequel personne ne sait quoi faire.
  document.body.innerHTML =
    '<p style="font:500 15px/1.6 Inter,sans-serif;color:#E63946;padding:40px;">' +
    "Le site n'a pas pu démarrer. Rechargez la page ; si le problème persiste, " +
    'contactez-nous à contact@ecoles360.com.</p>';
  console.error(erreur);
});
