Styled native select with chevron. Use for City (required), sort order, filière and other single-choice fields.

```jsx
<Select label="Ville" required options={['Casablanca','Rabat','Fès','Marrakech']} />
<Select label="Trier par" options={[{value:'note',label:'Mieux notés'},{value:'prix',label:'Prix croissant'}]} />
```

`options` accepts strings or `{value,label}`. `placeholder` is the empty option (defaults "Choisir…"). City is always `required`.
