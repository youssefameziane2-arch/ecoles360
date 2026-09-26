// Plan détaillé d'un écran de maquette : sections, titres, surtitres, boutons.
import fs from 'node:fs';

const t = fs.readFileSync(process.argv[2], 'utf8');
const cible = process.argv[3];

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

const debut = t.indexOf(`<sc-if value="{{ ${cible} }}"`);
if (debut < 0) throw new Error(`écran ${cible} introuvable`);
const bloc = t.slice(debut, finDuBloc(t, debut));

const propre = (s) =>
  s
    .replace(/<[^>]*>/g, ' ')
    .replace(/\{\{\s*([^}]*?)\s*\}\}/g, '«$1»')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Repères structurants, dans l'ordre d'apparition.
const marqueurs = [];

const pousse = (re, type) => {
  for (const m of bloc.matchAll(re)) {
    const texte = propre(m[1] ?? m[0]);
    if (texte) marqueurs.push({ pos: m.index, type, texte });
  }
};

pousse(/<h1[^>]*>([\s\S]*?)<\/h1>/g, 'H1');
pousse(/<h2[^>]*>([\s\S]*?)<\/h2>/g, 'H2');
pousse(/<h3[^>]*>([\s\S]*?)<\/h3>/g, 'h3');
// Surtitre : petit texte rouge en majuscules au-dessus d'un titre.
pousse(/<div[^>]*text-transform:uppercase;color:#E63946[^>]*>([\s\S]*?)<\/div>/g, 'surtitre');
pousse(/<sc-for\s+list="\{\{\s*([A-Za-z0-9_.]+)\s*\}\}"[^>]*hint-placeholder-count="(\d+)"/g, 'liste');
pousse(
  /<x-import[^>]*DesignSystem_66e6db\.Button[^>]*>([\s\S]*?)<\/x-import>/g,
  'bouton',
);
pousse(/<button[^>]*class="e3-btn"[^>]*>([\s\S]*?)<\/button>/g, 'bouton');
pousse(/<img[^>]*alt="([^"]*)"/g, 'image');

marqueurs.sort((a, b) => a.pos - b.pos);

console.log(`# ${cible} — ${bloc.length} octets\n`);
let dernier = '';
for (const m of marqueurs) {
  const ligne = `${m.type.padEnd(9)} ${m.texte.slice(0, 110)}`;
  if (ligne !== dernier) console.log(ligne);
  dernier = ligne;
}
