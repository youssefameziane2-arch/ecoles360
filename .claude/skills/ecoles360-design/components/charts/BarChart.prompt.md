Monthly bar chart. Current month's bar is red, others navy-tinted.

```jsx
<BarChart
  data={[
    {label:'Jan',value:320},{label:'Fév',value:410},{label:'Mar',value:380},
    {label:'Avr',value:520},{label:'Mai',value:640},{label:'Juin',value:710},
  ]}
  currentIndex={5}
  valueFormat={v => v.toLocaleString('fr-FR')} />
```

Pure CSS — no chart library. Use for views/contacts over time on the Statistiques view.
