import React from 'react';
import { Icon } from '../core/Icon.jsx';

/**
 * écoles360 Stepper — multi-step progress for flows like establishment
 * sign-up / onboarding (Compte → Fiche → Filières → Paiement). Completed steps
 * show a red check, current is red-filled, upcoming are muted.
 * steps: [{ label }]. `current` is the 0-based active index.
 * orientation: "horizontal" (default) or "vertical".
 */
export function Stepper({ steps = [], current = 0, orientation = 'horizontal', style = {}, ...rest }) {
  const vertical = orientation === 'vertical';
  return (
    <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', alignItems: vertical ? 'stretch' : 'flex-start', gap: vertical ? 0 : 4, ...style }} {...rest}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const dot = done ? 'var(--action)' : active ? 'var(--action)' : 'var(--surface-sunken)';
        const fg = done || active ? '#fff' : 'var(--text-muted)';
        const line = i < current ? 'var(--action)' : 'var(--border-strong)';
        return (
          <div key={i} style={{ display: 'flex', flexDirection: vertical ? 'row' : 'column', alignItems: vertical ? 'flex-start' : 'center', gap: vertical ? 12 : 8, flex: vertical ? 'none' : 1, position: 'relative' }}>
            {/* connector */}
            {i > 0 && !vertical ? (
              <span style={{ position: 'absolute', top: 14, left: 'calc(-50% + 16px)', right: 'calc(50% + 16px)', height: 2, background: (i <= current ? 'var(--action)' : 'var(--border-strong)') }} />
            ) : null}
            <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', alignItems: 'center', gap: 0 }}>
              <span style={{ zIndex: 1, width: 28, height: 28, flex: 'none', borderRadius: '50%', background: dot, color: fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: `var(--fw-bold) var(--fs-xs)/1 var(--font-sans)`, border: active ? '3px solid var(--e360-red-tint)' : 'none' }}>
                {done ? <Icon name="check" size={15} /> : (i + 1)}
              </span>
              {vertical && i < steps.length - 1 ? <span style={{ width: 2, height: 26, background: line, margin: '2px 0' }} /> : null}
            </div>
            <span style={{ font: `${active ? 'var(--fw-semibold)' : 'var(--fw-medium)'} var(--fs-xs)/1.3 var(--font-sans)`, color: active ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: vertical ? 'left' : 'center', paddingTop: vertical ? 4 : 0 }}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}
