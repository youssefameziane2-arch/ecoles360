import React from 'react';

/**
 * écoles360 Wordmark — "écoles360" with the red "360".
 * Default brand lockup when no image logo is supplied. `onDark` flips text white.
 */
export function Wordmark({ size = 22, onDark = false, style = {}, ...rest }) {
  return (
    <span style={{ font: `var(--fw-extrabold) ${size}px/1 var(--font-sans)`, letterSpacing: '-0.5px', color: onDark ? '#fff' : 'var(--text-primary)', whiteSpace: 'nowrap', ...style }} {...rest}>
      écoles<span style={{ color: 'var(--action)' }}>360</span>
    </span>
  );
}

/**
 * écoles360 public Header — logo + horizontal nav + red CTA.
 * Active link is red with a 2px red underline. Collapses to a logo + CTA row
 * (links hidden) below `collapseAt`.
 */
export function Header({
  items = [{ label: 'Accueil', href: '#', active: true }, { label: 'Établissements', href: '#' }, { label: 'Villes', href: '#' }, { label: 'Blog', href: '#' }, { label: 'À propos', href: '#' }],
  cta = 'Inscrire mon établissement',
  onCta,
  logoSrc = null,
  style = {}, ...rest
}) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 30, height: 66, padding: '0 40px',
      background: 'var(--surface-card)', borderBottom: '1px solid var(--border-hairline)',
      ...style,
    }} {...rest}>
      {logoSrc ? <img src={logoSrc} alt="écoles360" style={{ height: 28 }} /> : <Wordmark size={24} />}
      <nav style={{ display: 'flex', gap: 26, alignItems: 'center', height: '100%' }}>
        {items.map((it) => (
          <a key={it.label} href={it.href}
            style={{
              display: 'inline-flex', alignItems: 'center', height: '100%',
              font: `${it.active ? 'var(--fw-semibold)' : 'var(--fw-regular)'} var(--fs-body)/1 var(--font-sans)`,
              color: it.active ? 'var(--action)' : 'var(--text-secondary)',
              textDecoration: 'none',
              boxShadow: it.active ? 'inset 0 -2px 0 var(--action)' : 'none',
            }}>{it.label}</a>
        ))}
      </nav>
      <button type="button" onClick={onCta} style={{
        marginLeft: 'auto', height: 42, padding: '0 18px', border: 'none',
        background: 'var(--action)', color: '#fff', borderRadius: 'var(--radius-control)',
        font: `var(--fw-semibold) var(--fs-body)/1 var(--font-sans)`, cursor: 'pointer', whiteSpace: 'nowrap',
      }}>{cta}</button>
    </header>
  );
}
