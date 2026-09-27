import React from 'react';

/**
 * écoles360 FaqAccordion — expandable Q/A list for the profile / public FAQ.
 * Hairline rows, red chevron when open. Single-open by default.
 * items: [{ q, a }]
 */
export function FaqAccordion({ items = [], defaultOpen = -1, allowMultiple = false, style = {}, ...rest }) {
  const [open, setOpen] = React.useState(allowMultiple ? (defaultOpen >= 0 ? [defaultOpen] : []) : defaultOpen);
  const isOpen = (i) => allowMultiple ? open.includes(i) : open === i;
  const toggle = (i) => {
    if (allowMultiple) setOpen((o) => o.includes(i) ? o.filter((x) => x !== i) : [...o, i]);
    else setOpen((o) => (o === i ? -1 : i));
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, ...style }} {...rest}>
      {items.map((it, i) => {
        const on = isOpen(i);
        return (
          <div key={i} style={{ border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-field)', overflow: 'hidden', background: 'var(--surface-card)' }}>
            <button type="button" onClick={() => toggle(i)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, width: '100%',
                padding: '15px 17px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
                font: `var(--fw-semibold) var(--fs-body)/1.4 var(--font-sans)`, color: 'var(--text-primary)',
              }}>
              {it.q}
              <span style={{ flex: 'none', color: on ? 'var(--action)' : 'var(--text-muted)', fontSize: 16, transform: on ? 'rotate(180deg)' : 'none', transition: 'transform .18s ease' }}>⌄</span>
            </button>
            {on ? (
              <div style={{ padding: '0 17px 16px', font: `var(--fw-regular) var(--fs-sm)/1.55 var(--font-sans)`, color: 'var(--text-body)' }}>{it.a}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
