// Correctifs locaux du design system livré.
//
// Le design system arrive COMPILÉ (`web/public/ds/bundle.js`), sans export ni
// sources `.jsx`. Un défaut ne peut donc être corrigé que dans l'artefact
// lui-même — et une nouvelle livraison l'écraserait sans prévenir.
//
// Ce script est idempotent : il peut être relancé après chaque remplacement du
// bundle. Voir `docs/design-system/CORRECTIFS.md`.
//
//     node docs/design-system/appliquer-correctifs.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const bundle = path.join(racine, 'web/public/ds/bundle.js');

// `\xE9` est écrit en clair dans le bundle (quatre caractères), pas encodé.
const E_ACCENT = '\\xE9';

const correctifs = [
  {
    nom: 'CityCard — propriété label',
    // Le suffixe « établissements » est figé dans le composant : la carte ne
    // sert donc qu'aux villes. Une propriété `label` la rend réutilisable
    // (quartiers, filières…) sans toucher au reste.
    avant: ['function CityCard({', '  city,', '  count,', '  image,'].join('\n'),
    apres: ['function CityCard({', '  city,', '  count,', '  label,', '  image,'].join('\n'),
  },
  {
    nom: 'CityCard — libellé du compteur',
    //
    // DEUX DÉFAUTS EN UN SEUL CORRECTIF, ET C'EST VOLONTAIRE.
    //
    // Le composant écrivait `count + " établissements"` : pluriel systématique
    // (« 1 établissements ») ET libellé figé. Les corriger en deux passes
    // enchaînées rendait le script non rejouable — la seconde passe effaçait le
    // motif que la première cherchait, et une relecture signalait à tort un
    // correctif perdu. Une seule substitution, de la forme d'origine à la forme
    // finale, reste vraie à chaque exécution.
    //
    // Le seuil est `> 1` et non `>= 1` : « 0 établissement » est la forme
    // correcte en français, le pluriel ne commençant qu'à deux.
    avant: `}, count, " ${E_ACCENT}tablissements") : null));`,
    apres:
      `}, count, label != null ? " " + label : ` +
      `count > 1 ? " ${E_ACCENT}tablissements" : " ${E_ACCENT}tablissement") : null));`,
  },
];

const ENTETE = `/* ===========================================================================
 * BUNDLE CORRIGÉ LOCALEMENT — voir docs/design-system/CORRECTIFS.md
 *
 * Le design system est livré compilé et sans export : les défauts sont donc
 * corrigés dans cet artefact. TOUTE NOUVELLE LIVRAISON LES ÉCRASE.
 *
 * Après remplacement de ce fichier :
 *     node docs/design-system/appliquer-correctifs.mjs
 * =========================================================================== */
`;

let source = fs.readFileSync(bundle, 'utf8');
let appliques = 0;
let deja = 0;

for (const correctif of correctifs) {
  const restants = source.split(correctif.avant).length - 1;

  if (restants === 0) {
    if (source.includes(correctif.apres)) {
      console.log(`· ${correctif.nom} — déjà appliqué`);
      deja += 1;
      continue;
    }

    // Ni l'avant ni l'après : le bundle a changé de forme. On s'arrête plutôt
    // que de laisser croire que le correctif tient encore.
    console.error(`✗ ${correctif.nom} — MOTIF INTROUVABLE, correctif perdu`);
    process.exitCode = 1;
    continue;
  }

  if (restants > 1) {
    console.error(`✗ ${correctif.nom} — ${restants} occurrences, trop ambigu`);
    process.exitCode = 1;
    continue;
  }

  source = source.replace(correctif.avant, correctif.apres);
  console.log(`✓ ${correctif.nom} — appliqué`);
  appliques += 1;
}

if (!source.startsWith('/* ====')) {
  source = ENTETE + source;
}

fs.writeFileSync(bundle, source, 'utf8');
console.log(`\n${appliques} correctif(s) appliqué(s), ${deja} déjà en place.`);
