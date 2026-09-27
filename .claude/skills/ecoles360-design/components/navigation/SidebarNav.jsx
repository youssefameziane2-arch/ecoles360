import React from 'react';

/**
 * écoles360 SidebarNav — dark back-office sidebar (#15233A) for the three
 * spaces: Établissement, Secrétariat, Administration.
 * Active item = solid red fill. Counter badges on the right. Profile in footer.
 *
 * theme only swaps the eyebrow label/accent context; the surface stays navy.
 * items: [{ key, label, icon, count? }]
 */
export function SidebarNav({
  theme = 'etablissement',
  items = [],
  activeKey,
  onSelect,
  user = { name: 'Sara Bennani', role: 'Établissement' },
  logoSrc = null,
  width = 248,
  style = {}, ...rest
}) {
  const themes = {
    etablissement: 'Espace établissement',
    secretariat: 'Espace secrétariat',
    administration: 'Back-office admin',
  };
  const eyebrow = themes[theme] || themes.etablissement;
  const initials = (user.name || '?').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <aside style={{
      display: 'flex', flexDirection: 'column', width, flex: 'none', minHeight: '100%',
      background: 'var(--surface-dark)', color: '#fff', padding: '20px 14px',
      ...style,
    }} {...rest}>
      <div style={{ padding: '4px 10px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {logoSrc ? <img src={logoSrc} alt="écoles360" style={{ height: 24, alignSelf: 'flex-start' }} />
          : <span style={{ font: `var(--fw-extrabold) 22px/1 var(--font-sans)`, letterSpacing: '-0.5px', color: '#fff' }}>écoles<span style={{ color: 'var(--action)' }}>360</span></span>}
        <span style={{ font: `var(--fw-bold) var(--fs-2xs)/1 var(--font-sans)`, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--e360-navy-faint)' }}>{eyebrow}</span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {items.map((it) => {
          const active = it.key === activeKey;
          return (
            <button key={it.key} type="button" onClick={() => onSelect && onSelect(it.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 11, width: '100%',
                minHeight: 44, padding: '0 12px', border: 'none', textAlign: 'left',
                borderRadius: 'var(--radius-control)', cursor: 'pointer',
                background: active ? 'var(--action)' : 'transparent',
                color: active ? '#fff' : 'var(--e360-navy-soft)',
                font: `${active ? 'var(--fw-semibold)' : 'var(--fw-medium)'} var(--fs-body)/1 var(--font-sans)`,
                transition: 'background .14s ease, color .14s ease',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.06)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              {it.icon ? <span style={{ width: 18, textAlign: 'center', fontSize: 15 }}>{it.icon}</span> : null}
              <span style={{ flex: 1 }}>{it.label}</span>
              {it.count != null ? (
                <span style={{
                  minWidth: 20, height: 20, padding: '0 6px', borderRadius: 'var(--radius-pill)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  font: `var(--fw-bold) var(--fs-2xs)/1 var(--font-sans)`,
                  background: active ? 'rgba(255,255,255,.22)' : 'var(--action)', color: '#fff',
                }}>{it.count}</span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.10)', display: 'flex', alignItems: 'center', gap: 11 }}>
        <span style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', background: 'rgba(255,255,255,.12)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: `var(--fw-bold) var(--fs-sm)/1 var(--font-sans)` }}>{initials}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: `var(--fw-semibold) var(--fs-sm)/1.2 var(--font-sans)`, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
          <div style={{ font: `var(--fw-regular) var(--fs-xs)/1 var(--font-sans)`, color: 'var(--e360-navy-faint)', marginTop: 2 }}>{user.role}</div>
        </div>
      </div>
    </aside>
  );
}
