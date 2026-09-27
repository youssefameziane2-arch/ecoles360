import React from 'react';
import { Icon } from '../core/Icon.jsx';

const DEFAULTS = {
  whatsapp: { label: 'WhatsApp', icon: 'message-circle', bg: 'var(--e360-green-tint)', fg: 'var(--e360-green)' },
  phone: { label: 'Téléphone', icon: 'phone', bg: 'var(--e360-navy-tint)', fg: 'var(--e360-navy)' },
  website: { label: 'Site web', icon: 'globe', bg: 'var(--e360-navy-tint)', fg: 'var(--e360-navy)' },
  facebook: { label: 'Facebook', icon: 'users', bg: 'var(--e360-navy-tint)', fg: 'var(--e360-navy)' },
  instagram: { label: 'Instagram', icon: 'heart', bg: 'var(--e360-red-tint)', fg: 'var(--e360-red-700)' },
  email: { label: 'Email', icon: 'mail', bg: 'var(--e360-navy-tint)', fg: 'var(--e360-navy)' },
};

/**
 * écoles360 SocialLinks — row of contact / social channel chips on a profile.
 * links: [{ type, href }] where type maps to a known channel, or
 *        [{ label, glyph, href }] for a custom node.
 */
export function SocialLinks({ links = [], size = 40, style = {}, ...rest }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, ...style }} {...rest}>
      {links.map((l, i) => {
        const d = DEFAULTS[l.type] || {};
        const label = l.label || d.label || l.type;
        const content = l.glyph != null ? l.glyph : (d.icon ? <Icon name={d.icon} size={Math.round(size * 0.45)} /> : <Icon name="external-link" size={Math.round(size * 0.45)} />);
        return (
          <a key={i} href={l.href || '#'} title={label} aria-label={label}
            style={{
              width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--radius-control-lg)', textDecoration: 'none', fontSize: 16,
              background: d.bg || 'var(--surface-sunken)', color: d.fg || 'var(--text-body)',
              border: '1px solid var(--border-hairline)',
            }}>{content}</a>
        );
      })}
    </div>
  );
}
