Empty-state placeholder for empty lists, no results, empty inbox.

```jsx
<EmptyState icon="search" title="Aucun résultat"
  description="Aucun établissement ne correspond à vos filtres. Élargissez votre recherche."
  action={<Button variant="navy" onClick={reset}>Réinitialiser les filtres</Button>} />
```

Choose an icon that matches the context (`inbox`, `search`, `calendar`, `flag`).
