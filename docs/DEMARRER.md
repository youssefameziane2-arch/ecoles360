# Lancer le site sur votre machine

Pour travailler, ou pour faire une démonstration. Trois commandes, et une
adresse à ouvrir.

> Tout tourne **sur votre poste uniquement**. Rien n'est accessible depuis
> Internet, personne d'autre ne peut ouvrir ces adresses.

---

## 1. Démarrer la base et l'API

Docker Desktop doit être lancé (l'icône baleine, en bas à droite). S'il ne
l'est pas, ouvrez-le et attendez qu'il affiche « Engine running ».

Ensuite, dans un terminal :

```bash
cd C:/ecoles360 && docker compose -f docker-compose.dev.yml up -d
```

Trois conteneurs démarrent : MySQL, Redis et l'API. **Le premier démarrage
prend une minute** — l'API attend que MySQL soit prête, c'est normal.

Vérifier que l'API répond :

```bash
curl http://localhost:3000/api/v1/health
```

Vous devez lire `"statut":"ok"` avec `mysql` et `redis` à `ok`. Si ce n'est pas
le cas, attendez trente secondes et réessayez : MySQL finit de démarrer.

## 2. Démarrer le site

Dans un **second** terminal, laissé ouvert :

```bash
cd C:/ecoles360/web && npx vite
```

Cette commande ne rend jamais la main — c'est normal, elle sert le site tant
qu'elle tourne. Pour l'arrêter : `Ctrl+C` dans ce terminal.

## 3. Ouvrir

**http://localhost:5173**

---

## Se connecter au back-office

Les comptes de démonstration ont tous le même mot de passe,
`motdepasse-de-demonstration` :

| Rôle | Adresse |
|---|---|
| Administration | `direction@ecoles360.com` |
| Établissement | `contact@almassira.ma` |
| Secrétariat | `sara.s@ecoles360.com` |

### Choisir votre propre mot de passe

Pour une présentation, taper un mot de passe visiblement factice devant
l'assistance n'est pas idéal. Posez le vôtre :

```bash
cd C:/ecoles360 && docker compose -f docker-compose.dev.yml exec -e COMPTE_MOT_DE_PASSE='VotreMotDePasse2026' api node dist/cli.js compte:admin direction@ecoles360.com
```

Douze caractères minimum. Le semis ne réécrit **jamais** un mot de passe
existant : celui que vous posez ici reste le vôtre, même après un `db:seed`.

Sans `COMPTE_MOT_DE_PASSE`, la commande en tire un au sort et l'affiche une
seule fois.

---

## Ce que vous pouvez montrer

**Le site public** — accueil, recherche, filtres, carte, fiche d'établissement,
avis, blog, FAQ, pages légales.

**L'administration**, sur `/admin` :

| | |
|---|---|
| Ajouter une école | « Établissements » → **+ Ajouter un établissement** |
| La publier | **Activer l'essai gratuit**, puis **Valider** — elle apparaît aussitôt sur le site public |
| Ajouter ses photos | **Photos**, glisser-déposer, réordonner |
| La retirer du site | **Suspendre** — elle disparaît du public, son historique reste |
| La supprimer | **Supprimer**, visible seulement sur une fiche jamais publiée et sans abonnement |
| Modérer un avis | « Avis » |
| Écrire un article | « Blog » |
| Modifier la FAQ, « À propos », les pages légales | « Contenu du site » |
| Voir qui a fait quoi | « Journal d'audit » |

### Pourquoi « Supprimer » n'apparaît pas toujours

Une fois la fiche validée, ou dès qu'elle porte un avis, une demande de
contact ou un abonnement, elle ne peut plus être supprimée : toutes ses
données partiraient avec elle, **y compris ses factures**, que la loi impose
de conserver. Le bouton disparaît alors, et « Suspendre » prend le relais —
l'école sort du site public et tout son historique est conservé.

---

## Arrêter

```bash
cd C:/ecoles360 && docker compose -f docker-compose.dev.yml down
```

Et `Ctrl+C` dans le terminal du site. **Vos données restent** : elles vivent
dans des volumes Docker qui survivent à l'arrêt.

---

## Si ça ne marche pas

| Symptôme | Cause et remède |
|---|---|
| `docker: command not found`, ou « cannot find the pipe » | Docker Desktop n'est pas lancé. Ouvrez-le, attendez « Engine running ». |
| `localhost:5173` ne répond pas | Le terminal du site a été fermé. Relancez l'étape 2. |
| Le site s'affiche mais tout est vide | L'API ne répond pas. Vérifiez l'étape 1 avec `curl`. |
| « Identifiants incorrects » | Le mot de passe a été changé. Reposez-le avec `compte:admin` ci-dessus. |
| Le site affiche une version périmée après un changement de branche | Arrêtez le site, `rm -rf web/node_modules/.vite`, relancez. |

---

## Ce que ce mode **n'est pas**

Ce n'est pas une mise en production. Pas de sauvegarde, pas de certificat, pas
de nom de domaine, rien n'est joignable de l'extérieur. Pour ouvrir le site au
public, voir [`infra/README-DEPLOIEMENT.md`](../infra/README-DEPLOIEMENT.md) —
qui s'adresse à la personne qui héberge, pas à vous.
