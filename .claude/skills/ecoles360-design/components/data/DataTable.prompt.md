Data table with uppercase hairline headers. Collapses to stacked label/value cards on mobile — the brand's "tableaux → cartes empilées" rule.

```jsx
<DataTable
  columns={[
    { key: 'niveau', header: 'Niveau' },
    { key: 'frais', header: 'Frais / an', align: 'right' },
    { key: 'statut', header: 'Statut', render: r => <Badge tone="green">{r.statut}</Badge> },
  ]}
  rows={[{ niveau: 'Lycée', frais: '24 000 MAD', statut: 'Vérifié' }]}
  stackAt={720}
/>
```

`render` lets cells host Badge/Tag/Button. Set `stackAt` to the breakpoint where the table should card-stack.
