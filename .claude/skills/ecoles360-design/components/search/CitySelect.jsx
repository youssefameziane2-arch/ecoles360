import React from 'react';
import { Icon } from '../core/Icon.jsx';

const CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan', 'Mohammedia', 'El Jadida'];

/**
 * écoles360 CitySelect — the required city picker that gates every search.
 * Pin icon, red required marker, styled native select with a Morocco city list.
 */
export function CitySelect({ label = 'Ville', value, defaultValue, onChange, cities = CITIES, placeholder = 'Choisir une ville', required = true, style = {}, ...rest }) {
  const [focused, setFocused] = React.useState(false);
  const chosen = value || defaultValue;
  return (
    <label style={{ display: 'block', ...style }}>
      {label ? (
        <span style={{ display: 'block', font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`, color: 'var(--text-body)', marginBottom: 7 }}>
          {label}{required ? <span style={{ color: 'var(--action)', marginLeft: 4 }}>*</span> : null}
        </span>
      ) : null}
      <span style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: 9,
        height: 48, padding: '0 14px', background: '#fff',
        border: `1px solid ${focused ? 'var(--action-secondary)' : 'var(--border-control)'}`,
        borderRadius: 'var(--radius-control-lg)',
        boxShadow: focused ? '0 0 0 3px var(--e360-navy-tint)' : 'none',
        transition: 'border-color .15s ease, box-shadow .15s ease',
      }}>
        <Icon name="map-pin" size={16} color="var(--action)" />
        <select
          value={value} defaultValue={defaultValue}
          onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
            appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer',
            font: 'var(--text-default)', color: chosen ? 'var(--text-primary)' : 'var(--text-muted)',
          }}
          {...rest}
        >
          <option value="">{placeholder}</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <Icon name="chevron-down" size={16} color="var(--text-muted)" style={{ pointerEvents: 'none' }} />
      </span>
    </label>
  );
}
