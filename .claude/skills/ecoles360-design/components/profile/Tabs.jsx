import React from 'react';

/**
 * écoles360 Tabs — profile section tabs (À propos / Filières / Équipements /
 * Tarifs / Équipe / Avis). Active tab is red with a 2px red underline.
 * Controlled (value/onChange) or uncontrolled (defaultValue).
 * tabs: [{ key, label, count? }]
 */
export function Tabs({ tabs = [], value, defaultValue, onChange, style = {}, ...rest }) {
  const [internal, setInternal] = React.useState(defaultValue ?? (tabs[0] && tabs[0].key));
  const active = value !== undefined ? value : internal;
  const select = (k) => { if (value === undefined) setInternal(k); onChange && onChange(k); };
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-hairline)', overflowX: 'auto', ...style }} {...rest}>
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button key={t.key} type="button" onClick={() => select(t.key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, flex: 'none',
              padding: '13px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
              font: `${on ? 'var(--fw-semibold)' : 'var(--fw-medium)'} var(--fs-body)/1 var(--font-sans)`,
              color: on ? 'var(--action)' : 'var(--text-secondary)',
              boxShadow: on ? 'inset 0 -2px 0 var(--action)' : 'none',
              whiteSpace: 'nowrap',
            }}>
            {t.label}
            {t.count != null ? <span style={{ font: `var(--fw-bold) var(--fs-2xs)/1 var(--font-sans)`, color: on ? 'var(--action)' : 'var(--text-muted)' }}>{t.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
