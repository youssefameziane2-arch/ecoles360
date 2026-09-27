Public site header with logo, nav, and red CTA. Also exports `Wordmark`.

```jsx
<Header
  items={[{label:'Accueil',href:'#',active:true},{label:'Établissements',href:'#'},{label:'Villes',href:'#'}]}
  cta="Inscrire mon établissement" onCta={…} />
<Wordmark size={24} />
<Wordmark onDark />  // white text for dark backgrounds
```

Active link is red with a 2px underline. Pass `logoSrc` to use an image instead of the wordmark.
