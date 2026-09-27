Establishment-type cards for the search entry. Selected card gets a navy border + tint.

```jsx
<TypePicker value={types} onChange={setTypes} />          // single
<TypePicker value={types} multi onChange={setTypes} columns={3} />  // multi, 3-up
```

Defaults to the 6 brand types (Crèche, Primaire, Collège, Lycée, Université, Formation) with emoji icons. Pass `types` with custom `icon` nodes to swap in Lucide.
