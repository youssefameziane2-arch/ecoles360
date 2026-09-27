# Inventaire de la maquette — état d'avancement

> **Ce relevé se périme.** Trois lignes marquées ❌ décrivaient des sections
> construites depuis. Une session cloud est partie les écrire, a vérifié le
> code avant d'attaquer, et ne les a pas trouvées manquantes — le temps perdu
> est celui de la vérification. **Mettre ce fichier à jour fait partie du
> travail qu'il décrit**, et en cas de doute c'est le code qui fait foi, pas
> ce tableau.

Relevé **automatiquement** depuis les deux fichiers de maquette livrés
(`handoff/écoles360.dc.html` pour le site public, `handoff/Espace écoles360.dc.html` pour les
espaces connectés), puis rapproché à la main du code existant.

Ce document existe parce que le périmètre a été sous-estimé deux fois. Il est la
référence : **aucun écran ne doit être considéré comme fait s'il n'est pas coché
ici.**

Légende : ✅ fait · 🟡 partiel · ❌ à faire · ⛔ hors périmètre (décision client)

---

## Site public — 10 écrans présents, 6 incomplets

**Un écran présent n'est pas un écran fait.** Le détail bloc par bloc est en fin
de document : il compte ce qu'il y a DANS chaque écran, pas les écrans.

| Écran | Route | État |
|---|---|---|
| Accueil | `/` | ✅ |
| Résultats de recherche | `/etablissements` | 🟡 filtres dynamiques et vue carte manquants |
| Fiche établissement | `/etablissements/:slug` | 🟡 équipe, articles liés, similaires manquants |
| Page ville | `/villes/:slug` | 🟡 quartiers populaires manquants |
| À propos | `/a-propos` | 🟡 équipe et bloc contact manquants |
| FAQ | `/faq` | ✅ |
| Blog | `/blog` | ✅ |
| Article | `/blog/:slug` | ✅ |
| Inscription établissement | `/inscription-etablissement` | 🟡 formules de visibilité manquantes |
| Connexion | `/connexion` | ✅ écart assumé : formulaire unique au lieu des 2 étapes |

**Absents de la maquette elle-même** : l'écran de contact (`goContact` est
appelé mais jamais dessiné) et les pages légales (mentions, confidentialité,
cookies, CGU — liens présents, contenu absent). Le texte légal relève du client.

---

## Administration — 6 / 14

| Écran | Clé maquette | Route | État |
|---|---|---|---|
| Établissements | `isAdminEtab` | `/admin/etablissements` | ✅ création de fiche et galerie photo comprises |
| Page profil (relecture) | `isAdminPend` | `/admin/propositions` | ✅ |
| Avis — modération | `isAdminAvisAll` | `/admin/avis` | ✅ |
| Blog | `isBlogList` | `/admin/blog` | ✅ |
| Article (éditeur) | `isBlogDetail` | `/admin/blog` | ✅ |
| Journal d'audit | `isAdminJournal` | `/admin/journal` | ✅ |
| Contenu du site | `isAdminContent` | `/admin/contenu` | 🟡 FAQ seule — manquent les catégories d'articles et la page « À propos » |
| Tableau de bord | `isAdminDash` | `/admin` | 🟡 activité, à traiter, visites (30 j), top établissements — manquent le pipeline CRM (B-38), les encaissements (B-39) et la tuile « Recherches » (B-40) |
| CRM Clients | `isAdminCrm` | `/admin/crm` | ❌ KPI, prospects, dossiers, étapes |
| Statistiques | `isAdminStats` | `/admin/statistiques` | ❌ périodes, filtres ville/type, KPI, courbe, top |
| Abonnement & facturation | `isAdminFact` | `/admin/facturation` | ❌ KPI, tarifs, historique, encaissement |
| Facture (détail) | `isAdminFactDetail` | — | ❌ formules, essai, remise, reçu |
| Secrétariat | `isAdminUsers` | `/admin/secretariat` | ❌ comptes, portées déléguées, réinit. mot de passe |
| Commerciaux | `isAdminCommerciaux` | `/admin/commerciaux` | ❌ |
| Base de données | `isAdminDb` | — | ❌ explorateur lecture seule (pas dans la navigation actuelle) |

**Hors maquette, construits en plus** : Sponsoring (`/admin/sponsorings`) et
Paramètres de facturation (`/admin/parametres`) — écrans dessinés sans
référence, à la demande du client.

---

## Espace établissement — 5 / 7

| Écran | Clé maquette | Route | État |
|---|---|---|---|
| Tableau de bord | `isEtabDash` | `/espace` | ✅ |
| Ma fiche | `isEtabFiche` | `/espace/fiche` | ✅ galerie photo comprise — hors circuit de validation |
| Avis reçus | `isEtabAvis` | `/espace/avis` | ✅ |
| Blog | `isBlogList` | `/espace/blog` | ✅ |
| Article (éditeur) | `isBlogDetail` | `/espace/blog` | ✅ |
| Statistiques | `isEtabStats` | `/espace/statistiques` | ❌ |
| Abonnement & facturation | `isEtabCredits` | `/espace/facturation` | ❌ formules, factures, conseiller |
| CRM Leads | `isCrm` | — | ⛔ hors périmètre |

**Hors maquette, construit en plus** : Demandes de contact (`/espace/demandes`).
La navigation de la maquette ne le donne qu'au secrétariat, mais un
établissement doit accéder à ses propres demandes — le retirer serait une
régression.

---

## Espace secrétariat — 5 / 5 ✅

Servi par **les mêmes écrans que l'établissement**, filtrés par portée déléguée
(RG05) — pas de duplication de code.

| Écran | État |
|---|---|
| Tableau de bord | ✅ |
| Fiches | ✅ |
| Page profil | ✅ |
| Demandes de contact | ✅ |
| Modération des avis | ✅ |
| CRM Leads | ⛔ hors périmètre |

---

## Espace commercial — coquille en place, 1 / 6 écrans

**La navigation et les six routes existent** (`/commercial/…`, thème
`commercial` de `SidebarNav`) : un commercial se connecte et arrive dans son
espace. Le blog est construit ; les cinq autres entrées mènent à une page
d'attente qui nomme ce qu'elle contiendra — le CRM n'expose encore aucune
route à ce rôle.

| Écran | Clé maquette | Route | État |
|---|---|---|---|
| Tableau de bord | `isCommercialDash` | `/commercial` | ❌ page d'attente — tâches du jour, intérêts, transferts, commission |
| Agenda & tâches | `isAgenda` | `/commercial/agenda` | ❌ page d'attente — calendrier, tâches, retards, Google Agenda |
| Mes leads | `isCrm` | `/commercial/leads` | ❌ page d'attente — pipeline, température, relances |
| Transferts & commissions | `isTransferts` | `/commercial/transferts` | ❌ page d'attente — CA généré, ventes, dossiers transférés |
| Statistiques | `stats` (pas de bloc propre) | `/commercial/statistiques` | ❌ page d'attente |
| Blog | `isBlogList` | `/commercial/blog` | ✅ écran de l'espace établissement ; articles de plateforme soumis à validation, portée limitée aux siens (B-37) |
---

## Récapitulatif

| Périmètre | Fait | Reste |
|---|---|---|
| Site public | 10 écrans, 4 complets | 6 écrans à compléter |
| Administration | 6 | 7 + 2 partiels |
| Établissement | 5 | 2 |
| Secrétariat | 5 | 0 |
| Commercial | 1 (coquille et navigation en place) | 5 |
| **Total** | **27** | **14 + 2 partiels** |

---

## Comment ce relevé a été produit

```bash
node inventaire.mjs "handoff/Espace écoles360.dc.html"
```

Le script suit les blocs `<sc-if value="{{ isXxx }}">` en tenant compte de leur
imbrication, puis extrait pour chacun : composants du design system utilisés,
listes répétées (`sc-for`), champs de saisie, libellés de boutons et états
internes. À relancer après toute nouvelle livraison de maquette.

---

# Détail par écran — site public

Relevé section par section avec `docs/sections.mjs`, qui sort le plan d'un écran
dans l'ordre : titres, surtitres, listes répétées et boutons.

```bash
node docs/sections.mjs "docs/handoff/écoles360.dc.html" isHome
```

## Accueil (`isHome`) — 14 / 14 blocs

| # | Bloc de la maquette | État |
|---|---|---|
| 1 | Héros + `heroSlides` (carrousel de photos) | ✅ 7 diapositives, une par type, défilement 5 s |
| 2 | Carte de recherche : `typeCards`, `villeSuggest`, « Rechercher » | ✅ |
| 3 | « Recherche avancée » : `noteOptions`, `sortOptions`, `homeDynGroups` | ✅ options réduites à ce que l'API accepte (B-34) |
| 4 | `trustStats` — bandeau navy de chiffres | ✅ |
| 5 | « Notre sélection / Établissements à la une » + `featured` | ✅ |
| 6 | « Ce que nous faisons / Choisir une école, enfin simple » + `whatWeDo` | ✅ |
| 7 | « Explorez / Les établissements par ville » + `cityGrid` | ✅ |
| 8 | « Témoignages / Ils nous font confiance » + `reviewDots` | ✅ |
| 9 | « Simple et rapide / Comment ça marche » + `howSteps` | ✅ |
| 10 | « Ce que disent les parents » + `homeReviews` | ✅ |
| 11 | « Le blog / Conseils pour les parents » + `homeBlog` | ✅ article à la une en tête, puis les plus récents |
| 12 | « Questions fréquentes / Vous vous demandez peut-être… » | ✅ |
| 13 | « Besoin d'aide pour choisir ? » — téléphone + « Nous écrire » | ✅ même conseiller que la bannière ; sans conseiller en base, pas de bouton téléphone (B-35) |
| 14 | « Vous dirigez un établissement ? » + « Inscrire mon établissement » | ✅ |

## Résultats (`isResults`)

| Bloc | État |
|---|---|
| Barre de filtres `typeFilters`, `villeOptions2`, `sortOptions` | ✅ |
| **`dynGroups` / `g.chips` — filtres dynamiques par type** | ❌ |
| Compteur « N établissements » | ✅ |
| `skeletons` pendant le chargement | ✅ |
| `results` — cartes du design system | ✅ |
| **Bascule « Carte »** — vue cartographique | ❌ |
| Pagination `pages` | ✅ |
| `emptyState` + « Réinitialiser les filtres » | ✅ |

## Fiche établissement (`isDetail`)

L'écran le plus dense de la maquette : **22 listes**. Onglets À propos ·
Filières · Équipements · Tarifs · Équipe · Avis.

| Bloc | État |
|---|---|
| Galerie `gallery`, badges, spécifications | ✅ |
| Onglets `Tabs`, `detCycles`, `detChiffres`, `det_filieres` | ✅ |
| `equipementsFiche`, `detTarifs`, `detFacilites` | ✅ |
| **`detTeam` — onglet Équipe** | ❌ |
| Avis : `avisDist`, `avisStarChips`, `avisSortOptions`, `avisList` | ✅ |
| Dépôt d'avis : formulaire étoiles + « Soumettre mon avis » | ✅ |
| **« Utile (n) » — vote d'utilité sur un avis** | ❌ |
| `detFaq`, `horaires`, `socialsDark`, `autresProjets` | ✅ |
| **`ficheEtabArticles` / `ficheSiteArticles` — articles liés** | ❌ |
| **`similar` — établissements similaires** | ❌ |
| **`detUnavailable` — fiche indisponible (crédits épuisés)** | ❌ |

## Page ville (`isVille`)

| Bloc | État |
|---|---|
| H1 « Écoles privées à … » | ✅ |
| « Par type d'établissement » + `vTypeCounts` | ✅ |
| « Tous les établissements à … » + `vEstabs` | ✅ |
| **« Quartiers populaires » + `vQuartiers`** | ❌ |
| « Explorez d'autres villes » + `otherCities` | ✅ |

## À propos (`isAbout`)

| Bloc | État |
|---|---|
| « Notre mission » + H1 | ✅ |
| « Notre histoire » + `trustStats` | ✅ |
| « Ce qui nous guide / Nos valeurs » + `aboutValues` | ✅ |
| **« Les visages / L'équipe écoles360 » + `teamAv`** | ❌ |
| **« Parlons-en / Nous contacter » + `contactCards`, WhatsApp, `contactSocials`** | ❌ |
| « Vous dirigez un établissement ? » | ✅ |

## Inscription établissement (`isInscription`)

| Bloc | État |
|---|---|
| H1 + « Commencer l'inscription » | ✅ |
| `benefits` | ✅ |
| **« Formules de visibilité » + `plans`, bascule Mensuel / Annuel −10 %** | ❌ |
| `insSteps3` — les trois étapes | ✅ |
| « On s'occupe de tout par téléphone » / « Vous préférez écrire ? » | 🟡 |
| Formulaire en 2 étapes + « Demande envoyée ! » | ✅ |

---

**Le contenu prime sur le compte d'écrans.** Un écran présent mais amputé de la
moitié de ses blocs compte comme partiel, pas comme fait.
