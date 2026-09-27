import React from 'react';
import { Icon } from '../core/Icon.jsx';

/**
 * écoles360 FilterBar — horizontal scrollable chip row for refining results
 * (type, filière, budget, note) plus Appliquer / Réinitialiser actions.
 * Active chips invert to a navy fill. Removable active filters show a ✕.
 *
 * filters: [{ key, label, active? }]
 */
export function FilterBar({ filters = [], onToggle, onApply, onReset, applyLabel = 'Appliquer', resetLabel = 'Réinitialiser', style = {}, ...rest }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, ...style }} {...rest}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto', flex: 1, paddingBottom: 2 }}>
        {filters.map((f) => {
          const on = f.active;
          return (
            <button key={f.key} type="button" onClick={() => onToggle && onToggle(f.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, flex: 'none',
                height: 36, padding: '0 14px', cursor: 'pointer',
                background: on ? 'var(--action-secondary)' : 'var(--surface-card)',
                color: on ? '#fff' : 'var(--text-secondary)',
                border: on ? '1px solid var(--action-secondary)' : '1px solid var(--border-control)',
                borderRadius: 'var(--radius-pill)',
                font: `${on ? 'var(--fw-semibold)' : 'var(--fw-medium)'} var(--fs-sm)/1 var(--font-sans)`,
                whiteSpace: 'nowrap',
              }}>
              {f.label}
              <span style={{ display: 'inline-flex', opacity: on ? 1 : 0.6 }}><Icon name={on ? 'x' : 'chevron-down'} size={13} /></span>
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
        {onReset ? (
          <button type="button" onClick={onReset} style={{
            height: 36, padding: '0 14px', cursor: 'pointer',
            background: 'transparent', color: 'var(--text-secondary)',
            border: '1px solid var(--border-control)', borderRadius: 'var(--radius-control)',
            font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`, whiteSpace: 'nowrap',
          }}>{resetLabel}</button>
        ) : null}
        <button type="button" onClick={onApply} style={{
          height: 36, padding: '0 16px', cursor: 'pointer', border: 'none',
          background: 'var(--action)', color: '#fff', borderRadius: 'var(--radius-control)',
          font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`, whiteSpace: 'nowrap',
        }}>{applyLabel}</button>
      </div>
    </div>
  );
}
