# écoles360 — Design System

High-fidelity, reusable design system for **écoles360** (ecoles360.com), a paid advertising directory of private schools in Morocco. Built from the source-of-truth wireframe (`uploads/écoles360 - Wireframes branchés.dc.html`) and the brand logo (`uploads/logo.png`).

## Product context
écoles360 connects **parents** (search · compare · contact schools, free) with **establishments** (pay for visibility: sponsored placement, credit packs, subscription). Four surfaces:
- **Site public** — parent journey: Accueil, Résultats, Fiche établissement, Contact.
- **Espace établissement** — dark-sidebar back-office: dashboard, Ma fiche, Statistiques, Crédits & abonnement, Avis.
- **Espace secrétariat** — delegated back-office (scoped permissions): demandes de contact, rendez-vous, fiches, modération.
- **Back-office admin** — establishments validation/moderation, secrétaires & permissions, rappels.

Personality: **confiance & sérieux, moderne**. Language: **French (Maroc)** — MAD currency, decimal **comma** (4,8), ★ ratings.

### Sources
- Wireframe (source of truth for inventory, patterns, copy): `uploads/écoles360 - Wireframes branchés.dc.html`
- Logo: `uploads/logo.png` → `assets/logo.png` (light bg) + `assets/logo-on-dark.png` (white wordmark, red "360", for navy surfaces)
- Bundle namespace: **`Coles360DesignSystem_66e6db`** → `const { Button } = window.Coles360DesignSystem_66e6db`

---

## CONTENT FUNDAMENTALS
- **Language & voice:** French (Maroc), warm but professional. Addresses the user with **vous**. Reassuring, never salesy ("En toute confiance", "Trouvez l'établissement idéal").
- **Casing:** Sentence case for titles ("Établissements à la une", "Comment ça marche"). UPPERCASE only for short eyebrows/labels ("EN TOUTE CONFIANCE", "ESPACE ÉTABLISSEMENT", table headers).
- **Numbers:** decimal **comma** (★ 4,8 · 2 500 MAD). Thin space as thousands separator (8 420, 2 500). Currency written **MAD** after the amount ("2 500 MAD/mois").
- **Status copy:** short French labels — Sponsorisé, ✓ Vérifié, Nouveau, En cours, Traité, À confirmer, Payée, Solde bas, Solde épuisé, En attente, Actif, Suspendu.
- **Greetings:** dashboards open with "Bonjour 👋" / "Bonjour Sara 👋". The waving emoji is the one sanctioned emoji in chrome.
- **CTAs:** verb-first ("Rechercher", "Contacter", "Inscrire mon établissement", "Recharger mes crédits", "Publier la réponse").
- **Tone of microcopy:** helpful and concrete ("Vos crédits sont consommés à chaque vue sponsorisée et contact reçu.").

## VISUAL FOUNDATIONS
- **Color — 60-30-10.** White dominant (~60%); **navy** `#1D3557` / sidebar `#15233A` for structure & dark panels (~30%); **red** `#E63946` is accent ONLY — CTAs, active nav, key links (~10%). Green `#2E9E5B` = WhatsApp/success, amber `#E9A23B` = stars/alerts. Soft tint badges: red `#FDE8EA`, navy `#E7EDF5`, green `#E6F4EC`, amber `#FCF1DE`. Never use red for a second non-action element in a group.
- **Type.** Inter, 400–800. Headings heavy (800) with negative tracking (-0.5 to -1.2px). Scale hero(40) → display(28) → h1(24) → h2(18) → body(14) → eyebrow(11, uppercase, +1px). KPI numerals 30–40px extrabold.
- **Spacing.** 4px base. Section gutter 40px desktop / 16px mobile. Grid gap 18px. Touch targets ≥44px.
- **Radii.** badge 6 · button/input 9–10 · field/chip 12 · card 14–16 · pill 20 · avatar 50%.
- **Surfaces / cards.** Cards = white on a **1px hairline** `#ECEEF1` with **no shadow at rest**. Shadow appears only on floating elements (search card `0 8px 30px`, hero search `0 14px 40px`). App background `#F5F6F8`; sunken/track `#F1F3F6`.
- **Imagery.** Real photos (placeholder: `picsum.photos` seeds in wireframe). City/hero cards use a navy **scrim** gradient bottom-up for legible white text. Image placeholder block `#E3E7EC`.
- **Backgrounds.** Flat fills only — no decorative gradients except the navy scrims over photos and one subtle radial accent inside the navy "abonnement" panel.
- **Borders.** Hairline `#ECEEF1` (cards/dividers), control `#E1E5EA` (inputs/chips), strong `#D4DAE2` (device frames). Sponsored cards carry a **4px red left border**. Flagged/abusive review cards use a red-tinted border `#F3C9CD`.
- **Animation.** Restrained: 0.15s ease on hover/focus; press = 1px nudge down + slight brightness drop. Hero slider auto-advances every 2,5 s. No bounces, no infinite loops on content.
- **Hover/press.** Buttons darken ~6% (brightness 0.94) on hover, nudge down 1px on press. Filter chips invert to navy fill when active.
- **Active states.** Nav: red text + 2px red underline (public) / solid red fill (sidebar). Selected type chip: 1.5px navy border.

## ICONOGRAPHY
- The **source wireframe uses emoji** as icons throughout (🍼 ✏️ 📚 🎓 🏛️ 💼 for school types; 📞 🌐 ⭐ 💳 👁 🔔 ✉️ 📅 etc. for UI). écoles360 has **no custom icon font or SVG set**.
- **Implemented as the `Icon` component** (`components/core/Icon.jsx`) — a self-contained set of Lucide-style line SVGs (paths inlined, no CDN dependency, ISC-licensed geometry), 24×24 / 2px stroke / round caps, colored via `currentColor`. Use `<Icon name="…" />` everywhere. Type-picker mapping: Crèche→`baby`, Primaire→`pencil`, Collège→`book-open`, Lycée→`graduation-cap`, Université→`building`, Formation→`briefcase`. WhatsApp uses `message-circle` in brand green.
- All components and UI kits now render `Icon` (emoji defaults retrofitted). The **"Bonjour 👋"** waving hand is the single retained emoji (greeting only).
- **Stars** for ratings use the `star` icon (filled) in amber (`#E9A23B`); inline copy still writes "★ 4,8".

## LOCALISATION (FR / AR)
- Primary language **French (Maroc)** — MAD, decimal comma (4,8), 24h time.
- **Arabic (RTL) is in scope** for a later phase — not yet implemented. When built, RTL belongs at the **frontend** layer (i18n + `dir="rtl"`); at the DS level it means switching physical CSS props (`margin-left`…) to logical ones (`margin-inline-start`…) and mirroring directional icons (`chevron`, breadcrumb, stepper). Flagged for the prototype/frontend phase.

---

## Index / manifest
**Root:** `styles.css` (import entry), `readme.md` (this), `SKILL.md`.
**`tokens/`** — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `shadows.css`, `motion.css`, `breakpoints.css`.
**`assets/`** — `logo.png`, `logo-on-dark.png`.
**`guidelines/`** — foundation specimen cards (Colors, Type, Spacing, Brand) shown in the Design System tab.
**`SKILL.md`** — Agent-Skill manifest for downloading this system into Claude Code.
**`components/`** (namespace `Coles360DesignSystem_66e6db`) — each dir has `<Name>.jsx` + `<Name>.d.ts` + `<Name>.prompt.md` + one `*.card.html`:
- `core/` — Icon (Lucide-style line-icon set, the single icon source)
- `forms/` — Button, Input, Select, Checkbox, Textarea
- `data/` — Badge, Tag, Avatar, DataTable, Pagination, ProgressBar, PermissionToggle
- `navigation/` — Header (+ Wordmark), SidebarNav (3 themes), BottomTabBar, Breadcrumb, Stepper
- `search/` — TypePicker, CitySelect, FilterBar
- `cards/` — EstablishmentCard, CityCard, StatCard, PricingCard, ReviewCard, RequestCard
- `profile/` — Tabs, TeamMember, EquipmentItem, FaqAccordion, RatingBreakdown, SocialLinks, VideoEmbed
- `feedback/` — Modal, Toast, EmptyState, Skeleton (+ SkeletonCard), ProfileUnavailable
- `charts/` — BarChart, SourceBars

**`ui_kits/`** — interactive full-screen recreations, each `{README.md, index.html}`:
- `site-public/` — Accueil (parent search journey)
- `espace-etablissement/` — dashboard (KPIs, charts, requests, credits)
- `secretariat/` — demandes & rendez-vous inbox
- `admin/` — establishment validation, moderation, permissions

> **Status:** complete — foundations (incl. motion tokens), 9 component groups (46 exports), foundation specimen cards, and 4 UI kits. Iconography unified via the `Icon` component (Lucide-style); emoji defaults retrofitted. The `_ds_bundle.js`, `_ds_manifest.json` and adherence config are generated by the compiler.
