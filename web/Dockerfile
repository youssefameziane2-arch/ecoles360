# =============================================================================
#  écoles360 — image du front (React 18 + Vite)
#  Livrable 14 §2.2
# -----------------------------------------------------------------------------
#  Le contexte de build est la RACINE du dépôt, pas web/ : en espace de travail
#  pnpm le fichier de verrouillage est unique et vit à la racine — même raison
#  que pour api/Dockerfile (docs/BACKLOG.md, B-04).
#
#      docker build -f web/Dockerfile -t ecoles360-web .
#
#  ÉCART ASSUMÉ AVEC LE LIVRABLE 14 §2.2, ET IL EST IMPORTANT. Le livrable
#  décrit une image Node qui sert un rendu SSR (`node server.js`, port 4000,
#  sortie `dist/client` + `dist/server`). Ce front-là n'existe pas : `vite
#  build` produit aujourd'hui une application monopage — un index.html et un
#  paquet JavaScript. Fabriquer un `server.js` qui ne fait que servir des
#  fichiers statiques en se présentant comme du SSR mentirait sur ce que le
#  site sait faire, et le référencement d'un annuaire en dépend entièrement.
#
#  L'image sert donc les fichiers statiques par nginx, et la topologie reste
#  celle du livrable : un service `web` derrière le proxy. Le jour de la
#  migration SSR, c'est ce fichier qui change, et lui seul.
#
#  Conséquence à connaître : tant que ce front est une SPA, Google reçoit une
#  page vide et un paquet JavaScript. Voir docs/BACKLOG.md, B-45.
# =============================================================================

# -----------------------------------------------------------------------------
FROM node:20-alpine AS build
# -----------------------------------------------------------------------------
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Seuls les manifestes d'abord : le cache ne s'invalide qu'au changement d'une
# dépendance, jamais à une modification de code.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web/package.json ./web/

RUN pnpm install --frozen-lockfile --filter @ecoles360/web...

COPY web/ ./web/

WORKDIR /app/web
# `vite build` seul, sans le `tsc --noEmit` du script `build` : le typage est
# déjà éprouvé par la CI avant qu'une image soit construite (livrable 14 §3),
# et le rejouer ici ne ferait qu'allonger la chaîne sans rien prouver de neuf.
RUN pnpm exec vite build

# LES MAQUETTES NE PARTENT PAS EN PRODUCTION. `web/public/_maquette/` porte
# les deux livrables de conception déballés — 2 Mo utiles pour les ouvrir dans
# un navigateur pendant le développement. Tout ce qui est dans `public/` est
# recopié tel quel dans `dist/` : sans cette ligne, le travail de conception du
# client serait téléchargeable sur ecoles360.com/_maquette/espace.html.
#
# Retirées ICI plutôt que du dépôt, pour qu'elles restent à portée en
# développement. Un `Disallow` dans robots.txt n'y suffirait pas : il demande
# aux robots de ne pas indexer, il n'empêche personne d'ouvrir l'URL.
RUN rm -rf dist/_maquette


# -----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime
# -----------------------------------------------------------------------------
# Image de service, pas de build : ni Node, ni sources, ni dépendances de
# développement ne survivent à cette étape (livrable 14 §6, durcissement).

COPY --from=build /app/web/dist /usr/share/nginx/html
COPY web/nginx.conf /etc/nginx/conf.d/default.conf

# nginx:alpine tourne déjà son maître en root pour ouvrir le port 80, puis
# rétrograde ses workers sur l'utilisateur `nginx`. Ce conteneur ne publie
# aucun port : il n'est joignable que depuis le réseau interne, par le proxy.
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/sante || exit 1
