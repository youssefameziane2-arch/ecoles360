Credit-pack / subscription tier. "Populaire" tier gets navy fill + red ribbon.

```jsx
<PricingCard name="Pack Pro" price="1 200 MAD" credits={600}
  features={['Placement sponsorisé','Badge Vérifié','Statistiques avancées']}
  popular cta="Recharger" onSelect={…} />
```

Use one `popular` per row. `unit` for subscriptions ("/mois"), `credits` for packs.
