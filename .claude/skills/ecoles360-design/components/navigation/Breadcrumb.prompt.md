Page-hierarchy trail. Bold current page, muted links, chevron separators.

```jsx
<Breadcrumb items={[
  { label: 'Accueil', href: '#' },
  { label: 'Casablanca', href: '#' },
  { label: 'Lycées', href: '#' },
  { label: 'Groupe Al Massira' },   // last = current page
]} />
```

The last item always renders as the current (non-link) page.
