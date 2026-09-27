Text input with label, optional leading icon, and red error state. Use for all single-line text entry in forms.

```jsx
<Input label="Nom de l'établissement" placeholder="Groupe scolaire Al Massira" required />
<Input label="Email" type="email" error="Adresse invalide" />
```

Pair with `icon` for search/contact fields. `error` (non-empty string) turns the border red and shows the message below. Labels are sentence case; required marker is a red `*`.
