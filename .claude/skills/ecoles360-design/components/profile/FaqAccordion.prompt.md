FAQ accordion. Single-open by default; red chevron when open.

```jsx
<FaqAccordion
  defaultOpen={0}
  items={[
    {q:"Quels sont les frais d'inscription ?", a:"Les frais varient selon le niveau…"},
    {q:'Y a-t-il un service de transport ?', a:'Oui, sur les principaux axes de la ville.'},
  ]} />
```

Set `allowMultiple` to keep several panels open.
