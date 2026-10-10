# Documentation écoles360 — cahier des charges figé

Les seize livrables de conception sont **figés et validés**. Ils font office de
cahier des charges : le code les traduit, il ne les redéfinit pas.

## `livrables/` — les seize livrables (exports hors-ligne autonomes)

Ouvrir directement dans un navigateur, aucun fichier d'accompagnement requis.

| Livrable | Fichier | Sert de référence à |
|---|---|---|
| 1 — Analyse de l'existant & Benchmark | `Livrable 1 - Analyse de l'existant & Benchmark.html` | contexte marché |
| 2 — User stories & Besoins | `Livrable 2 - User stories & Besoins.html` | US-xx |
| 3 — Cahier des charges initial | `Livrable 3 - Cahier des charges initial.html` | critères d'acceptation |
| 7 — Architecture technique (v2.5) | `Livrable 7 - Architecture technique (hors-ligne).html` | **stack, arborescence, topologie Docker** |
| 8 — Merise (MCD / MLD / MPD) | `Livrable 8 - Merise MCD MLD MPD.html` | lot 2 — modèle de données |
| 9 — Cahier des charges complet | `Livrable 9 - Cahier des charges complet.html` | règles RG01–RG27 |
| 10 — Base de données (v2.5) | `Livrable 10 - Base de données (hors-ligne).html` | lot 2 — `schema.prisma`, migrations, seeders |
| 11 — Back-end API (v2.5) | `Livrable 11 - Back-end API (hors-ligne).html` | **conventions d'API, format d'erreur, modules** |
| 12 — Front-end React (v2.5) | `Livrable 12 - Front-end React (hors-ligne).html` | lot 7 — `web/` |
| 13 — Stratégie de tests (v2.5) | `Livrable 13 - Stratégie de tests (hors-ligne).html` | **outillage et couverture** |
| 14 — Déploiement CI-CD (v2.5) | `Livrable 14 - Déploiement CI-CD (hors-ligne).html` | **Compose, GitHub Actions, images** |
| 15 — Recette | `Livrable 15 - Recette (hors-ligne).html` | scénarios de recette |
| 16 — Documentation & maintenance | `Livrable 16 - Documentation & maintenance (hors-ligne).html` | runbook, guide de contribution |
| Avenant 1 — Extension CRM | `Avenant 1 - Extension CRM (hors-ligne).html` | RG21–RG23, module `leads` |

Maquettes haute fidélité (livrables 4 à 6) :
`Site public écoles360 (hors-ligne).html` et `Espaces connectés écoles360 (hors-ligne).html`.

> L'avenant 3 (console d'administration & CMS, RG25–RG27) n'a pas d'export
> hors-ligne : sa source est `handoff/Avenant 3 - Console d'administration & CMS.dc.html`.

## `design-system/` — design system écoles360

Bundle `_ds_bundle.js` (namespace `Coles360DesignSystem_66e6db`), `tokens/*.css`,
`_ds_manifest.json`, `_adherence.oxlintrc.json` et `readme.md`.
**Non utilisé avant le lot 7** (front `web/`) — à conserver en l'état.

## `handoff/` — bundle de handoff d'origine, intact

Sources `.dc.html` des livrables (nécessitent `support.js` et `doc-page.js`),
maquettes, captures d'écran, PDF, `ecoles360.sql`, `PROMPT Claude Code - Lot 1.md`
et `CLAUDE-design-project.md` (état du projet côté conception).

## `REPRISE.md`

**Où le travail s'est arrêté.** État du dépôt, tâche suivante, ce qui attend une
décision du client, pièges de ce poste. À lire en premier quand on reprend, et
à mettre à jour à chaque arrêt.

## `BACKLOG.md`

Besoins identifiés **hors périmètre du lot en cours**, à arbitrer avant implémentation.
