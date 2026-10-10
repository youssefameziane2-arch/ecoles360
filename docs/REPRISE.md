# Reprise — où le travail s'est arrêté

*Dernière mise à jour : 10 octobre 2026.*

Ce fichier est écrit pour la **session suivante**, quelle qu'elle soit. Il dit
l'état exact, ce qui vient ensuite, et les pièges que l'on ne devine pas en
lisant le code.

À tenir à jour à chaque arrêt : un document de reprise périmé est pire que
pas de document, parce qu'on le croit.

---

## L'état, en cinq lignes

| | |
|---|---|
| Branche | `feat/purges-loi-09-08`, **20 commits d’avance sur `main`** |
| Tests | **411 verts, 23 suites** — vérifiés dans le conteneur |
| Arbre | propre, rien en cours |
| Migrations | **19**, toutes appliquées en `ecoles360_dev` et `ecoles360_test` |
| Écrans | **36 complets · 8 partiels · 1 restant** sur 45 (`INVENTAIRE-MAQUETTE.md`) |

⚠️ **Les 7 derniers commits ne sont pas poussés** (`edfd2e4` … `11b217d`).
Vérifier avant toute chose :

```bash
git log origin/feat/purges-loi-09-08..HEAD --oneline
```

---

## Première commande à lancer

```bash
node scripts/tester.mjs
```

Elle joue les 411 tests **dans le conteneur `api`**. Si le conteneur ne tourne
pas, le script le dit et donne la commande. Compter environ six minutes.

**Ne pas utiliser la commande du livrable 13 depuis Windows** sans savoir
pourquoi : elle joint MySQL par le relais de port de Docker Desktop, qui perd
une connexion de loin en loin sur une suite complète. Le symptôme est un
`Can't reach database server at 127.0.0.1:3306` au milieu d'une exécution,
**alors que MySQL n'a rien eu**. Voir B-58 au backlog.

---

## Ce qui vient ensuite : les images Docker depuis la CI

**Le job `images` existe déjà** dans `.github/workflows/ci.yml` (commit
`fd96269`) : il construit `ecoles360-api` et `ecoles360-web`, les pousse sur
ghcr.io avec `GITHUB_TOKEN` et `packages: write`, après `api` et `web`, sur
`main` et les tags `v*`. Ce que cette section annonçait comme manquant ne
l'était pas.

**Ce qui manquait réellement, et qui est corrigé (non commité) :** le
déclencheur `push` ne listait pas `tags: ['v*']`, donc la condition `refs/tags/v`
du job ne pouvait jamais être vraie.

**Étiquetage : le SHA du commit, pas le tag Git.** Un tag `v*` déclenche la
construction, mais l'image reste nommée par SHA. Ce n'est pas un oubli : le
`deploy.sh` du livrable 14 fait `SHA="$1"` puis `echo "TAG=$SHA" > .env.tag`,
avec le commentaire « le tag devient l'unique variable de version », et le
retour arrière s'écrit `./deploy.sh <sha-precedent>`. **`TAG` ne vaut donc
jamais `v1.0.0` : il vaut un SHA.** Ajouter `:${{ github.ref_name }}` ne
casserait rien, mais produirait une étiquette que rien ne tire.

Le job de ce dépôt reprend **mot pour mot** celui du livrable 14 §3, y compris
`${{ github.repository_owner }}` sans mise en minuscules. ghcr.io refuse les
majuscules dans un nom d'image : cela tiendra tant que le propriétaire du
dépôt en est dépourvu — c'est le cas de `youssefameziane2-arch`. Si le dépôt
passait sous une organisation à majuscule, il faudrait abaisser la casse. **Ne
pas le faire par avance** : ce serait s'écarter d'un extrait verbatim du
livrable pour un risque qui n'existe pas aujourd'hui.

**Jamais exécuté.** La branche n'est pas poussée : le job n'a donc jamais
tourné sur GitHub. Il ne se prouvera qu'à la première exécution sur `main` ou
sur un tag.

**Entrées de backlog liées — et elles ne se prennent pas de la même façon.**

- **B-04** (lockfile dans les Dockerfiles de production) est **`à arbitrer`** :
  une décision du client est attendue. Le lockfile racine est déjà copié dans
  les deux Dockerfiles ; reste à ratifier la proposition.
- **B-10** (jobs CI `web`, `images`, `e2e`) est **`planifié`**, donc **se
  prend librement** — `CLAUDE.md` est explicite : « `à faire` et `planifié` se
  prennent librement ; ce qui manque est du travail, pas un arbitrage ». Reste
  `e2e`, qui suppose un staging déployé.

*(Une version antérieure de ce document rangeait B-10 parmi les entrées à
arbitrer. C'était faux, et ce genre d'erreur coûte cher dans les deux sens :
on soumet au client ce qu'on pouvait faire, ou l'on tranche ce qui ne nous
appartient pas. Le statut se lit dans l'entrée, pas de mémoire.)*

Ensuite seulement : le déploiement lui-même, qui demande un serveur.

---

## Ce qui est bloqué, et sur qui

Tous les écrans partiels attendent **le client**, pas du code. Ne pas combler
ces trous en inventant : une règle inventée compile, passe les tests, et ne se
découvre qu'à la recette.

### Contenus à fournir

| Quoi | Où |
|---|---|
| Raison sociale, RC/ICE, directeur de publication, hébergeur | mentions légales — 4 `[À COMPLÉTER]` |
| **Numéro de déclaration CNDP** | confidentialité — démarche administrative, délai propre |
| Image de l'histoire, carte, réseaux sociaux d'écoles360 | page À propos |
| Témoignages de directeurs, FAQ dédiée | page Inscription |
| Adresse expéditrice + 4 réglages SMTP | `.env` — voir plus bas |

**Le reçu de facture est bloqué par les mentions légales** : il doit les
porter. C'est le dernier manque de « Abonnement & facturation ».

### Définitions à trancher

| Question | Pourquoi personne ne peut y répondre à la place du client |
|---|---|
| Qu'est-ce qu'une « visite du site » ? | Session, visiteur unique du jour ou page vue : facteur dix d'écart, et la RG12 facture à la vue |
| « Taux de contact » (espace établissement) | Numérateur et dénominateur indéfinis ; aucun rapport des chiffres de la maquette ne donne son 1,5 % |
| Écran Statistiques du commercial | La maquette y remet les chiffres d'une fiche ; ce qu'un commercial doit y lire n'est écrit nulle part |
| Transfert de dossier entre commerciaux | Défini nulle part |

---

## L'envoi d'e-mail : construit, éteint

Six messages existent et sont branchés. **Rien ne reste à développer.**

Le service se déclare **éteint** tant que les cinq variables ne sont pas
toutes renseignées, le dit une fois au démarrage, et refuse chaque envoi sans
jamais lever. C'est ce qui permet aux 411 tests de tourner sans serveur de
messagerie.

Pour l'allumer, décommenter dans `.env` et redémarrer :

```
SMTP_HOST= SMTP_PORT= SMTP_USER= SMTP_PASSWORD= MAIL_FROM=
```

**Le mot de passe ne passe ni par le dépôt ni par une conversation** : le
client l'écrit lui-même dans `.env`, qui est ignoré par Git.

Ce qui part : avis à modérer, modification de fiche à valider, échéance
d'abonnement, demande de contact, plafond de vues, réinitialisation de mot de
passe, et **inscription d'une école** (le seul événement commercial, longtemps
silencieux — B-46).

---

## Pièges de ce poste, vérifiés

**Le conteneur garde ses propres dépendances.** Après un changement de
`api/package.json`, il ne voit pas le nouveau paquet. La procédure est dans
`docker-compose.dev.yml`, et elle marche telle quelle :

```bash
docker compose -f docker-compose.dev.yml exec api \
  sh -c "cd /app && corepack pnpm install --filter @ecoles360/api"
docker compose -f docker-compose.dev.yml restart api
```

Le redémarrage compte : `tsc --watch` met en cache ses échecs de résolution.

**Après une migration d'énumération**, le conteneur garde son ancien client
Prisma et répond 422 « validation échouée » sur une valeur pourtant valide.
`docker compose -f docker-compose.dev.yml restart api`.

**`prisma generate` échoue en `EPERM`** si un processus tient le moteur de
requête — typiquement un Jest resté suspendu ou le planificateur. Les
terminer, puis régénérer.

**Le shell mange les accents graves et les échappements** dans `node -e` et
les heredocs. Pour tout ce qui contient des accents graves, des accents ou des
expressions régulières : passer par les outils d'édition de fichier, pas par
le shell. L'erreur s'est produite quatre fois dans une seule session, et elle
est silencieuse — le commentaire sort vidé de sa substance.

**Ne jamais faire `docker compose … down -v`** : cela détruit `mysql_data` et
`storage`, donc toute la base de développement et les photos des fiches.

**Serveurs de développement :** Vite sur **5174** (5173 est tenu par un
processus resté en place), API dans Docker sur **3000**. Comptes de
démonstration dans `docs/DEMARRER.md` — jamais sur l'écran de connexion.

---

## Discipline de ce projet

Trois choses qui ne se devinent pas, et que `CLAUDE.md` pose déjà — rappelées
ici parce qu'elles ont chacune coûté une correction :

**L'inventaire de la maquette se périme.** Il s'est contredit **douze fois**,
dont deux fois dans la même session : une ligne annonçant un écran à faire
quand une autre le disait fait. **Vérifier dans le code avant de construire ce
qu'il déclare manquant.** La douzième fois, le calendrier commercial existait
déjà et fonctionnait.

**La base de test n'est pas remise à zéro.** Écrire des invariants ou
fabriquer sa propre donnée ; jamais `toBe(3)` sur un comptage global. Et
nettoyer derrière soi — y compris dans `ecoles360_dev` après une vérification
au navigateur.

**Les commentaires disent POURQUOI.** Ce qui casserait si l'on faisait
autrement, pas ce que fait le code.

---

## Résidus connus, non traités

Cinq établissements de test polluent la base de **développement** —
`testing`, `j2hb`, `j2hbb`, `École Facturation 1791309525`, `École Démo
Abonnement`. Ils apparaissent dans le classement et les factures à l'écran.
Deux portent des factures payées : les supprimer cascade sur des lignes
financières. **Demander avant d'y toucher.**
