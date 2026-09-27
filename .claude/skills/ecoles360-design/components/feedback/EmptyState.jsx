import React from 'react';
import { Icon } from '../core/Icon.jsx';

/**
 * écoles360 EmptyState — centered placeholder for empty lists, no search
 * results, empty inbox. Icon in a soft circle, title, description, optional CTA.
 */
export function EmptyState({ icon = 'inbox', title, description = '', action = null, style = {}, ...rest }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '44px 24px', gap: 6, ...style,
    }} {...rest}>
      <span style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--surface-sunken)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <Icon name={icon} size={28} />
      </span>
      <div style={{ font: `var(--fw-bold) var(--fs-h3)/1.3 var(--font-sans)`, color: 'var(--text-primary)' }}>{title}</div>
      {description ? <div style={{ font: `var(--fw-regular) var(--fs-sm)/1.5 var(--font-sans)`, color: 'var(--text-muted)', maxWidth: 340 }}>{description}</div> : null}
      {action ? <div style={{ marginTop: 12 }}>{action}</div> : null}
    </div>
  );
}
