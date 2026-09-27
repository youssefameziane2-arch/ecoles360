import React from 'react';

/**
 * écoles360 ProgressBar — flat track with a colored fill. Used for the credits
 * gauge ("Solde de crédits"), profile completeness, rating distribution rows.
 */
export function ProgressBar({ value = 0, max = 100, tone = 'red', height = 8, label = null, showValue = false, style = {}, ...rest }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const tones = {
    red: 'var(--action)',
    navy: 'var(--action-secondary)',
    green: 'var(--action-success)',
    amber: 'var(--e360-amber)',
  };
  const fill = tones[tone] || tones.red;
  return (
    <div style={{ ...style }} {...rest}>
      {(label || showValue) ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
          {label ? <span style={{ font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`, color: 'var(--text-body)' }}>{label}</span> : <span />}
          {showValue ? <span style={{ font: `var(--fw-bold) var(--fs-sm)/1 var(--font-sans)`, color: 'var(--text-primary)' }}>{Math.round(pct)}%</span> : null}
        </div>
      ) : null}
      <div style={{ width: '100%', height, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: fill, borderRadius: 'var(--radius-pill)', transition: 'width .3s ease' }} />
      </div>
    </div>
  );
}
