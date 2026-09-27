import React from 'react';
import { Icon } from '../core/Icon.jsx';

const DEFAULT_TYPES = [
  { key: 'creche', label: 'Crèche', icon: <Icon name="baby" size={26} /> },
  { key: 'primaire', label: 'Primaire', icon: <Icon name="pencil" size={26} /> },
  { key: 'college', label: 'Collège', icon: <Icon name="book-open" size={26} /> },
  { key: 'lycee', label: 'Lycée', icon: <Icon name="graduation-cap" size={26} /> },
  { key: 'universite', label: 'Université', icon: <Icon name="building" size={26} /> },
  { key: 'formation', label: 'Formation', icon: <Icon name="briefcase" size={26} /> },
];

/**
 * écoles360 TypePicker — 6 establishment-type cards (Crèche → Formation).
 * Selected card gets a 1.5px navy border + navy tint. Single or multi select.
 * Icons default to emoji; pass `types` with your own icon nodes to swap to Lucide.
 */
export function TypePicker({ types = DEFAULT_TYPES, value = [], multi = false, onChange, columns = 6, style = {}, ...rest }) {
  const sel = Array.isArray(value) ? value : (value ? [value] : []);
  const toggle = (key) => {
    if (!onChange) return;
    if (multi) onChange(sel.includes(key) ? sel.filter((k) => k !== key) : [...sel, key]);
    else onChange(sel.includes(key) ? [] : [key]);
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 12, ...style }} {...rest}>
      {types.map((t) => {
        const on = sel.includes(t.key);
        return (
          <button key={t.key} type="button" onClick={() => toggle(t.key)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 9,
              padding: '18px 10px', minHeight: 92, cursor: 'pointer',
              background: on ? 'var(--e360-navy-tint)' : 'var(--surface-card)',
              border: on ? '1.5px solid var(--action-secondary)' : '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-field)',
              transition: 'border-color .14s ease, background .14s ease',
            }}>
            <span style={{ display: 'inline-flex', color: on ? 'var(--action-secondary)' : 'var(--text-secondary)', lineHeight: 1 }}>{t.icon}</span>
            <span style={{ font: `${on ? 'var(--fw-semibold)' : 'var(--fw-medium)'} var(--fs-sm)/1 var(--font-sans)`, color: on ? 'var(--action-secondary)' : 'var(--text-body)' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
