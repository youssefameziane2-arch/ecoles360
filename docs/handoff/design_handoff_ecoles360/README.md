# Handoff : écoles360 — annuaire payant des établissements scolaires privés au Maroc

> Package destiné à un développeur travaillant avec **Claude Code**. Il contient (1) les maquettes HTML de référence, (2) le design system écoles360 compilé, (3) les livrables de spécification qui font foi. Objectif : implémenter le produit réel sur la stack cible.

---

## 1. Vue d'ensemble

écoles360 (`ecoles360.com`) met en relation des **parents** (recherche, comparaison, contact — gratuit) et des **établissements scolaires privés** (clients payants : visibilité sponsorisée, abonnement, paiement à la vue). Modèle économique : aucun tarif n'est public — l'administration fixe le tarif client par client.

**Quatre surfaces :**

| Surface | Public | Contenu |
|---|---|---|
| Site public | Parents | Accueil, résultats + filtres, fiche établissement, blog, à propos, contact, inscription établissement |
| Espace établissement | Client | Tableau de bord, page profil éditable, statistiques, abonnement & factures, avis, blog, CRM leads |
| Espace secrétariat | Délégué du client | Tableau de bord, demandes de contact, fiches (portées déléguées, révocables) |
| Back-office admin | Direction / Super Admin | Établissements, secrétariat, commerciaux, CRM clients, abonnement & facturation, avis, blog, contenu du site, statistiques, journal d'audit, base de données |

**Langue et conventions :** français (Maroc), vouvoiement systématique. Virgule décimale (`4,8`), espace fine comme séparateur de milliers (`8 420`), devise `MAD` **après** le montant (`2 500 MAD/mois`), heures en 24 h. L'arabe (RTL) est hors périmètre V1 mais prévu — utiliser des propriétés CSS logiques (`margin-inline-start`) plutôt que physiques dès maintenant.

---

## 2. À propos des fichiers de design fournis

Les fichiers de `design/` sont des **références de design réalisées en HTML** — des prototypes qui montrent l'apparence et le comportement attendus. **Ce n'est pas du code de production à copier tel quel.**

La tâche consiste à **recréer ces designs dans l'environnement de la stack cible** (API NestJS 10 + front React 18/Vite en TypeScript, voir §4) en utilisant ses conventions et ses bibliothèques. Les prototypes utilisent un runtime de maquettage propriétaire (`support.js`, balises `<x-dc>`, `<sc-for>`, `<x-import>`) : **ce runtime ne doit pas être porté**. Seuls comptent le rendu visuel, la structure, les états et les enchaînements.

Les données des maquettes sont des **jeux de démonstration en dur** (constantes `ESTAB`, `LEADS`, `PROSPECTS`, `ARTICLES`, `AUDIT`, `ALL_REVIEWS`…). En production, elles viennent de l'API (§5). Le pont `localStorage['e360cms']` entre les deux maquettes est un artifice de prototypage — il est remplacé par l'API et son cache Redis (`CacheModule`, clés `fiche:{slug}`, `articles:public`, `faq:public`, `pages:a-propos`) côté serveur, et par les invalidations React Query côté client.

## 3. Fidélité

**Haute fidélité (hifi).** Les maquettes portent les couleurs, la typographie, les espacements et les interactions définitifs, et sont construites sur le design system compilé (`design/_ds/`). Le rendu doit être **reproduit fidèlement**, en montant les composants du design system plutôt qu'en re-stylant du HTML brut.

Le design system est fourni sous deux formes dans `design/_ds/` :
- `_ds_bundle.js` — bundle des composants React (namespace global `Coles360DesignSystem_66e6db`),
- `tokens/*.css` + `styles.css` — jetons (couleurs, type, espacements, rayons, ombres, motion, points de rupture) exposés en variables CSS,
- `readme.md` — guide du système, `SKILL.md` — manifeste d'Agent Skill directement exploitable par Claude Code.

Composants disponibles (46 exports) : `Icon` · `Button`, `Input`, `Select`, `Checkbox`, `Textarea` · `Badge`, `Tag`, `Avatar`, `DataTable`, `Pagination`, `ProgressBar`, `PermissionToggle` · `Header`, `SidebarNav`, `BottomTabBar`, `Breadcrumb`, `Stepper` · `TypePicker`, `CitySelect`, `FilterBar` · `EstablishmentCard`, `CityCard`, `StatCard`, `PricingCard`, `ReviewCard`, `RequestCard` · `Tabs`, `TeamMember`, `EquipmentItem`, `FaqAccordion`, `RatingBreakdown`, `SocialLinks`, `VideoEmbed` · `Modal`, `Toast`, `EmptyState`, `Skeleton`, `ProfileUnavailable` · `BarChart`, `SourceBars`.

---

## 4. Stack cible

| Couche | Choix | Notes |
|---|---|---|
| Back-end | **NestJS 10** + TypeScript strict · Node 20 LTS | Un module par domaine métier ; préfixe global `/api/v1` |
| Front-end | **React 18 + Vite 5**, routage par fichier **Vike** | **SSR ciblé du site public** (SEO des ~8 000 fiches) · **SPA pure** pour les 3 back-offices |
| Contrat | REST `/api/v1/*` — enveloppe `{data,meta,links}`, erreurs `{code,message,details}` en français | OpenAPI généré : **`@nestjs/swagger` → `/api/docs`** |
| Persistance | **Prisma 5** sur **MySQL 8** (InnoDB, `utf8mb4_unicode_ci`) | 23 modèles ; `PrismaService` provider injectable |
| Authentification | **`@nestjs/passport` + `passport-local`** · `express-session` + `connect-redis` · **Argon2id** | Cookie `HttpOnly`/`Secure`/`SameSite=Lax`, CSRF double-submit ; sessions dans Redis donc **révocables** |
| Autorisation | **Guards** `CanActivate` + décorateurs `@Roles()` / `@Scopes()` | Vérifiés à chaque requête — jamais côté affichage seul |
| Validation | **class-validator + class-transformer** · `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`) | Messages français ; les champs de plateforme sont rejetés par construction |
| Files & cache | **`@nestjs/bullmq`** sur Redis 7 — `mail`, `alerts`, `billing`, `maintenance`, `stats` | + `CacheModule` Redis et `@nestjs/throttler` |
| Tâches planifiées | **`@nestjs/schedule`** (`@Cron`) dans un conteneur dédié | Purges 02 h / 04 h, sauvegarde 03 h, rappels 08 h — exemplaire unique |
| État client | **TanStack Query** — invalidations explicites après mutation | Pas de Server Actions : une seule voie d'écriture HTTP |
| Cartographie | **Leaflet + OpenStreetMap** | Fiche établissement, carte cliquable dans l'éditeur |
| Tests | **Jest + Supertest** (API, base MySQL réelle) · **Vitest + RTL + MSW** (composants) · **Playwright** (5 parcours acteur) | Jamais SQLite en test |
| Hébergement | **VPS Hostinger KVM 2** (2 vCPU / 8 Go, Ubuntu 24 LTS) — **Docker Compose** : `api · worker · scheduler · web · mysql · redis · nginx` | Volumes nommés ; seul nginx publie 80/443 ; certbot sur l'hôte. **Pas de PM2** |
| CI/CD | GitHub Actions (jobs `api` / `web` / **`images`** / `e2e`) → images **ghcr.io** taguées par SHA, poussées **après** les tests | Déploiement `docker compose pull && up -d` ; rollback = tag antérieur ; `up -d --no-deps api` pour un seul composant |

### Arborescence attendue

```
api/                              # NestJS 10 — image ecoles360-api
  src/main.ts                     # setGlobalPrefix('api/v1'), ValidationPipe, Swagger
  src/app.module.ts
  src/modules/<domaine>/          # 14 modules : auth · users · etablissements · fiches ·
    <domaine>.controller.ts       #   abonnements · facturation · commissions · prospects ·
    <domaine>.service.ts          #   leads · avis · contacts · articles · cms · audit
    dto/                          #   class-validator
    guards/
  src/common/                     # guards · filters · interceptors · decorators
  src/database/seeders/           # commandes NestJS (nest-commander)
  prisma/                         # schema.prisma · migrations/
  Dockerfile                      # multi-stage → node:20-alpine, non-root, HEALTHCHECK

web/                              # React 18 + Vite — image ecoles360-web
  src/renderer/                   # racine Vike (onRenderHtml / onRenderClient), DS, Providers
  src/pages/public/               # SSR (ssr: true) — accueil, résultats, fiche, blog, à propos…
  src/pages/espace/{etablissement,secretariat,commercial}/   # SPA (ssr: false)
  src/pages/admin/                # SPA — 12 écrans (voir §5.4)
  src/api/client.ts               # apiFetch — same-origin, cookie de session, en-tête CSRF
  src/hooks/ · src/components/ · src/ds/ · src/guards/ · src/lib/
  Dockerfile                      # multi-stage → serveur SSR public + assets

docker-compose.prod.yml · .staging.yml · .dev.yml · .test.yml
deploy.sh                         # TAG=<sha> puis docker compose pull && up -d
infra/nginx/conf.d/               # /api → api:3000 · reste → web:4000
```

### Les douze services serveur

`ViewBillingService` (comptage des vues facturables, plafond mensuel) · `FacturationService` (numérotation `F2026-NNNNNN`, TVA 20 %) · `SubscriptionService` (abonnement unique, remise annuelle −10 %, expiration) · `CommissionService` (commission à la facturation, validation Direction) · `ProspectService` (pipeline commercial, transformation) · `LeadService` (scoring /10, pipeline 6 statuts) · `ReviewModerationService` (décisions + recalcul de note) · `ContactRequestService` (consentement, création du lead, notifications) · `FicheProposalService` (propositions de fiche, unicité, publication directe admin) · `ArticleWorkflowService` (brouillon → en attente → approuvé) · `AuditService` (journal immuable) · `CmsService` (FAQ, pages, purge des clés de cache Redis). Tous sont des `@Injectable()` exportés par leur module.

---

## 5. Écrans et vues

> Chaque écran est visible dans les maquettes de `design/`. Les libellés cités sont les libellés définitifs à reprendre mot pour mot.

### 5.1 Site public (`design/écoles360.dc.html`)

**Accueil.** En-tête : logo `écoles360` (le « 360 » en rouge) + navigation + bouton **Connexion** (outline) + **Inscrivez-vous** (primary, rouge). Hero navy plein cadre (`clamp(300px, 100vh − 396px, 430px)`) avec slider auto-avançant toutes les 2,5 s, indicateurs masqués. Carte de recherche flottante en surimpression (ombre `0 14px 40px`) : **pas de champ mot-clé** — grandes tuiles de type d'établissement sélectionnables (`TypePicker`, 7 types : Crèche, Primaire, Collège, Lycée, Université, École supérieure, Centre de formation), sélecteur de ville (12 villes), CTA **Rechercher** rouge. Sous le hero : établissements à la une, villes, « Comment ça marche », avis mis en avant (pilotés par l'admin), articles à la une, FAQ (pilotée par l'admin). Bouton WhatsApp flottant en bas à gauche ; bandeau fermable « Besoin d'aide pour choisir ? » en bas à droite avec numéro de téléphone.

**Résultats + filtres.** Filtres **horizontaux** en barre au-dessus des résultats sur desktop (pas de colonne latérale), empilés sur mobile. Filtres communs : ville, budget **Min–Max MAD/mois**, note. Filtres **dynamiques selon le ou les types sélectionnés** (multi-sélection possible, pour les groupes scolaires multi-cycles) :

| Type | Filtres spécifiques |
|---|---|
| Crèche | langues (ar/fr/en/es) + activités (dessin, musique, cinéma, parascolaire…) |
| Primaire | matières spécifiques (ar/fr/en/es/sport) + activités |
| Collège | langues + activités |
| Lycée | langues + activités + **filière** (sciences maths, PC…) |
| Université / École supérieure | langues + activités + filière (≠ lycée) + **cursus** (LMD / cycle ingénieur) |
| Centre de formation | langues + **type de formation** (continue, à distance, présentiel, certifiée) + domaine — **pas** d'activités |

Tri : pertinence, prix croissant, prix décroissant, mieux noté. Cartes de résultat : badges (Sponsorisé / ✓ Vérifié / Type), nom, `★ 4,8 (142 avis)` souligné et cliquable, quartier · ville, `•••` Premium, boutons **Appeler** (navy), **WhatsApp** (vert `#2E9E5B`), **Site web** (outline). Les fiches sponsorisées sortent en tête avec une **bordure gauche rouge de 4 px**.

**Fiche établissement.** Galerie photos (flèches + puces + légende) ; en-tête type + ville + nom ; encart « Établissement multi-cycles · Groupe scolaire » avec chips de cycles quand applicable. Onglets : À propos, Filières, Équipements, Tarifs, Équipe, Avis. Colonne de droite : bloc d'informations (budget, langues, localité), **COORDONNÉES**, mini-carte avec marqueur, horaires, réseaux sociaux (masqués si vides). **Pas de formulaire « Demander des informations »** — contact direct par téléphone / WhatsApp / réseaux. Sections de bas de page dans cet ordre : **Autres projets** (publicité croisée des autres commerces du propriétaire : restaurant, café, hôtel…), puis **Établissements similaires**.

**Compte parent léger.** Consultation entièrement libre. Déposer un avis exige une inscription : mini-formulaire de connexion (e-mail + mot de passe) ou d'inscription (e-mail + mot de passe + confirmation) avec le message « inscription requise pour laisser un avis ». Mot de passe oublié : e-mail ou téléphone → « un nouveau mot de passe vous a été envoyé par e-mail ». Connecté : **avatar rond** (initiale sur fond vert) dans l'en-tête → menu de type Gmail : Mes avis · Historique de recherche · Historique de contact · Modifier mon mot de passe · Contactez-nous · Déconnexion. **Aucun tableau de bord parent.**

**Inscription établissement.** Deux voies : carte navy « On s'occupe de tout par téléphone » (lien `tel:` + WhatsApp) **ou** « Remplir le formulaire » → établissement, contact + fonction, **formule souhaitée** en chips, message, consentement → état « Demande envoyée ». Les trois formules sont présentées **sans aucun prix** : ① Essai gratuit « 1 mois offert, toutes options » ② Abonnement (recommandé, navy) avec bascule Mensuel / Annuel −10 % si réglé en une fois ③ Paiement à la vue (tarif par vue défini avec le conseiller).

### 5.2 Espace établissement (`design/Espace écoles360.dc.html`)

Coquille : `SidebarNav` navy foncé (`#15233A`, largeur 248 px, `position: sticky`) + en-tête avec cloche de notifications (centre déroulant de 360 px, badge = non-lues, « Tout marquer comme lu », chaque ligne navigue vers l'écran concerné) — **pas de champ de recherche**. Le **tile de profil en pied de sidebar est cliquable** → modale **Paramètres du compte** à trois onglets : Coordonnées (nom + e-mail, confirmation du mot de passe actuel obligatoire), Mot de passe (actuel + nouveau ≥ 8 caractères + confirmation), Photo (aperçu, téléversement, retrait → retour aux initiales).

Écrans : **Tableau de bord** (« Bonjour 👋 », KPI live, actions rapides en tuiles, dernières demandes de contact, canaux de contact, derniers avis) · **Ma fiche** = page profil éditable (§5.5) · **Statistiques** · **Abonnement & facturation** (formule, vues du profil, factures en lecture seule) · **Avis** · **Blog** (activable par compte) · **CRM Leads** (§5.6).

### 5.3 Espace secrétariat

Navigation **fixe et réduite à trois entrées** : Tableau de bord · Demandes de contact · Fiches. Tableau de bord épuré : 2 KPI (demandes en attente, fiches gérées), 2 actions rapides, 2 blocs (dernières demandes, vos fiches avec badges À jour / À compléter). La secrétaire traite les leads via son établissement mais **ne voit ni bouton Supprimer ni bouton Exporter** — et l'API les lui refuse en 403 (RG23).

### 5.4 Back-office admin — ordre exact de la sidebar

Tableau de bord · Établissements · Secrétariat · Commerciaux · CRM Clients · Abonnement & facturation · Avis · Blog · Contenu du site · Statistiques · Journal d'audit · Base de données.

- **Établissements** — **une seule table** avec chips de filtre : statut (Tous / En attente / Actifs / Suspendus, avec compteurs) + type. Colonnes : Établissement, Contact, Formule, Paiement, Statut, Actions. Tri attente → actif → suspendu ; le message du client s'affiche sous les lignes en attente. Actions contextuelles : Valider (si en attente), Suspendre / Réactiver, Facturation, Voir le profil. Bouton **Valider bloqué** par une modale « Abonnement non payé » tant que la facture n'est pas encaissée. En tête d'écran : file **« Modifications de fiche à valider »**.
- **Secrétariat** — CRUD des comptes secrétariat uniquement (les rôles admin / commercial / établissement ont un **périmètre fixe**, affiché en lecture seule avec badge). Permissions unitaires par compte via `PermissionToggle`. Réinitialisation de mot de passe (lien ou mot de passe temporaire).
- **CRM Clients** — pipeline de prospection commerciale en **liste tabulaire dense** + chips d'étape avec compteurs (« Toutes les étapes (N) » + une puce colorée par étape). Six états : Nouveau › Contacté › RDV planifié › Proposition envoyée › Transformé — client · Perdu. Colonnes : nom + sous-ligne, étape, température, intérêt (barre), canal, formule, prochaine relance (rouge si programmée), commercial, flèche **Avancer** en fin de ligne. Clic sur la ligne → fiche détail.
- **Abonnement & facturation** — onglets **Tarification** / **Historique des factures** (badge d'impayés sur le second). Détail par établissement : choix de formule, tarif mensuel **ou** prix par vue + plafond, récapitulatif HT / remise / TVA / TTC, CTA générant la facture (Non payée) ou activant l'essai gratuit. Reçu HTML téléchargeable.
- **Avis** — tous les avis avec chips (tous / en attente / signalés / publiés / en avant), approuver, supprimer, **Mettre en avant** (remonte sur l'accueil).
- **Blog** — circuit Brouillon → En attente → Approuvé / Refusé, éditeur (titre, catégorie, chapeau, **contenu**, image téléversée facultative), bascule **À la une**.
- **Contenu du site** — **Catégories du blog** (chips éditables, ajout, retrait avec confirmation, et file **« Propositions à valider »** alimentée par les autres profils : Approuver / Refuser) · **FAQ** (CRUD + réordonnancement) · éditeur **À propos** (histoire, mission, 3 valeurs, coordonnées).
- **Statistiques** — filtres période (7 j / 30 j / 90 j / 12 mois) + ville + type, 6 KPI, courbe de visites, barres des recherches par ville, répartition des vues par type, classement des meilleurs établissements.
- **Journal d'audit** — seed d'événements (acteur, rôle, action, cible, horodatage, sévérité), chips de filtre par rôle. **Lecture seule stricte** : aucun contrôle d'écriture ni de suppression dans l'UI, `405` côté API.
- **Base de données** — explorateur en lecture seule, chips par table + `DataTable` dynamique.

### 5.5 Page profil éditable (partagée)

Un seul écran monté sur quatre routes : `admin/fiche-review`, `etablissement/fiche`, `secretaire/fiche`, `commercial/fiche` (lecture). Il reproduit la fiche publique et rend **tous ses blocs éditables** : identité, localisation (adresse, lat/long, **carte cliquable qui déplace le marqueur**), contact, budget, langues, cycles, textes, filières, équipements, tarifs, équipe, photos téléversées, chiffres clés (label + valeur), vidéo (URL + affiche téléversée), FAQ (ajout / édition / suppression / **réordonnancement**), horaires, réseaux sociaux, autres projets (nom, catégorie, ville, description, image, lien), facilités, libellés de gamme et de devis.

Règle d'or : **l'admin publie directement** ; **l'établissement et le secrétariat soumettent une proposition** → file admin avec calcul de diff, bandeau « Modifications en attente de validation » et bouton « Annuler la demande ». Rien n'est public avant approbation. La carte **« Badges & note »** (Sponsorisé, Vérifié, Premium, note, nombre d'avis) est **réservée à l'admin** : grisée, non cliquable et champs `disabled` pour les autres profils.

### 5.6 CRM leads (établissement — avenant n° 1)

Fiche de besoin FC-1 → FC-11, pipeline **6 statuts** : Nouveau › Contacté › Qualifié › Proposition envoyée › Inscrit/Converti · Perdu. La température (Froid / Tiède / Chaud / Très chaud) est une dimension du **scoring**, pas un statut. Score sur 10 = urgence (0–4) + adéquation budget (0–3) + complétude (0–3), calculé automatiquement et ajustable manuellement dans les bornes. Passage à *Perdu* impossible sans motif ; passage à *Inscrit* horodate la conversion et accepte un acompte. Vue liste dense + chips d'étape (même gabarit que le CRM admin). Le matching lead ↔ offre est affiché en aperçu avec un badge **« Lot 2 · V1.1 »** — hors périmètre V1.

---

## 6. Interactions et comportements

- **Animation** : sobre. `0.15s ease` sur survol et focus. Pression = descente de 1 px + légère baisse de luminosité (`filter: brightness(0.94)`). Aucun rebond, aucune boucle infinie sur du contenu. Slider du hero : avance automatique toutes les 2,5 s.
- **États actifs** : navigation publique = texte rouge + soulignement rouge de 2 px ; sidebar = pastille pleine rouge ; chip de filtre actif = fond navy inversé ; tuile de type sélectionnée = bordure navy 1,5 px.
- **Formulaires** : bouton d'envoi inactif tant que le consentement n'est pas coché (RG09) ; double soumission impossible (état `isPending` de la mutation React Query) ; les erreurs `422` du `ValidationPipe` se reprojettent champ par champ sur les `Input` du design system.
- **Erreurs d'API** → retours visibles : `401` déconnecte et redirige ; `403` affiche un toast d'erreur ; `409` affiche un toast d'avertissement portant le message serveur tel quel (`facture_non_payee`, `plafond_vue_atteint`, `reponse_existante`, `proposition_deja_en_attente`, `abonnement_deja_actif`) ; `429` affiche un toast neutre.
- **États d'interface** : `Skeleton` au premier chargement, `EmptyState` avec action quand il n'y a rien, `ProfileUnavailable` quand la fiche n'a pas de formule active (RG13).
- **Responsive** : produit **mobile first**. Points de rupture utilisés dans les maquettes : 1200 / 980 / 860 / 640 / 560 / 400 px. Sur mobile, les kanbans passent en une colonne, les grilles de formulaire en une colonne, la coquille du back-office repasse en défilement de document. Cibles tactiles **≥ 44 px** partout.
- **Invalidations de cache** (doubles : clé Query côté client + clé Redis côté API) : traiter une demande rafraîchit compteurs et KPI ; marquer une facture payée débloque Valider / Réactiver ; approuver une proposition de fiche purge `fiche:{slug}` (le rendu SSR suivant sert la mise à jour) ; approuver un article purge `articles:public` ; écrire dans le CMS purge `faq:public` et `pages:a-propos`.

---

## 7. État applicatif

**Session (Passport + `express-session` sur Redis)** : rôle unique par compte parmi `superadmin`, `secretariat`, `commercial`, `etablissement` — plus le compte parent léger, distinct. `POST /auth/login` ouvre la session, `GET /auth/me` la résout au démarrage et alimente un `SessionProvider` React ; redirection par rôle après connexion. Portées de la secrétaire portées par la session et **vérifiées à chaque requête par le `ScopesGuard`** (le garde front n'est qu'un confort d'affichage). Sessions **révocables** (suspension de compte, réinitialisation de mot de passe — RG25).

**Serveur (source de vérité)** : établissements et fiches, propositions de fiche, abonnements et paiements à la vue, factures et commissions, sponsorings, prospects et relances, leads et suivis, avis, demandes de contact, articles, FAQ et pages CMS, journal d'audit, utilisateurs et permissions.

**Client (éphémère)** : filtres et tri courants, onglet actif, ouverture des modales, brouillon de formulaire, panneau de notifications, chips d'étape sélectionnées.

**Récupération de données** : une seule voie — `apiFetch` (`src/api/client.ts`) vers `/api/v1/*`, *same-origin* avec le cookie de session et l'en-tête CSRF ; en SSR le serveur de rendu appelle l'API sur le réseau interne Docker (`http://api:3000/api/v1`) et déshydrate le cache Query dans le HTML. Mutations via `useMutation` + invalidations explicites. Pas de Server Actions, pas d'Axios, pas de jeton en `localStorage`.

---

## 8. Jetons de design

Tous disponibles en variables CSS dans `design/_ds/tokens/`. Valeurs de référence :

**Couleurs — règle 60-30-10.** Blanc dominant (~60 %) ; navy `#1D3557` et sidebar `#15233A` pour la structure (~30 %) ; rouge `#E63946` **uniquement** en accent — CTA, navigation active, liens clés (~10 %). Jamais de rouge sur un second élément non actionnable d'un même groupe.

| Rôle | Valeur |
|---|---|
| Navy / structure | `#1D3557` — sidebar `#15233A` |
| Rouge accent | `#E63946` |
| Vert (WhatsApp, succès) | `#2E9E5B` |
| Ambre (étoiles, alertes) | `#E9A23B` |
| Teintes douces | rouge `#FDE8EA` · navy `#E7EDF5` · vert `#E6F4EC` · ambre `#FCF1DE` |
| Texte | `#1A1A1A` · corps `#2A313B` · atténué `#5A6472` · faible `#9AA3AF` |
| Bordures | filet `#ECEEF1` · contrôles `#E1E5EA` · forte `#D4DAE2` · avis signalé `#F3C9CD` |
| Fonds | application `#F5F6F8` · creux `#F1F3F6` · placeholder d'image `#E3E7EC` |

**Typographie.** Inter, graisses 400 à 800. Titres lourds (800) avec interlettrage négatif (−0,5 à −1,2 px). Échelle : hero 40 · display 28 · h1 24 · h2 18 · corps 14 · eyebrow 11 (majuscules, +1 px d'interlettrage). Chiffres de KPI 30–40 px en extra-gras.

**Espacements.** Base 4 px. Gouttière de section 40 px desktop / 16 px mobile. Gap de grille 18 px.

**Rayons.** Badge 6 · bouton et champ 9–10 · chip 12 · carte 14–16 · pill 20 · avatar 50 %.

**Surfaces.** Les cartes sont blanches sur un **filet de 1 px** `#ECEEF1`, **sans ombre au repos**. L'ombre est réservée aux éléments flottants : carte de recherche `0 8px 30px`, recherche du hero `0 14px 40px`. Fonds **plats uniquement** — pas de dégradé décoratif, à l'exception des voiles navy sur photo et d'un léger radial dans le panneau navy de l'abonnement.

**Casse et ton.** Casse de phrase pour les titres (« Établissements à la une »). MAJUSCULES réservées aux eyebrows courts et aux en-têtes de tableau. CTA en verbe d'abord (« Rechercher », « Contacter », « Publier la réponse »). Libellés de statut courts : Sponsorisé, ✓ Vérifié, Nouveau, En cours, Traité, Payée, En attente, Actif, Suspendu.

**Iconographie.** Le composant `Icon` du design system est la **source unique** (jeu de tracés SVG de type Lucide, 24 × 24, trait 2 px, bouts arrondis, couleur via `currentColor`). Correspondance des types : Crèche → `baby`, Primaire → `pencil`, Collège → `book-open`, Lycée → `graduation-cap`, Université → `building`, Formation → `briefcase`. WhatsApp → `message-circle` en vert de marque. Étoiles de notation → `star` plein en ambre. **Le seul emoji autorisé** est la main qui salue des accueils de tableau de bord (« Bonjour Sara 👋 »).

---

## 9. Règles de gestion (RG01–RG27)

Toute affirmation fonctionnelle du produit est traçable à l'une de ces règles. Elles sont détaillées dans `specs/Livrable 9` (cahier des charges complet) et couvertes par les tests de `specs/Livrable 13`.

| RG | Règle |
|---|---|
| RG01 | Un établissement appartient à une seule ville (12 villes au lancement) |
| RG02 | Type unique par établissement parmi les types référencés |
| RG03 | Statuts de fiche ; **seules les fiches validées sont publiques** |
| RG04 | Rôle unique par compte |
| RG05 | Portées déléguées des secrétaires, révocables à tout moment |
| RG06 | Un avis est créé *en attente*, jamais publié directement ; note 1–5 |
| RG07 | Une seule réponse par avis ; un signalement le renvoie en file de modération |
| RG08 | `note_moy` et `nb_avis` recalculés à chaque décision, dans la même transaction |
| RG09 | Une demande cible un établissement ; **consentement obligatoire** ; notifie l'établissement et le secrétariat |
| RG10 | Interactions tracées : appel, WhatsApp, vue, vue sponsorisée |
| RG11 | Un seul abonnement actif ; remise −10 % si l'année est réglée en une fois |
| RG12 | Paiement à la vue : comptage **plafonné par mois**, jamais dépassé |
| RG13 | Essai gratuit d'un mois toutes options ; sans souscription à l'échéance → retour à la fiche de base |
| RG14 | **Aucun tarif public** ; facture `F2026-NNNNNN`, TVA 20 % ; **validation bloquée si la facture n'est pas payée** |
| RG15 | Journal d'audit des actions sensibles |
| RG16 | Photos par fiche sous quota d'offre |
| RG17 | Prospect suivi en pipeline, affecté à un commercial, relances historisées |
| RG18 | Commission calculée à la facturation, réglée **seulement** après validation Direction |
| RG19 | Sponsoring à 3 niveaux ; rotation équitable à niveau égal |
| RG20 | Toute modification de fiche par un secrétaire ou un établissement passe en **validation Super Admin** |
| RG21 | Lead + fiche de besoin FC-1 → FC-11 ; pipeline 6 statuts ; relances et historique horodatés |
| RG22 | Score sur 10 automatique (urgence 0–4 + budget 0–3 + complétude 0–3), ajustable, borné |
| RG23 | Les données de leads appartiennent à l'établissement (**loi 09-08**) ; suppression et export réservés à l'Admin Client ; le Super Admin n'accède qu'aux agrégats |
| RG24 | Compte parent léger : inscription e-mail + mot de passe requise pour déposer un avis ; historiques de recherche et de contact ; **pas de tableau de bord parent** |
| RG25 | Console d'administration : rôles nommés, permissions unitaires, réinitialisation de mot de passe, périmètre fixe des rôles autres que secrétariat |
| RG26 | Journal d'audit **immuable** ; rôle de l'acteur figé à l'écriture ; sévérité info / avertissement / erreur ; purge à 3 ans |
| RG27 | CMS : blog (brouillon → en attente → approuvé), avis (mise en avant), FAQ réordonnable, page À propos, page profil, badges de plateforme |

**Invariants à protéger par verrou de base** (transaction + `SELECT … FOR UPDATE`) : comptage des vues (RG12), numérotation des factures (RG14), unicité de la proposition de fiche en attente (RG27). Ces trois cas ont des tests de concurrence dédiés, exécutés avec **deux clients Prisma distincts** — un rollback masquerait le comportement du verrou.

---

## 10. Ressources

- **Logo** : `design/_ds/assets/logo.png` (fond clair) et `logo-on-dark.png` (mot-symbole blanc, « 360 » rouge, pour les surfaces navy).
- **Police** : Inter 400–800, chargée par `design/_ds/tokens/fonts.css`.
- **Icônes** : aucune dépendance externe — tracés inlinés dans le composant `Icon`.
- **Photos** : les maquettes utilisent des placeholders (`picsum.photos`, identifiants Unsplash). Les vraies photos sont téléversées par les établissements sous quota d'offre (RG16) ; l'implémentation doit retirer les EXIF (`sharp`) et contrôler type MIME et poids.
- **Cartographie** : tuiles OpenStreetMap via Leaflet — attribution obligatoire.

---

## 11. Contenu du package

```
design_handoff_ecoles360/
  README.md                                   ← ce document
  design/
    écoles360.dc.html                         ← maquette du site public
    Espace écoles360.dc.html                  ← maquette des 4 back-offices (connexion incluse)
    support.js                                ← runtime de maquettage (NE PAS porter)
    _ds/                                      ← design system compilé
      _ds_bundle.js, styles.css, readme.md, SKILL.md
      tokens/{colors,typography,spacing,radius,shadows,motion,fonts,breakpoints}.css
  specs/
    Livrable 7  — Architecture technique       ← stack, topologie, choix techniques
    Livrable 8  — Merise (MCD / MLD / MPD)     ← modèle de données conceptuel → physique
    Livrable 9  — Cahier des charges complet   ← exigences, RG01–RG27, critères d'acceptation
    Livrable 10 — Base de données              ← schema.prisma, migrations, seeders, exploitation
    Livrable 11 — Back-end API                 ← endpoints /api/v1, modules, services, Guards, BullMQ, Swagger
    Livrable 12 — Front-end React              ← routes Vike, SSR public / SPA back-offices, React Query
    Livrable 13 — Stratégie de tests           ← Jest+Supertest / RTL+MSW / Playwright, matrice RG↔tests
    Livrable 14 — Déploiement CI-CD            ← Docker Compose, ghcr.io, Hostinger KVM, GitHub Actions, PRA
    Livrable 15 — Recette                      ← 5 scénarios acteur, réserves, procès-verbal
    Livrable 16 — Documentation & maintenance   ← runbook docker compose, plan de maintenance
    Avenant 1   — Extension CRM                ← leads, scoring, pipeline, loi 09-08
```

**Ouvrir les maquettes** : servir le dossier `design/` par HTTP (`npx serve design`) puis ouvrir les deux `.dc.html` — l'ouverture en `file://` empêche le chargement du design system. Les fichiers de `specs/` sont autonomes : un double-clic suffit.

## 12. Comptes de démonstration des maquettes

L'écran de connexion de `Espace écoles360.dc.html` propose quatre profils cliquables, sans mot de passe : **Direction (admin)** `direction@ecoles360.com` · **Secrétariat** `sara.s@ecoles360.com` · **Établissement** `contact@almassira.ma` · **Commercial**. Les mêmes comptes sont seedés côté serveur (mots de passe injectés par variables d'environnement `SEED_*_PASSWORD`, jamais en clair) et servent aux parcours Playwright.

## 13. Ordre d'implémentation suggéré

1. **Socle** — monorepo `api/` (NestJS 10) + `web/` (React 18 + Vite), TypeScript strict, Prisma sur MySQL 8, Passport + `express-session`/`connect-redis`, Redis + BullMQ, `docker-compose.dev.yml`, design system monté et jetons câblés.
2. **Données** — `schema.prisma` du livrable 10, migrations, seeders exposés en commandes NestJS (référentiels, comptes de démonstration, jeu de démonstration).
3. **Site public** — accueil, recherche et filtres dynamiques, fiche établissement (RG01–RG03, RG10, RG19). C'est la surface la plus exposée et la seule à contrainte SEO.
4. **Espace établissement** — tableau de bord, page profil éditable et circuit de proposition (RG20), avis (RG06–RG08), abonnement en lecture (RG11–RG14).
5. **Back-office admin** — établissements et validation, facturation et sponsoring (RG14, RG18, RG19), modération, validation des fiches.
6. **Console d'administration & CMS** — utilisateurs et permissions (RG25), journal d'audit immuable (RG26), blog et contenu du site (RG27).
7. **CRM** — prospects commerciaux (RG17, RG18) puis leads établissement et scoring (RG21–RG23).
8. **Secrétariat** — portées déléguées et cloisonnement (RG05, RG23), à faire après le CRM puisqu'il en est le miroir restreint.
9. **Compte parent léger** (RG24) et **déploiement** (livrable 14) en clôture.

À chaque étape, écrire les tests de la strate correspondante de la pyramide du livrable 13 — les trois cas de concurrence (§9) ne doivent pas être reportés en fin de projet.
