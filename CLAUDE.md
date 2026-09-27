# écoles360 — conventions du projet

Annuaire web **payant** des établissements scolaires privés au Maroc. Site
public gratuit pour les parents ; les établissements paient leur visibilité.

Ce fichier est lu au démarrage de chaque session. Il dit ce qu'on ne peut pas
deviner en lisant le code.

---

## Ce qui ne se négocie pas

**Tout est nommé en français.** Variables, fonctions, classes, fichiers,
messages d'erreur, commentaires, messages de commit. `versListe`, pas
`toList`. `etablissementIdOuRefuse`, pas `getOrThrowEstablishmentId`. Les
seules exceptions sont les mots imposés par un cadre extérieur — `useState`,
`data`, `meta`, `links`, les noms de colonnes Prisma déjà posés.

**La maquette fait foi.** Elle est livrée dans `docs/handoff/écoles360.dc.html`
(site public) et `docs/handoff/Espace écoles360.dc.html` (back-offices). Avant d'écrire un écran,
on l'y lit — on ne l'approxime pas de mémoire. `docs/INVENTAIRE-MAQUETTE.md`
recense chaque écran, son état, et ce qui manque. `docs/inventaire.mjs` et
`docs/sections.mjs` savent extraire une section précise de ces fichiers.

**Les commentaires expliquent POURQUOI, jamais QUOI.** Le code dit déjà ce
qu'il fait. Un commentaire utile dit ce qui casserait si on faisait autrement.
Regardez ceux qui existent : c'est le registre attendu.

**Aucun secret, jamais.** `.env` est ignoré et ne doit jamais entrer dans le
dépôt. `.env.example` ne porte que des valeurs de développement.

---

## Architecture

```
api/   NestJS 10 · Prisma 5 · MySQL 8 · Redis 7      (pnpm : @ecoles360/api)
web/   React 18 · Vite 5 · TanStack Query · Router    (pnpm : @ecoles360/web)
docs/  livrables, backlog, inventaire de la maquette
```

Espace de travail pnpm. **pnpm n'est pas sur le PATH** : passer par
`corepack pnpm`.

Front Next.js et API NestJS conservés séparés — décision du client, la
migration du front vers Next.js viendra plus tard, sans supprimer Nest.

### Contrat d'API

Toute réponse porte l'enveloppe `{ data, meta, links }` (livrable 11 §1),
posée par `EnveloppeInterceptor`. Les sorties qui n'en veulent pas s'en
échappent par `@SansEnveloppe()`. Les collections paginées passent par
`Page<T>`.

Erreurs : `{ code, message, details }`. Le `code` est le contrat machine, en
snake_case, **jamais renommé une fois publié**. Le `message` est en français
et affichable tel quel — le front ne le reformule pas.

Les identifiants sont des `BigInt` **sérialisés en chaînes**. Ne jamais les
faire transiter en nombre.

### Validation

`ValidationPipe` global en `whitelist` + `forbidNonWhitelisted`, code 422. Un
champ non déclaré dans le DTO fait échouer la requête — c'est ce qui écarte
par construction les champs de plateforme (`sponsorise`, `verifie`,
`premium`, `note_moy`) d'une charge utile cliente (RG27).

**Piège connu :** `@IsOptional()` court-circuite *tous* les validateurs du
champ, y compris un `@ValidateIf()`. Pour un champ conditionnellement
obligatoire, utiliser `@ValidateIf()` **seul**.

---

## Règles de gestion

Numérotées RG01 à RG27 dans les livrables. Les plus structurantes :

| | |
|---|---|
| RG01 | une fiche, une seule ville |
| RG02 | 7 types d'établissement (crèche, primaire, collège, lycée, supérieur, université, formation) |
| RG03 | seules les fiches `validee` sont publiques — une autre répond **404**, jamais 403 |
| RG04 | `proprietaire_user_id` reste NULL jusqu'à revendication |
| RG05 | portées déléguées au secrétariat (`fiches`, `contacts`, `avis`) |
| RG06–RG08 | modération des avis, réponse de l'établissement, recalcul de la note |
| RG09 | consentement loi 09-08 |
| RG14 | **pas de validation de fiche sans abonnement encaissé** |
| RG15 / RG26 | tout acte d'administration est journalisé ; le journal est en **lecture seule** |
| RG19 | sponsorisés d'abord, avec rotation équitable |
| RG20 | l'établissement **propose**, l'admin **publie** — aucune écriture directe sur la fiche |
| RG25 | rôles, suspension, révocation immédiate des sessions |
| RG27 | attributs de plateforme non modifiables par le client |

**Règle de lecture :** ne jamais confirmer l'existence d'une ressource qu'on
n'a pas le droit de voir. Un brouillon, une fiche non validée, un avis en
attente répondent 404.

---

## Tests

```bash
DATABASE_URL="mysql://ecoles360:motdepasse_dev@127.0.0.1:3306/ecoles360_test" \
REDIS_URL="redis://127.0.0.1:6379/15" \
NODE_ENV=test npx jest
```

**Contre une vraie MySQL et une vraie Redis, jamais SQLite** (livrable 13 §1).
Redis **base 15**, réservée aux tests. `maxWorkers: 1` : les suites partagent
la base et échouent en parallèle.

**La base n'est pas remise à zéro entre les exécutions.** Un test qui attend
un compte exact (`toBe(3)`) ou un slug littéral passera une fois puis échouera.
Écrire des invariants, ou fabriquer soi-même la donnée dont on dépend.

Avant de proposer quoi que ce soit :

```bash
corepack pnpm --filter @ecoles360/api  exec tsc --noEmit
corepack pnpm --filter @ecoles360/api  exec eslint "{src,test}/**/*.ts" --max-warnings 0
corepack pnpm --filter @ecoles360/web  exec tsc --noEmit
corepack pnpm --filter @ecoles360/web  exec eslint "src/**/*.{ts,tsx}" --max-warnings 0
```

---

## Le design system

**Les sources sont dans `.claude/skills/ecoles360-design/`.** Chaque composant
y a son `.jsx`, son `.d.ts` (les propriétés) et son `.prompt.md` (usage et
exemple). **Lire le `.prompt.md` avant d'employer un composant.**

⚠️ **CES SOURCES SONT PLUS ANCIENNES QUE LE BUNDLE.** Elles viennent d'une
livraison antérieure : `SidebarNav.d.ts` n'y déclare que trois thèmes quand le
bundle en sert quatre, `commercial` compris. **En cas de désaccord, le bundle
fait foi** — c'est lui que le navigateur exécute. Vérifier dans
`web/public/ds/bundle.js`, qui n'est pas minifié et se lit :

```bash
grep -n -A 6 "const themes" web/public/ds/bundle.js
```

Corollaire : un bundle reconstruit depuis ces sources PERDRAIT des
fonctionnalités. Elles servent à lire et à préparer une demande à l'auteur du
design system, pas à régénérer quoi que ce soit.

Ce que l'application CHARGE est le bundle compilé `web/public/ds/bundle.js`,
un IIFE qui accroche les composants sur `window.Coles360DesignSystem_66e6db` ;
`web/src/ds/composants.tsx` les retype pour TypeScript. Les sources ne sont
donc pas importées à l'exécution : elles servent à LIRE et à corriger.

**`composants.tsx` retype désormais tout le bundle.** Quatorze composants n'y
figuraient pas — donc inutilisables — alors qu'ils répondent exactement à des
écrans restant à construire. Ils y sont, typés depuis le bundle, avec en
commentaire ce que leur `.d.ts` ne dit pas (`TypePicker` n'a que six types par
défaut, `CitySelect` douze villes figées, `Header` des liens qui rechargent la
page) :

| Composant | Pour |
|---|---|
| `FilterBar` · `TypePicker` · `CitySelect` | les filtres de recherche |
| `PricingCard` | « Formules de visibilité » de l'inscription |
| `TeamMember` | l'équipe de la page À propos |
| `Stepper` · `Breadcrumb` · `Header` · `BottomTabBar` | navigation |
| `SocialLinks` · `Skeleton` · `SourceBars` · `PermissionToggle` · `ProfileUnavailable` | divers |

**Avant d'écrire un composant à la main, chercher s'il existe déjà** dans
`.claude/skills/ecoles360-design/components/`. Il a suffi de ne pas le faire
une fois pour que les filtres de recherche soient réécrits de zéro alors qu'un
`FilterBar` attendait dans le bundle déjà chargé par la page.

Les défauts constatés sont consignés dans `docs/design-system/CORRECTIFS.md`,
et `docs/design-system/appliquer-correctifs.mjs` applique les rustines sur le
bundle — script **idempotent**, à garder rejouable.

---

## Médias

Les photos vivent dans le volume Docker `storage`, **jamais en base** : seul
le chemin est persisté (`/media/etablissements/<id>/<aléa>.<ext>`).

- `StockageService` est le seul code qui touche au disque.
- Le nom de fichier est **tiré au sort**, jamais repris du client.
- Type validé sur la **signature réelle** des premiers octets, pas sur le
  `Content-Type` déclaré.
- `PhotosService` sert l'admin *et* l'espace établissement — même logique, seul
  le rôle journalisé diffère.

Ne pas importer `multer` directement : ce n'est pas une dépendance déclarée de
`@ecoles360/api`, pnpm ne la résoudrait pas à l'exécution. Sans option,
`FilesInterceptor` garde déjà le fichier en mémoire, ce qu'on veut.

---

## Ce qu'une session cloud ne peut pas faire

Un bac à sable cloud clone le dépôt. Il n'a donc **ni** :

- `.env` — ignoré à raison ; l'API ne démarre pas sans ;
- MySQL 8 ni Redis 7 — **les 210 tests ne peuvent pas tourner** ;
- `web/public/heros/` et `web/public/galerie/` — images de remplacement
  ignorées ; le front s'affichera avec des visuels manquants ;
- `api/src/generated/` — régénéré par `prisma generate` ;
- de navigateur sur le serveur de développement local.

**Conséquence : une session cloud ne peut pas exécuter les tests elle-même.**
Elle écrit du code qui compile et passe le lint ; elle ne doit jamais affirmer
avoir lancé la suite.

Elle n'est pas seule pour autant : `.github/workflows/ci.yml` se déclenche sur
**chaque pull request**, monte MySQL 8 et Redis 7, applique les migrations,
sème, et joue les 210 tests. Une PR verte vaut donc preuve d'exécution — c'est
la raison d'ouvrir une PR plutôt que de pousser une branche seule.

Restent hors de portée de la CI, et donc réservés au local : **regarder les
écrans**, et **appliquer une migration** sur des données réelles.

Voir `docs/SESSIONS-CLOUD.md` pour le protocole d'aller-retour, et en
particulier **l'interdit sur les migrations**.

---

## Le backlog dit qui peut agir

`docs/BACKLOG.md` porte un statut par entrée, et ce statut n'est pas qu'un
état d'avancement : **`à arbitrer`, `à trancher` et `à confirmer` veulent dire
qu'une décision du client est attendue.** On peut préparer l'entrée et exposer
les options ; on ne choisit pas à sa place.

`à faire` et `planifié` se prennent librement : ce qui manque est du travail,
pas un arbitrage.

Les règles de gestion viennent des livrables et du client. En inventer une
parce qu'elle manquait, c'est produire un défaut qui compile, passe les tests,
et ne se découvre qu'à la recette.

---

## Git

Messages de commit en français, préfixe conventionnel
(`feat(admin):`, `fix(test):`, `docs:`, `chore(seed):`).

`main` reste toujours vert : rien n'y est fusionné sans avoir été vérifié en
local. Une branche par tâche. Un tag à chaque jalon vérifié.
