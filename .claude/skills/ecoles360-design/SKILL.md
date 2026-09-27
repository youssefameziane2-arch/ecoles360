---
name: ecoles360-design
description: Use this skill to generate well-branded interfaces and assets for écoles360 (annuaire d'établissements scolaires privés au Maroc), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick reference
- **Brand:** écoles360 — paid directory of private schools in Morocco. Personality: confiance & sérieux, moderne. Language: **French (Maroc)**, MAD currency, decimal comma (4,8), ★ ratings.
- **Color 60-30-10:** white dominant · navy `#1D3557` / sidebar `#15233A` structure · red `#E63946` accent ONLY (CTA/active/key link). Green `#2E9E5B` = WhatsApp/success, amber `#E9A23B` = stars/alerts.
- **Type:** Inter 400–800; heavy headings with negative tracking. Hero 40 → eyebrow 11.
- **Tokens:** link `styles.css` (imports `tokens/*.css`). Use CSS custom properties (`--action`, `--surface-card`, `--text-primary`, …).
- **Bundle:** `_ds_bundle.js`, namespace `window.Coles360DesignSystem_66e6db`.
- **Assets:** `assets/logo.png` (light bg), `assets/logo-on-dark.png` (navy bg).

## Components (by group)
- **core/** Icon (Lucide-style line-icon set — the single icon source; use instead of emoji)
- **forms/** Button · Input · Select · Checkbox · Textarea
- **data/** Badge · Tag · Avatar · ProgressBar · PermissionToggle · Pagination · DataTable
- **cards/** EstablishmentCard · CityCard · StatCard · PricingCard · ReviewCard · RequestCard
- **navigation/** Header (+ Wordmark) · SidebarNav (3 themes) · BottomTabBar · Breadcrumb · Stepper
- **search/** TypePicker · CitySelect · FilterBar
- **profile/** Tabs · TeamMember · EquipmentItem · FaqAccordion · RatingBreakdown · SocialLinks · VideoEmbed
- **feedback/** Modal · Toast · EmptyState · Skeleton (+ SkeletonCard)
- **charts/** BarChart · SourceBars

Each component dir has `<Name>.jsx`, `<Name>.d.ts` (props), and `<Name>.prompt.md` (usage + JSX example). Read the `.prompt.md` before using a component.

## UI kits (full screens) — `ui_kits/`
`site-public/` · `espace-etablissement/` · `secretariat/` · `admin/`. Each `index.html` is an interactive recreation composing the primitives — copy one as a starting point.

## Usage in an HTML artifact
```html
<link rel="stylesheet" href="styles.css">
<script src="_ds_bundle.js"></script>
<script type="text/babel">
  const { Button, EstablishmentCard } = window.Coles360DesignSystem_66e6db;
</script>
```
