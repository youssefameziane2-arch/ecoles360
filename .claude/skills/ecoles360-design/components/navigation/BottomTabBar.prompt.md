Mobile bottom tab bar. Active tab in red, badge counts supported.

```jsx
<BottomTabBar
  activeKey="search"
  items={[
    { key:'home', label:'Accueil', icon:'⌂' },
    { key:'search', label:'Rechercher', icon:'⌕' },
    { key:'saved', label:'Favoris', icon:'♥' },
    { key:'account', label:'Compte', icon:'☻', count:2 },
  ]}
  onSelect={…} />
```

Fix to the viewport bottom in mobile layouts; respects iOS safe-area inset.
