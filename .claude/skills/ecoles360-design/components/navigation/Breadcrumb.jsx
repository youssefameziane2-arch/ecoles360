import React from 'react';
import { Icon } from '../core/Icon.jsx';

/**
 * écoles360 Breadcrumb — page hierarchy trail. Chevron separators, muted links,
 * bold current page. Used on the public site (Accueil / Casablanca / Lycées).
 * items: [{ label, href? }] — the last item renders as the current page.
 */
export function Breadcrumb({ items = [], style = {}, ...rest }) {
  return (
    <nav aria-label="Fil d'Ariane" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, ...style }} {...rest}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {last || !it.href ? (
              <span style={{ font: `${last ? 'var(--fw-semibold)' : 'var(--fw-regular)'} var(--fs-sm)/1 var(--font-sans)`, color: last ? 'var(--text-primary)' : 'var(--text-muted)' }}>{it.label}</span>
            ) : (
              <a href={it.href} style={{ font: `var(--fw-regular) var(--fs-sm)/1 var(--font-sans)`, color: 'var(--text-secondary)', textDecoration: 'none' }}>{it.label}</a>
            )}
            {!last ? <Icon name="chevron-right" size={14} color="var(--text-placeholder)" /> : null}
          </span>
        );
      })}
    </nav>
  );
}
