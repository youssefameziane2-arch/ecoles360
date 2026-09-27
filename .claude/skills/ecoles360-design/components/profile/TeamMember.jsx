import React from 'react';

/**
 * écoles360 TeamMember — staff card for the "Équipe" tab. Photo/monogram avatar,
 * name, and role.
 */
export function TeamMember({ name, role, photo = null, style = {}, ...rest }) {
  const initials = (name || '?').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 13,
      background: 'var(--surface-card)', border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-card)', padding: 14, ...style,
    }} {...rest}>
      <span style={{ width: 48, height: 48, flex: 'none', borderRadius: '50%', overflow: 'hidden', background: photo ? 'var(--surface-image)' : 'var(--e360-navy-tint)', color: 'var(--e360-navy)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: `var(--fw-bold) var(--fs-h3)/1 var(--font-sans)` }}>
        {photo ? <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ font: `var(--fw-semibold) var(--fs-body)/1.2 var(--font-sans)`, color: 'var(--text-primary)' }}>{name}</div>
        <div style={{ font: `var(--fw-regular) var(--fs-xs)/1.3 var(--font-sans)`, color: 'var(--text-muted)', marginTop: 2 }}>{role}</div>
      </div>
    </div>
  );
}
