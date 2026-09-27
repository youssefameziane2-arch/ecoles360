Profile section tabs. Active tab is red with a 2px underline.

```jsx
<Tabs
  defaultValue="apropos"
  tabs={[
    {key:'apropos',label:'À propos'},{key:'filieres',label:'Filières'},
    {key:'equip',label:'Équipements'},{key:'tarifs',label:'Tarifs'},
    {key:'equipe',label:'Équipe'},{key:'avis',label:'Avis',count:126},
  ]}
  onChange={…} />
```

Controlled via `value`/`onChange` or uncontrolled via `defaultValue`. Scrolls horizontally on mobile.
