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

### B-19 · `pnpm/action-setup` : version déclarée deux fois
**Source :** L14 §3 — `uses: pnpm/action-setup@v4` `with: { version: 9 }`.
**Constat :** la racine déclare `packageManager: pnpm@9.15.4`. L'action v4
**refuse de démarrer** quand la version est donnée aux deux endroits
(« Multiple versions of pnpm specified »). Première CI rouge en 49 s.
**Tranché :** la clé `version` est retirée du workflow ; `packageManager` fait
foi. Il fige la version exacte, sert déjà au `corepack enable` du Dockerfile,
et garantit que le poste, l'image et le coureur installent à l'identique.
L'extrait du livrable 14 est antérieur à l'ajout de ce champ.
**Statut :** à confirmer.

---

## Relevé pendant l'implémentation du lot 3

### B-20 · `argon2` remplacé par `@node-rs/argon2`
**Source :** L10 §3 — extrait de seeder utilisant `argon2.hash()`.
**Constat :** le paquet `argon2` ne publie **aucun binaire précompilé pour
linux-musl**. Dans `node:20-alpine`, il tente de compiler depuis les sources et
échoue faute de Python et de `g++` — la construction de l'image s'arrête.
Invisible sur un poste Windows, où un binaire existe.
**Tranché :** `@node-rs/argon2`, **même algorithme Argon2id**, avec des binaires
pour treize plateformes dont `linux-x64-musl`. Aucune chaîne de compilation dans
l'image, build plus rapide. Seul le paquet change, pas l'algorithme.
**Statut :** à confirmer.

### B-21 · `connect-redis` figé en 8.x pour ioredis
**Constat :** `connect-redis@9+` exige **node-redis ≥ 5** en dépendance de pair,
alors que le livrable 11 §6 impose **ioredis** (BullMQ ne fonctionne qu'avec
lui). Installé en v10, il envoyait des commandes malformées — `ERR syntax error`
à chaque ouverture de session.
**Tranché :** `connect-redis@^8.0.0`, dernière version agnostique du client, qui
détecte ioredis et adapte ses commandes. Un seul client Redis dessert sessions,
files, cache et limitation de débit.
**À revoir** si le projet migre vers node-redis.
**Statut :** contrainte documentée.

### B-22 · `@nestjs/passport` et `@nestjs/throttler` figés pour NestJS 10
**Constat :** `@nestjs/passport@12` exige NestJS 11. Versions exactes retenues :
`@nestjs/passport@10.0.3`, `@nestjs/throttler@6.4.0`. Même contrainte que
`nest-commander` (B-17). À revoir ensemble le jour d'une montée vers NestJS 11.
**Statut :** contrainte documentée.

### B-23 · Surveillance de fichiers par sondage sous Windows
**Constat :** Docker Desktop pour Windows ne propage **pas** les événements
`inotify` depuis l'hôte vers le conteneur. `nest start --watch` ne recompilait
jamais : le rechargement à chaud annoncé par `docker-compose.dev.yml` était une
promesse vide, et il fallait redémarrer le conteneur à chaque modification.
**Tranché :** `watchOptions` en sondage dans `tsconfig.json`. Coût : un réveil
périodique du processus. Bénéfice : le développement fonctionne réellement sur
les trois systèmes.
**Statut :** convention posée.

### B-24 · Jeton de réinitialisation non envoyé par courriel
**Source :** L11 §6 — file BullMQ `mail`.
**Constat :** `POST /auth/mot-de-passe-oublie` émet bien un jeton à usage unique
(TTL 1 h, haché en base), mais **rien ne l'envoie** : BullMQ et SMTP arrivent au
lot des files. Le jeton n'est ni journalisé ni renvoyé au client — le connaître
suffirait à changer le mot de passe.
**En l'état, la réinitialisation n'est donc pas utilisable de bout en bout par
un utilisateur final.** Le contrat HTTP, lui, est complet et testé.
**Statut :** planifié — lot BullMQ.

### B-25 · Préfixe de session : source unique
**Constat :** le préfixe des clés de session était configuré à deux endroits —
le magasin `connect-redis` qui écrit, et le balayage de révocation qui détruit
(RG25). Tant que les deux chaînes coïncidaient, tout fonctionnait ; le jour où
elles divergeaient, la révocation ne trouvait plus rien à supprimer. **Sans
erreur, sans journal** : les sessions d'un compte suspendu seraient restées
actives. Découvert parce que le test utilisait un préfixe de test distinct.
**Tranché :** `prefixeSession(config)` dans `session.constants.ts`, seule source.
**Statut :** convention posée.

## B-31 — `CityCard` du design system : pluriel non géré

`CityCard` rend `count + " établissements"` sans distinguer le singulier : une
ville qui compte une seule fiche affiche « 1 établissements ».

CE CONSTAT ÉTAIT FAUX : « le composant est livré compilé, donc non corrigeable
depuis le projet ». Les SOURCES existaient — elles dormaient dans un ZIP sur le
poste, jamais versionnées. Elles sont désormais dans
`.claude/skills/ecoles360-design/components/cards/CityCard.jsx`, et le défaut y
tient en une ligne :

    {count} établissements

La correction propre est un `label` en propriété, qui rendrait au passage le
composant réutilisable hors du contexte « ville ». Elle se fait dans la source,
puis se reporte sur le bundle par `appliquer-correctifs.mjs` — l'application
charge le bundle, pas les sources.

En attendant, l'accueil masque les villes sans fiche, ce qui réduit l'occurrence
sans la supprimer.

**Leçon au-delà de ce défaut :** avant de déclarer qu'un composant livré n'est
pas modifiable, vérifier que ses sources n'existent pas ailleurs. Ici elles
étaient sur le poste depuis le début, dans une livraison jamais ouverte.

## B-32 — `viderBase()` listait les tables à la main

**Constat :** le nettoyage de la base de test énumérait ses tables dans un
tableau écrit à la main. `photos` n'y figurait pas. Or `TRUNCATE etablissements`
remet l'auto-incrément à zéro : les fiches créées par la suite suivante
héritaient des lignes `photos` de fiches disparues.

Le symptôme était **intermittent et trompeur** — une galerie de trois photos en
comptait cinq, mais seulement quand l'ordre d'exécution des suites plaçait
`seed.spec.ts` en premier, ce que Jest décide d'après les durées mesurées au
tour précédent. Rien ne pointait vers le fichier fautif.

**Tranché :** la liste est demandée à `information_schema`, `_prisma_migrations`
exceptée. Une liste manuelle dérive au premier modèle ajouté ; celle-ci ne peut
pas.
**Statut :** corrigé.

## B-33 — Médias servis par Node en développement

`monterMedias()` déclare le volume `storage` en service statique dans l'API.
C'est ce qu'il faut en développement, et c'est un pis-aller en production :
faire transiter une photo de 400 Ko par la boucle d'événements de Node occupe
le processus qui doit répondre aux requêtes métier.

Le livrable 14 §2 prévoit que nginx serve `/media/` directement depuis le
volume. Tant que ce bloc n'est pas écrit, l'API assure le service — des fiches
complètes valent mieux qu'un dossier inaccessible.

**À faire :** bloc `location /media/` dans la configuration nginx, avec
`expires 1y` (le nom de fichier est un aléa, son contenu ne change jamais).
**Statut :** planifié — lot mise en ligne.

## B-34 — Recherche avancée de l'accueil : la maquette demande plus que l'API

La maquette (`isHome`, `noteOptions` / `sortOptions` / bascule sponsorisée)
propose des critères que `RechercheEtablissementsDto` n'accepte pas. L'écran
s'est aligné sur l'API telle qu'elle est ; **à trancher : étendre le DTO ou
aligner la maquette.**

| Critère | Maquette | API aujourd'hui | Écran livré |
|---|---|---|---|
| Note minimale | « 4,0 et plus », « 4,5 et plus » | `note_min` entier 1–5 (`@IsInt()`) — 4,5 → **422** | « 3,0 et plus », « 4,0 et plus » (les seuils des puces des résultats) |
| Tri | Pertinence, Mieux notés, Prix croissant, Prix décroissant | `tri` ∈ `note` · `recent` · `nom` | Mieux notés, Plus récents, Ordre alphabétique |
| « École sponsorisée » | bascule | aucun paramètre | absente |
| Budget | MAD/**mois** | `budget_min` / `budget_max` **annuels** | MAD/an |

Ce qu'une extension du DTO impliquerait, pour éclairer le choix :

- **Note au demi-point** : `@IsNumber({ maxDecimalPlaces: 1 })` au lieu de
  `@IsInt()`, et les puces « Note » des résultats à revoir en même temps.
- **Tri par prix** : sur `budget_min` / `budget_max`, qui sont nullables — il
  faut décider où vont les fiches sans budget (en fin de liste, sans doute).
- **« Pertinence »** n'a de sens qu'avec une recherche plein texte classée ;
  sans `q`, elle se confondrait avec le tri par défaut.
- **Filtre sponsorisé** : RG19 place déjà les sponsorisés en tête. Filtrer
  dessus retire les autres fiches, ce qui touche au modèle commercial — décision
  client plutôt que technique.
- **Budget mensuel** : les fiches portent un budget annuel. Afficher du
  mensuel, c'est diviser par 10 ou 12 selon l'établissement : à trancher côté
  données, pas dans l'écran.

La page de résultats porte déjà les mêmes écarts (tri, sponsorisé) : la
décision vaudra pour les deux écrans.
**Statut :** à trancher.

## B-35 — L'accueil affiche un numéro de conseiller factice

Le bloc « Besoin d'aide pour choisir ? » de l'accueil affiche
`TELEPHONE_CONSEILLER`, une constante de `MobilierAssistance.tsx` qui vaut
`06 00 00 00 00` à défaut de `VITE_TELEPHONE_CONSEILLER`. Le bouton porte un
lien `tel:` vers ce numéro inexistant, en pleine page publique.

La bannière flottante, elle, fait déjà les choses correctement : elle appelle
`chargerConseillers()` et fait tourner les commerciaux réels avec leur nom.
Deux blocs qui affichent « le numéro du conseiller » puisent donc à deux
sources différentes, et une seule est bonne.

**Le défaut est ancien, il vient seulement d'être rendu visible.** Tant que la
constante portait un vrai numéro, l'incohérence ne se voyait pas : les deux
blocs affichaient quelque chose de plausible. La rendre factice — pour qu'un
oubli de configuration ne fasse pas appeler un inconnu — a fait apparaître ce
qu'elle masquait. C'est exactement ce qu'on attendait d'elle.

**À faire :** le bloc 13 doit puiser à `chargerConseillers()` comme la
bannière. La constante ne doit plus servir qu'au repli du composant qui la
définit, et `TELEPHONE_CONSEILLER` / `LIEN_TELEPHONE` cesser d'être exportés.

**Bloquant avant mise en ligne** : un numéro faux sur la page d'accueil.
**Statut :** à faire.
