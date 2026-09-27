import React from 'react';

/** écoles360 textarea. Matches Input styling; multiline. */
export function Textarea({ label, required = false, placeholder = '', value, defaultValue, rows = 4, disabled = false, onChange, style = {}, ...rest }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <label style={{ display: 'block', font: 'var(--text-default)', ...style }}>
      {label ? (
        <span style={{ display: 'block', fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-body)', marginBottom: 7 }}>
          {label}{required ? <span style={{ color: 'var(--action)', marginLeft: 4 }}>*</span> : null}
        </span>
      ) : null}
      <textarea
        rows={rows}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', resize: 'vertical', padding: '12px 14px',
          background: disabled ? 'var(--surface-sunken)' : '#fff',
          border: `1px solid ${focused ? 'var(--action-secondary)' : 'var(--border-control)'}`,
          borderRadius: 'var(--radius-control-lg)',
          boxShadow: focused ? '0 0 0 3px var(--e360-navy-tint)' : 'none',
          font: 'var(--text-default)', color: 'var(--text-primary)', outline: 'none',
          transition: 'border-color .15s ease, box-shadow .15s ease',
        }}
        {...rest}
      />
    </label>
  );
}
