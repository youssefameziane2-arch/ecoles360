import React from 'react';

/**
 * écoles360 select. Native <select> styled to match Input, with a chevron.
 * Used for City (required), sort order, filière, etc.
 */
export function Select({
  label,
  required = false,
  value,
  defaultValue,
  onChange,
  options = [],
  placeholder = 'Choisir…',
  icon = null,
  disabled = false,
  style = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <label style={{ display: 'block', font: 'var(--text-default)', ...style }}>
      {label ? (
        <span style={{ display: 'block', fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-body)', marginBottom: 7 }}>
          {label}{required ? <span style={{ color: 'var(--action)', marginLeft: 4 }}>*</span> : null}
        </span>
      ) : null}
      <span style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: 9,
        height: 48, padding: '0 14px',
        background: disabled ? 'var(--surface-sunken)' : '#fff',
        border: `1px solid ${focused ? 'var(--action-secondary)' : 'var(--border-control)'}`,
        borderRadius: 'var(--radius-control-lg)',
        boxShadow: focused ? '0 0 0 3px var(--e360-navy-tint)' : 'none',
        transition: 'border-color .15s ease, box-shadow .15s ease',
      }}>
        {icon ? <span style={{ display: 'inline-flex', color: 'var(--text-muted)' }}>{icon}</span> : null}
        <select
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
            appearance: 'none', WebkitAppearance: 'none',
            font: 'var(--text-default)', color: value || defaultValue ? 'var(--text-primary)' : 'var(--text-muted)',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
          {...rest}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{ pointerEvents: 'none', color: 'var(--text-muted)', fontSize: 12 }}>⌄</span>
      </span>
    </label>
  );
}
