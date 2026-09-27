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
