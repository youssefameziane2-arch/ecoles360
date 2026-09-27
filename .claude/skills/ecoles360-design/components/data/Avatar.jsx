import React from 'react';

/**
 * écoles360 Avatar — monogram in a colored circle, or a photo.
 * Color is derived deterministically from the name so the same person is stable.
 */
const PALETTE = [
  { bg: 'var(--e360-navy-tint)',  fg: 'var(--e360-navy)' },
  { bg: 'var(--e360-red-tint)',   fg: 'var(--e360-red-700)' },
  { bg: 'var(--e360-green-tint)', fg: 'var(--e360-green)' },
  { bg: 'var(--e360-amber-tint)', fg: 'var(--e360-amber-700)' },
];

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name = '', src = null, size = 40, style = {}, ...rest }) {
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length;
  const c = PALETTE[idx];
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flex: 'none', width: size, height: size, borderRadius: 'var(--radius-round)',
        overflow: 'hidden',
        background: src ? 'var(--surface-image)' : c.bg,
        color: c.fg,
        font: `var(--fw-bold) ${Math.round(size * 0.36)}px/1 var(--font-sans)`,
        ...style,
      }}
      {...rest}
    >
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(name)}
    </span>
  );
}
