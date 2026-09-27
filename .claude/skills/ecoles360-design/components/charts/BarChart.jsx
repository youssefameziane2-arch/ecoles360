import React from 'react';

/**
 * écoles360 BarChart — flat vertical bars (e.g. monthly views/contacts).
 * The current/highlighted bar is red; the rest are navy-tinted. CSS only.
 * data: [{ label, value }]. `currentIndex` highlights one bar (default last).
 */
export function BarChart({ data = [], currentIndex = -1, height = 180, valueFormat = (v) => v, style = {}, ...rest }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const current = currentIndex < 0 ? data.length - 1 : currentIndex;
  return (
    <div style={{ ...style }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height }}>
        {data.map((d, i) => {
          const on = i === current;
          const h = Math.round((d.value / max) * (height - 26));
          return (
            <div key={d.label + i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ font: `var(--fw-bold) var(--fs-2xs)/1 var(--font-sans)`, color: on ? 'var(--action)' : 'var(--text-muted)' }}>{valueFormat(d.value)}</span>
              <div style={{ width: '100%', maxWidth: 38, height: h, background: on ? 'var(--action)' : 'var(--e360-navy-tint)', borderRadius: '6px 6px 0 0', transition: 'height .3s ease' }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        {data.map((d, i) => (
          <span key={d.label + i} style={{ flex: 1, textAlign: 'center', font: `${i === current ? 'var(--fw-semibold)' : 'var(--fw-regular)'} var(--fs-xs)/1 var(--font-sans)`, color: i === current ? 'var(--text-primary)' : 'var(--text-muted)' }}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}
