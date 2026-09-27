import React from 'react';

/**
 * écoles360 Tag — filière / subject chip. Neutral pill on sunken background.
 * Removable variant shows a ✕. Use for "Bilingue", "Sciences", "Internat", etc.
 */
export function Tag({ children, removable = false, onRemove, active = false, style = {}, ...rest }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 11px',
        font: `var(--fw-medium) var(--fs-xs)/1 var(--font-sans)`,
        borderRadius: 'var(--radius-pill)',
        background: active ? 'var(--e360-navy-tint)' : 'var(--surface-sunken)',
        color: active ? 'var(--e360-navy)' : 'var(--text-secondary)',
        border: active ? '1px solid transparent' : '1px solid transparent',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {children}
      {removable ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Retirer"
          style={{ border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: 12, lineHeight: 1, opacity: .7 }}
        >✕</button>
      ) : null}
    </span>
  );
}
