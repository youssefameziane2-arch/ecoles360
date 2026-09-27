import React from 'react';

/**
 * écoles360 BottomTabBar — fixed mobile tab bar. Active tab in red.
 * items: [{ key, label, icon, count? }]. ≥44px touch targets.
 */
export function BottomTabBar({ items = [], activeKey, onSelect, style = {}, ...rest }) {
  return (
    <nav style={{
      display: 'flex', alignItems: 'stretch',
      background: 'var(--surface-card)', borderTop: '1px solid var(--border-hairline)',
      paddingBottom: 'env(safe-area-inset-bottom, 0)',
      ...style,
    }} {...rest}>
      {items.map((it) => {
        const active = it.key === activeKey;
        return (
          <button key={it.key} type="button" onClick={() => onSelect && onSelect(it.key)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              minHeight: 56, border: 'none', background: 'transparent', cursor: 'pointer',
              color: active ? 'var(--action)' : 'var(--text-muted)',
            }}>
            <span style={{ position: 'relative', fontSize: 19, lineHeight: 1 }}>
              {it.icon}
              {it.count != null ? (
                <span style={{ position: 'absolute', top: -5, right: -10, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 'var(--radius-pill)', background: 'var(--action)', color: '#fff', font: `var(--fw-bold) 10px/16px var(--font-sans)`, textAlign: 'center' }}>{it.count}</span>
              ) : null}
            </span>
            <span style={{ font: `${active ? 'var(--fw-semibold)' : 'var(--fw-medium)'} 11px/1 var(--font-sans)` }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
