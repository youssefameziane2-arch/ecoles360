import React from 'react';
import { Icon } from '../core/Icon.jsx';

/**
 * écoles360 Toast — transient notification. Tones: success / error / info /
 * warning, each with a tinted icon. Optional dismiss. White card, flat shadow,
 * left accent bar in the tone color.
 */
export function Toast({ tone = 'success', title, message, onClose, style = {}, ...rest }) {
  const tones = {
    success: { icon: 'check-circle', fg: 'var(--e360-green)', bg: 'var(--e360-green-tint)' },
    error: { icon: 'alert-circle', fg: 'var(--e360-red-700)', bg: 'var(--e360-red-tint)' },
    info: { icon: 'info', fg: 'var(--e360-navy)', bg: 'var(--e360-navy-tint)' },
    warning: { icon: 'alert-triangle', fg: 'var(--e360-amber-700)', bg: 'var(--e360-amber-tint)' },
  };
  const t = tones[tone] || tones.success;
  return (
    <div
      role="status"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        minWidth: 300, maxWidth: 420, padding: '13px 14px',
        background: 'var(--surface-card)', borderRadius: 'var(--radius-control-lg)',
        borderLeft: `3px solid ${t.fg}`, boxShadow: 'var(--shadow-card)',
        animation: 'e360-toast-in var(--dur-slow) var(--ease-out)',
        ...style,
      }}
      {...rest}
    >
      <span style={{ flex: 'none', width: 30, height: 30, borderRadius: '50%', background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={t.icon} size={18} />
      </span>
      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
        {title ? <div style={{ font: `var(--fw-semibold) var(--fs-sm)/1.3 var(--font-sans)`, color: 'var(--text-primary)' }}>{title}</div> : null}
        {message ? <div style={{ font: `var(--fw-regular) var(--fs-xs)/1.45 var(--font-sans)`, color: 'var(--text-secondary)', marginTop: title ? 2 : 0 }}>{message}</div> : null}
      </div>
      {onClose ? (
        <button type="button" onClick={onClose} aria-label="Fermer"
          style={{ flex: 'none', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
          <Icon name="x" size={16} />
        </button>
      ) : null}
    </div>
  );
}
