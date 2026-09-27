import React from 'react';

/**
 * écoles360 text input. Hairline border, 10px radius, optional leading icon,
 * error state in red. Labels sit above; required marker is red.
 */
export function Input({
  label,
  required = false,
  placeholder = '',
  value,
  defaultValue,
  type = 'text',
  icon = null,
  error = '',
  disabled = false,
  onChange,
  style = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const borderColor = error ? 'var(--action)' : focused ? 'var(--action-secondary)' : 'var(--border-control)';
  return (
    <label style={{ display: 'block', font: 'var(--text-default)', ...style }}>
      {label ? (
        <span style={{ display: 'block', fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-body)', marginBottom: 7 }}>
          {label}{required ? <span style={{ color: 'var(--action)', marginLeft: 4 }}>*</span> : null}
        </span>
      ) : null}
      <span style={{
        display: 'flex', alignItems: 'center', gap: 9,
        height: 48, padding: '0 14px',
        background: disabled ? 'var(--surface-sunken)' : '#fff',
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius-control-lg)',
        boxShadow: focused && !error ? '0 0 0 3px var(--e360-navy-tint)' : 'none',
        transition: 'border-color .15s ease, box-shadow .15s ease',
      }}>
        {icon ? <span style={{ display: 'inline-flex', color: 'var(--text-muted)' }}>{icon}</span> : null}
        <input
          type={type}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
            font: 'var(--text-default)', color: 'var(--text-primary)',
          }}
          {...rest}
        />
      </span>
      {error ? <span style={{ display: 'block', fontSize: 'var(--fs-xs)', color: 'var(--action)', marginTop: 5 }}>{error}</span> : null}
    </label>
  );
}
