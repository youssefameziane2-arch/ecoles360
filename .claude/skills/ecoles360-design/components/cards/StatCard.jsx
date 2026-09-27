import React from 'react';

/**
 * écoles360 StatCard — dashboard KPI: big numeral, label, optional delta vs
 * previous period (green up / red down), and a leading icon chip.
 */
export function StatCard({ label, value, delta = null, deltaDir = 'up', icon = null, tone = 'navy', style = {}, ...rest }) {
  const chipTones = {
    navy: { bg: 'var(--e360-navy-tint)', fg: 'var(--e360-navy)' },
    red: { bg: 'var(--e360-red-tint)', fg: 'var(--e360-red-700)' },
    green: { bg: 'var(--e360-green-tint)', fg: 'var(--e360-green)' },
    amber: { bg: 'var(--e360-amber-tint)', fg: 'var(--e360-amber-700)' },
  };
  const c = chipTones[tone] || chipTones.navy;
  const up = deltaDir === 'up';
  return (
    <div style={{
      background: 'var(--surface-card)', border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-card-lg)', padding: 'var(--pad-card)',
      ...style,
    }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`, color: 'var(--text-secondary)' }}>{label}</span>
        {icon ? <span style={{ width: 34, height: 34, borderRadius: 'var(--radius-control-lg)', background: c.bg, color: c.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{icon}</span> : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ font: `var(--fw-extrabold) var(--fs-stat)/1 var(--font-sans)`, letterSpacing: 'var(--ls-tight)', color: 'var(--text-primary)' }}>{value}</span>
        {delta != null ? (
          <span style={{ font: `var(--fw-semibold) var(--fs-xs)/1 var(--font-sans)`, color: up ? 'var(--action-success)' : 'var(--action)' }}>{up ? '▲' : '▼'} {delta}</span>
        ) : null}
      </div>
    </div>
  );
}
