import React from 'react';
import { Icon } from '../core/Icon.jsx';

/**
 * écoles360 ProfileUnavailable — shown over an establishment profile when its
 * page is temporarily offline ("en mise à jour"). Centered card with an icon
 * badge, title, message, optional image slot, and two CTAs (search another /
 * contact). Render as a full-screen overlay (`overlay`, default) that blurs the
 * profile behind it, or inline (`overlay={false}`) inside a container.
 */
export function ProfileUnavailable({
  title = 'Cet établissement est temporairement en mise à jour',
  message = 'La page de cet établissement est en cours de mise à jour sur notre plateforme.',
  note = "Merci pour votre compréhension. N'hésitez pas à nous contacter pour plus d'informations.",
  image = null,
  searchLabel = 'Rechercher un autre établissement',
  contactLabel = 'Nous contacter',
  onSearch, onContact,
  overlay = true,
  style = {}, ...rest
}) {
  const card = (
    <div
      role="alertdialog" aria-label={title}
      style={{
        width: '100%', maxWidth: 520, background: 'var(--surface-card)',
        borderRadius: 'var(--radius-card-lg)', boxShadow: overlay ? 'var(--shadow-pop)' : 'none',
        border: overlay ? 'none' : '1px solid var(--border-hairline)',
        padding: '34px 30px', textAlign: 'center',
        animation: overlay ? 'e360-pop-in var(--dur-slow) var(--ease-out)' : 'none',
        ...(!overlay ? style : {}),
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'var(--e360-navy-tint)', color: 'var(--action-secondary)', marginBottom: 18 }}>
        <Icon name="settings" size={30} />
      </span>
      <h2 style={{ margin: '0 0 10px', font: `var(--fw-extrabold) var(--fs-h1)/1.2 var(--font-sans)`, letterSpacing: 'var(--ls-h1)', color: 'var(--text-primary)', textWrap: 'balance' }}>{title}</h2>
      <p style={{ margin: '0 auto', maxWidth: 380, font: `var(--fw-regular) var(--fs-body-lg)/1.5 var(--font-sans)`, color: 'var(--text-secondary)' }}>{message}</p>

      {image !== false ? (
        <div style={{ margin: '22px 0', height: 150, borderRadius: 'var(--radius-card)', overflow: 'hidden', background: 'var(--surface-image)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-placeholder)' }}>
          {image ? <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="building" size={40} />}
        </div>
      ) : <div style={{ height: 22 }} />}

      {note ? (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, justifyContent: 'center', textAlign: 'left', maxWidth: 420, margin: '0 auto 22px', font: `var(--fw-regular) var(--fs-sm)/1.5 var(--font-sans)`, color: 'var(--text-muted)' }}>
          <span style={{ flex: 'none', color: 'var(--action-secondary)', marginTop: 1 }}><Icon name="info" size={16} /></span>
          <span>{note}</span>
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button type="button" onClick={onSearch} style={btn('var(--action)', '#fff')}>
          <Icon name="search" size={17} /> {searchLabel}
        </button>
        <button type="button" onClick={onContact} style={btn('var(--action-success)', '#fff')}>
          <Icon name="message-circle" size={17} /> {contactLabel}
        </button>
      </div>
    </div>
  );

  if (!overlay) return card;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        background: 'rgba(21,35,58,.38)', backdropFilter: 'blur(6px)',
        animation: 'e360-fade-in var(--dur-base) var(--ease-out)',
        ...style,
      }}
      {...rest}
    >{card}</div>
  );
}

function btn(bg, fg) {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 48, padding: '0 20px', border: 'none', borderRadius: 'var(--radius-control-lg)',
    background: bg, color: fg, cursor: 'pointer',
    font: `var(--fw-semibold) var(--fs-body)/1 var(--font-sans)`, whiteSpace: 'nowrap',
  };
}
