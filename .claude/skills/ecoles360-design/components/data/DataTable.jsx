import React from 'react';

/**
 * écoles360 DataTable. Uppercase hairline headers, hairline row separators,
 * no shadow. Below `stackAt` (px) it collapses into stacked label/value cards
 * (the wireframe's "tableaux → cartes empilées" rule).
 *
 * columns: [{ key, header, width?, align?, render?(row) }]
 * rows: array of objects
 */
export function DataTable({ columns = [], rows = [], stackAt = 720, rowKey = 'id', style = {}, ...rest }) {
  const [stacked, setStacked] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width:${stackAt}px)`);
    const apply = () => setStacked(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [stackAt]);

  const cellVal = (col, row) => (col.render ? col.render(row) : row[col.key]);

  if (stacked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, ...style }} {...rest}>
        {rows.map((row, i) => (
          <div key={row[rowKey] ?? i} style={{ border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-card)', padding: 14, background: 'var(--surface-card)' }}>
            {columns.map((col) => (
              <div key={col.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '5px 0', alignItems: 'center' }}>
                <span style={{ font: `var(--fw-bold) var(--fs-2xs)/1 var(--font-sans)`, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{col.header}</span>
                <span style={{ font: 'var(--text-default)', color: 'var(--text-body)', textAlign: 'right' }}>{cellVal(col, row)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-card)', overflow: 'hidden', background: 'var(--surface-card)', ...style }} {...rest}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{
                textAlign: col.align || 'left', width: col.width,
                padding: '13px 18px', borderBottom: '1px solid var(--border-hairline)',
                font: `var(--fw-bold) var(--fs-2xs)/1 var(--font-sans)`,
                letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--text-muted)',
              }}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row[rowKey] ?? i}>
              {columns.map((col) => (
                <td key={col.key} style={{
                  textAlign: col.align || 'left',
                  padding: '13px 18px',
                  borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--surface-sunken)',
                  font: 'var(--text-default)', color: 'var(--text-body)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{cellVal(col, row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
