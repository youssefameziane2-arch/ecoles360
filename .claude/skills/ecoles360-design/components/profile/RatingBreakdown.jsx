import React from 'react';

/**
 * écoles360 RatingBreakdown — the 5★→1★ distribution with amber bars and the
 * average on the left. Used on profile "Avis" and moderation views.
 * distribution: [count5, count4, count3, count2, count1]
 */
export function RatingBreakdown({ average, total, distribution = [0, 0, 0, 0, 0], style = {}, ...rest }) {
  const sum = total != null ? total : distribution.reduce((a, b) => a + b, 0);
  return (
    <div style={{ display: 'flex', gap: 26, alignItems: 'center', ...style }} {...rest}>
      <div style={{ textAlign: 'center', flex: 'none' }}>
        <div style={{ font: `var(--fw-extrabold) var(--fs-stat-lg)/1 var(--font-sans)`, letterSpacing: 'var(--ls-tight)', color: 'var(--text-primary)' }}>{average}</div>
        <div style={{ color: 'var(--rating)', font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`, letterSpacing: '1px', margin: '6px 0 4px' }}>★★★★★</div>
        <div style={{ font: `var(--fw-regular) var(--fs-xs)/1 var(--font-sans)`, color: 'var(--text-muted)' }}>{sum} avis</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {distribution.map((count, i) => {
          const stars = 5 - i;
          const pct = sum ? (count / sum) * 100 : 0;
          return (
            <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 26, flex: 'none', font: `var(--fw-medium) var(--fs-xs)/1 var(--font-sans)`, color: 'var(--text-secondary)' }}>{stars} ★</span>
              <span style={{ flex: 1, height: 8, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                <span style={{ display: 'block', width: `${pct}%`, height: '100%', background: 'var(--rating)', borderRadius: 'var(--radius-pill)' }} />
              </span>
              <span style={{ width: 32, flex: 'none', textAlign: 'right', font: `var(--fw-regular) var(--fs-xs)/1 var(--font-sans)`, color: 'var(--text-muted)' }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
