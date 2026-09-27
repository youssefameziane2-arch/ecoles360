import React from 'react';

/**
 * écoles360 VideoEmbed — thumbnail with a red play button overlay for the
 * profile "À propos" presentation video. Clicking swaps in the iframe.
 */
export function VideoEmbed({ src, poster = null, title = 'Vidéo de présentation', ratio = '16 / 9', style = {}, ...rest }) {
  const [playing, setPlaying] = React.useState(false);
  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: ratio,
      background: 'var(--surface-image)', borderRadius: 'var(--radius-card)', overflow: 'hidden',
      ...style,
    }} {...rest}>
      {playing && src ? (
        <iframe src={src} title={title} allow="autoplay; encrypted-media; fullscreen" allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label={title}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }}>
          {poster ? <img src={poster} alt={title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
          <span style={{ position: 'absolute', inset: 0, background: 'var(--scrim-card)' }} />
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 60, height: 60, borderRadius: '50%', background: 'var(--action)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, paddingLeft: 4, boxShadow: '0 6px 20px rgba(230,57,70,.45)' }}>▶</span>
          <span style={{ position: 'absolute', left: 16, bottom: 14, font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`, color: '#fff' }}>{title}</span>
        </button>
      )}
    </div>
  );
}
