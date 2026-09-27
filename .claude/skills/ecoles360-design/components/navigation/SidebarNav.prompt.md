Dark back-office sidebar for the three spaces. Active item is solid red; counter badges and a profile footer.

```jsx
<SidebarNav
  theme="etablissement"
  activeKey="dashboard"
  items={[
    { key:'dashboard', label:'Tableau de bord', icon:'▦' },
    { key:'fiche', label:'Ma fiche', icon:'🏫' },
    { key:'stats', label:'Statistiques', icon:'📈' },
    { key:'avis', label:'Avis', icon:'★', count:3 },
    { key:'credits', label:'Crédits & abonnement', icon:'💳' },
  ]}
  user={{ name:'Sara Bennani', role:'Établissement' }}
  onSelect={…} />
```

`theme` sets the eyebrow ("Espace établissement" / "Espace secrétariat" / "Back-office admin"). Surface stays navy `#15233A` across all three.
