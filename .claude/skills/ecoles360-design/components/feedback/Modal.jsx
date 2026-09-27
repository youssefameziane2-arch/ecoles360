import React from 'react';
import { Icon } from '../core/Icon.jsx';

/**
 * écoles360 Modal — centered dialog over a navy scrim. Header with title + close,
 * body, and an optional footer actions row. Closes on backdrop click / Esc.
 * Render conditionally or pass `open`.
 */
export function Modal({ open = true, title, children, footer = null, onClose, width = 480, style = {}, ...rest }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(21,35,58,.55)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        animation: 'e360-fade-in var(--dur-base) var(--ease-out)',
      }}
    >
      <div
        role="dialog" aria-modal="true" aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'auto',
          background: 'var(--surface-card)', borderRadius: 'var(--radius-card-lg)',
          boxShadow: 'var(--shadow-pop)',
          animation: 'e360-pop-in var(--dur-slow) var(--ease-out)',
          ...style,
        }}
        {...rest}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '18px 20px', borderBottom: '1px solid var(--border-hairline)' }}>
          <span style={{ font: `var(--fw-bold) var(--fs-h2)/1.2 var(--font-sans)`, letterSpacing: 'var(--ls-h2)', color: 'var(--text-primary)' }}>{title}</span>
          {onClose ? (
            <button type="button" onClick={onClose} aria-label="Fermer"
              style={{ flex: 'none', width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', borderRadius: 'var(--radius-control)', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <Icon name="x" size={20} />
            </button>
          ) : null}
        </div>
        <div style={{ padding: 20, font: 'var(--text-default)', color: 'var(--text-body)' }}>{children}</div>
        {footer ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid var(--border-hairline)', background: 'var(--surface-sunken)' }}>{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
