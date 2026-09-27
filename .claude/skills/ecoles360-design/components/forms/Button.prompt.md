Button — the core action control; red `primary` is the single key CTA per view (60-30-10 rule), with `navy`, `success` (WhatsApp), `outline`, and `ghost` for everything else.

```jsx
<Button variant="primary" size="lg" onClick={search}>Rechercher</Button>
<Button variant="success" icon={<WhatsAppIcon />}>WhatsApp</Button>
<Button variant="outline">Voir la fiche</Button>
```

Variants: `primary` (red), `navy`, `success` (green), `outline`, `ghost`.
Sizes: `sm` (36px) · `md` (42px) · `lg` (50px). Props: `block`, `disabled`, `icon`, `onClick`.
Never place two red `primary` buttons in the same group — pair red with navy/outline.
