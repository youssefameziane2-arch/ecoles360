import React from 'react';

/**
 * écoles360 SourceBars — horizontal breakdown of where contacts come from
 * (WhatsApp, Appel, Formulaire, Fiche…). Labeled rows with value + share bar.
 * data: [{ label, value, tone? }]. Tones default to a rotating brand set.
 */
export function SourceBars({ data = [], showShare = true, style = {}, ...rest }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const toneColors = {
    green: 'var(--action-success)', navy: 'var(--action-secondary)',
    red: 'var(--action)', amber: 'var(--e360-amber)',
  };
  const rotation = ['green', 'navy', 'amber', 'red'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, ...style }} {...rest}>
      {data.map((d, i) => {
        const pct = (d.value / total) * 100;
        const color = toneColors[d.tone || rotation[i % rotation.length]];
        return (
          <div key={d.label + i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ font: `var(--fw-medium) var(--fs-sm)/1 var(--font-sans)`, color: 'var(--text-body)' }}>{d.label}</span>
              <span style={{ font: `var(--fw-bold) var(--fs-sm)/1 var(--font-sans)`, color: 'var(--text-primary)' }}>
                {d.value}{showShare ? <span style={{ font: `var(--fw-regular) var(--fs-xs)/1 var(--font-sans)`, color: 'var(--text-muted)', marginLeft: 6 }}>{Math.round(pct)}%</span> : null}
              </span>
            </div>
            <div style={{ width: '100%', height: 9, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 'var(--radius-pill)', transition: 'width .3s ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
