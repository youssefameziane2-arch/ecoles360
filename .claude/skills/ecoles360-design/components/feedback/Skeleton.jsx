import React from 'react';

/**
 * écoles360 Skeleton — loading placeholder with a subtle left-to-right shimmer.
 * variant: "text" (rounded line), "rect" (block), "circle" (avatar).
 * Compose several to mirror the real layout while data loads.
 */
export function Skeleton({ variant = 'rect', width, height, radius, style = {}, ...rest }) {
  const base = {
    text: { width: width || '100%', height: height || 12, radius: 'var(--radius-badge)' },
    rect: { width: width || '100%', height: height || 80, radius: 'var(--radius-card)' },
    circle: { width: width || 40, height: height || width || 40, radius: '50%' },
  }[variant] || {};
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'block',
        width: base.width, height: base.height,
        borderRadius: radius || base.radius,
        background: 'linear-gradient(90deg, var(--surface-sunken) 25%, var(--e360-bg-2) 37%, var(--surface-sunken) 63%)',
        backgroundSize: '400% 100%',
        animation: 'e360-shimmer 1.4s ease-in-out infinite',
        ...style,
      }}
      {...rest}
    />
  );
}

/** Pre-composed skeleton mirroring an EstablishmentCard. */
export function SkeletonCard({ style = {} }) {
  return (
    <div style={{ border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-card)', overflow: 'hidden', ...style }}>
      <Skeleton variant="rect" height={140} radius={0} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
        <Skeleton variant="text" width="70%" height={14} />
        <Skeleton variant="text" width="45%" />
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <Skeleton variant="rect" width="50%" height={38} radius="var(--radius-control)" />
          <Skeleton variant="rect" width="50%" height={38} radius="var(--radius-control)" />
        </div>
      </div>
    </div>
  );
}
