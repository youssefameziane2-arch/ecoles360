import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/**
 * Front écoles360 — livrable 12.
 *
 * Le proxy `/api` vers le conteneur de l'API reproduit en développement ce que
 * nginx fait en production (livrable 14 §2) : front et API sous la MÊME
 * ORIGINE. C'est ce qui permet au cookie de session `SameSite=Lax` de partir
 * seul, sans CORS ni jeton dans le stockage local (livrable 12 §1).
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: '0.0.0.0', // joignable depuis l'hôte quand le front tourne en conteneur
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.API_URL ?? 'http://127.0.0.1:3000',
        changeOrigin: false, // même origine : on ne réécrit pas l'en-tête Host
      },
      // Photos téléversées — elles vivent dans le volume `storage`, servi par
      // l'API en développement et par nginx en production (livrable 14 §2).
      // Sans ce renvoi, une galerie fraîchement remplie afficherait des
      // images cassées sur le serveur de développement.
      '/media': {
        target: process.env.API_URL ?? 'http://127.0.0.1:3000',
        changeOrigin: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
