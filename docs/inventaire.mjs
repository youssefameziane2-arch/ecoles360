// Inventaire exhaustif d'une maquette : écrans, boutons, champs, listes.
//
// Le balisage est un seul gros document où chaque écran est un bloc
// `<sc-if value="{{ isXxx }}">`. Les blocs s'imbriquent (un état à l'intérieur
// d'un écran), donc on suit la profondeur plutôt que de découper naïvement.
import fs from 'node:fs';

const source = fs.readFileSync(process.argv[2], 'utf8');

/** Borne du bloc `<sc-if>` ouvert à `depart`, en suivant l'imbrication. */
function finDuBloc(texte, depart) {
  let profondeur = 0;
  let i = depart;

  while (i < texte.length) {
    const ouvre = texte.indexOf('<sc-if', i);
    const ferme = texte.indexOf('</sc-if>', i);

    if (ferme === -1) return texte.length;

    if (ouvre !== -1 && ouvre < ferme) {
      profondeur += 1;
      i = ouvre + 6;
    } else {
      profondeur -= 1;
      if (profondeur === 0) return ferme;
      i = ferme + 8;
    }
  }

  return texte.length;
}

const nettoie = (s) => s.replace(/\s+/g, ' ').trim();

/** Texte visible d'un fragment, sans balises ni interpolations. */
function libelle(fragment) {
  return nettoie(
    fragment
      .replace(/<[^>]*>/g, ' ')
      .replace(/\{\{[^}]*\}\}/g, '…')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' '),
  );
}

const ecrans = [];
const vus = new Set();
const re = /<sc-if\s+value="\{\{\s*(is[A-Za-z0-9]+)\s*\}\}"/g;
let m;

while ((m = re.exec(source))) {
  const nom = m[1];
  if (vus.has(nom)) continue;
  vus.add(nom);

  const debut = m.index;
  const fin = finDuBloc(source, debut);
  const bloc = source.slice(debut, fin);

  // Boutons du design system.
  const boutons = [
    ...bloc.matchAll(/<x-import[^>]*DesignSystem_66e6db\.Button[^>]*>([\s\S]*?)<\/x-import>/g),
  ].map((b) => libelle(b[1]));

  // Boutons et éléments cliquables maison.
  const cliquables = [
    ...bloc.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g),
    ...bloc.matchAll(/<span[^>]*sc-camel-on-click[^>]*>([\s\S]*?)<\/span>/g),
  ]
    .map((b) => libelle(b[1]))
    .filter((t) => t && t.length < 60);

  // Champs de saisie.
  const champs = [
    ...bloc.matchAll(/<input[^>]*?(?:name|placeholder)="([^"]{2,60})"/g),
    ...bloc.matchAll(/<textarea[^>]*?(?:name|placeholder)="([^"]{2,60})"/g),
    ...bloc.matchAll(/<sc-raw-select[^>]*?name="([^"]{2,60})"/g),
  ].map((c) => c[1]);

  // Listes répétées.
  const listes = [...bloc.matchAll(/<sc-for\s+list="\{\{\s*([A-Za-z0-9_.]+)\s*\}\}"/g)].map(
    (l) => l[1],
  );

  // États internes (sc-if imbriqués).
  const etats = [...bloc.slice(1).matchAll(/<sc-if\s+value="\{\{\s*([A-Za-z0-9_.]+)\s*\}\}"/g)]
    .map((e) => e[1])
    .filter((e) => e !== nom);

  // Composants du design system utilisés.
  const composants = [
    ...bloc.matchAll(/DesignSystem_66e6db\.([A-Za-z]+)/g),
  ].map((c) => c[1]);

  ecrans.push({
    nom,
    octets: bloc.length,
    boutons: [...new Set([...boutons, ...cliquables])],
    champs: [...new Set(champs)],
    listes: [...new Set(listes)],
    etats: [...new Set(etats)],
    composants: [...new Set(composants)],
  });
}

ecrans.sort((a, b) => b.octets - a.octets);

console.log(`${ecrans.length} blocs d'écran trouvés\n`);

for (const e of ecrans) {
  console.log(`## ${e.nom}  (${e.octets} octets)`);
  if (e.composants.length) console.log(`   DS      : ${e.composants.join(', ')}`);
  if (e.listes.length) console.log(`   listes  : ${e.listes.join(', ')}`);
  if (e.champs.length) console.log(`   champs  : ${e.champs.join(' | ')}`);
  if (e.boutons.length) console.log(`   boutons : ${e.boutons.join(' | ')}`);
  if (e.etats.length) console.log(`   états   : ${e.etats.join(', ')}`);
  console.log();
}
