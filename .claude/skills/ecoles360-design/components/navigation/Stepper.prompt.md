Multi-step progress for flows like establishment sign-up.

```jsx
<Stepper current={2} steps={[
  {label:'Compte'},{label:'Fiche'},{label:'Filières'},{label:'Paiement'},
]} />
<Stepper orientation="vertical" current={1} steps={[…]} />
```

Completed steps show a red check, current is red-filled with a soft ring, upcoming are muted. Drive `current` from the form state.
