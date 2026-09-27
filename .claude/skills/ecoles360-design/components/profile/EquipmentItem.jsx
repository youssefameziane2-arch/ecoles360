import React from 'react';

/**
 * écoles360 EquipmentItem — a single facility in the "Équipements" grid
 * (Bibliothèque, Cantine, Laboratoire, Terrain de sport…). Icon chip + label.
 * `available={false}` dims the item.
 */
export function EquipmentItem({ icon = '•', label, available = true, style = {}, ...rest }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 11,
      padding: '11px 13px',
      background: 'var(--surface-card)', border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-control-lg)',
      opacity: available ? 1 : 0.5,
      ...style,
    }} {...rest}>
      <span style={{ width: 32, height: 32, flex: 'none', borderRadius: 'var(--radius-control)', background: 'var(--e360-navy-tint)', color: 'var(--e360-navy)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</span>
      <span style={{ font: `var(--fw-medium) var(--fs-sm)/1.3 var(--font-sans)`, color: 'var(--text-body)' }}>{label}</span>
      {!available ? <span style={{ marginLeft: 'auto', font: `var(--fw-medium) var(--fs-xs)/1 var(--font-sans)`, color: 'var(--text-muted)' }}>Non dispo.</span> : null}
    </div>
  );
}
