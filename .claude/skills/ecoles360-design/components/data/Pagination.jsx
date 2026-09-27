import React from 'react';

/**
 * écoles360 Pagination — page numbers with prev/next. Active page in red.
 * Compact, hairline buttons matching the data tables.
 */
export function Pagination({ page = 1, pageCount = 1, onChange, style = {}, ...rest }) {
  const go = (p) => { if (p >= 1 && p <= pageCount && p !== page) onChange && onChange(p); };
  const pages = [];
  const add = (p) => pages.push(p);
  add(1);
  const lo = Math.max(2, page - 1);
  const hi = Math.min(pageCount - 1, page + 1);
  if (lo > 2) add('…');
  for (let p = lo; p <= hi; p++) add(p);
  if (hi < pageCount - 1) add('…');
  if (pageCount > 1) add(pageCount);

  const cell = (extra = {}) => ({
    minWidth: 36, height: 36, padding: '0 10px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`,
    border: '1px solid var(--border-control)', borderRadius: 'var(--radius-control)',
    background: '#fff', color: 'var(--text-body)', cursor: 'pointer',
    ...extra,
  });

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, ...style }} {...rest}>
      <button type="button" onClick={() => go(page - 1)} disabled={page <= 1}
        style={cell({ opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' })}>‹</button>
      {pages.map((p, i) => p === '…'
        ? <span key={`e${i}`} style={{ color: 'var(--text-muted)', padding: '0 2px' }}>…</span>
        : <button key={p} type="button" onClick={() => go(p)}
            style={cell(p === page
              ? { background: 'var(--action)', borderColor: 'var(--action)', color: '#fff' }
              : {})}>{p}</button>
      )}
      <button type="button" onClick={() => go(page + 1)} disabled={page >= pageCount}
        style={cell({ opacity: page >= pageCount ? 0.4 : 1, cursor: page >= pageCount ? 'not-allowed' : 'pointer' })}>›</button>
    </div>
  );
}
