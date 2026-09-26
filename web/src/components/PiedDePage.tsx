import { Link } from 'react-router-dom';

/** Un lien de colonne — même graisse, même couleur, même interligne partout. */
const lienStyle = {
  font: "400 14px/1 'Inter', sans-serif",
  color: '#AFC0D6',
} as const;

const titreColonneStyle = {
  font: "700 12px/1 'Inter', sans-serif",
  letterSpacing: '.6px',
  textTransform: 'uppercase',
  color: '#fff',
  margin: '0 0 16px',
} as const;

/**
 * Pied de page du site public — porté de la maquette.
 *
 * QUATRE COLONNES, PAS TROIS : marque, Parents, Établissements, Aide. La
 * colonne « Aide » porte la FAQ et les pages légales — c'est le seul endroit
 * du site où un visiteur les trouve, et elles sont exigées par la loi 09-08
 * pour un service qui collecte des coordonnées (RG09).
 *
 * LES PAGES LÉGALES NE SONT PAS ENCORE ÉCRITES : leurs liens manquent donc
 * volontairement plutôt que de mener à une page vide. Le texte (mentions,
 * confidentialité, cookies, CGU) relève du client, pas du développement — il
 * engage l'éditeur du site.
 */
export function PiedDePage() {
  return (
    <footer style={{ background: '#15233A', color: '#fff', marginTop: 0 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '60px 32px 28px' }}>
        <div className="e3-footer-grille">
          <div>
            {/* Fond navy : c'est la version claire du logo qui s'y lit
                (`ecoles360-logo-dark.png` — « dark » désigne le fond, pas
                l'encre). 44 px, comme la maquette. */}
            <img
              src="/ecoles360-logo-dark.png"
              alt="écoles360 — Annuaires Maroc"
              style={{ height: 44, width: 'auto', display: 'block', marginBottom: 18 }}
            />
            <p
              style={{
                margin: '0 0 20px',
                color: '#AFC0D6',
                font: "400 14px/1.65 'Inter', sans-serif",
                maxWidth: 300,
              }}
            >
              L&rsquo;annuaire de référence des établissements scolaires privés au Maroc.
              Recherchez, comparez et contactez en toute confiance.
            </p>
          </div>

          <div>
            <p style={titreColonneStyle}>Parents</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              <Link to="/etablissements" style={lienStyle}>
                Rechercher
              </Link>
              <Link to="/blog" style={lienStyle}>
                Blog
              </Link>
              <Link to="/a-propos" style={lienStyle}>
                À propos
              </Link>
            </div>
          </div>

          <div>
            <p style={titreColonneStyle}>Établissements</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              <Link to="/inscription-etablissement" style={lienStyle}>
                Inscrire mon établissement
              </Link>
              <Link to="/inscription-etablissement#formules" style={lienStyle}>
                Formules &amp; tarifs
              </Link>
              <Link to="/connexion" style={lienStyle}>
                Espace pro
              </Link>
            </div>
          </div>

          <div>
            <p style={titreColonneStyle}>Aide</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              <Link to="/faq" style={lienStyle}>
                FAQ
              </Link>
              <a href="mailto:contact@ecoles360.com" style={lienStyle}>
                Nous contacter
              </a>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 44,
            paddingTop: 22,
            borderTop: '1px solid rgba(255,255,255,.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            font: "400 13px/1.5 'Inter', sans-serif",
            color: '#7E8CA0',
          }}
        >
          <span>© {new Date().getFullYear()} écoles360. Tous droits réservés.</span>
          <span>Casablanca, Maroc</span>
        </div>
      </div>
    </footer>
  );
}
