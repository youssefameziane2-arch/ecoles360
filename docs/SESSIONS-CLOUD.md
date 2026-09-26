# Sessions cloud — protocole d'aller-retour

Le projet se construit à deux endroits : des **sessions cloud** qui écrivent,
et des **sessions locales** qui vérifient. Ce document dit qui fait quoi, et
ce qu'aucune session cloud ne doit faire seule.

La raison de ce partage n'est pas une question de confiance : c'est que le bac
à sable cloud n'a ni MySQL, ni Redis, ni `.env`, ni navigateur sur le serveur
de développement. **Il ne peut donc pas exécuter les 210 tests, ni regarder
un écran.** Il écrit du code qui compile ; il ne peut pas prouver qu'il marche.

---

## Le partage

### Ce qui se fait bien en cloud

- Les écrans qui suivent un motif déjà posé — reprendre `EtablissementsAdmin`
  ou `FicheEditeur` pour en écrire un frère.
- Les services Nest calqués sur l'existant, avec leurs DTO et leurs tests.
- La documentation, l'inventaire, le backlog.
- Les refactors mécaniques : extraire un helper partagé, renommer, dédoublonner.
- Le paquet de types partagés généré depuis l'OpenAPI.

### Ce qui reste en local

- **Faire tourner les 210 tests.** C'est la seule preuve que les règles de
  gestion tiennent encore.
- **Regarder les écrans.** Deux défauts trouvés ainsi et invisibles à la
  lecture : une classe CSS qui n'existait pas (`grille-fiche`), et
  `prefers-reduced-motion` qui supprimait un carrousel entier au lieu du seul
  zoom.
- **Appliquer et vérifier les migrations.**
- Tout ce qui touche à `.env`, au volume `storage`, à Docker.

---

## L'interdit : les migrations

**Aucune migration écrite en cloud ne rejoint `main` sans être passée en local
d'abord.**

Une migration Prisma **ne se rejoue pas à l'envers**. Revenir au code d'avant
ne défait pas la migration : l'ancien code parle alors à un schéma qu'il ne
connaît plus. Et `prisma migrate dev` sur un schéma divergent *propose de
réinitialiser la base* — c'est ainsi qu'on perd ses données sans s'en
apercevoir.

Trois règles :

1. **Additif par défaut.** On ajoute une colonne, on n'en retire pas. La
   suppression attend une version ultérieure, quand plus rien ne la lit.
2. **Relecture locale obligatoire** avant fusion, même si le code compile.
3. **Export de la base avant d'appliquer un lot** venu du cloud :

   ```bash
   docker exec ecoles360-dev-mysql-1 mysqldump \
     -uecoles360 -pmotdepasse_dev ecoles360_dev > sauvegarde-avant-lot.sql
   ```

Le code se rembobine avec `git`. Les données, non.

---

## Le cycle

```
  cloud                          local
  ─────                          ─────
  branche feat/…
  écrit, compile, lint
  ouvre une PR
                        ──────►  git fetch && git checkout feat/…
                                 les 210 tests
                                 vérification à l'écran
                                 corrections
                                 fusion dans main
                                 tag si jalon
                        ◄──────  git push
  repart de main
```

**Une règle à ne jamais enfreindre : le cloud et le local ne travaillent
jamais sur les mêmes fichiers en même temps.**

### Granularité

**Un écran par branche, pas un module entier.** Plus le lot est gros, plus du
code non vérifié s'accumule, et quand quelque chose casse on ne sait plus quel
changement l'a cassé. Un écran par PR, c'est une vérification qui coûte peu et
un échec qui ne fait perdre qu'un écran.

### Points de retour

Pas de copie « ancienne version » à côté : elle diverge, et finit par mentir
sur ce qu'elle contient. Git suffit, à condition de nommer les jalons :

```bash
git tag -a v0.2.0 -m "Tableau de bord admin vérifié"
git push origin v0.2.0
```

Revenir devient `git checkout v0.2.0`, sans ambiguïté.

---

## Vérification locale — la liste

À dérouler sur chaque branche venue du cloud, avant fusion :

```bash
# 1. Dépendances et client Prisma
corepack pnpm install
corepack pnpm --filter @ecoles360/api exec prisma generate

# 2. Compilation et style, les deux paquets
corepack pnpm --filter @ecoles360/api exec tsc --noEmit
corepack pnpm --filter @ecoles360/api exec eslint "{src,test}/**/*.ts" --max-warnings 0
corepack pnpm --filter @ecoles360/web exec tsc --noEmit
corepack pnpm --filter @ecoles360/web exec eslint "src/**/*.{ts,tsx}" --max-warnings 0

# 3. Migrations — APRÈS relecture, et après l'export ci-dessus
corepack pnpm --filter @ecoles360/api exec prisma migrate dev

# 4. Les tests, contre la vraie base
DATABASE_URL="mysql://ecoles360:motdepasse_dev@127.0.0.1:3306/ecoles360_test" \
REDIS_URL="redis://127.0.0.1:6379/15" \
NODE_ENV=test corepack pnpm --filter @ecoles360/api exec jest

# 5. À l'écran
docker compose -f docker-compose.dev.yml up -d
corepack pnpm --filter @ecoles360/web dev
```

Un écran nouveau n'est **pas** vérifié tant qu'il n'a pas été regardé. La
compilation ne dit rien du rendu.

---

## Ce qu'une session cloud doit savoir en arrivant

Tout est dans `CLAUDE.md`, lu automatiquement : nommage français, enveloppe
`{data, meta, links}`, règles RG01–RG27, design system compilé, pièges connus.

Ce qu'elle ne trouvera pas dans le dépôt, et qu'il faut lui donner dans la
consigne :

- **quel écran** de `docs/INVENTAIRE-MAQUETTE.md` traiter ;
- le fait qu'elle **ne peut pas** lancer les tests, et qu'elle ne doit pas
  prétendre l'avoir fait ;
- qu'elle ouvre une PR plutôt que d'écrire sur `main`.
