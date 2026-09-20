# =============================================================================
#  écoles360 — image applicative API (NestJS 10)
#  Livrable 14 §2.2 — multi-étages, node:20-alpine, utilisateur non-root, HEALTHCHECK
# -----------------------------------------------------------------------------
#  Le contexte de build est la RACINE du dépôt, pas api/ : en espace de travail
#  pnpm le fichier de verrouillage est unique et vit à la racine (voir
#  docs/BACKLOG.md, B-04 — le livrable 14 §2.2 copie « api/pnpm-lock.yaml »,
#  qui n'existe pas dans cette topologie).
#
#      docker build -f api/Dockerfile --target runtime -t ecoles360-api .
#
#  Trois étapes utiles :
#    deps        dépendances complètes, réutilisées par development et build
#    development cible de docker-compose.dev.yml — sources montées, rechargement à chaud
#    runtime     image de production — ni sources TypeScript, ni outils de développement
# =============================================================================

# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

# Prisma sonde la version d OpenSSL pour choisir son moteur de requete. Alpine
# embarque OpenSSL 3 mais pas le paquet que cette detection interroge : faute
# de reponse, Prisma retombe sur le moteur openssl-1.1.x et echoue a l execution
# sur « Error loading shared library libssl.so.1.1 ». Une ligne ici epargne une
# panne qui ne se manifeste qu au premier acces a la base.
RUN apk add --no-cache openssl
# -----------------------------------------------------------------------------
WORKDIR /app

# Corepack fige la version de pnpm sur le champ `packageManager` de la racine :
# la même que celle de la CI (livrable 14 §3, pnpm/action-setup v9).
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Seuls les manifestes sont copiés d'abord : le cache de cette couche ne
# s'invalide qu'au changement d'une dépendance, jamais à une modification de code.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json ./api/

RUN pnpm install --frozen-lockfile --filter @ecoles360/api...


# -----------------------------------------------------------------------------
FROM node:20-alpine AS development

# Prisma sonde la version d OpenSSL pour choisir son moteur de requete. Alpine
# embarque OpenSSL 3 mais pas le paquet que cette detection interroge : faute
# de reponse, Prisma retombe sur le moteur openssl-1.1.x et echoue a l execution
# sur « Error loading shared library libssl.so.1.1 ». Une ligne ici epargne une
# panne qui ne se manifeste qu au premier acces a la base.
RUN apk add --no-cache openssl
# -----------------------------------------------------------------------------
# Cible de docker-compose.dev.yml. Les sources arrivent par montage, pas par
# COPY : le conteneur voit le poste du développeur, et `nest start --watch`
# recompile à l'enregistrement.
WORKDIR /app
ENV NODE_ENV=development
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/api/node_modules ./api/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/ ./api/

WORKDIR /app/api
EXPOSE 3000

# `prisma generate` est rejoué au démarrage plutôt qu'ici : le client généré
# vit sous api/src/generated/, donc sous le montage, et serait masqué par lui.
CMD ["sh", "-c", "pnpm exec prisma generate && pnpm start:dev"]


# -----------------------------------------------------------------------------
FROM node:20-alpine AS build

# Prisma sonde la version d OpenSSL pour choisir son moteur de requete. Alpine
# embarque OpenSSL 3 mais pas le paquet que cette detection interroge : faute
# de reponse, Prisma retombe sur le moteur openssl-1.1.x et echoue a l execution
# sur « Error loading shared library libssl.so.1.1 ». Une ligne ici epargne une
# panne qui ne se manifeste qu au premier acces a la base.
RUN apk add --no-cache openssl
# -----------------------------------------------------------------------------
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/api/node_modules ./api/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/ ./api/

WORKDIR /app/api
RUN pnpm exec prisma generate && pnpm build

# Ne survivent à cette étape que les dépendances d'exécution.
RUN pnpm prune --prod


# -----------------------------------------------------------------------------
FROM node:20-alpine AS runtime

# Prisma sonde la version d OpenSSL pour choisir son moteur de requete. Alpine
# embarque OpenSSL 3 mais pas le paquet que cette detection interroge : faute
# de reponse, Prisma retombe sur le moteur openssl-1.1.x et echoue a l execution
# sur « Error loading shared library libssl.so.1.1 ». Une ligne ici epargne une
# panne qui ne se manifeste qu au premier acces a la base.
RUN apk add --no-cache openssl
# -----------------------------------------------------------------------------
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Utilisateur non-root (livrable 14 §6, durcissement des images).
RUN addgroup -S app && adduser -S app -G app

COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/api/node_modules ./api/node_modules
COPY --from=build --chown=app:app /app/api/dist ./api/dist
COPY --from=build --chown=app:app /app/api/prisma ./api/prisma
COPY --from=build --chown=app:app /app/api/package.json ./api/package.json

# Volume des médias (RG16, RG27) — monté depuis le volume nommé `storage`.
RUN mkdir -p /app/storage && chown -R app:app /app/storage

USER app
WORKDIR /app/api
EXPOSE 3000

# Une seule définition de « en bonne santé » pour l'orchestrateur, la sonde
# externe UptimeRobot et le `depends_on: service_healthy` des autres services
# (livrable 14 §2.2 et §5).
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=40s \
  CMD node -e "fetch('http://127.0.0.1:3000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# LOT 1 — l'image ne sert que l'API. Les conteneurs `worker` (dist/worker.js) et
# `scheduler` (dist/scheduler.js) du livrable 14 §2 partagent cette image avec
# une commande différente ; leurs points d'entrée arrivent avec BullMQ et
# @nestjs/schedule (docs/BACKLOG.md, B-09).
CMD ["node", "dist/main.js"]
