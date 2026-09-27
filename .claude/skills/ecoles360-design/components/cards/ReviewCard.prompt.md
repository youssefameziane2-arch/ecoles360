Parent review with optional establishment reply and moderation status. Flagged reviews get a red border.

```jsx
<ReviewCard author="Sara B." date="12 mai 2026" rating={5}
  body="Encadrement remarquable, ma fille a beaucoup progressé."
  reply="Merci pour votre confiance !" status="Publié" />
<ReviewCard author="Anonyme" date="3 juin" rating={1} body="…" status="Signalé" flagged />
```

`status` is shown to moderators (admin/secrétaire). Omit `reply`/`status` for the public profile.
