Checkbox with red fill when checked. Use for filters, consent, and multi-select lists.

```jsx
<Checkbox label="J'accepte les conditions" defaultChecked />
<Checkbox label="Recevoir les alertes" checked={on} onChange={e => setOn(e.target.checked)} />
```

Works controlled (`checked`) or uncontrolled (`defaultChecked`). 20px square, 6px radius, red `✓` when on.
