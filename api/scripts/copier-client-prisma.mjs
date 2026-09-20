/**
 * Recopie le client Prisma généré dans `dist/`.
 *
 * POURQUOI CE SCRIPT EXISTE — le client est généré sous `src/generated/prisma`
 * (livrable 10 §2.0). C'est du JavaScript, pas des sources TypeScript : `tsc` ne
 * le compile donc pas, et il n'atterrit jamais dans `dist/` tout seul. Or
 * `dist/prisma/prisma.service.js` fait `require('../generated/prisma')`.
 *
 * La recopie était auparavant confiée au champ `assets` de nest-cli.json. Elle
 * est ASYNCHRONE : sous `nest start --watch`, l'application démarrait avant la
 * fin de la copie et mourait sur « Cannot find module ./runtime/library.js ».
 * Le watcher ne relançant rien tant qu'aucun fichier ne change, le conteneur
 * restait « Up » avec un processus mort — panne silencieuse, reproductible sur
 * tout poste où la copie est lente (montage Windows → WSL2, 90 Mo de moteurs).
 *
 * `fs.cpSync` est synchrone : quand ce script rend la main, la copie est faite.
 *
 * Les moteurs de requête de l'autre plateforme sont écartés : `binaryTargets`
 * en déclare deux (natif + linux-musl pour les images alpine), mais une seule
 * est utilisable à l'exécution. Cela épargne ~19 Mo à chaque build.
 */
import { cpSync, existsSync, rmSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(racine, 'src', 'generated');
const cible = join(racine, 'dist', 'generated');

if (!existsSync(source)) {
  console.error(
    `Client Prisma introuvable dans ${source}.\n` +
      'Lancez `pnpm --filter api exec prisma generate` au préalable.',
  );
  process.exit(1);
}

// Une copie partielle héritée d'un build précédent serait pire que pas de copie
// du tout : on repart d'un dossier propre.
rmSync(cible, { recursive: true, force: true });

const moteurEtranger = process.platform === 'win32' ? /^libquery_engine-/ : /^query_engine-windows/;

cpSync(source, cible, {
  recursive: true,
  filter: (chemin) => {
    const nom = basename(chemin);
    // Résidus d'un `prisma generate` interrompu (fichier verrouillé sous Windows).
    if (nom.includes('.tmp')) return false;
    if (moteurEtranger.test(nom)) return false;
    return true;
  },
});

console.log('Client Prisma copié dans dist/generated.');
