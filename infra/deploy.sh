#!/usr/bin/env bash
# =============================================================================
#  écoles360 — déploiement par tag d'image
#  Livrable 14 §4 — exécuté sur le VPS par l'utilisateur `deploy`
# -----------------------------------------------------------------------------
#      ./infra/deploy.sh <sha-du-commit>
#
#  DÉPLOYER, C'EST DÉSIGNER UN TAG, PAS RECONSTRUIRE. Les images viennent de
#  ghcr.io et n'existent que si leurs tests sont passés. Le serveur ne compile
#  jamais : il télécharge des artefacts déjà éprouvés, ce qui retire de la
#  production la chaîne de build, ses dépendances de développement et son
#  risque d'échouer à mi-parcours.
#
#  Le retour arrière est la MÊME commande avec le tag précédent (§4.2) :
#      tail -n 5 deploiements.log
#      ./infra/deploy.sh <sha-precedent>
#
#  Réserve à connaître : LES MIGRATIONS NE RECULENT PAS AVEC L'IMAGE. Toute
#  migration doit rester compatible avec la version précédente — ajout de
#  colonne nullable, jamais de suppression dans la même livraison.
# =============================================================================
set -euo pipefail

SHA="${1:-}"
if [ -z "$SHA" ]; then
  echo "usage: $0 <sha-du-commit>" >&2
  exit 64
fi

RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RACINE"

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.prod --env-file .env.tag"

# Le tag est l'unique variable de version. `.env.prod` porte GH_ORG ; ce
# second fichier ne porte que TAG, ce qui rend le déploiement lisible dans
# l'historique du shell sans exposer le reste.
echo "TAG=$SHA" > .env.tag

$COMPOSE pull
$COMPOSE up -d --remove-orphans

# Chaque service n'entre en service qu'une fois son healthcheck au vert ; `api`
# applique ses migrations à son démarrage.
$COMPOSE ps

# CONTRÔLE DE BOUT EN BOUT, PAS SEULEMENT « LES CONTENEURS TOURNENT ». Un
# conteneur sain derrière un proxy mal rechargé ou un certificat expiré donne
# un site injoignable et une pile en apparence verte.
curl -fsS https://ecoles360.com/api/v1/health > /dev/null
echo "santé publique : ok"

echo "$(date --iso-8601=seconds) $SHA" >> deploiements.log

# Purge des images de plus de trente jours — les plus récentes restent en
# cache local, c'est ce qui rend le retour arrière immédiat.
docker image prune -af --filter "until=720h"

echo "déployé : $SHA"
