# Prompt de démarrage — Claude Code · Lot 1 (socle)

> **Mode d'emploi.** Décompressez le dossier de handoff à la racine d'un dossier vide, ouvrez Claude Code dedans, puis collez le bloc ci-dessous tel quel. Ne collez pas les lots suivants : un lot à la fois.

---

## À coller dans Claude Code

Tu vas démarrer l'implémentation d'écoles360, un annuaire web payant des établissements scolaires privés au Maroc. La conception est **entièrement terminée et validée** : seize livrables figés font office de cahier des charges. Ton travail est de les traduire en code, pas de reconcevoir le produit.

**Avant d'écrire la moindre ligne, lis ces documents dans `docs/` :**

- `Livrable 7 - Architecture technique` — stack imposée, arborescence du dépôt, topologie Docker
- `Livrable 14 - Déploiement CI-CD` — composition Docker, chaîne GitHub Actions, images
- `Livrable 11 - Back-end API` — conventions d'API, format des erreurs, nommage des modules
- `Livrable 13 - Stratégie de tests` — outillage et attentes de couverture

Puis résume-moi en dix lignes ce que tu as compris de la stack et de l'arborescence attendues, et **attends ma validation avant de coder**.

### Stack imposée (ne propose pas d'alternative)

NestJS 10 · TypeScript strict · Prisma · MySQL 8 · Redis 7 · BullMQ · Jest + Supertest · Docker Compose · front séparé React 18 + Vite (à venir, lot 7 — ne l'initialise pas maintenant).

### Périmètre du lot 1 — strictement celui-ci

1. Arborescence `api/` et `web/` à la racine, conforme au livrable 7. `web/` reste vide avec un simple `.gitkeep`.
2. Initialisation de NestJS 10 dans `api/` avec :
   - TypeScript en mode strict, ESLint + Prettier configurés ;
   - préfixe global `/api/v1` ;
   - `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`) ;
   - un filtre d'exception global produisant **exactement** le format d'erreur décrit au livrable 11 ;
   - Swagger exposé sur `/api/docs`.
3. `docker-compose.dev.yml` à la racine : services `api`, `mysql:8`, `redis:7`, volumes nommés, rechargement à chaud, réseau interne. Un seul `docker compose up` doit suffire à un nouveau développeur.
4. `.env.example` exhaustif et commenté. Aucun secret réel dans le dépôt, `.env` dans `.gitignore`.
5. `GET /api/v1/health` : vérifie réellement la connexion MySQL et la connexion Redis, renvoie `200` avec le détail par dépendance, `503` si l'une est en échec. Cette sonde servira de `HEALTHCHECK` en production — écris-la pour durer.
6. Un test Jest + Supertest sur cet endpoint (cas nominal et cas dépendance en échec).
7. Un workflow GitHub Actions qui installe, lint, build et joue les tests avec des services `mysql` et `redis`.

### Ce que tu ne fais pas dans ce lot

Aucun module métier, aucun `schema.prisma` complet, aucune authentification, aucun écran. Le module Prisma peut être posé (connexion + `PrismaService`) mais le schéma se limite au strict nécessaire à la sonde. Si tu identifies un besoin hors périmètre, note-le dans `docs/BACKLOG.md` au lieu de l'implémenter.

### Règles de travail

- Le français est la langue du produit : messages d'erreur, libellés et commentaires utilisateur en français (Maroc). Le code et les noms techniques restent en anglais.
- Commits atomiques et messages conventionnels (`feat:`, `chore:`, `test:`…).
- Toute divergence avec un livrable doit m'être signalée et arbitrée — jamais tranchée seule.
- Le design system est fourni dans `docs/design-system/` avec son `SKILL.md` : tu ne l'utilises pas encore, mais ne le supprime pas.

### Critère de sortie — je validerai sur celui-ci

Sur une machine vierge : `git clone` → `cp .env.example .env` → `docker compose -f docker-compose.dev.yml up` → `GET /api/v1/health` répond `200`, `/api/docs` s'affiche, et la CI est verte sur la branche.

Commence par la lecture des livrables et ton résumé en dix lignes.

---

## Après validation du lot 1

Enchaînez avec le lot 2 (données) en reprenant la même structure : périmètre strict, référence au **Livrable 8** (Merise) et au **Livrable 10** (migrations, seeders, import open data), critère de sortie observable — `prisma migrate deploy` puis la commande de seed reconstruisent une base de démonstration complète depuis zéro.
