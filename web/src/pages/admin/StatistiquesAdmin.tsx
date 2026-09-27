import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  chargerStatistiquesAdmin,
  type PeriodeStatistiques,
  type StatistiquesAdmin as Donnees,
} from '@/api/admin';
import { LIBELLE_TYPE, type TypeEtablissement } from '@/api/etablissements';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { CourbeVues } from '@/components/CourbeVues';
import { DataTable, SourceBars } from '@/ds/composants';
import { formaterNombre, formaterNote } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

const PERIODES: { valeur: PeriodeStatistiques; libelle: string }[] = [
  { valeur: '7j', libelle: '7 jours' },
  { valeur: '30j', libelle: '30 jours' },
  { valeur: '90j', libelle: '90 jours' },
  { valeur: '12m', libelle: '12 mois' },
];

const TYPES = Object.keys(LIBELLE_TYPE) as TypeEtablissement[];

/**
 * Statistiques de la plateforme — maquette `isAdminStats`.
 *
 * CE QUI N'Y EST PAS, ET POURQUOI (B-40). La maquette pose six indicateurs et
 * un bloc « Recherches par ville ». Les visites du site, les recherches et le
 * taux de transformation (demandes ÷ recherches) n'ont aucune source : aucune
 * trace ne les compte. Ils sont absents, pas à zéro — un zéro ferait croire
 * que personne ne cherche.
 */
export function StatistiquesAdmin() {
  useTitrePage('Statistiques');

  return (
    <AvecIdentite
      role={['superadmin']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="Statistiques"
          sousTitre="Audience et activité de l’ensemble de la plateforme"
        >
          <Contenu />
        </CoquilleEspace>
      )}
    />
  );
}

function Contenu() {
  const [periode, setPeriode] = useState<PeriodeStatistiques>('30j');
  const [ville, setVille] = useState('');
  const [type, setType] = useState<TypeEtablissement | ''>('');

  const statistiques = useQuery({
    queryKey: ['admin', 'statistiques', periode, ville, type],
    queryFn: () =>
      chargerStatistiquesAdmin({ periode, ville: ville || undefined, type: type || undefined }),
    // Les chiffres précédents restent affichés pendant le changement de
    // filtre : vider l'écran à chaque clic ferait clignoter tous les blocs.
    placeholderData: keepPreviousData,
  });

  const libellePeriode = PERIODES.find((p) => p.valeur === periode)?.libelle ?? '';
  const donnees = statistiques.data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {PERIODES.map((option) => {
          const actif = option.valeur === periode;
          return (
            <button
              key={option.valeur}
              type="button"
              aria-pressed={actif}
              onClick={() => setPeriode(option.valeur)}
              style={{
                border: `1px solid ${actif ? '#1D3557' : '#E1E5EA'}`,
                background: actif ? '#1D3557' : '#fff',
                color: actif ? '#fff' : '#3A424E',
                fontFamily: 'inherit',
                fontSize: 12.5,
                fontWeight: 600,
                padding: '8px 14px',
                borderRadius: 20,
                cursor: 'pointer',
              }}
            >
              {option.libelle}
            </button>
          );
        })}

        <span style={{ flex: 1 }} />

        {/*
          SÉLECTEURS NATIFS, pas le `Select` du design system : c'est un champ
          de formulaire de 48 px qui impose une option « Choisir… », là où la
          maquette pose deux filtres compacts dont la première option est déjà
          « Toutes les villes ».
        */}
        <select
          value={ville}
          onChange={(evenement) => setVille(evenement.target.value)}
          aria-label="Filtrer par ville"
          style={selecteur}
        >
          <option value="">Toutes les villes</option>
          {donnees?.options.villes.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.nom}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(evenement) => setType(evenement.target.value as TypeEtablissement | '')}
          aria-label="Filtrer par type d’établissement"
          style={selecteur}
        >
          <option value="">Tous les types</option>
          {TYPES.map((option) => (
            <option key={option} value={option}>
              {LIBELLE_TYPE[option]}
            </option>
          ))}
        </select>
      </div>

      {statistiques.isPending && (
        <p style={{ fontSize: 14, color: '#9AA3AF' }}>Chargement des statistiques…</p>
      )}

      {statistiques.isError && (
        <p role="alert" style={{ fontSize: 14, color: 'var(--e360-red)' }}>
          Les statistiques n&rsquo;ont pas pu être chargées. Rechargez la page.
        </p>
      )}

      {donnees && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            // Données de l'ancien filtre encore affichées : on le signale.
            opacity: statistiques.isPlaceholderData ? 0.55 : 1,
            transition: 'opacity .15s ease',
          }}
        >
          <Indicateurs donnees={donnees} periode={libellePeriode} />

          <Carte
            titre="Visites du site"
            droite={<span style={{ fontSize: 12, color: '#9AA3AF' }}>vues de fiches — {libellePeriode}</span>}
          >
            <Courbe donnees={donnees} />
          </Carte>

          <div className="e-2col-inverse">
            <Carte titre="Vues par type d’établissement">
              {donnees.vues_par_type.length === 0 ? (
                <Vide>Aucune vue de fiche sur la période.</Vide>
              ) : (
                <SourceBars
                  data={donnees.vues_par_type.map((ligne) => ({
                    label: LIBELLE_TYPE[ligne.type],
                    value: ligne.vues,
                    tone: 'navy' as const,
                  }))}
                />
              )}
            </Carte>

            <Carte
              titre="Top établissements"
              droite={
                <span style={{ fontSize: 12, fontWeight: 600, color: '#9AA3AF' }}>
                  selon les filtres ville / type
                </span>
              }
            >
              <Classement lignes={donnees.top_etablissements} />
            </Carte>
          </div>
        </div>
      )}
    </div>
  );
}

function Indicateurs({ donnees, periode }: { donnees: Donnees; periode: string }) {
  const tuiles = [
    { libelle: 'Vues de fiches', valeur: donnees.indicateurs.vues_fiches },
    { libelle: 'Demandes envoyées', valeur: donnees.indicateurs.demandes },
    { libelle: 'Nouveaux avis', valeur: donnees.indicateurs.nouveaux_avis },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 14 }}>
      {tuiles.map((tuile) => (
        <div
          key={tuile.libelle}
          style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 14, padding: '16px 18px' }}
        >
          <div style={{ fontSize: 12, color: '#9AA3AF', fontWeight: 600 }}>{tuile.libelle}</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.6px', marginTop: 6 }}>
            {formaterNombre(tuile.valeur)}
          </div>
          <div style={{ fontSize: 11.5, color: '#9AA3AF', marginTop: 3 }}>sur {periode}</div>
        </div>
      ))}
    </div>
  );
}

/** Étiquette d'un point — le jour pour les courbes fines, le mois pour l'année. */
function etiquette(debut: string, granularite: Donnees['granularite']): string {
  const date = new Date(`${debut}T00:00:00Z`);

  return granularite === 'mois'
    ? date.toLocaleDateString('fr-FR', { month: 'short', timeZone: 'UTC' })
    : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function Courbe({ donnees }: { donnees: Donnees }) {
  if (donnees.indicateurs.vues_fiches === 0) {
    return <Vide>Aucune vue de fiche sur la période.</Vide>;
  }

  // Six étiquettes au plus sous la courbe, comme la maquette : trente et une
  // dates côte à côte se chevaucheraient.
  const points = donnees.courbe;
  const pas = Math.max(1, Math.ceil(points.length / 6));
  const reperes = points.filter((_, rang) => rang % pas === 0);

  return (
    <>
      <CourbeVues
        points={points.map((point) => point.vues)}
        hauteurVue={210}
        hauteurAffichee={200}
        guides={3}
        libelle={`Vues de fiches par ${donnees.granularite}`}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        {reperes.map((point) => (
          <span key={point.debut} style={{ fontSize: 11, color: '#9AA3AF' }}>
            {etiquette(point.debut, donnees.granularite)}
          </span>
        ))}
      </div>
    </>
  );
}

function Classement({ lignes }: { lignes: Donnees['top_etablissements'] }) {
  if (lignes.length === 0) {
    // Texte de la maquette, mot pour mot.
    return <Vide>Aucun établissement ne correspond aux filtres.</Vide>;
  }

  return (
    <DataTable
      columns={[
        { key: 'rang', header: '#' },
        { key: 'etablissement', header: 'Établissement' },
        { key: 'vues', header: 'Vues', align: 'right' },
        { key: 'contacts', header: 'Contacts', align: 'right' },
        { key: 'note', header: 'Note', align: 'right' },
      ]}
      rows={lignes.map((ligne, rang) => ({
        id: ligne.id,
        rang: <span style={{ fontWeight: 800, color: '#C9D2DE' }}>{String(rang + 1).padStart(2, '0')}</span>,
        etablissement: (
          <span style={{ display: 'block', minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 600 }}>{ligne.nom}</span>
            <span style={{ display: 'block', fontSize: 12, color: '#9AA3AF', marginTop: 2 }}>
              {ligne.ville.nom} · {LIBELLE_TYPE[ligne.type]}
            </span>
          </span>
        ),
        vues: <span style={{ fontWeight: 700 }}>{formaterNombre(ligne.vues)}</span>,
        contacts: formaterNombre(ligne.contacts),
        // Une note sans avis serait un zéro inventé : un tiret, et le titre le dit.
        note:
          ligne.nb_avis > 0 ? (
            <span style={{ color: '#B57708', fontWeight: 700 }}>★ {formaterNote(ligne.note_moy)}</span>
          ) : (
            <span title="Aucun avis publié" style={{ color: '#9AA3AF' }}>
              —
            </span>
          ),
      }))}
    />
  );
}

function Carte({
  titre,
  droite,
  children,
}: {
  titre: string;
  droite?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 14, padding: '22px 24px', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{titre}</h2>
        {droite}
      </div>
      {children}
    </section>
  );
}

function Vide({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: '#9AA3AF' }}>{children}</p>;
}

const selecteur: React.CSSProperties = {
  border: '1px solid #E1E5EA',
  borderRadius: 10,
  fontFamily: 'inherit',
  fontSize: 12.5,
  fontWeight: 600,
  color: '#3A424E',
  padding: '8px 11px',
  background: '#fff',
  cursor: 'pointer',
};
