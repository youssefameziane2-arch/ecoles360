import { Link } from 'react-router-dom';

/**
 * À propos — livrable 1 (positionnement) et livrable 12 §5.
 *
 * Cette page porte l'engagement de transparence du produit : un annuaire payé
 * par les établissements doit dire clairement ce qui est sponsorisé et ce qui
 * ne l'est pas. C'est ce qui justifie le badge « Sponsorisé » (RG19) et la
 * modération des avis (RG06) auprès d'un parent qui se demande à qui se fier.
 */
export function APropos() {
  return (
    <div className="conteneur section" style={{ maxWidth: 780 }}>
      <h1 className="titre-section">À propos d&rsquo;écoles360</h1>
      <p className="sous-titre-section">
        L&rsquo;annuaire des établissements scolaires privés au Maroc.
      </p>

      <Section titre="Ce que nous faisons">
        <p style={paragraphe}>
          écoles360 rassemble les crèches, écoles primaires, collèges, lycées, universités et
          centres de formation privés du Maroc sur une seule plateforme. Les parents recherchent par
          ville, par type et par niveau, comparent les établissements, lisent les avis d&rsquo;autres
          familles, et contactent gratuitement celui qui leur convient — sans créer de compte.
        </p>
      </Section>

      <Section titre="Comment nous gagnons notre vie">
        <p style={paragraphe}>
          Notre service est gratuit pour les parents. Il est financé par les établissements qui
          souscrivent un abonnement pour enrichir leur fiche et recevoir les demandes de contact.
        </p>
        <p style={paragraphe}>
          <strong>Un établissement ne peut pas acheter une meilleure note ni faire retirer un avis.</strong>{' '}
          Un abonnement met une fiche en avant dans les résultats — et dans ce cas seulement, elle
          porte la mention <Mention>Sponsorisé</Mention>. Une mise en avant ne remplace jamais les
          autres résultats : elle s&rsquo;y ajoute, en tête, et reste identifiable.
        </p>
      </Section>

      <Section titre="Les avis">
        <p style={paragraphe}>
          Chaque avis est relu avant publication. Nous écartons les contenus injurieux, les propos
          hors sujet et les tentatives manifestes de manipulation — dans les deux sens : un
          établissement qui s&rsquo;auto-félicite comme un concurrent qui le dénigre.
        </p>
        <p style={paragraphe}>
          Un établissement peut répondre publiquement, une fois, à chaque avis le concernant. Cette
          réponse s&rsquo;affiche sous l&rsquo;avis d&rsquo;origine, qui n&rsquo;est ni modifié ni
          masqué. La note moyenne affichée est recalculée à partir des seuls avis publiés.
        </p>
      </Section>

      <Section titre="Vos données">
        <p style={paragraphe}>
          Lorsque vous envoyez une demande de contact, vos coordonnées sont transmises à
          l&rsquo;établissement que vous avez choisi, et à lui seul, afin qu&rsquo;il vous rappelle.
          Nous ne les revendons pas et ne les transmettons à aucun autre établissement. Ce
          traitement s&rsquo;effectue avec votre accord explicite, conformément à la loi 09-08
          relative à la protection des personnes physiques à l&rsquo;égard du traitement des données
          à caractère personnel.
        </p>
        <p style={paragraphe}>
          Pour accéder à vos données, les corriger ou en demander la suppression, écrivez-nous à{' '}
          <a href="mailto:contact@ecoles360.com" style={{ color: '#1D3557', fontWeight: 600 }}>
            contact@ecoles360.com
          </a>
          .
        </p>
      </Section>

      <Section titre="Vous dirigez un établissement ?">
        <p style={paragraphe}>
          L&rsquo;inscription de base est gratuite. Créez votre fiche, elle sera vérifiée puis
          publiée.
        </p>
        <p style={{ margin: '18px 0 0' }}>
          <Link
            to="/inscription-etablissement"
            style={{
              font: "600 14px/1 'Inter', sans-serif",
              color: '#fff',
              background: '#E63946',
              borderRadius: 10,
              padding: '12px 20px',
              display: 'inline-block',
            }}
          >
            Inscrire mon établissement
          </Link>
        </p>
      </Section>
    </div>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: '#fff',
        border: '1px solid #ECEEF1',
        borderRadius: 14,
        padding: 24,
        marginBottom: 18,
      }}
    >
      <h2 style={{ font: "700 19px/1.3 'Inter', sans-serif", color: '#1D3557', margin: '0 0 12px' }}>
        {titre}
      </h2>
      {children}
    </section>
  );
}

/** Rend la mention telle qu'elle apparaît sur les fiches, pour qu'elle soit reconnue. */
function Mention({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        font: "600 11px/1 'Inter', sans-serif",
        padding: '5px 8px',
        borderRadius: 6,
        background: '#FDE8EA',
        color: '#C42B38',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

const paragraphe: React.CSSProperties = {
  font: "400 15px/1.75 'Inter', sans-serif",
  color: '#2A313B',
  margin: '0 0 12px',
};
