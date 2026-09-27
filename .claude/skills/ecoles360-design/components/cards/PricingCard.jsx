import React from 'react';

/**
 * écoles360 PricingCard — credit pack / subscription tier.
 * "Populaire" variant gets a navy fill, red ribbon, and elevated emphasis.
 */
export function PricingCard({ name, price, unit = '', credits = null, features = [], popular = false, cta = 'Choisir', onSelect, style = {}, ...rest }) {
  const dark = popular;
  return (
    <div style={{
      position: 'relative', display: 'flex', flexDirection: 'column',
      background: dark ? 'var(--surface-dark)' : 'var(--surface-card)',
      border: dark ? '1px solid var(--surface-dark)' : '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-card-lg)', padding: '24px 22px',
      color: dark ? '#fff' : 'var(--text-primary)',
      ...style,
    }} {...rest}>
      {popular ? (
        <span style={{ position: 'absolute', top: 16, right: 16, font: `var(--fw-bold) var(--fs-2xs)/1 var(--font-sans)`, letterSpacing: '.4px', textTransform: 'uppercase', background: 'var(--action)', color: '#fff', borderRadius: 'var(--radius-badge)', padding: '5px 9px' }}>Populaire</span>
      ) : null}
      <div style={{ font: `var(--fw-bold) var(--fs-h3)/1 var(--font-sans)`, color: dark ? '#fff' : 'var(--text-primary)', marginBottom: 12 }}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span style={{ font: `var(--fw-extrabold) var(--fs-stat)/1 var(--font-sans)`, letterSpacing: 'var(--ls-tight)' }}>{price}</span>
        {unit ? <span style={{ font: `var(--fw-medium) var(--fs-sm)/1 var(--font-sans)`, color: dark ? 'var(--e360-navy-soft)' : 'var(--text-muted)' }}>{unit}</span> : null}
      </div>
      {credits != null ? <div style={{ font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`, color: 'var(--action)', marginBottom: 16 }}>{credits} crédits</div> : <div style={{ height: 16 }} />}
      <ul style={{ listStyle: 'none', margin: '4px 0 20px', padding: 0, display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
        {features.map((f) => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, font: `var(--fw-regular) var(--fs-sm)/1.4 var(--font-sans)`, color: dark ? 'rgba(255,255,255,.86)' : 'var(--text-body)' }}>
            <span style={{ color: dark ? 'var(--action)' : 'var(--action-success)', fontWeight: 700 }}>✓</span>{f}
          </li>
        ))}
      </ul>
      <button type="button" onClick={onSelect} style={{
        height: 46, width: '100%', border: 'none', borderRadius: 'var(--radius-control)',
        background: dark ? 'var(--action)' : 'var(--action-secondary)', color: '#fff',
        font: `var(--fw-semibold) var(--fs-body)/1 var(--font-sans)`, cursor: 'pointer',
      }}>{cta}</button>
    </div>
  );
}
