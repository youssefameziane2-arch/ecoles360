import React from 'react';

/**
 * écoles360 checkbox. Red when checked, hairline square when not.
 */
export function Checkbox({ label, checked, defaultChecked, onChange, disabled = false, style = {}, ...rest }) {
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const isCtrl = checked !== undefined;
  const on = isCtrl ? checked : internal;
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', font: 'var(--text-default)', color: 'var(--text-body)', opacity: disabled ? 0.5 : 1, ...style }}>
      <input
        type="checkbox"
        checked={on}
        disabled={disabled}
        onChange={(e) => { if (!isCtrl) setInternal(e.target.checked); onChange && onChange(e); }}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        {...rest}
      />
      <span style={{
        flex: 'none', width: 20, height: 20, borderRadius: 'var(--radius-badge)',
        border: on ? '1px solid var(--action)' : '1px solid var(--border-control)',
        background: on ? 'var(--action)' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 13, transition: 'background .12s ease, border-color .12s ease',
      }}>{on ? '✓' : ''}</span>
      {label ? <span style={{ fontSize: 'var(--fs-body)' }}>{label}</span> : null}
    </label>
  );
}
