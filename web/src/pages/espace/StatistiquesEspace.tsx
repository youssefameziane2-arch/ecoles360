import { useQuery } from '@tanstack/react-query';
import {
  chargerStatistiquesEspace,
  type ComparaisonMensuelle,
  type SourceTrace,
  type StatistiquesEspace as Donnees,
} from '@/api/espace';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { BarChart, SourceBars } from '@/ds/composants';
import { formaterNombre, MOIS_COURTS } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

/**
 * Libellés des pages d'où partent les clics. Ce ne sont PAS ceux de la
 * maquette (« Recherche par ville », « Mise en avant sponsorisée », « Lien
 * direct ») : une trace dit sur quelle page le parent a cliqué, pas comment
 * il y est arrivé. Reprendre les libellés dessinés ferait dire aux chiffres
 * ce qu'ils ne mesurent pas.
 */
const LIBELLE_SOURCE: Record<Exclude<SourceTrace, null>, string> = {
  resultats: 'Résultats de recherche',
  fiche: 'Page de l’établissement',
  une: 'Accueil — établissements à la une',
};

const TEINTE_SOURCE: Record<Exclude<SourceTrace, null>, 'red' | 'navy' | 'amber'> = {
  resultats: 'red',
  fiche: 'navy',
  une: 'amber',
};

/**
 * Statistiques de la fiche — maquette `isEtabStats`.
 *
 * TROIS TUILES SUR QUATRE. « Taux de contact » n'a pas de définition : la
 * maquette affiche 1,5 % pour 8 420 vues, 312 appels et 126 WhatsApp, et
 * aucun rapport entre ces nombres ne le donne. Le calculer serait choisir une
 * formule à la place du client (B-42).
 */
export function StatistiquesEspace() {
  useTitrePage('Statistiques');

  return (
    <AvecIdentite
      role={['etablissement', 'secretariat']}
      rendu={(identite) => (
        <CoquilleEspace identite={identite} titre="Statistiques" sousTitre="Performance de votre fiche">
          <Contenu />
        </CoquilleEspace>
      )}
    />
  );
}

function Contenu() {
  const statistiques = useQuery({
    queryKey: ['espace', 'statistiques'],
    queryFn: chargerStatistiquesEspace,
  });

  if (statistiques.isPending) {
    return <p style={texteDoux}>Chargement des statistiques…</p>;
  }

  if (statistiques.isError) {
    return (
      <p role="alert" style={{ ...texteDoux, color: 'var(--e360-red)' }}>
        Les statistiques n&rsquo;ont pas pu être chargées. Rechargez la page.
      </p>
    );
  }

  const d = statistiques.data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Trois tuiles, pas quatre : la grille de la maquette laisserait un trou. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <Tuile libelle="Vues ce mois" comparaison={d.indicateurs.vues} />
        <Tuile libelle="Clics « Appeler »" comparaison={d.indicateurs.appels} />
        <Tuile libelle="Contacts WhatsApp" comparaison={d.indicateurs.whatsapp} />
      </div>

      <div className="e-2col">
        <Carte titre="Vues mensuelles" annotation="6 derniers mois">
          {d.total_vues === 0 ? (
            <p style={texteDoux}>Aucune vue de votre fiche sur les six derniers mois.</p>
          ) : (
            <BarChart
              data={versSeries(d.vues_par_mois)}
              height={210}
              valueFormat={(valeur) => formaterNombre(valeur)}
            />
          )}
        </Carte>

        <Carte titre="Origine des contacts" annotation="6 derniers mois">
          <Origines donnees={d} />
        </Carte>
      </div>
    </div>
  );
}

/**
 * L'écart n'est affiché que s'il a un sens : face à un mois précédent vide,
 * toute hausse vaudrait « +∞ % », et un zéro pour zéro ne dit rien.
 */
function Tuile({ libelle, comparaison }: { libelle: string; comparaison: ComparaisonMensuelle }) {
  const { courant, precedent } = comparaison;
  const ecart = precedent > 0 ? Math.round(((courant - precedent) / precedent) * 100) : null;

  return (
    <div style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 16, padding: '20px 22px' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#5A6472', marginBottom: 14 }}>{libelle}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1px', whiteSpace: 'nowrap' }}>
          {formaterNombre(courant)}
        </span>
        {ecart !== null && ecart !== 0 && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: ecart > 0 ? '#2E9E5B' : '#E63946',
              whiteSpace: 'nowrap',
            }}
          >
            {ecart > 0 ? '▲' : '▼'} {formaterNombre(Math.abs(ecart))} %
          </span>
        )}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: '#9AA3AF' }}>
        {ecart === null
          ? 'Rien à comparer le mois dernier'
          : ecart === 0
            ? 'Stable'
            : 'par rapport au mois dernier, à date'}
      </div>
    </div>
  );
}

function Origines({ donnees }: { donnees: Donnees }) {
  if (donnees.total_contacts === 0) {
    return <p style={texteDoux}>Aucun clic « Appeler » ni « WhatsApp » sur les six derniers mois.</p>;
  }

  return (
    <>
      <SourceBars
        data={donnees.origine_contacts.map((ligne) => ({
          label: ligne.source ? LIBELLE_SOURCE[ligne.source] : 'Page non renseignée',
          value: ligne.contacts,
          // Pas de teinte grise dans SourceBars : le vert, que ne porte
          // aucune page, marque ce qui n'en a pas.
          tone: ligne.source ? TEINTE_SOURCE[ligne.source] : 'green',
        }))}
      />
      <p style={{ ...texteDoux, fontSize: 12, marginTop: 16 }}>
        Clics « Appeler » et « WhatsApp », rangés selon la page où ils ont eu lieu.
      </p>
    </>
  );
}

/** L'axe porte le mois court de la maquette — « Juin », pas « 2026-06-01 ». */
function versSeries(points: Donnees['vues_par_mois']) {
  return points.map((point) => ({
    label: MOIS_COURTS[Number(point.debut.slice(5, 7)) - 1] ?? point.debut,
    value: point.vues,
  }));
}

function Carte({
  titre,
  annotation,
  children,
}: {
  titre: string;
  annotation?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 14, padding: '22px 24px', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{titre}</h2>
        {annotation && <span style={{ fontSize: 12.5, color: '#9AA3AF' }}>{annotation}</span>}
      </div>
      {children}
    </section>
  );
}

const texteDoux: React.CSSProperties = {
  font: "400 13.5px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};
