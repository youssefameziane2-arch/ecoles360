import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

/**
 * En-tête du site public.
 *
 * Reprend la composition retenue au chantier UI des maquettes : logo, nav,
 * « Connexion » en outline et « Inscrivez-vous » en primaire. Le composant
 * Header du design system est mono-CTA et ne suffisait pas — c'est noté dans
 * le CLAUDE.md de conception.
 */
export function EnTete() {
  const naviguer = useNavigate();
  const [recherche, setRecherche] = useState('');

  const soumettre = (evenement: React.FormEvent) => {
    evenement.preventDefault();
    const q = recherche.trim();
    naviguer(q ? `/etablissements?q=${encodeURIComponent(q)}` : '/etablissements');
  };

  return (
    <header
      style={{
        background: '#fff',
        borderBottom: '1px solid #ECEEF1',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="conteneur"
        style={{ display: 'flex', alignItems: 'center', gap: 24, height: 68 }}
      >
        {/* LE LOGO LIVRÉ, pas un mot-symbole recomposé en CSS. La version à
            encre sombre (`ecoles360-logo.png`) est celle qui tient sur fond
            blanc.

            34 px ET NON 28 : la maquette pose 28, mais son logo n'a pas la
            baseline « ANNUAIRES MAROC » sous le mot, qui mange le tiers de la
            hauteur de l'image livrée. À 28 px, la marque était illisible. */}
        <Link to="/" style={{ flex: 'none', display: 'block' }} aria-label="écoles360 — accueil">
          <img
            src="/ecoles360-logo.png"
            alt="écoles360"
            style={{ height: 34, width: 'auto', display: 'block' }}
          />
        </Link>

        <form onSubmit={soumettre} style={{ flex: 1, maxWidth: 440 }} role="search">
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un établissement, une ville…"
            aria-label="Rechercher un établissement"
            style={{
              width: '100%',
              height: 40,
              padding: '0 14px',
              font: "400 14px/1 'Inter', sans-serif",
              border: '1px solid #E1E5EA',
              borderRadius: 10,
              outline: 'none',
            }}
          />
        </form>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 20, marginLeft: 'auto' }}>
          {/* Quatre entrées, dans l'ordre de la maquette : Accueil,
              Établissements, Blog, À propos. */}
          <Link to="/etablissements" style={{ font: "500 14px/1 'Inter', sans-serif", color: '#2A313B' }}>
            Établissements
          </Link>
          <Link to="/blog" style={{ font: "500 14px/1 'Inter', sans-serif", color: '#2A313B' }}>
            Blog
          </Link>
          <Link to="/a-propos" style={{ font: "500 14px/1 'Inter', sans-serif", color: '#2A313B' }}>
            À propos
          </Link>
          <Link
            to="/connexion"
            style={{
              font: "600 14px/1 'Inter', sans-serif",
              color: '#1D3557',
              border: '1px solid #D4DAE2',
              borderRadius: 10,
              padding: '9px 16px',
            }}
          >
            Connexion
          </Link>
          <Link
            to="/inscription-etablissement"
            style={{
              font: "600 14px/1 'Inter', sans-serif",
              color: '#fff',
              background: '#E63946',
              borderRadius: 10,
              padding: '10px 16px',
            }}
          >
            Inscrivez-vous
          </Link>
        </nav>
      </div>
    </header>
  );
}
