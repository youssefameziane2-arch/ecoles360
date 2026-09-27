# Correctifs locaux du design system

Le design system écoles360 est livré **compilé** : `web/public/ds/bundle.js` est
une IIFE qui accroche ses 44 composants à `window.Coles360DesignSystem_66e6db`.
Il n'expose **aucun `export`** et les sources `.jsx` ne sont pas fournies.

Conséquence : un défaut ne peut être corrigé que dans l'artefact lui-même, et
**toute nouvelle livraison du bundle écrase les corrections**.

## Les deux copies du bundle

| Fichier | Rôle |
|---|---|
| `docs/design-system/_ds_bundle.js` | **copie d'origine**, telle que livrée — ne jamais corriger ici |
| `web/public/ds/bundle.js` | **copie servie** au navigateur (`/ds/bundle.js`) — c'est elle qui porte les correctifs |

Garder l'original intact permet de savoir ce qui vient de l'auteur et ce qui
vient de nous, et de refaire un `diff` à tout moment :

```bash
diff docs/design-system/_ds_bundle.js web/public/ds/bundle.js
```

## Procédure après une nouvelle livraison

1. remplacer **les deux** copies par le nouveau bundle ;
2. relancer le script :

```bash
node docs/design-system/appliquer-correctifs.mjs
```

Le script est idempotent. Il signale en erreur tout correctif dont le motif a
disparu — c'est le cas à surveiller : il veut dire que le composant a changé de
forme et que la correction doit être réécrite, pas qu'elle est devenue inutile.

## Correctifs en place

### 1. `CityCard` — propriété `label`

**Défaut.** Le suffixe est figé dans le composant :

```js
count, " établissements"
```

La carte ne sert donc qu'aux villes. La maquette de la page ville l'emploie
pourtant aussi pour les quartiers.

**Correction.** Une propriété `label` facultative, sans effet quand elle est
absente :

```js
label != null ? " " + label : …
```

### 2. `CityCard` — pluriel du compteur

**Défaut.** Le pluriel est systématique : une ville qui compte une seule fiche
affiche « 1 établissements ». Visible sur l'accueil et sur la page ville,
c'est-à-dire les deux écrans les plus consultés d'un annuaire jeune, où
beaucoup de villes n'ont qu'une fiche.

**Correction.**

```js
count > 1 ? " établissements" : " établissement"
```

Le seuil est `> 1` et non `>= 1` : « 0 établissement » est la forme correcte
en français, le pluriel ne commençant qu'à deux.

> **Les deux corrections tiennent en une seule substitution.** Les enchaîner en
> deux passes rendait le script non rejouable : la seconde effaçait le motif que
> la première cherchait, et une relecture signalait à tort un correctif perdu.

## À demander à l'auteur du design system

Ces corrections devraient remonter à la source plutôt que vivre ici :

1. **Les deux correctifs `CityCard` ci-dessus**, pour qu'ils cessent de vivre
   dans notre copie du bundle.
2. **Les sources `.jsx`**, tout simplement. Un bundle exécuté dans un bac à
   sable pour le rendu serveur fonctionne, mais un `import` propre vaut mieux.
3. **Réaligner les sources sur le bundle livré — `SidebarNav` d'abord.** Les
   sources versées dans `.claude/skills/ecoles360-design/` ne sont pas celles
   du bundle que l'application charge (`web/public/ds/bundle.js`, et sa copie
   `_ds_bundle.js` : les deux portent le thème). Écart constaté sur `SidebarNav` : le bundle connaît le
   thème `commercial` (sur-titre « Espace commercial »), que
   `SidebarNav.jsx` et `SidebarNav.d.ts` ignorent — ils n'en listent que
   trois. L'espace commercial s'appuie sur ce thème, ce n'est donc **pas** une
   rustine : c'est le comportement livré. Le risque est inverse — qu'un bundle
   un jour recompilé depuis ces sources perde le thème sans que rien ne le
   signale. Demande : les sources exactes du bundle livré, ou l'ajout de
   `commercial` à `SidebarNav.jsx` et à son `.d.ts`.
4. **`TypePicker` — six types au lieu de sept.** La liste par défaut
   (`DEFAULT_TYPES`) s'arrête à `creche`, `primaire`, `college`, `lycee`,
   `universite`, `formation` : `superieur` manque, alors que la RG02 en pose
   sept. Même liste dans le bundle et dans `TypePicker.jsx`. Sans rustine :
   `composants.tsx` impose de passer `types`, dérivé de `LIBELLE_TYPE`.
   Demande : la liste à sept, ou pas de liste par défaut du tout.
5. **`CitySelect` — douze villes figées.** `CITIES` est écrit dans le
   composant ; une ville ajoutée en base n'y apparaîtrait jamais si l'appelant
   oubliait `cities`. Et la valeur d'une option est le **nom** de la ville,
   quand l'API filtre par **slug**. Demande : options `{ value, label }`,
   comme `Select`.

## Écarts relevés entre les sources du skill et le bundle

Relevé en typant dans `web/src/ds/composants.tsx` les treize composants qui
n'y figuraient pas (`BottomTabBar`, `Breadcrumb`, `CitySelect`, `FilterBar`,
`Header`, `PermissionToggle`, `PricingCard`, `ProfileUnavailable`,
`Skeleton`, `SocialLinks`, `Stepper`, `TeamMember`, `TypePicker`).

**Les signatures sont identiques.** Pour les treize, la liste des propriétés et
leurs valeurs par défaut sont les mêmes dans `.jsx` et dans le bundle, au mot
`export` près. Les écarts sont dans les `.d.ts`, qui déclarent **moins** que
ce que le composant accepte :

| Composant | `.d.ts` du skill | Bundle |
|---|---|---|
| `TypePicker` | `value?: string[]` | accepte aussi une clé seule, mise en tableau |
| `PricingCard` | `price: string`, `credits?: number` | `price` rendu tel quel ; `credits = null` par défaut, qui remplace la ligne par un espace |
| `TeamMember` | `photo?: string` | `photo = null` par défaut, initiales à la place |
| `Header` | `logoSrc?: string`, `cta?: string` | `logoSrc = null` ; `cta` rendu comme enfant du bouton |
| `PermissionToggle` | `label?: string` | `label` rendu comme enfant |

Aucun n'est un défaut : `composants.tsx` suit le bundle.

**`DataTable` — rectification.** On a cru un temps que le `.d.ts` du skill
annonçait `label` là où le composant lit `header`. C'est faux : `DataTable.d.ts`
déclare bien `header`. L'erreur était dans **notre** `composants.tsx`, corrigée
depuis. Seul `SidebarNav` (point 3 ci-dessus) diverge réellement entre sources
et bundle.

**Deux comportements à connaître, non signalés par les `.d.ts` :**
- `Header` rend des `<a href>` natifs : dans le routeur, un clic recharge
  l'application entière.
- `ProfileUnavailable` est par défaut une **modale plein écran**
  (`position: fixed`, voile flouté) ; `overlay={false}` l'intègre au flux.
