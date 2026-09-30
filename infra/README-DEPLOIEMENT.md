# Mise en service — VPS Hostinger KVM 2

Procédure d'amorçage d'un serveur neuf, puis exploitation courante.
Cible du livrable 14 : Ubuntu 24 LTS, Docker Engine, cinq conteneurs,
`ecoles360.com` déjà acheté chez Hostinger.

> **Ce document décrit ce qui est construit, pas ce qui est prévu.**
> Ce qui manque encore est dit à la fin, sans le maquiller.

---

## 0. Ce qui doit exister avant de commencer

| | |
|---|---|
| VPS | Hostinger KVM 2 — 2 vCPU, 8 Go, 100 Go NVMe, Ubuntu 24 LTS |
| DNS | `ecoles360.com` et `www` → IPv4 du VPS, dans hPanel. **À faire en premier** : Let's Encrypt valide en résolvant le nom, et la propagation prend parfois des heures. |
| Accès | Clé SSH. `PermitRootLogin no`, `PasswordAuthentication no`. |
| GitHub | Le dépôt publie ses images sur `ghcr.io`. Si le dépôt est privé, le VPS a besoin d'un jeton en lecture : `docker login ghcr.io`. |

---

## 1. L'hôte

```bash
# Docker Engine + plugin Compose
curl -fsSL https://get.docker.com | sh

# Utilisateur de déploiement, non-root, membre du groupe docker
adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy

# Pare-feu : trois ports, pas un de plus
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable

apt-get install -y fail2ban certbot
```

Journaux bornés — remplace `pm2-logrotate`, qui n'existe plus en production.
Sans ce fichier, les journaux d'un conteneur remplissent le disque en quelques
mois et personne ne s'en aperçoit avant que MySQL refuse d'écrire :

```bash
cat > /etc/docker/daemon.json <<'JSON'
{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "5" } }
JSON
systemctl restart docker
```

---

## 2. Le dépôt et les secrets

```bash
mkdir -p /srv/ecoles360 && chown deploy:deploy /srv/ecoles360
su - deploy
git clone https://github.com/<org>/ecoles360.git /srv/ecoles360
cd /srv/ecoles360

cp .env.prod.example .env.prod && chmod 600 .env.prod
# puis renseigner : GH_ORG, DATABASE_URL, SESSION_SECRET, APP_URL…
#   SESSION_SECRET :  openssl rand -base64 48

mkdir -p secrets && chmod 700 secrets
openssl rand -base64 32 > secrets/mysql_root.txt
openssl rand -base64 32 > secrets/mysql_app.txt
chmod 600 secrets/*.txt
```

> **Le mot de passe applicatif est écrit à deux endroits** : dans
> `secrets/mysql_app.txt`, que MySQL lit pour créer le compte, et dans le
> `DATABASE_URL` de `.env.prod`, que l'API lit pour s'y connecter. S'ils
> diffèrent, MySQL démarre normalement et c'est l'API qui échoue — le message
> parle d'un accès refusé, jamais d'une divergence.

`secrets/`, `.env.prod` et `.env.tag` sont ignorés par Git. **Rien de tout
cela n'entre dans le dépôt, jamais.**

---

## 3. Les certificats, AVANT le premier démarrage

`nginx` refuse de se lancer si `ssl_certificate` pointe dans le vide. L'ordre
compte donc, et c'est l'erreur classique de la première mise en service.

```bash
mkdir -p infra/certbot/www infra/nginx/logs

# Rien n'écoute encore sur 80 : certbot peut s'en servir seul.
certbot certonly --standalone -d ecoles360.com -d www.ecoles360.com \
  --agree-tos -m contact@ecoles360.com --no-eff-email
```

Renouvellement automatique — le certificat vit trois mois, et il expire un
dimanche. Le `deploy hook` recharge le proxy sans le redémarrer :

```bash
cat > /etc/letsencrypt/renewal-hooks/deploy/ecoles360.sh <<'SH'
#!/bin/sh
cd /srv/ecoles360 && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
SH
chmod +x /etc/letsencrypt/renewal-hooks/deploy/ecoles360.sh
```

Une fois en service, certbot renouvelle par le défi HTTP servi par le bloc 80
de `infra/nginx/conf.d/ecoles360.conf`, monté en lecture seule dans le
conteneur.

> **HSTS n'a pas de marche arrière.** L'en-tête est posé par la configuration
> nginx : un navigateur qui l'a reçu refusera tout accès en clair au domaine
> pendant un an, même si le certificat vient à manquer. Ne le laisser en place
> qu'une fois le TLS éprouvé.

---

## 4. Premier déploiement

```bash
./infra/deploy.sh <sha-du-commit>
```

Le SHA est celui d'un commit de `main` dont la CI est **verte** : c'est la
seule condition d'existence d'une image sur `ghcr.io`.

`api` applique `prisma migrate deploy` à son démarrage. Sur une base neuve,
cela crée le schéma — **vide**. Les référentiels (villes, niveaux, filières,
paramètres de facturation, page « À propos », FAQ, pages légales) se posent
une fois :

```bash
docker compose -f docker-compose.prod.yml exec api node dist/cli.js db:seed
```

Cette commande sème les référentiels **et** les données de démonstration —
sauf sous `NODE_ENV=production`, où elle refuse la démonstration et le dit
dans ses journaux. C'est un garde-fou de `SeedCommand`, pas une consigne à
respecter : les comptes de démonstration ont des mots de passe connus, et les
poser à côté de vraies fiches clientes serait une faille.

**Vérifier la ligne `Données de démonstration ignorées : NODE_ENV=production`
dans la sortie.** Si elle manque, `.env.prod` ne porte pas `NODE_ENV` — et il
faut vider la base avant d'aller plus loin.

### Créer le premier administrateur — sans quoi personne ne peut entrer

La base porte maintenant les référentiels et **zéro compte**. Le back-office
s'affiche, et il n'existe au monde aucun identifiant pour y entrer :

```bash
docker compose -f docker-compose.prod.yml exec api \
  node dist/cli.js compte:creer direction@ecoles360.com --nom="Direction écoles360"
```

La commande **affiche un mot de passe tiré au sort, une seule fois** — il
n'est stocké nulle part en clair, la base n'en garde qu'un hachage Argon2id.
Notez-le avant de fermer le terminal.

Pour en choisir un, le passer par l'environnement plutôt qu'en argument : la
ligne de commande se retrouve dans l'historique du shell et dans `ps`, lisible
par tout autre compte de la machine.

```bash
docker compose -f docker-compose.prod.yml exec \
  -e COMPTE_MOT_DE_PASSE='…' api node dist/cli.js compte:creer direction@ecoles360.com
```

La même commande sur un compte existant **réinitialise son mot de passe** et
le remet superadmin actif — c'est le recours le jour où plus personne ne peut
se connecter.

---

## 5. Exploitation courante

```bash
./infra/deploy.sh <sha>                    # déployer
tail -n 5 deploiements.log                 # historique des versions
./infra/deploy.sh <sha-precedent>          # retour arrière

docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
```

Remplacer **un seul** composant — c'est l'objet même de la conteneurisation :

```bash
docker compose -f docker-compose.prod.yml pull api
docker compose -f docker-compose.prod.yml up -d --no-deps api
```

`--no-deps` est la clé : sans lui, Compose recrée aussi `mysql` et `redis`,
c'est-à-dire précisément ceux qu'il ne faut pas redémarrer. Les sessions
vivant dans Redis, remplacer le seul conteneur `api` ne déconnecte personne.

---

## 6. Sauvegarde

Le livrable 14 §5 confie la sauvegarde de 3 h au conteneur `scheduler`.
**Ce conteneur n'existe pas** (voir plus bas). En attendant, une tâche cron de
l'hôte tient le même rôle — RPO 24 h :

```bash
crontab -e -u deploy
```

```cron
0 3 * * * cd /srv/ecoles360 && docker compose -f docker-compose.prod.yml exec -T mysql \
  mysqldump --single-transaction --routines --triggers -u root \
  -p"$(cat secrets/mysql_root.txt)" ecoles360_prod \
  | gzip -9 > /srv/sauvegardes/ecoles360-$(date +\%F).sql.gz
```

`--single-transaction` : le dump est cohérent sans verrouiller les tables, donc
sans interrompre le site.

Restent à mettre en place, et ce ne sont pas des détails : le **chiffrement
GPG**, l'**externalisation** vers Hostinger Object Storage — une sauvegarde qui
ne quitte pas le serveur ne protège de rien, puisqu'elle disparaît avec lui —,
la rétention 30/4/12, et le `rsync` du volume `storage` (les photos des fiches).

---

## 7. Ce qui n'est pas couvert

| Manque | Conséquence |
|---|---|
| `worker` et `scheduler` (BullMQ, `@nestjs/schedule`) — B-09 | **Les purges de la loi 09-08 ne tournent pas** : anonymisation des demandes à 12 mois, agrégation des traces, purge du journal à 3 ans (livrable 10 §6.3). C'est une obligation légale, pas une commodité. |
| Rendu serveur du site public — B-45 | Le front est une application monopage : Google reçoit une page vide et un paquet JavaScript. Pour un annuaire dont le trafic vient de la recherche, c'est le point le plus coûteux. |
| Staging (`docker-compose.staging.yml`) | Aucun environnement de recette : toute vérification se fait en local ou en production. |
| Sauvegarde chiffrée et externalisée | Voir §6. |
| Supervision externe (UptimeRobot) | `/api/v1/health` existe et répond ; personne ne l'interroge. |

---

## 8. Vérifié, et comment

Les deux images ont été **construites et exécutées** avant d'être proposées —
elles ne sont pas seulement écrites :

| | |
|---|---|
| `docker build -f api/Dockerfile --target runtime` | construit |
| `docker build -f web/Dockerfile` | construit |
| API lancée, `GET /api/v1/health` | `200`, MySQL et Redis `ok` |
| web lancée, `GET /sante` | `200` |
| Repli monopage `GET /etablissements/xyz` | `200` — index.html |
| Asset absent `GET /assets/pas-la.js` | `404` — **et non un repli HTML**, qui ferait échouer le navigateur sur une erreur d'analyse incompréhensible |
| `HEALTHCHECK` des deux images | `healthy` — c'est ce dont dépend `depends_on: service_healthy` |
| `docker compose -f docker-compose.prod.yml config` | rend les cinq services |

Ce qui **n'a pas pu être vérifié** ici, faute de serveur : le TLS, le proxy
frontal, le renouvellement des certificats et `deploy.sh` de bout en bout.
