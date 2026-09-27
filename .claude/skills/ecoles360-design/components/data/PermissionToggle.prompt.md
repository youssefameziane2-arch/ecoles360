Labeled switch row. Use for secrétaire permissions and admin settings.

```jsx
<PermissionToggle label="Répondre aux avis" description="Publier des réponses publiques" defaultChecked />
<PermissionToggle label="Gérer les crédits" checked={can} onChange={setCan} />
```

Red when on. Pair label + description for a settings list.
