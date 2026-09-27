Loading placeholder with shimmer. Mirror the real layout while data loads. Also exports `SkeletonCard`.

```jsx
<Skeleton variant="text" width="60%" />
<Skeleton variant="circle" width={40} />
<Skeleton variant="rect" height={120} />
<SkeletonCard />   // matches an EstablishmentCard
```

Use a grid of `SkeletonCard` for result-list loading states.
