import React from 'react';

/**
 * écoles360 PermissionToggle — labeled switch row used in the secrétaire
 * permissions panel and admin settings. Red when on.
 */
export function PermissionToggle({ label, description = '', checked, defaultChecked = false, onChange, disabled = false, style = {}, ...rest }) {
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const isCtrl = checked !== undefined;
  const on = isCtrl ? checked : internal;
  const toggle = () => {
    if (disabled) return;
    if (!isCtrl) setInternal(!on);
    onChange && onChange(!on);
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, opacity: disabled ? 0.55 : 1, ...style }} {...rest}>
      {(label || description) ? (
        <div>
          {label ? <div style={{ font: `var(--fw-semibold) var(--fs-body)/1.3 var(--font-sans)`, color: 'var(--text-primary)' }}>{label}</div> : null}
          {description ? <div style={{ font: `var(--fw-regular) var(--fs-xs)/1.4 var(--font-sans)`, color: 'var(--text-muted)', marginTop: 3 }}>{description}</div> : null}
        </div>
      ) : null}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={toggle}
        disabled={disabled}
        style={{
          flex: 'none', position: 'relative', width: 44, height: 26, padding: 0,
          borderRadius: 'var(--radius-pill)', border: 'none',
          background: on ? 'var(--action)' : 'var(--border-strong)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background .18s ease',
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20,
          borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(26,26,26,.25)',
          transition: 'left .18s ease',
        }} />
      </button>
    </div>
  );
}
