import React from 'react';
import { Icon } from '../core/Icon.jsx';

/**
 * écoles360 RequestCard — an inbound contact request in the établissement /
 * secrétaire inbox. Shows requester, channel, message preview, time, and a
 * status badge: Nouveau (red), En cours (amber), Traité (green).
 */
export function RequestCard({
  name, channel = 'Formulaire', message, time,
  status = 'Nouveau', onOpen, style = {}, ...rest
}) {
  const tones = {
    'Nouveau': { bg: 'var(--e360-red-tint)', fg: 'var(--e360-red-700)' },
    'En cours': { bg: 'var(--e360-amber-tint)', fg: 'var(--e360-amber-700)' },
    'Traité': { bg: 'var(--e360-green-tint)', fg: 'var(--e360-green)' },
  };
  const t = tones[status] || tones['Nouveau'];
  const initials = (name || '?').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const channelIcon = { 'WhatsApp': 'message-circle', 'Appel': 'phone', 'Formulaire': 'mail', 'Email': 'mail' }[channel] || 'mail';

  return (
    <div
      onClick={onOpen}
      style={{
        display: 'flex', gap: 13, alignItems: 'flex-start',
        background: 'var(--surface-card)', border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-card)', padding: 15,
        cursor: onOpen ? 'pointer' : 'default',
        ...style,
      }}
      {...rest}
    >
      <span style={{ width: 40, height: 40, flex: 'none', borderRadius: '50%', background: 'var(--e360-navy-tint)', color: 'var(--e360-navy)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: `var(--fw-bold) var(--fs-sm)/1 var(--font-sans)` }}>{initials}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
          <span style={{ font: `var(--fw-semibold) var(--fs-sm)/1.2 var(--font-sans)`, color: 'var(--text-primary)' }}>{name}</span>
          <span style={{ font: `var(--fw-regular) var(--fs-xs)/1 var(--font-sans)`, color: 'var(--text-muted)', flex: 'none' }}>{time}</span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: `var(--fw-medium) var(--fs-xs)/1 var(--font-sans)`, color: 'var(--text-muted)', marginBottom: 7 }}><Icon name={channelIcon} size={13} /> {channel}</div>
        <p style={{ margin: 0, font: `var(--fw-regular) var(--fs-sm)/1.45 var(--font-sans)`, color: 'var(--text-body)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{message}</p>
        <div style={{ marginTop: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: `var(--fw-semibold) var(--fs-2xs)/1 var(--font-sans)`, background: t.bg, color: t.fg, borderRadius: 'var(--radius-badge)', padding: '4px 9px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.fg }} />{status}
          </span>
        </div>
      </div>
    </div>
  );
}
