Required city picker that gates every search. Pin icon + red required marker.

```jsx
<CitySelect value={city} onChange={e => setCity(e.target.value)} />
```

Ships a Morocco city list (Casablanca, Rabat, Marrakech, Fès…). Pass `cities` to override. Always required by design.
