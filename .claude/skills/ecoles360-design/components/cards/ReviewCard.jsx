import React from 'react';

/**
 * écoles360 ReviewCard — a parent review with ★ rating, body, optional photos,
 * an establishment reply block, and a moderation status badge (admin/secrétaire).
 * Flagged reviews get a red-tinted border.
 */
export function ReviewCard({
  author, date, rating = 5, body,
  reply = null, status = null, flagged = false,
  style = {}, ...rest
}) {
  const stars = '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(0, 5 - rating);
  const statusTones = {
    'Publié': { bg: 'var(--e360-green-tint)', fg: 'var(--e360-green)' },
    'En attente': { bg: 'var(--e360-amber-tint)', fg: 'var(--e360-amber-700)' },
    'Signalé': { bg: 'var(--e360-red-tint)', fg: 'var(--e360-red-700)' },
    'Rejeté': { bg: 'var(--surface-sunken)', fg: 'var(--text-secondary)' },
  };
  const st = status ? (statusTones[status] || statusTones['En attente']) : null;
  const initials = (author || '?').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{
      background: 'var(--surface-card)',
      border: `1px solid ${flagged ? '#F3C9CD' : 'var(--border-hairline)'}`,
      borderRadius: 'var(--radius-card)', padding: 16, ...style,
    }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 10 }}>
        <span style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', background: 'var(--e360-navy-tint)', color: 'var(--e360-navy)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: `var(--fw-bold) var(--fs-sm)/1 var(--font-sans)` }}>{initials}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: `var(--fw-semibold) var(--fs-sm)/1.2 var(--font-sans)`, color: 'var(--text-primary)' }}>{author}</div>
          <div style={{ font: `var(--fw-regular) var(--fs-xs)/1 var(--font-sans)`, color: 'var(--text-muted)', marginTop: 2 }}>{date}</div>
        </div>
        <span style={{ color: 'var(--rating)', font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`, letterSpacing: '1px' }}>{stars}</span>
      </div>
      <p style={{ margin: 0, font: `var(--fw-regular) var(--fs-sm)/1.5 var(--font-sans)`, color: 'var(--text-body)' }}>{body}</p>

      {reply ? (
        <div style={{ marginTop: 12, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-control-lg)', padding: '11px 13px' }}>
          <div style={{ font: `var(--fw-semibold) var(--fs-xs)/1 var(--font-sans)`, color: 'var(--action-secondary)', marginBottom: 5 }}>↩ Réponse de l'établissement</div>
          <div style={{ font: `var(--fw-regular) var(--fs-xs)/1.5 var(--font-sans)`, color: 'var(--text-body)' }}>{reply}</div>
        </div>
      ) : null}

      {st ? (
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: `var(--fw-semibold) var(--fs-2xs)/1 var(--font-sans)`, background: st.bg, color: st.fg, borderRadius: 'var(--radius-badge)', padding: '4px 9px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.fg }} />{status}
          </span>
        </div>
      ) : null}
    </div>
  );
}
