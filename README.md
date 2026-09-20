# écoles360

Annuaire web payant des établissements scolaires privés au Maroc. Les parents
cherchent, comparent et contactent gratuitement ; les établissements sont les
clients (visibilité sponsorisée, abonnement, paiement à la vue).

La conception est **terminée et figée** : les seize livrables de
[`docs/`](docs/README.md) font office de cahier des charges. Le code les
traduit, il ne les redéfinit pas.

---

## État — lot 1 : socle

| Lot | Périmètre | État |
|---|---|---|
| **1** | Socle `api/` : NestJS 10, `/api/v1`, format d'erreur, Swagger, sonde de santé, Compose de développement, CI | **fait** |
| 2 | Données : `schema.prisma` complet (livrable 8), migrations, seeders, import open data (livrable 10) | à venir |
| … | Modules métier, authentification, back-offices | à venir |
| 7 | Front `web/` — React 18 + Vite, SSR ciblé du site public (livrable 12) | à venir |

Ce qui n'existe pas encore, volontairement : aucun module métier, aucune
authentification, aucun écran, et un `schema.prisma` réduit à sa connexion.
Les besoins repérés hors périmètre sont consignés dans
[`docs/BACKLOG.md`](docs/BACKLOG.md).

---

## Démarrer

Prérequis : **Docker** et rien d'autre.

```bash
git clone <dépôt> ecoles360 && cd ecoles360
cp .env.example .env
docker compose -f docker-compose.dev.yml up
```

Au bout d'une minute :

| Adresse | Attendu |
|---|---|
| <http://localhost:3000/api/v1/health> | `200` — MySQL et Redis répondent |
| <http://localhost:3000/api/docs> | Documentation OpenAPI 3 |

`.env.example` est commenté ligne à ligne ; aucune valeur n'est un vrai secret,
et `.env` est ignoré par git.

### Sans Docker pour l'API

Le livrable 14 §1 prévoit aussi de ne conteneuriser que les dépendances et de
garder l'API sur le poste. Les deux voies sont supportées :

```bash
docker compose -f docker-compose.dev.yml up mysql redis
pnpm install
pnpm --filter api start:dev
```

Les `DATABASE_URL` et `REDIS_URL` de `.env` pointent déjà `127.0.0.1` pour ce cas.

---

## Arborescence

Conforme au livrable 7 §3.

```
ecoles360/
├── api/                         NestJS 10 — image ecoles360-api
│   ├── src/main.ts              amorçage : /api/v1, ValidationPipe, Swagger
│   ├── src/app.module.ts        modules métier + ConfigModule
│   ├── src/modules/<domaine>/   un dossier par domaine métier
│   │   └── health/              sonde de santé (lot 1)
│   ├── src/common/              guards · filters · interceptors · decorators
│   ├── src/prisma/              PrismaService (provider injectable)
│   ├── src/redis/               client Redis partagé
│   ├── prisma/schema.prisma     livrable 10 — réduit à la connexion au lot 1
│   ├── test/                    Jest + Supertest (livrable 13)
│   └── Dockerfile               multi-étages, non-root, HEALTHCHECK
├── web/                         React 18 + Vite — vide jusqu'au lot 7
├── docs/                        les seize livrables + design system
├── docker-compose.dev.yml
└── .github/workflows/ci.yml
```

---

## Conventions

**Langue.** Le produit parle français (Maroc) : messages d'erreur, libellés et
commentaires s'adressant à un lecteur humain. Le code et les noms techniques
restent en anglais.

**Contrat d'API** — livrable 11 §1. Préfixe global `/api/v1`. Les erreurs ont
toujours cette forme, et rien d'autre :

```json
{ "code": "facture_non_payee", "message": "…", "details": {} }
```

`code` est le contrat machine (stable, jamais traduit), `message` le contrat
humain (affichable tel quel). Statuts : `401` `403` `404` `409` `422` `429`.
Un échec de validation de DTO donne `422` avec le détail champ par champ dans
`details.champs`.

**Commits.** Atomiques, messages conventionnels (`feat:`, `fix:`, `chore:`,
`test:`, `docs:`, `ci:`).

**Divergences.** Tout écart constaté avec un livrable est signalé et arbitré,
jamais tranché seul — il est consigné dans `docs/BACKLOG.md` en attendant.

---

## Commandes

Toutes depuis la racine.

| Commande | Effet |
|---|---|
| `pnpm install` | Installe l'espace de travail (`api`, `web`) |
| `pnpm lint` | ESLint + Prettier, zéro avertissement toléré |
| `pnpm build` | `prisma generate` puis `nest build` |
| `pnpm test` | Jest + Supertest |
| `pnpm test:cov` | Idem avec la couverture (seuils du livrable 13 §1) |

Les tests exigent une **MySQL 8 et une Redis 7 réelles**, jamais SQLite
(livrable 13 §1) : lancez `docker compose -f docker-compose.dev.yml up mysql redis`
avant, et pointez `REDIS_URL` sur la base `15`, réservée aux tests.

---

## Intégration continue

`.github/workflows/ci.yml` — à chaque poussée sur `main` / `develop` et à
chaque pull request : installation, `prisma generate`, lint, build, puis tests
contre des services `mysql:8` et `redis:7`.

La publication des images sur `ghcr.io` et les parcours Playwright décrits au
livrable 14 §3 arriveront avec leurs lots.
