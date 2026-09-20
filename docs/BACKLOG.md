# Backlog — besoins hors périmètre

Tout besoin identifié en cours de lot mais **hors de son périmètre** est noté ici
plutôt qu'implémenté. Chaque entrée référence le livrable qui la fonde.

Statuts : `à arbitrer` · `planifié lot N` · `tranché`

---

## Ouvert — à arbitrer

### B-01 · Sonde `/health` : profondeur des cinq files BullMQ
**Source :** L14 §5 — « la sonde retourne 200 avec la version, **la profondeur des
cinq files BullMQ** et le statut de la connexion Prisma ».
**Constat :** le lot 1 interdit tout module métier et donc la déclaration des files
`mail · alerts · billing · maintenance · stats`. La sonde du lot 1 couvre la version,
MySQL et Redis ; la profondeur des files est absente.
**Proposition :** ajouter un bloc `queues` à la réponse au lot où BullMQ est introduit.
Le contrat de la sonde est additif — aucun consommateur existant n'est cassé.
**Statut :** à arbitrer.

### B-02 · `docker-compose.dev.yml` : service `api` conteneurisé
**Source :** L14 §1 — en développement, « Compose lève MySQL 8 et Redis 7 ;
l'API et le front tournent **en local hors conteneur** pour garder le rechargement à chaud ».
**Constat :** le lot 1 §3 impose au contraire un service `api` dans
`docker-compose.dev.yml`, avec rechargement à chaud, et pose comme critère de sortie
qu'« un seul `docker compose up` suffise à un nouveau développeur ».
**Proposition :** les deux voies cohabitent — `api` conteneurisé avec montage du code
source et `start:dev` (chemin par défaut, celui du critère de sortie), et exécution
locale hors conteneur restant possible (`docker compose up mysql redis` + `pnpm --filter api start:dev`).
Le lot 1 prime ; L14 §1 à mettre à jour ou à lire comme une variante.
**Statut :** à arbitrer.

### B-03 · `SKILL.md` du design system absent du bundle
**Source :** prompt du lot 1 — « le design system est fourni dans `docs/design-system/`
avec son `SKILL.md` » ; `CLAUDE-design-project.md` — « le DS contient un `SKILL.md`
prévu pour Claude Code ».
**Constat :** le bundle livre `readme.md` (fondations, 46 composants, tokens),
`_ds_manifest.json` et `_adherence.oxlintrc.json`, mais **aucun `SKILL.md`**.
**Proposition :** sans objet avant le lot 7. À réclamer ou à dériver du `readme.md`
au démarrage du front.
**Statut :** à arbitrer.

### B-04 · Lockfile pnpm dans les Dockerfiles de production
**Source :** L14 §2.2 — `COPY api/package.json api/pnpm-lock.yaml ./`.
**Constat :** en espace de travail pnpm (L14 §3 : `pnpm --filter api …`), le lockfile
est unique et vit **à la racine** du dépôt ; `api/pnpm-lock.yaml` n'existe pas.
**Proposition :** au lot où l'image de production est construite, copier
`pnpm-lock.yaml` + `pnpm-workspace.yaml` de la racine et `api/package.json`,
puis `pnpm install --frozen-lockfile --filter api...`.
**Statut :** à arbitrer.

### B-05 · `CLAUDE.md` de dépôt (consignes permanentes de code)
**Constat :** `docs/handoff/CLAUDE-design-project.md` décrit l'état du **projet de
conception**, pas les conventions de code. Le dépôt d'implémentation n'a pas encore
son propre `CLAUDE.md` (conventions de commit, langue, commandes usuelles).
**Source pressentie :** L16 §guide de contribution.
**Statut :** à arbitrer — hors périmètre du lot 1.

---

## Relevé pendant l'implémentation du lot 1

### B-06 · `details` : objet ou tableau ?
**Source :** L11 §1 — `{ "code": …, "message": …, "details": { } }` (objet).
L7 §1 — « messages d'erreur en français, sortie 422 + `details[]` » (tableau).
**Constat :** les deux livrables décrivent la même charge utile différemment.
**Tranché provisoirement :** `details` est un **objet**, le prompt du lot 1
désignant le livrable 11 comme référence du format d'erreur. Les erreurs de
validation y logent un tableau sous la clé `champs` :
`details: { champs: [{ champ, contraintes: [] }] }` — ce qui satisfait les deux
lectures. `details` est toujours présent, objet vide à défaut, pour que le front
n'ait jamais à tester son existence.
**Statut :** à confirmer.

### B-07 · `/api/docs` réservé au Super Admin hors développement
**Source :** L11 §1 — « l'accès est restreint au Super Admin hors développement ».
**Constat :** aucune authentification au lot 1. Swagger est actif hors production,
et pilotable par `SWAGGER_ENABLED`.
**Proposition :** poser la garde au lot d'authentification, en réutilisant
`RolesGuard` + `@Roles('superadmin')`.
**Statut :** planifié — lot authentification.

### B-08 · La sonde ne porte pas l'enveloppe `{data, meta, links}`
**Source :** L11 §1 — l'enveloppe est produite par un interceptor de sérialisation.
**Constat :** l'interceptor est hors périmètre du lot 1, et `GET /health` est une
sonde d'exploitation — lue par Docker, par `depends_on` et par UptimeRobot —, pas
une ressource métier consommée par le front. Elle renvoie donc une charge plate.
**À arbitrer :** au lot de l'interceptor, soit exclure explicitement `/health` de
l'enveloppe (recommandé), soit l'y soumettre — ce qui obligerait à modifier la
commande du `HEALTHCHECK` et la configuration de la sonde externe.
**Statut :** à arbitrer.

### B-09 · Points d'entrée `worker` et `scheduler`
**Source :** L14 §2 — `api`, `worker` et `scheduler` partagent une image et ne
diffèrent que par leur commande : `dist/main.js`, `dist/worker.js`, `dist/scheduler.js`.
**Constat :** `api/Dockerfile` ne produit que `dist/main.js` au lot 1 ; BullMQ et
`@nestjs/schedule` sont hors périmètre.
**Proposition :** ajouter `src/worker.ts` et `src/scheduler.ts` au lot des files.
Aucune modification du Dockerfile ne sera nécessaire.
**Statut :** planifié — lot BullMQ.

### B-10 · Jobs CI `web`, `images` et `e2e`
**Source :** L14 §3 — quatre jobs : `api` · `web` · `images` · `e2e`.
**Constat :** `web/` est vide jusqu'au lot 7 ; la publication sur `ghcr.io`
suppose une organisation GitHub et un dépôt, et Playwright suppose un staging
déployé. Seul le job `api` a un objet au lot 1.
**Proposition :** ajouter chaque job au lot qui lui donne un objet.
**Statut :** planifié.

### B-11 · Modèle technique `SocleVersion` dans `schema.prisma`
**Source :** prompt du lot 1 — « le schéma se limite au strict nécessaire à la sonde ».
**Constat :** Prisma 5 **refuse** `prisma generate` sur un schéma sans aucun modèle
(`You don't have any models defined`). Sans client généré, `PrismaService` ne
compile pas. Un modèle minimal est donc devenu « le strict nécessaire ».
**Effet réel :** nul en base — aucune migration n'est générée au lot 1, et la sonde
exécute `SELECT 1`. La table `_socle_version` n'existe nulle part.
**À FAIRE AU LOT 2, EN PREMIER :** supprimer le modèle `SocleVersion` de
`api/prisma/schema.prisma` **avant** le premier `prisma migrate dev`, sinon la
migration initiale créera une table parasite.
**Statut :** à arbitrer — action requise au lot 2.

### B-12 · Seuils de couverture par fichier
**Source :** L13 §1 — branches ≥ 90 % sur `modules/**/*.service.ts`, ≥ 85 % sur les
guards, ≥ 80 % sur les controllers.
**Constat :** `jest.config.ts` déclare ces seuils **fichier par fichier** plutôt
qu'en global : un seuil global mêlerait la logique métier au code de câblage et
baisserait à chaque module ajouté. Deux fichiers sont couverts au lot 1
(`health.service.ts`, `http-exception.filter.ts`).
**Convention à tenir :** chaque lot ajoute ses propres entrées dans
`coverageThreshold`. Une revue qui laisse passer un service sans seuil laisse
passer un service sans test.
**Statut :** convention posée.

---

## Relevé pendant l'implémentation du lot 2

### B-13 · Les fichiers SQL voisins ne sont pas exécutés par Prisma Migrate
**Source :** L10 §1 — « les contraintes CHECK sont ajoutées par un fichier SQL
supplémentaire dans le même dossier de migration (prisma migrate exécute tout
`*.sql` présent) ».
**Constat :** Prisma Migrate n'exécute QUE le fichier `migration.sql` de chaque
dossier. Un fichier voisin serait ignoré **en silence** — les contraintes
n'existeraient jamais en base, et rien ne le signalerait.
**Tranché :** les CHECK vivent dans une migration dédiée
(`*_contraintes_check/migration.sql`). L'intention du livrable est préservée —
des contraintes versionnées, appliquées par la même chaîne — sans reposer sur
un comportement que l'outil n'a pas.
**Statut :** à confirmer.

### B-14 · `chk_fac_origine` : contrainte impossible et contradictoire
**Source :** L10 §2.7 — clés étrangères de `factures` en `onDelete: SetNull`
ET contrainte CHECK exigeant exactement une origine non nulle.
**Constat :** MySQL 8 refuse (erreur 3823 — une colonne servant à une action
référentielle ne peut pas figurer dans un CHECK). Et il a raison : si la
suppression d'un abonnement met `abonnement_id` à `NULL`, la facture se
retrouve **sans aucune origine**, ce que le CHECK interdit. Les deux règles du
livrable sont logiquement incompatibles.
**Provisoire :** le CHECK n'est pas posé ; l'invariant reste garanti à
l'écriture par `FacturationService` (L11 §4), comme le livrable le prévoit déjà.
**Recommandation :** au lot de la facturation, passer les trois clés en
`onDelete: Restrict`. Le CHECK redevient posable, ET l'on interdit de supprimer
un abonnement déjà facturé — comportement attendu d'un document conservé dix
ans (RG14). **À arbitrer.**

### B-15 · `main.cli.ts` ou `dist/cli.js` ?
**Source :** L10 §3 nomme la source `api/src/main.cli.ts` ; L10 §4 et L14 §4.3
invoquent `node dist/cli.js`.
**Constat :** les deux ne peuvent pas être vrais — `tsc` produirait
`dist/main.cli.js`.
**Tranché :** la source s'appelle `src/cli.ts`, ce qui produit `dist/cli.js`.
C'est le chemin d'exécution qui fait foi : c'est lui qui figure dans le runbook
et dans les procédures d'exploitation.
**Statut :** à confirmer.

### B-16 · Droits MySQL pour la base fantôme de Prisma
**Constat :** `prisma migrate dev` crée une base temporaire pour détecter les
dérives. L'utilisateur applicatif n'ayant pas le droit d'en créer, la commande
échouait en P3014 et aucune migration ne pouvait être produite.
**Tranché :** `infra/mysql/init/01-bases-et-droits.sql`, joué à la création du
volume, accorde le droit sur le **préfixe** `prisma_migrate_shadow_db%`
uniquement — pas sur `*.*`. Y est aussi créée la base `ecoles360_test`.
Développement seulement : en production `prisma migrate deploy` n'a jamais
besoin de base fantôme.
**Statut :** convention posée.

### B-17 · `nest-commander` figé en 3.17.0
**Constat :** à partir de la 3.18, `nest-commander` dépend de
`@golevelup/nestjs-discovery` qui exige NestJS 11, alors que le livrable 7
impose **NestJS 10**. La version est donc figée exactement, pas en `^`.
**À revoir** au moment d'une éventuelle montée vers NestJS 11.
**Statut :** contrainte documentée.

### B-18 · Import open data non implémenté
**Source :** L10 §4 — `ImportEtablissementsCommand`, pipeline en 6 étapes
(collecte, nettoyage, doublons par similarité, slugs, géocodage Nominatim,
insertion), mode `--dry-run`.
**Constat :** hors du critère de sortie du lot 2, qui porte sur
`prisma migrate deploy` + seed. L'import suppose en outre un fichier CSV du MEN
qui n'est pas fourni dans le handoff, et un accès réseau à Nominatim.
**Proposition :** lot dédié, avec le CSV réel en entrée.
**Statut :** à arbitrer — fournir le CSV.
