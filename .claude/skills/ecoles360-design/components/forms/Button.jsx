import React from 'react';

/**
 * écoles360 Button.
 * Variants: primary (red CTA), navy (secondary), success (WhatsApp/green),
 * outline, ghost. Red is the only accent — use it for the single key action.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  icon = null,
  type = 'button',
  onClick,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: { height: 36, padding: '0 14px', font: 'var(--fs-sm)', radius: 'var(--radius-control)' },
    md: { height: 42, padding: '0 18px', font: 'var(--fs-body)', radius: 'var(--radius-control)' },
    lg: { height: 50, padding: '0 24px', font: 'var(--fs-body-lg)', radius: 'var(--radius-control-lg)' },
  };
  const s = sizes[size] || sizes.md;

  const variants = {
    primary: { background: 'var(--action)', color: '#fff', border: '1px solid transparent' },
    navy: { background: 'var(--action-secondary)', color: '#fff', border: '1px solid transparent' },
    success: { background: 'var(--action-success)', color: '#fff', border: '1px solid transparent' },
    outline: { background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent' },
  };
  const v = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: block ? 'flex' : 'inline-flex',
        width: block ? '100%' : 'auto',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        height: s.height,
        minHeight: size === 'lg' ? 'var(--touch-min)' : undefined,
        padding: s.padding,
        font: `var(--fw-semibold) ${s.font}/1 var(--font-sans)`,
        letterSpacing: '.1px',
        borderRadius: s.radius,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'filter .15s ease, transform .05s ease',
        whiteSpace: 'nowrap',
        ...v,
        ...style,
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'translateY(1px)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.filter = 'brightness(0.94)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
      {...rest}
    >
      {icon ? <span style={{ display: 'inline-flex', fontSize: '1.05em' }}>{icon}</span> : null}
      {children}
    </button>
  );
}
