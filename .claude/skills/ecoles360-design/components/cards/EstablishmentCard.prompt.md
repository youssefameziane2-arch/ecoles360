Core establishment listing card. Sponsored adds a red left border + badge; verified shows a green check.

```jsx
<EstablishmentCard
  name="Groupe scolaire Al Massira" city="Casablanca" type="Lycée"
  rating="4,8" reviews={126} image="https://picsum.photos/seed/almassira/640/420"
  sponsored verified tags={['Bilingue','Sciences']}
  onCall={…} onWhatsApp={…} onView={…} />
<EstablishmentCard layout="row" name="Lycée Ibn Khaldoun" city="Casablanca" rating="4,5" />
```

`layout="grid"` for result grids, `layout="row"` for the search results list. Rating is a French string ("4,8").
