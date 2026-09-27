import React from 'react';
import { Icon } from '../core/Icon.jsx';

/**
 * écoles360 EstablishmentCard — the core result/listing card.
 * Sponsored cards carry a 4px red left border + "Sponsorisé" badge.
 * Verified shows a green "✓ Vérifié" badge. ★ rating in amber.
 * layout="grid" (image on top) or "row" (image left, actions right).
 */
export function EstablishmentCard({
  name, city, type, rating, reviews,
  image, sponsored = false, verified = false,
  price = null, tags = [], layout = 'grid',
  onCall, onWhatsApp, onView, style = {}, ...rest
}) {
  const Stars = () => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--rating)', font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)` }}><Icon name="star" size={14} /> {rating}</span>
      {reviews != null ? <span style={{ color: 'var(--text-muted)', font: `var(--fw-regular) var(--fs-xs)/1 var(--font-sans)` }}>({reviews} avis)</span> : null}
    </span>
  );

  const badges = (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {sponsored ? <span style={chip('var(--e360-red-tint)', 'var(--e360-red-700)')}>Sponsorisé</span> : null}
      {verified ? <span style={chip('var(--e360-green-tint)', 'var(--e360-green)')}><Icon name="check" size={12} /> Vérifié</span> : null}
    </div>
  );

  const actions = (
    <div style={{ display: 'flex', gap: 7 }}>
      <button type="button" onClick={onCall} style={actionBtn('var(--action-secondary)', '#fff')}><Icon name="phone" size={16} /> Appeler</button>
      <button type="button" onClick={onWhatsApp} style={actionBtn('var(--action-success)', '#fff')}><Icon name="message-circle" size={16} /> WhatsApp</button>
    </div>
  );

  const wrap = {
    display: 'flex',
    flexDirection: layout === 'row' ? 'row' : 'column',
    gap: layout === 'row' ? 18 : 0,
    alignItems: layout === 'row' ? 'center' : 'stretch',
    background: 'var(--surface-card)',
    border: '1px solid var(--border-hairline)',
    borderLeft: sponsored ? '4px solid var(--action)' : '1px solid var(--border-hairline)',
    borderRadius: 'var(--radius-card)',
    overflow: 'hidden',
    padding: layout === 'row' ? 16 : 0,
    ...style,
  };

  const img = (
    <div style={{
      flex: 'none',
      width: layout === 'row' ? 150 : '100%',
      height: layout === 'row' ? 104 : 140,
      background: 'var(--surface-image)', borderRadius: layout === 'row' ? 'var(--radius-control-lg)' : 0,
      position: 'relative', overflow: 'hidden',
    }}>
      {image ? <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
      {layout === 'grid' ? <div style={{ position: 'absolute', top: 10, left: 10 }}>{badges}</div> : null}
    </div>
  );

  return (
    <div style={wrap} {...rest}>
      {img}
      <div style={{ flex: 1, padding: layout === 'row' ? 0 : 14, minWidth: 0 }}>
        {layout === 'row' ? <div style={{ marginBottom: 6 }}>{badges}</div> : null}
        <div style={{ font: `var(--fw-bold) var(--fs-h3)/1.25 var(--font-sans)`, color: 'var(--text-primary)', marginBottom: 3 }}>{name}</div>
        <div style={{ font: `var(--fw-regular) var(--fs-xs)/1 var(--font-sans)`, color: 'var(--text-muted)', marginBottom: 9 }}>{city}{type ? ` · ${type}` : ''}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11, gap: 8 }}>
          <Stars />
          {price ? <span style={{ font: `var(--fw-bold) var(--fs-sm)/1 var(--font-sans)`, color: 'var(--text-body)' }}>{price}</span> : null}
        </div>
        {tags.length ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 11 }}>
            {tags.map((t) => <span key={t} style={{ font: `var(--fw-medium) var(--fs-xs)/1 var(--font-sans)`, color: 'var(--text-secondary)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-pill)', padding: '5px 10px' }}>{t}</span>)}
          </div>
        ) : null}
        {actions}
        {onView ? <button type="button" onClick={onView} style={{ ...ghostBtn, marginTop: 7, width: '100%' }}>Voir la fiche</button> : null}
      </div>
    </div>
  );
}

function chip(bg, fg) {
  return { display: 'inline-flex', alignItems: 'center', gap: 4, font: `var(--fw-semibold) var(--fs-2xs)/1 var(--font-sans)`, background: bg, color: fg, borderRadius: 'var(--radius-badge)', padding: '4px 8px', whiteSpace: 'nowrap' };
}
function actionBtn(bg, fg) {
  return { flex: 1, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: bg, color: fg, border: 'none', borderRadius: 'var(--radius-control)', font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`, cursor: 'pointer' };
}
const ghostBtn = { height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-control)', borderRadius: 'var(--radius-control)', font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`, cursor: 'pointer' };
