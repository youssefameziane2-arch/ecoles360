# Sessions cloud — protocole d'aller-retour

Le projet se construit à deux endroits : des **sessions cloud** qui écrivent,
et des **sessions locales** qui vérifient. Ce document dit qui fait quoi, et
ce qu'aucune session cloud ne doit faire seule.

La raison de ce partage n'est pas une question de confiance : c'est que le bac
à sable cloud n'a ni MySQL, ni Redis, ni `.env`, ni navigateur sur le serveur
de développement. **Il ne peut donc pas exécuter les 210 tests lui-même, ni
regarder un écran.**

Mais la CI, elle, le peut. `.github/workflows/ci.yml` se déclenche sur **chaque
pull request**, monte MySQL 8 et Redis 7, applique les migrations, sème et joue
la suite complète. C'est précisément pourquoi une session cloud **ouvre une PR**
au lieu de pousser une branche seule : la PR est ce qui déclenche la preuve.

Ce qui reste strictement local : **regarder les écrans** — la CI ne voit pas
un rendu — et **appliquer une migration** sur des données réelles.

---

## Le partage

### Ce qui se fait bien en cloud

- Les écrans qui suivent un motif déjà posé — reprendre `EtablissementsAdmin`
  ou `FicheEditeur` pour en écrire un frère.
- Les services Nest calqués sur l'existant, avec leurs DTO et leurs tests.
- La documentation, l'inventaire, le backlog.
- Les refactors mécaniques : extraire un helper partagé, renommer, dédoublonner.
- Le paquet de types partagés généré depuis l'OpenAPI.

### Ce que la CI vérifie à notre place

Sur chaque PR, sans intervention : lint et format, `nest build`, migrations,
seed, puis les 210 tests avec couverture. Le job s'appelle
**`API — lint, build, tests`**.

Une PR rouge ne se fusionne pas. Une PR verte prouve que les règles de gestion
tiennent encore — c'est la garantie qui manquait au bac à sable.

### Ce qui reste en local

- **Regarder les écrans.** La CI ne voit pas un rendu. Deux défauts trouvés
  ainsi et invisibles à la lecture comme aux tests : une classe CSS qui
  n'existait pas (`grille-fiche`), et `prefers-reduced-motion` qui supprimait
  un carrousel entier au lieu du seul zoom.
- **Appliquer les migrations** sur les données réelles, après relecture.
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
