import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { FormulesVisibilite } from '@/components/FormulesVisibilite';
import { useConseillerAffiche } from '@/components/MobilierAssistance';
import { lienTelephone } from '@/lib/telephone';
import { useTitrePage } from '@/lib/titre';

/** Adresse de contact commercial — reprise partout où un établissement doit nous joindre. */
const EMAIL = 'etablissements@ecoles360.com';

/**
 * Inscrire son établissement — livrable 1 (offre) et livrable 12 §5.
 *
 * PAS DE FORMULAIRE ICI, DÉLIBÉRÉMENT. La création de prospect est une route
 * du back-office commercial (lot 5) : aucune API publique ne l'accepte
 * aujourd'hui. Afficher un formulaire qui n'enverrait rien — ou qui afficherait
 * « nous vous recontacterons » sans que personne ne soit prévenu — coûterait
 * exactement ce que cette page cherche à gagner : la confiance d'un directeur
 * d'établissement. On donne donc les deux canaux qui fonctionnent vraiment
 * aujourd'hui, et le formulaire prendra leur place quand la route existera.
 */
export function InscriptionEtablissement() {
  useTitrePage(
    'Inscrire mon établissement',
    'Référencez gratuitement votre établissement privé sur écoles360 et recevez les demandes des parents.',
  );

  /**
   * Le bouton d'une formule mène AU SEUL ENDROIT QUI RÉPOND : le bloc de
   * contact. Tant qu'aucune route publique n'enregistre une demande, « Choisir
   * cet abonnement » ne peut rien choisir — l'emmener ailleurs promettrait une
   * souscription qui n'existe pas.
   */
  const blocContact = useRef<HTMLElement>(null);

  // Le même conseiller que la bannière flottante : deux numéros sur une page
  // laisseraient le directeur choisir celui qui ne répond pas.
  const { numero: numeroConseiller } = useConseillerAffiche();

  return (
    <>
      <div className="conteneur section" style={{ maxWidth: 780 }}>
      <h1 className="titre-section">Inscrire mon établissement</h1>
      <p className="sous-titre-section">
        Le référencement de base est gratuit. Vous ne payez que si vous voulez aller plus loin.
      </p>

      <section style={carte}>
        <h2 style={sousTitre}>Ce que vous obtenez gratuitement</h2>
        <Liste
          elements={[
            'Une fiche publique : nom, adresse, type, niveaux, description et photos.',
            'Votre établissement présent dans les recherches par ville et par type.',
            'Les avis des parents, modérés avant publication, avec un droit de réponse.',
          ]}
        />
      </section>

      <section style={carte}>
        <h2 style={sousTitre}>Ce que l&rsquo;abonnement ajoute</h2>
        <Liste
          elements={[
            'Les demandes de contact des parents, transmises directement.',
            'La mise en avant dans les résultats, signalée par la mention « Sponsorisé ».',
            'Les statistiques de consultation de votre fiche.',
          ]}
        />
        <p style={{ ...paragraphe, marginTop: 14, marginBottom: 0 }}>
          Un abonnement ne modifie jamais votre note ni les avis vous concernant. Nous
          l&rsquo;expliquons en détail sur la page{' '}
          <Link to="/a-propos" style={{ color: '#1D3557', fontWeight: 600 }}>
            À propos
          </Link>
          .
        </p>
      </section>

      </div>

      {/* Pleine largeur : les trois cartes de la maquette ne tiennent pas dans
          la colonne de 780 du reste de la page. */}
      <FormulesVisibilite
        onChoisir={() => blocContact.current?.scrollIntoView({ behavior: 'smooth' })}
      />

      <div className="conteneur section" style={{ maxWidth: 780, paddingTop: 0 }}>
      <section
        ref={blocContact}
        style={{ ...carte, background: '#1D3557', border: 'none', marginTop: 24 }}
      >
        <h2 style={{ ...sousTitre, color: '#fff' }}>Comment s&rsquo;inscrire</h2>
        <p style={{ ...paragraphe, color: '#C6D2E2' }}>
          Écrivez-nous en indiquant le nom de votre établissement, sa ville et un numéro où vous
          joindre. Nous créons votre fiche, la vérifions avec vous, puis la publions.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
          <a
            href={`mailto:${EMAIL}?subject=${encodeURIComponent('Inscription de mon établissement')}`}
            style={{
              font: "600 14px/1 'Inter', sans-serif",
              color: '#fff',
              background: '#E63946',
              borderRadius: 10,
              padding: '13px 20px',
            }}
          >
            {EMAIL}
          </a>
          {/* LE NUMÉRO VIENT DES CONSEILLERS, PAS D'UNE CONSTANTE. Il y avait
              ici « +212 5 22 00 00 00 », qui ne sonne nulle part : un directeur
              d'établissement l'aurait composé. Sans conseiller en base, le
              bouton disparaît — mieux vaut un seul canal qui répond que deux
              dont l'un raccroche. */}
          {numeroConseiller && (
            <a
              href={lienTelephone(numeroConseiller)}
              style={{
                font: "600 14px/1 'Inter', sans-serif",
                color: '#fff',
                border: '1px solid #3C5478',
                borderRadius: 10,
                padding: '13px 20px',
              }}
            >
              {numeroConseiller}
            </a>
          )}
        </div>
      </section>

      <p style={{ ...paragraphe, textAlign: 'center', marginTop: 24 }}>
        Votre établissement est déjà référencé ?{' '}
        <Link to="/connexion" style={{ color: '#1D3557', fontWeight: 600 }}>
          Connectez-vous à votre espace
        </Link>
      </p>
      </div>
    </>
  );
}

function Liste({ elements }: { elements: string[] }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {elements.map((element) => (
        <li
          key={element}
          style={{
            ...paragraphe,
            margin: '0 0 10px',
            paddingLeft: 26,
            position: 'relative',
          }}
        >
          <span style={{ position: 'absolute', left: 0, color: '#2E9E5B', fontWeight: 700 }} aria-hidden>
            ✓
          </span>
          {element}
        </li>
      ))}
    </ul>
  );
}

const carte: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ECEEF1',
  borderRadius: 14,
  padding: 24,
  marginBottom: 18,
};

const sousTitre: React.CSSProperties = {
  font: "700 19px/1.3 'Inter', sans-serif",
  color: '#1D3557',
  margin: '0 0 14px',
};

const paragraphe: React.CSSProperties = {
  font: "400 15px/1.75 'Inter', sans-serif",
  color: '#2A313B',
  margin: '0 0 12px',
};
