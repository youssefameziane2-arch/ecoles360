import React from 'react';

/**
 * écoles360 status Badge. Soft-tint pill for statuses: Sponsorisé, Vérifié,
 * Nouveau, En cours, Traité, Payée, Solde bas, etc.
 * Tones map to the brand semantic palette.
 */
export function Badge({ children, tone = 'navy', solid = false, dot = false, icon = null, style = {}, ...rest }) {
  const tones = {
    red:    { tint: 'var(--e360-red-tint)',   fg: 'var(--e360-red-700)',   solidBg: 'var(--action)' },
    navy:   { tint: 'var(--e360-navy-tint)',  fg: 'var(--e360-navy)',      solidBg: 'var(--action-secondary)' },
    green:  { tint: 'var(--e360-green-tint)', fg: 'var(--e360-green)',     solidBg: 'var(--action-success)' },
    amber:  { tint: 'var(--e360-amber-tint)', fg: 'var(--e360-amber-700)', solidBg: 'var(--e360-amber)' },
    grey:   { tint: 'var(--surface-sunken)',  fg: 'var(--text-secondary)', solidBg: 'var(--text-secondary)' },
  };
  const t = tones[tone] || tones.navy;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 9px',
        font: `var(--fw-semibold) var(--fs-2xs)/1 var(--font-sans)`,
        letterSpacing: '.1px',
        borderRadius: 'var(--radius-badge)',
        background: solid ? t.solidBg : t.tint,
        color: solid ? '#fff' : t.fg,
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {dot ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: solid ? '#fff' : t.fg }} /> : null}
      {icon}
      {children}
    </span>
  );
}
