import React from 'react';

/**
 * écoles360 CityCard — photo with a navy scrim and a count overlay.
 * Used in the "Explorer par ville" grid on the public homepage.
 */
export function CityCard({ city, count, image, height = 150, onClick, style = {}, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative', display: 'block', width: '100%', height,
        border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
        borderRadius: 'var(--radius-card)', overflow: 'hidden',
        background: 'var(--surface-image)',
        ...style,
      }}
      {...rest}
    >
      {image ? <img src={image} alt={city} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
      <span style={{ position: 'absolute', inset: 0, background: 'var(--scrim-navy)' }} />
      <span style={{ position: 'absolute', left: 14, bottom: 12, right: 14 }}>
        <span style={{ display: 'block', font: `var(--fw-bold) var(--fs-h3)/1.1 var(--font-sans)`, color: '#fff' }}>{city}</span>
        {count != null ? <span style={{ display: 'block', font: `var(--fw-medium) var(--fs-xs)/1 var(--font-sans)`, color: 'rgba(255,255,255,.82)', marginTop: 3 }}>{count} établissements</span> : null}
      </span>
    </button>
  );
}
