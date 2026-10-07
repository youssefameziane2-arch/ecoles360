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

> **PÉRIMÈTRE ÉLARGI LE 6 OCTOBRE 2026.** Le client demande désormais de
> terminer le projet **complet** — tous les rôles, tous les écrans, les
> migrations comprises. La section ci-dessous décrit le périmètre réduit de la
> première mise en ligne ; elle reste valable comme ordre de priorité, pas
> comme limite.
>
> Ordre des lots : **facturation** (fait côté API et back-office) → **CRM** →
> **secrétariat** (B-44) → **`worker`/`scheduler`** (purges loi 09-08) →
> finitions.

## Périmètre de la première mise en ligne — décision client du 30 septembre 2026

Le site ouvre en **vitrine** : **site public + l'administration qui l'alimente**,
rien d'autre. Les autres rôles se construisent ensuite et se greffent sur un
site déjà en service.

**Gratuit à l'ouverture.** Aucun paiement, et **pas de facturation non plus
pour le moment** — la facturation se fera sur le site, plus tard, jamais le
paiement. Rien n'est à construire pour cela : la RG13 prévoit déjà l'essai
gratuit, qui lève la condition d'abonnement de la RG14. Le chemin complet
existe et il est éprouvé : créer la fiche → activer l'essai gratuit → valider →
elle est publique.

**Catalogue rempli à la main** après mise en ligne, depuis l'écran
« Établissements ». L'import open data du MEN (B-18) reste en attente d'un
fichier, et n'est pas sur le chemin de l'ouverture.

| Dans le périmètre | Hors périmètre, jusqu'à nouvel ordre |
|---|---|
| Les 13 écrans du site public | CRM Clients · Commerciaux |
| Établissements · Propositions · Avis · Blog · Article · Contenu du site · Journal d'audit · Sponsoring | Abonnement & facturation · Facture (détail) |
| Tableau de bord · Statistiques (partiels, lisibles) | Secrétariat (B-44) · Base de données |
| | Les 6 écrans de l'espace commercial |

---

## Site public — 13 écrans attendus, 9 complets

**Un écran présent n'est pas un écran fait.** Le détail bloc par bloc est en fin
de document : il compte ce qu'il y a DANS chaque écran, pas les écrans.

| Écran | Route | État |
|---|---|---|
| Accueil | `/` | ✅ |
| Résultats de recherche | `/etablissements` | ✅ carte Leaflet comprise — reste la seule bascule « sponsorisé », qu'aucun paramètre d'API ne sait filtrer |
| Fiche établissement | `/etablissements/:slug` | ✅ onglet Équipe compris — édité depuis l'espace, via la file de propositions (RG20) |
| Page ville | `/villes/:slug` | ✅ quartiers populaires compris |
| À propos | `/a-propos` | 🟡 servie par le CMS (`a-propos`), équipe, bloc contact et bande de chiffres compris — manquent l'image de l'histoire, la carte et les réseaux sociaux, qui n'ont aucune source |
| FAQ | `/faq` | ✅ |
| Blog | `/blog` | ✅ |
| Article | `/blog/:slug` | ✅ |
| Inscription établissement | `/inscription-etablissement` | 🟡 formules de visibilité, trois étapes et formulaire en 2 étapes compris, le prospect arrive dans le CRM — manquent les témoignages de directeurs et la FAQ qui leur est destinée, qui n'ont pas de source |
| Connexion | `/connexion` | ✅ écart assumé : formulaire unique au lieu des 2 étapes |
| Mentions légales | `/mentions-legales` | 🟡 8 rubriques rédigées et semées — restent 3 `[À COMPLÉTER]` : raison sociale, RC/ICE, directeur de publication, hébergeur |
| Confidentialité | `/confidentialite` | 🟡 11 rubriques rédigées — restent 2 `[À COMPLÉTER]`, dont le **numéro de déclaration CNDP**, qui suppose une démarche et non une saisie |
| Cookies | `/cookies` | ✅ 6 rubriques, rien à compléter — le site ne pose que deux cookies, et seulement si l'on se connecte |

**LES TROIS PAGES EXISTENT, ONT LEUR ROUTE ET LEUR LIEN AU PIED DE PAGE.** Leur
texte est rédigé et posé par le semis, donc présent sur une base neuve.

**Ce n'est pas un texte validé pour autant** : c'est une base à faire relire par
un juriste, et l'écran « Contenu du site » signale une page tant qu'il y reste un
marqueur `[À COMPLÉTER]`. Le semis ne réécrit jamais une page déjà rédigée — le
texte relu ne sera pas écrasé par un `db:seed` de routine.

**Absent de la maquette elle-même** : l'écran de contact (`goContact` est
appelé mais jamais dessiné).

---

## Administration — 15 écrans attendus, 10 complets

| Écran | Clé maquette | Route | État |
|---|---|---|---|
| Établissements | `isAdminEtab` | `/admin/etablissements` | ✅ création, galerie, essai gratuit (RG13), validation, **masquage** et **suspension**. Le client a tranché le 7 octobre 2026 ce qui sépare les deux (B-47) : `masquee` = fiche en cours de mise à jour, `suspendue` = retrait jusqu'à réactivation. Ni l'une ni l'autre n'est publique — 404, jamais 403 (RG03) — et revenir en ligne repasse par le contrôle d'abonnement (RG14) |
| Page profil (relecture) | `isAdminPend` | `/admin/propositions` | ✅ |
| Avis — modération | `isAdminAvisAll` | `/admin/avis` | ✅ |
| Blog | `isBlogList` | `/admin/blog` | ✅ |
| Article (éditeur) | `isBlogDetail` | `/admin/blog` | ✅ |
| Journal d'audit | `isAdminJournal` | `/admin/journal` | ✅ |
| Contenu du site | `isAdminContent` | `/admin/contenu` | ✅ FAQ, page « À propos », les **trois pages légales** et les **catégories d'articles** (onglets). Les *demandes* de catégorie de la maquette restent à définir : qui demande, ce qui se passe au refus, et si le demandeur est prévenu (B-50) |
| Tableau de bord | `isAdminDash` | `/admin` | 🟡 activité, à traiter, visites (30 j), top établissements — manquent le pipeline CRM (B-38), les encaissements (B-39) et la tuile « Recherches » (B-40) |
| CRM Clients | `isAdminCrm` | `/admin/crm` | ✅ indicateurs, pipeline en 6 colonnes (RG17), relances, attribution des dossiers (RG18), **pastille des prospects jamais ouverts** dans le menu — seul signal qu'une demande du formulaire public est arrivée, faute d'envoi d'e-mail (B-46) |
| Statistiques | `isAdminStats` | `/admin/statistiques` | 🟡 filtres période / ville / type, vues de fiches, demandes, nouveaux avis, courbe, vues par type, top établissements — manquent les visites, les recherches, le taux de transformation et « Recherches par ville » (B-40) |
| Abonnement & facturation | `isAdminFact` | `/admin/facturation` | 🟡 indicateurs, historique, encaissement ✅ · ouverture d'abonnement et émission de facture depuis la fiche ✅ — manque le **détail de facture** (`isAdminFactDetail`) |
| Facture (détail) | `isAdminFactDetail` | sous la fiche, dans « Établissements » | 🟡 **formules, essai et remise sont faits** par le panneau `AbonnementEtablissement` — choix de la formule, tarif négocié, remise annuelle (RG11), émission et encaissement. Ne manque que le **reçu**, bloqué : il porte des mentions légales obligatoires (raison sociale, RC/ICE) encore `[À COMPLÉTER]` |
| Secrétariat | `isAdminUsers` | `/admin/secretariat` | ✅ **création de compte** et **réinitialisation de mot de passe** comprises, avec rattachement, portées déléguées (RG05) et suspension qui coupe les sessions (RG25). Le mot de passe est tiré au sort et affiché **une seule fois** — un lien de première connexion par courriel vaudrait mieux, mais il n'y a aucun envoi d'e-mail dans le projet (B-46) |
| Commerciaux | `isAdminCommerciaux` | `/admin/commerciaux` | ✅ **création de compte** comprise, portefeuilles, transformations, taux, relances dues, commissions. Un commercial sans téléphone n'apparaît pas sur la bannière d'aide du site, et l'écran le dit |
| Base de données | `isAdminDb` | — | ❌ explorateur lecture seule (pas dans la navigation actuelle) |

**Hors maquette, construits en plus** : Sponsoring (`/admin/sponsorings`) et
Paramètres de facturation (`/admin/parametres`) — écrans dessinés sans
référence, à la demande du client.

---

## Espace établissement — 6 / 7

| Écran | Clé maquette | Route | État |
|---|---|---|---|
| Tableau de bord | `isEtabDash` | `/espace` | ✅ |
| Ma fiche | `isEtabFiche` | `/espace/fiche` | ✅ galerie photo comprise — hors circuit de validation |
| Avis reçus | `isEtabAvis` | `/espace/avis` | ✅ |
| Blog | `isBlogList` | `/espace/blog` | ✅ |
| Article (éditeur) | `isBlogDetail` | `/espace/blog` | ✅ |
| Statistiques | `isEtabStats` | `/espace/statistiques` | 🟡 vues du mois, clics « Appeler », contacts WhatsApp (écart au mois précédent à date), vues mensuelles, origine des contacts — manque « Taux de contact », sans définition (B-42) |
| Abonnement & facturation | `isEtabCredits` | `/espace/facturation` | ✅ formule en cours, vues du mois, les trois formules avec le badge de l'état réel, factures et conseiller. **Lecture seule** — ni souscription ni paiement sur la plateforme. **Refusé au secrétariat** : la RG05 ne délègue que `fiches`, `contacts` et `avis`, et la facturation n'en est pas une |
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

## Espace commercial — 2 / 6 écrans complets

**Les six routes existent** (`/commercial/…`, thème
`commercial` de `SidebarNav`) : un commercial se connecte et arrive dans son
espace. **Quatre écrans sur six sont construits** — tableau de bord, agenda,
mes leads, transferts & commissions — et le blog avec eux. Seul « Statistiques »
reste une page d'attente, et elle attend une DÉFINITION, pas du travail : ce
qu'un commercial doit lire des chiffres d'une fiche n'est écrit nulle part.

| Écran | Clé maquette | Route | État |
|---|---|---|---|
| Tableau de bord | `isCommercialDash` | `/commercial` | 🟡 son portefeuille et ses indicateurs — la maquette y met aussi les transferts, qui ne sont pas définis |
| Agenda & tâches | `isAgenda` | `/commercial/agenda` | 🟡 relances dues, retards signalés, « c’est fait » (RG17) — manquent le calendrier et la synchronisation Google Agenda |
| Mes leads | `isCrm` | `/commercial/leads` | ✅ pipeline borné à son portefeuille par le serveur, relances comprises |
| Transferts & commissions | `isTransferts` | `/commercial/transferts` | 🟡 commissions par facture et par statut (RG18) — le **transfert de dossier** entre commerciaux n’est défini nulle part |
| Statistiques | `isEtabStats` (bloc partagé avec l'établissement) | `/commercial/statistiques` | ❌ page d'attente — la maquette y remet les chiffres d'une fiche ; ce qu'un commercial doit y lire (son portefeuille ?) n'est pas dit |
| Blog | `isBlogList` | `/commercial/blog` | ✅ écran de l'espace établissement ; articles de plateforme soumis à validation, portée limitée aux siens (B-37) |
---

## Récapitulatif

| Périmètre | Complets | Partiels | Restants |
|---|---|---|---|
| Site public (13) | 9 | 4 — dont 2 pages légales en attente de mentions, et la 3ᵉ de l'image, carte et réseaux sociaux | 0 |
| Administration (15) | 10 | 4 | 1 — l'explorateur de base |
| Établissement (7) | 6 | 1 — statistiques | 0 (+1 hors périmètre) |
| Secrétariat (5) | 5 | 0 | 0 |
| Commercial (6) | 2 | 3 | 1 — statistiques, en attente de définition |
| **Total (46)** | **32** | **12** | **2** |

Ces nombres sont **recomptés depuis les tableaux ci-dessus**, pas tenus à la
main : un écran passé de ❌ à 🟡 sans que le récapitulatif suive a déjà fait
croire à quatre reprises que le reste à faire était plus court qu'il ne l'est.

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
| Bascule « Carte » — vue cartographique | ✅ `CarteResultats` (Leaflet + OpenStreetMap), avec le bouton « Carte » de chaque résultat qui y situe la fiche. **Cette ligne disait ❌ alors que la ligne 66 disait ✅** — vérifié dans `Resultats.tsx` le 7 octobre 2026 |
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
| `detTeam` — onglet Équipe | ✅ servi par `equipe`, édité depuis l'espace via la file de propositions (RG20). **Cette ligne disait ❌ alors que la ligne 67 disait ✅ du même écran** — vérifié dans `Fiche.tsx` le 7 octobre 2026 |
| Avis : `avisDist`, `avisStarChips`, `avisSortOptions`, `avisList` | ✅ |
| Dépôt d'avis : formulaire étoiles + « Soumettre mon avis » | ✅ |
| **« Utile (n) » — vote d'utilité sur un avis** | ❌ |
| `detFaq`, `horaires`, `socialsDark`, `autresProjets` | ✅ |
| `ficheEtabArticles` / `ficheSiteArticles` — articles liés | ✅ |
| `similar` — établissements similaires | ✅ |
| **`detUnavailable` — fiche indisponible (crédits épuisés)** | ❌ |

## Page ville (`isVille`)

| Bloc | État |
|---|---|
| H1 « Écoles privées à … » | ✅ |
| « Par type d'établissement » + `vTypeCounts` | ✅ |
| « Tous les établissements à … » + `vEstabs` | ✅ |
| « Quartiers populaires » + `vQuartiers` | ✅ |
| « Explorez d'autres villes » + `otherCities` | ✅ |

## À propos (`isAbout`)

| Bloc | État |
|---|---|
| « Notre mission » + H1 | ✅ `accroche`, `mission` |
| « Notre histoire » | ✅ `histoire` — sans l'image, qui n'a pas de source |
| `trustStats` — bande de chiffres | ✅ `BandeauChiffres`, partagé avec l'accueil. Deux des quatre chiffres de la maquette sont **remplacés, pas inventés** : rien ne trace les « parents par mois » (B-40), et une note moyenne de tout le catalogue vaudrait, au démarrage, la note de la seule école notée. À leur place, le nombre de types (RG02) et la gratuité — vrais le premier jour comme le millième |
| « Ce qui nous guide / Nos valeurs » + `aboutValues` | ✅ `valeurs` |
| « Nos engagements » — hors maquette | ✅ `engagements` : le texte de l'ancienne page, relu par le client (sponsoring, avis, loi 09-08) |
| « Les visages / L'équipe écoles360 » + `teamAv` | ✅ `equipe`, rendu par `TeamMember` ; semé vide, section masquée tant que le back-office ne l'a pas remplie |
| « Parlons-en / Nous contacter » + `contactCards`, WhatsApp | ✅ `coordonnees` ; la carte WhatsApp n'apparaît que si un numéro est saisi |
| **`contactSocials` et la carte** | ❌ aucune source |
| « Vous dirigez un établissement ? » | ✅ |

Relevé en passant : les lignes ✅ « Notre histoire » et « Nos valeurs » étaient
fausses avant ce lot — l'ancienne page, écrite en dur, n'avait ni l'une ni
l'autre.

## Inscription établissement (`isInscription`)

| Bloc | État |
|---|---|
| H1 + « Commencer l'inscription » | ✅ les boutons des trois formules mènent au formulaire |
| `benefits` | ✅ sous deux cartes (« gratuitement » / « ce que l'abonnement ajoute ») |
| « Formules de visibilité » + `plans`, bascule Mensuel / Annuel −10 % | ✅ `FormulesVisibilite`, trois `PricingCard` du design system. **Sans montants — c'est la maquette qui le veut** : elle écrit « Tarif communiqué par votre conseiller ». La bascule ne calcule rien, elle annonce la remise de 10 % (RG11). Sous-titre et note rendus autour de la carte, faute de fente (CORRECTIFS.md §6) |
| `insSteps3` — les trois étapes | ✅ posées entre les formules et le formulaire, comme la maquette. Les « 48 h » sont un engagement : le même délai est promis par la réponse de `POST /inscriptions`, et les deux doivent changer ensemble |
| « On s'occupe de tout par téléphone » / « Vous préférez écrire ? » | 🟡 un bloc « Comment s'inscrire » donne les deux canaux, sans les deux titres de la maquette |
| Formulaire en 2 étapes + « Demande envoyée ! » | ✅ `FormulaireInscription` sur `POST /inscriptions`, route publique d'un module à part — jamais une exception au milieu de `CrmController`, qui est entièrement derrière la session. Le prospect naît « nouveau », sans commercial (RG17) et sans fiche. Consentement 09-08 obligatoire, trois demandes par heure, et le 429 est dit en français. Vérifié de bout en bout : formulaire rempli dans le navigateur, prospect relu en base |
| `insTestimonials` — « La parole aux directeurs » | ❌ aucune source ; les témoignages de la maquette sont fictifs |
| `insFaqItems` — questions fréquentes | ❌ la FAQ du CMS est celle des parents ; celle-ci s'adresse aux directeurs |

---

**Le contenu prime sur le compte d'écrans.** Un écran présent mais amputé de la
moitié de ses blocs compte comme partiel, pas comme fait.
