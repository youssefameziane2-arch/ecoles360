# écoles360 — Design System

**écoles360** (ecoles360.com) est un annuaire publicitaire d'établissements scolaires privés au Maroc. La plateforme référence crèches, écoles primaires, collèges, lycées, universités et centres de formation. Elle aide les parents à **rechercher, comparer et contacter** des établissements, et permet aux établissements de **payer pour gagner en visibilité** (mise en avant sponsorisée, crédits consommés à la vue/au clic, ou abonnement).

**Personnalité de marque :** confiance et sérieux (c'est de l'éducation — les parents doivent se sentir rassurés), tout en restant moderne et dynamique.

## Trois surfaces, une identité

1. **Site public** — accueil, recherche avec filtres, fiches d'établissements.
2. **Espace professionnel** (établissements) — tableau de bord, gestion de fiche, statistiques, crédits.
3. **Back-office d'administration** — indicateurs, modération, rappels, tableaux de données.

## Sources

- `uploads/ecoles360 - Maquette.html` — maquette de marque fournie (page « bundled »). Sa version décodée et lisible est `uploads/maquette-decoded.html` : c'est la **source de vérité** pour les couleurs, la typographie, les composants et les six écrans (accueil, résultats, fiche, connexion, espace pro, admin). La police Inter (5 graisses) en a été extraite vers `assets/fonts/`.

---

## CONTENT FUNDAMENTALS

- **Langue :** français (Maroc). Devise en **MAD** ; nombres avec espace fine comme séparateur de milliers (`2 500 MAD/mois`, `86 400 MAD`, `1 200 établissements`) et **virgule décimale** pour les notes (`★ 4,8`).
- **Voix :** on s'adresse au parent au **vous** (« Trouvez la bonne école pour **votre** enfant », « près de chez **vous** »). Côté pro/admin, ton direct et utilitaire (« Voici l'activité de votre fiche ce mois-ci »).
- **Ton :** rassurant, clair, sans jargon. Phrases courtes. On vend la **confiance** (« vérifiés et recommandés », « En toute confiance ») et l'**action simple** (« Recherchez · Comparez · Contactez »).
- **Casse :** titres en casse de phrase (pas de Title Case). Majuscules réservées aux **eyebrows / labels** courts (`TÉLÉPHONE`, `HORAIRES`, `ADMINISTRATION`) et aux en-têtes de tableau.
- **Boutons :** verbes d'action à l'infinitif (« Rechercher », « Appliquer les filtres », « Recharger », « Valider », « Contacter sur WhatsApp »).
- **Badges/statuts :** courts et factuels — `Sponsorisé`, `✓ Vérifié`, `Solde bas`, `Solde épuisé`, `Abonnement expirant`, `Inscription en attente`.
- **Emoji :** **oui**, avec parcimonie — comme pictogrammes de catégories (🍼 ✏️ 📚 🎓 🏛️ 💼) et d'actions rapides (📞 🌐), et un 👋 d'accueil dans l'espace pro. Jamais décoratifs à l'excès.

---

## VISUAL FOUNDATIONS

**Règle 60-30-10 :** ~60 % blanc, ~30 % noir/gris, ~10 % rouge. Le rouge `#E63946` reste un **accent** (boutons, badge « Sponsorisé », état actif, barre de progression) — **jamais** en grands aplats.

- **Couleurs** — Blanc dominant `#FFFFFF` ; fonds clairs `#F5F6F8` (sections/pages) et `#F1F3F6` (puces, pistes). Texte presque noir `#1A1A1A` ; secondaire `#5A6472` ; discret `#9AA3AF`. Accent secondaire bleu nuit `#1D3557` (liens, boutons « Appeler », panneaux sombres). Sémantique : vert `#2E9E5B` (succès/WhatsApp), ambre `#E9A23B` (alertes, étoiles). Chaque couleur sémantique a une teinte de fond claire pour les badges (`#FDE8EA`, `#E7EDF5`, `#E6F4EC`, `#FCF1DE`). Voir `tokens/colors.css`.
- **Typographie** — **Inter** uniquement (auto-hébergée, graisses 400/500/600/700/800). Titres lourds (700–800) avec **interlettrage négatif** (`-1px` héros, `-0.5px` sections). Échelle : héros 46px, H1 30px, H2 28px, titre dashboard 24px, corps 14–15px, légendes 12–13px, eyebrow 11px. Voir `tokens/typography.css`.
- **Espace** — Base 4px, généreux. Conteneur public `1180px`, rail filtres `280px`, sidebar dashboard `248px`. Sections marketing respirent (`64–88px` vertical). Sur mobile, ces valeurs deviennent fluides via `tokens/breakpoints.css` (gouttière `--container-pad`, rythme `--section-y`).
- **Coins arrondis** — Badges `6px`, boutons/inputs `9–10px`, tuiles `12px`, cartes/panneaux `14–16px`, pills `20px`, avatars/étapes ronds.
- **Ombres — légères et plates, jamais lourdes.** Hover de carte `0 6–10px 18–28px rgba(26,26,26,.06–.10)` ; barre de recherche héros `0 8px 30px rgba(26,26,26,.10)`. La plupart des cartes n'ont **pas** d'ombre au repos — elles s'appuient sur une **bordure hairline `#ECEEF1`**.
- **Cartes** — fond blanc, bordure `1px #ECEEF1`, rayon `14–16px`, pas d'ombre au repos. Au survol : légère élévation (ombre douce + `translateY(-2px)`) et/ou bordure qui passe au rouge. Les cartes sponsorisées portent un **liseré rouge** `4px` à gauche ou un badge « Sponsorisé ».
- **États** — Survol : élévation douce, bordure rouge, ou fond foncé dans la nav admin sombre. Liens « Tout voir → », « → » fréquents. Transition standard `0.15s ease`. Pas de bounce, pas d'animation décorative en boucle.
- **Imagerie** — Placeholders neutres `#E3E7EC` avec icône bâtiment ligne `#AEB6C2` (les vraies photos d'établissements viendront s'y substituer). Pas de gradients, pas de textures, pas de flou.
- **Data viz** — Barres neutres `#C9D2DE`, la barre « courante » mise en avant en rouge `#E63946`. KPI : grand nombre 28px + delta vert/ambre.

---

## RESPONSIVE & MOBILE

La maquette d'origine était **fig ée en largeurs desktop** (héros 46px, grilles `repeat(6,1fr)`, conteneur 1180px) — rien ne s'adaptait au téléphone. La couche responsive corrige cela ; elle vit dans `tokens/breakpoints.css` (variables) et `tokens/responsive.css` (utilitaires), et est documentée par les cartes du groupe **Responsive**.

- **Approche mobile-first.** On conçoit pour `< 600px` puis on enrichit. Cinq paliers : `base < 600` · `sm ≥ 600` · `md ≥ 900` · `lg ≥ 1200` · `xl ≥ 1440` (tokens `--bp-*`). C'est à `md` que reviennent sidebar, rail de filtres et nav d'en-tête.
- **Type fluide.** Utiliser les tokens `--fs-*-fluid` (clamp) sur les écrans plutôt que les `--fs-*` fixes : `--fs-hero-fluid` passe de 46→28px, le tracking se desserre (`--ls-hero-fluid`). Les `--fs-*` fixes restent la référence/plafond desktop.
- **Navigation mobile.** Deux patterns selon la surface : le **site public** ouvre un **tiroir hamburger** latéral (voile sombre, CTA ancré en bas, `--drawer-w`) ; l'**espace pro** et l'**admin** posent une **barre d'onglets fixe en bas** (`--bottombar-h`, 3 à 5 destinations au pouce).
- **Tableaux.** Les `DataTable` adoptent `.e360-responsive-table` : sous `md`, chaque ligne se replie en **carte empilée** dont chaque cellule affiche son intitulé de colonne (`data-label`). À défaut, scroll horizontal avec 1ʳᵉ colonne figée.
- **Reflow.** `.e360-split` empile sidebar + contenu sous `md` ; le **rail de filtres** se replie derrière un bouton qui ouvre une **feuille du bas** ; `.e360-grid` (auto-fill `minmax`) reflue les résultats de N colonnes à 1 sans media query.
- **Cibles tactiles.** Tout contrôle tapotable atteint **44×44px** (`--touch-min`, utilitaire `.e360-touch`), espacement entre cibles ≥ 8px.
- **Utilitaires** (`tokens/responsive.css`) : `.e360-container[--narrow|--wide]`, `.e360-section`, `.e360-grid[--wide|--tight]`, `.e360-split`, `.e360-hide-mobile` / `.e360-only-mobile`, `.e360-touch`, `.e360-hero/.e360-h1/.e360-h2`, `.e360-responsive-table`.

---

## ICONOGRAPHY

- **Emoji** comme système d'icônes léger et reconnaissable : catégories (🍼 Crèche, ✏️ Primaire, 📚 Collège, 🎓 Lycée, 🏛️ Université, 💼 Formation), actions (📞 Appeler, 🌐 Site web), navigation admin (▦ 🏫 📝 🔔 👥 📊 ⚙️), états (➕ ✅ ↩). C'est l'approche de la maquette ; la conserver pour rester fidèle.
- **Icône ligne** dédiée pour le **bâtiment scolaire** (placeholders d'images, marque) — `assets/icons/school-building.svg`, trait `1.4`, couleur `#AEB6C2`.
- **Caractères unicode** comme micro-icônes : étoiles `★`/`☆` (notes), chevrons `‹ › →`, flèches de delta `↑`, séparateur `·`, puce `›` (fil d'Ariane).
- **Logo** — mot « écoles » en sombre + « 360 » en rouge. Variantes : `assets/logo/ecoles360-logo.svg` (clair), `…-logo-dark.svg` (sur fond sombre), `…-mark.svg` (carré app/favicon).
- *Recommandation (non bloquante) :* pour une montée en gamme « production », un set de pictos ligne homogène (ex. Lucide, trait 1.5) pourrait remplacer les emoji de navigation tout en gardant les emoji de catégories. À valider avec l'équipe.

---

## INDEX — contenu du dépôt

- `styles.css` — point d'entrée global (liste d'`@import` uniquement). Les consommateurs lient ce seul fichier.
- `tokens/` — `fonts.css` (Inter `@font-face`), `colors.css`, `typography.css`, `spacing.css` (espace, rayons, ombres, layout), `breakpoints.css` (paliers, type fluide, tactile), `responsive.css` (conteneur + utilitaires de reflow).
- `assets/` — `fonts/` (Inter 400–800 woff2), `logo/` (wordmark clair/sombre + mark), `icons/` (bâtiment scolaire).
- `components/` — primitives réutilisables, groupées par usage :
  - `core/` — **Button**, **Badge**, **Tag**, **Avatar** (actions & libellés)
  - `forms/` — **Input**, **Select**, **Checkbox** (contrôles de formulaire, focus/accent rouge)
  - `surfaces/` — **Card**, **StatCard**, **ProgressBar** (surfaces & données)
  - `navigation/` — **Tabs**, **Pagination**, **DataTable** (navigation & tableaux back-office)
- `uploads/` — maquette de marque fournie + version décodée.

### Composants
| Composant | Groupe | Rôle |
|---|---|---|
| `Button` | core | Action plate arrondie — primaire rouge, navy secondaire, vert succès/WhatsApp, outline, ghost. |
| `Badge` | core | Pastille de statut sur teinte douce — Sponsorisé, ✓ Vérifié, Solde bas, info, type. |
| `Tag` | core | Chip neutre pour filières / spécialités. |
| `Avatar` | core | Monogramme ou image, rond ou tuile arrondie. |
| `Input` | forms | Champ texte labellisé, bordure rouge au focus. |
| `Select` | forms | Liste déroulante assortie à l'Input. |
| `Checkbox` | forms | Case à cocher + label, accent rouge. |
| `Card` | surfaces | Surface de base — blanc, hairline, arrondi, plat ; option hover + liseré sponsorisé. |
| `StatCard` | surfaces | Tuile KPI — label discret, grand nombre, delta. |
| `ProgressBar` | surfaces | Jauge plate (crédits / quotas). |
| `Tabs` | navigation | Barre d'onglets soulignée (rouge actif). |
| `Pagination` | navigation | Boutons de page carrés, page active rouge. |
| `DataTable` | navigation | Tableau back-office — en-tête majuscule, lignes hairline. |

*UI kits (site public, espace pro, admin), cartes de spécimens de fondations, et SKILL.md sont planifiés — voir la todo list du projet.*

---

## Comment consommer

Lier la feuille globale, puis utiliser les composants via le namespace exposé par le bundle :

```html
<link rel="stylesheet" href="styles.css">
<script src="_ds_bundle.js"></script>
<script>
  const { Button, Badge, Card, StatCard, Tabs, DataTable } = window.Coles360DesignSystem_f0cdf0;
</script>
```
