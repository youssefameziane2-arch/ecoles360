import { Link, useLocation } from 'react-router-dom';

/**
 * 404 — livrable 13 §3.
 *
 * « Jamais une page nue » : une impasse doit proposer une sortie. Les deux
 * sorties utiles ici sont la recherche et l'accueil, parce qu'un parent arrive
 * presque toujours sur cette page par un lien périmé vers une fiche.
 */
export function Introuvable() {
  const { pathname } = useLocation();

  return (
    <div
      className="conteneur section"
      style={{ textAlign: 'center', padding: '96px 0', maxWidth: 560 }}
    >
      <p
        style={{
          font: "800 64px/1 'Inter', sans-serif",
          letterSpacing: '-2px',
          color: '#D4DAE2',
          margin: '0 0 12px',
        }}
      >
        404
      </p>

      <h1 style={{ font: "800 26px/1.25 'Inter', sans-serif", letterSpacing: '-0.6px', margin: '0 0 10px' }}>
        Cette page n&rsquo;existe pas
      </h1>

      <p style={{ font: "400 15px/1.7 'Inter', sans-serif", color: '#5A6472', margin: '0 0 28px' }}>
        L&rsquo;adresse <code style={code}>{pathname}</code> ne correspond à aucune page. Le lien est
        peut-être périmé, ou l&rsquo;établissement recherché n&rsquo;est plus publié.
      </p>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          to="/etablissements"
          style={{
            font: "600 14px/1 'Inter', sans-serif",
            color: '#fff',
            background: '#E63946',
            borderRadius: 10,
            padding: '12px 20px',
          }}
        >
          Rechercher un établissement
        </Link>
        <Link
          to="/"
          style={{
            font: "600 14px/1 'Inter', sans-serif",
            color: '#1D3557',
            background: '#fff',
            border: '1px solid #D4DAE2',
            borderRadius: 10,
            padding: '12px 20px',
          }}
        >
          Retour à l&rsquo;accueil
        </Link>
      </div>
    </div>
  );
}

const code: React.CSSProperties = {
  font: "500 13px/1 ui-monospace, monospace",
  background: '#ECEEF1',
  borderRadius: 5,
  padding: '3px 6px',
  color: '#2A313B',
  wordBreak: 'break-all',
};
