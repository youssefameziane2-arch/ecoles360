// Rapatrie localement les photos du héros de l'accueil.
//
// POURQUOI LOCALEMENT. La maquette pointe `images.unsplash.com`. Dépendre d'un
// CDN tiers pour la première image que voit un visiteur, c'est accepter que la
// page d'accueil soit vide le jour où ce CDN est lent, bloqué par un réseau
// d'entreprise, ou simplement indisponible — ce qui arrive déjà sur le poste de
// développement, où une requête sur deux échoue.
//
// Ces fichiers sont des IMAGES DE REMPLACEMENT : elles portent l'intention de
// la direction artistique, pas des établissements marocains réels. À remplacer
// par les visuels du client avant la mise en ligne.
//
//     node web/scripts/telecharger-heros.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(racine, 'public/heros');

/** Identifiants Unsplash repris de `TYPES` dans la maquette. */
const PHOTOS = {
  creche: '1503454537195-1dcabb73ffb9',
  primaire: '1594608661623-aa0bd3a69d98',
  college: '1577896851231-70ef18881754',
  lycee: '1541339907198-e08756dedf3f',
  universite: '1564981797816-1043664bf78d',
  // La maquette réutilise la photo d'université pour l'école supérieure.
  superieur: '1564981797816-1043664bf78d',
  formation: '1531545514256-b1400bc00f31',
};

const url = (id) =>
  `https://images.unsplash.com/photo-${id}?fm=jpg&q=72&w=1600&auto=format&fit=crop`;

/** Une seule tentative peut échouer : le CDN est intermittent. */
async function telecharger(id, essais = 4) {
  for (let essai = 1; essai <= essais; essai += 1) {
    try {
      const reponse = await fetch(url(id), { signal: AbortSignal.timeout(20_000) });
      if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);

      return Buffer.from(await reponse.arrayBuffer());
    } catch (erreur) {
      if (essai === essais) throw erreur;
      await new Promise((r) => setTimeout(r, 800 * essai));
    }
  }

  throw new Error('inatteignable');
}

fs.mkdirSync(destination, { recursive: true });

let recuperees = 0;
let echecs = 0;

for (const [type, id] of Object.entries(PHOTOS)) {
  const fichier = path.join(destination, `${type}.jpg`);

  if (fs.existsSync(fichier) && fs.statSync(fichier).size > 10_000) {
    console.log(`· ${type} — déjà présent`);
    recuperees += 1;
    continue;
  }

  try {
    const image = await telecharger(id);
    fs.writeFileSync(fichier, image);
    console.log(`✓ ${type} — ${Math.round(image.length / 1024)} Ko`);
    recuperees += 1;
  } catch (erreur) {
    console.error(`✗ ${type} — ${erreur.message}`);
    echecs += 1;
  }
}

console.log(`\n${recuperees}/${Object.keys(PHOTOS).length} photos en place.`);

if (echecs > 0) {
  console.error('Relancer le script : le CDN est intermittent.');
  process.exitCode = 1;
}
