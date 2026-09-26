// Rapatrie localement les photos de galerie des fiches de démonstration.
//
// MÊME RAISON QUE POUR LE HÉROS : dépendre d'un CDN tiers pour les images
// d'une fiche, c'est accepter une page vide le jour où il est lent ou filtré —
// ce qui arrive déjà sur le poste de développement, où une requête sur deux
// échoue.
//
// CE SONT DES IMAGES DE REMPLACEMENT : elles montrent l'intention graphique,
// pas les locaux réels des établissements. À remplacer par les photos fournies
// par chaque école — c'est d'ailleurs ce que le téléversement de l'espace
// établissement permettra.
//
//     node web/scripts/telecharger-galerie.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(racine, 'public/galerie');

/** Vues reprises de `galleryShots` dans la maquette. */
const VUES = [
  { fichier: 'facade', id: '1592280771190-3e2e4d571952' },
  { fichier: 'salle-de-classe', id: '1577896851231-70ef18881754' },
  { fichier: 'cour', id: '1594608661623-aa0bd3a69d98' },
  { fichier: 'laboratoire', id: '1606761568499-6d2451b23c66' },
  { fichier: 'bibliotheque', id: '1481627834876-b7833e8f5570' },
  { fichier: 'gymnase', id: '1571902943202-507ec2618e8f' },
  { fichier: 'cantine', id: '1555396273-367ea4eb4db5' },
];

const url = (id) =>
  `https://images.unsplash.com/photo-${id}?fm=jpg&q=72&w=1200&auto=format&fit=crop`;

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

for (const vue of VUES) {
  const fichier = path.join(destination, `${vue.fichier}.jpg`);

  if (fs.existsSync(fichier) && fs.statSync(fichier).size > 10_000) {
    console.log(`· ${vue.fichier} — déjà présent`);
    recuperees += 1;
    continue;
  }

  try {
    const image = await telecharger(vue.id);
    fs.writeFileSync(fichier, image);
    console.log(`✓ ${vue.fichier} — ${Math.round(image.length / 1024)} Ko`);
    recuperees += 1;
  } catch (erreur) {
    console.error(`✗ ${vue.fichier} — ${erreur.message}`);
    echecs += 1;
  }
}

console.log(`\n${recuperees}/${VUES.length} photos en place.`);

if (echecs > 0) {
  console.error('Relancer le script : le CDN est intermittent.');
  process.exitCode = 1;
}
