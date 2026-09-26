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

**La maquette fait foi.** Elle est livrée dans `écoles360.dc.html` (site
public) et `Espace écoles360.dc.html` (back-offices). Avant d'écrire un écran,
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

Livré **compilé** : `web/public/ds/bundle.js`, un IIFE qui accroche 44
composants sur `window.Coles360DesignSystem_66e6db`. **Zéro export ES, aucune
source `.jsx`.** `web/src/ds/composants.tsx` les retype un par un.

On ne peut donc pas le corriger depuis le projet. Les défauts constatés sont
consignés dans `docs/design-system/CORRECTIFS.md`, et
`docs/design-system/appliquer-correctifs.mjs` applique les rustines — script
**idempotent**, à garder rejouable.

Avant de conclure qu'un composant est défaillant, **vérifier le nom de sa
propriété** dans `composants.tsx`. Une propriété mal nommée ressemble beaucoup
à un bug du composant.

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

**Conséquence : une session cloud ne peut pas prouver que son travail
fonctionne.** Elle peut écrire du code qui compile et passe le lint. La
vérification se fait en local.

Voir `docs/SESSIONS-CLOUD.md` pour le protocole d'aller-retour, et en
particulier **l'interdit sur les migrations**.

---

## Git

Messages de commit en français, préfixe conventionnel
(`feat(admin):`, `fix(test):`, `docs:`, `chore(seed):`).

`main` reste toujours vert : rien n'y est fusionné sans avoir été vérifié en
local. Une branche par tâche. Un tag à chaque jalon vérifié.
