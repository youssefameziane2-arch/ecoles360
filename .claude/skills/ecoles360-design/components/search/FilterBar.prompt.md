Horizontal filter chip bar for results. Active chips invert to navy; trailing Appliquer/Réinitialiser actions.

```jsx
<FilterBar
  filters={[
    { key:'type', label:'Type' },
    { key:'filiere', label:'Filière' },
    { key:'budget', label:'Budget', active:true },
    { key:'note', label:'★ 4+', active:true },
  ]}
  onToggle={…} onApply={…} onReset={…} />
```

Active chips show a ✕; inactive show a ⌄. Scrolls horizontally on mobile.
