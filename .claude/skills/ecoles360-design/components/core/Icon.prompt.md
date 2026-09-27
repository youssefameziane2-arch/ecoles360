The single icon source for écoles360 — Lucide-style line icons (24×24, 2px stroke). Use everywhere instead of emoji; inherits text color via `currentColor`.

```jsx
<Icon name="search" />
<Icon name="map-pin" size={18} color="var(--action)" />
<Icon name="star" color="var(--rating)" />        // star/heart render filled
<Button icon={<Icon name="phone" size={18} />}>Appeler</Button>
```

Existing components accept icon nodes (`icon`, sidebar/tab `icon`, etc.) — pass `<Icon …/>` to override their emoji defaults. Add new glyphs by dropping Lucide path data into `ICONS`.
