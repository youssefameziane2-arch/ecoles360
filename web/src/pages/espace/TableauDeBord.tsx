import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { chargerTableauDeBord, type TableauDeBord as Donnees } from '@/api/espace';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { BarChart, Badge, Button, Icon } from '@/ds/composants';
import { formaterDepuis, formaterNombre, formaterNote } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

const MOIS_COURTS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const LIBELLE_CANAL: Record<string, string> = {
  vue: 'Formulaire écoles360',
  vue_sponsorisee: 'Vues sponsorisées',
  appel: 'Appels téléphoniques',
  whatsapp: 'WhatsApp',
};

const COULEUR_CANAL: Record<string, string> = {
  vue: '#E63946',
  vue_sponsorisee: '#C0303C',
  appel: '#1D3557',
  whatsapp: '#2E9E5B',
};

const TON_STATUT: Record<string, 'red' | 'amber' | 'green'> = {
  nouvelle: 'red',
  en_cours: 'amber',
  traitee: 'green',
};

const LIBELLE_STATUT: Record<string, string> = {
  nouvelle: 'Nouveau',
  en_cours: 'En cours',
  traitee: 'Traité',
};

/** Tableau de bord établissement — écran `etablissement/dash` de la maquette. */
export function TableauDeBordEspace() {
  useTitrePage('Tableau de bord');

  return (
    <AvecIdentite
      role={['etablissement', 'secretariat']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="Bonjour 👋"
          sousTitre="Voici l’activité de votre fiche ce mois-ci"
        >
          <Contenu />
        </CoquilleEspace>
      )}
    />
  );
}

function Contenu() {
  const naviguer = useNavigate();
  const donnees = useQuery({ queryKey: ['espace', 'dashboard'], queryFn: chargerTableauDeBord });

  if (donnees.isPending) {
    return <p style={texteDoux}>Chargement…</p>;
  }

  if (donnees.isError || !donnees.data) {
    return <p style={{ ...texteDoux, color: '#E63946' }}>Les indicateurs n’ont pas pu être chargés.</p>;
  }

  const d = donnees.data;
  const contacts = d.canaux.find((canal) => canal.type === 'appel')?.total ?? 0;
  const demandesNouvelles = d.dernieres_demandes.filter((demande) => demande.statut === 'nouvelle').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ---- Les quatre indicateurs ------------------------------------ */}
      <div className="e-kpis">
        <Kpi
          libelle="Vues ce mois"
          valeur={formaterNombre(d.vues_30j)}
          icone="eye"
          teinte="#FDE8EA"
          couleurIcone="#E63946"
        />
        <Kpi
          libelle="Contacts reçus"
          valeur={formaterNombre(d.dernieres_demandes.length + contacts)}
          icone="phone"
          teinte="#E7EDF5"
          couleurIcone="#1D3557"
        />
        <Kpi
          libelle="Note moyenne"
          valeur={formaterNote(d.note_moy)}
          annotation={`${formaterNombre(d.nb_avis)} avis`}
          icone="star"
          teinte="#FCF1DE"
          couleurIcone="#E9A23B"
        />
        <Kpi
          libelle="Abonnement"
          valeur="—"
          annotation="Module de facturation à venir"
          icone="credit-card"
          teinte="#FDE8EA"
          couleurIcone="#E63946"
        />
      </div>

      {/* ---- Tuiles d'accès rapide -------------------------------------- */}
      <div className="e-tuiles">
        <Tuile
          titre="Ma fiche"
          sousTitre="Mettre à jour vos informations"
          icone="pencil"
          onClick={() => naviguer('/espace/fiche')}
        />
        <Tuile
          titre="Avis reçus"
          sousTitre="Lire et répondre"
          icone="star"
          compteur={d.derniers_avis.length}
          onClick={() => naviguer('/espace/avis')}
        />
        <Tuile
          titre="Demandes de contact"
          sousTitre="Parents à rappeler"
          icone="mail"
          compteur={demandesNouvelles}
          onClick={() => naviguer('/espace/demandes')}
        />
      </div>

      {/* ---- Graphique et formule --------------------------------------- */}
      <div className="e-2col">
        <Carte titre="Vues de votre fiche" annotation="6 derniers mois">
          <BarChart
            data={versSeries(d.vues_par_mois)}
            height={220}
            valueFormat={(v) => formaterNombre(v)}
          />
        </Carte>

        <Carte titre="Votre formule">
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.6px' }}>
            Aucun abonnement actif
          </div>
          <p style={{ ...texteDoux, margin: '10px 0 16px', fontSize: 12.5 }}>
            La formule, les vues facturées et les factures s’afficheront ici dès que le module
            de facturation sera en service. Votre conseiller reste l’interlocuteur pour toute
            question de tarif.
          </p>
          <Button variant="navy" size="md" block onClick={() => naviguer('/espace/facturation')}>
            Voir l’abonnement
          </Button>
        </Carte>
      </div>

      {/* ---- Demandes et canaux ----------------------------------------- */}
      <div className="e-2col">
        <Carte
          titre="Dernières demandes de contact"
          action={<Lien onClick={() => naviguer('/espace/demandes')}>Tout voir →</Lien>}
        >
          {d.dernieres_demandes.length === 0 ? (
            <p style={texteDoux}>Aucune demande reçue pour l’instant.</p>
          ) : (
            d.dernieres_demandes.map((demande) => (
              <Ligne key={demande.id}>
                <Pastille texte={demande.parent_nom} fond="#E63946" />
                <span style={{ flex: 1, minWidth: 160 }}>
                  <span style={nomLigne}>{demande.parent_nom}</span>
                  <span style={sousLigne}>{demande.message ?? 'Sans message'}</span>
                </span>
                <Badge tone={TON_STATUT[demande.statut] ?? 'navy'}>
                  {LIBELLE_STATUT[demande.statut] ?? demande.statut}
                </Badge>
              </Ligne>
            ))
          )}
        </Carte>

        <Carte titre="Canaux de contact" annotation="30 jours">
          <Canaux canaux={d.canaux} />
        </Carte>
      </div>

      <Carte
        titre="Derniers avis reçus"
        action={<Lien onClick={() => naviguer('/espace/avis')}>Tout voir →</Lien>}
      >
        {d.derniers_avis.length === 0 ? (
          <p style={texteDoux}>Aucun avis publié pour l’instant.</p>
        ) : (
          d.derniers_avis.map((avis) => (
            <Ligne key={avis.id}>
              <Pastille texte={avis.auteur_nom} fond="#1D3557" />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={nomLigne}>
                  {avis.auteur_nom}{' '}
                  <span style={{ color: '#E9A23B', fontWeight: 600, letterSpacing: 1 }}>
                    {'★'.repeat(avis.note)}
                  </span>
                </span>
                <span style={sousLigne}>{avis.commentaire}</span>
              </span>
              <span style={{ fontSize: 12, color: '#9AA3AF', whiteSpace: 'nowrap' }}>
                {formaterDepuis(avis.depose_le)}
              </span>
            </Ligne>
          ))
        )}
      </Carte>
    </div>
  );
}

/** `2026-03` → `Mar` — l'axe du graphique porte le mois court, comme la maquette. */
function versSeries(mois: Donnees['vues_par_mois']) {
  return mois.map((point) => {
    const index = Number(point.mois.split('-')[1]) - 1;

    return { label: MOIS_COURTS[index] ?? point.mois, value: point.vues };
  });
}

function Canaux({ canaux }: { canaux: Donnees['canaux'] }) {
  const total = canaux.reduce((somme, canal) => somme + canal.total, 0);

  if (total === 0) {
    return <p style={texteDoux}>Aucune interaction enregistrée sur la période.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
      {canaux.map((canal) => {
        const part = Math.round((canal.total / total) * 100);

        return (
          <div key={canal.type}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: 13.5, color: '#3A424E', fontWeight: 500 }}>
                {LIBELLE_CANAL[canal.type] ?? canal.type}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{part} %</span>
            </div>
            <div style={{ height: 8, background: '#F1F3F6', borderRadius: 8, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${part}%`,
                  background: COULEUR_CANAL[canal.type] ?? '#1D3557',
                  borderRadius: 8,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Kpi({
  libelle,
  valeur,
  annotation,
  icone,
  teinte,
  couleurIcone,
}: {
  libelle: string;
  valeur: string;
  annotation?: string;
  icone: string;
  teinte: string;
  couleurIcone: string;
}) {
  return (
    <div style={{ ...carteStyle, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: '#5A6472', fontWeight: 500 }}>{libelle}</div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1px', marginTop: 6 }}>
            {valeur}
          </div>
          {annotation && (
            <div style={{ fontSize: 12, color: '#9AA3AF', marginTop: 4 }}>{annotation}</div>
          )}
        </div>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: teinte,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
          }}
        >
          <Icon name={icone} size={17} color={couleurIcone} />
        </span>
      </div>
    </div>
  );
}

function Tuile({
  titre,
  sousTitre,
  icone,
  compteur,
  onClick,
}: {
  titre: string;
  sousTitre: string;
  icone: string;
  compteur?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...carteStyle,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
        textAlign: 'left',
        font: 'inherit',
        width: '100%',
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: '#F1F3F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        <Icon name={icone} size={17} color="#1D3557" />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700 }}>{titre}</span>
        <span style={{ display: 'block', fontSize: 12, color: '#9AA3AF', marginTop: 2 }}>
          {sousTitre}
        </span>
      </span>
      {compteur ? (
        <span
          style={{
            minWidth: 20,
            height: 20,
            padding: '0 6px',
            borderRadius: 20,
            background: '#E63946',
            color: '#fff',
            fontSize: 11.5,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
          }}
        >
          {compteur}
        </span>
      ) : null}
    </button>
  );
}

function Carte({
  titre,
  annotation,
  action,
  children,
}: {
  titre: string;
  annotation?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={carteStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{titre}</div>
        {annotation && <span style={{ fontSize: 12.5, color: '#9AA3AF' }}>{annotation}</span>}
        {action}
      </div>
      {children}
    </section>
  );
}

function Ligne({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid #F1ECE3',
        flexWrap: 'wrap',
      }}
    >
      {children}
    </div>
  );
}

function Pastille({ texte, fond }: { texte: string; fond: string }) {
  const initiales = texte
    .split(/\s+/)
    .map((mot) => mot[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <span
      style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        background: fond,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 12.5,
        flex: 'none',
      }}
    >
      {initiales}
    </span>
  );
}

function Lien({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: 13,
        color: '#E63946',
        fontWeight: 600,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

const carteStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #EAE6DE',
  borderRadius: 14,
  padding: '22px 24px',
};

const texteDoux: React.CSSProperties = {
  font: "400 13.5px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};

const nomLigne: React.CSSProperties = {
  display: 'block',
  fontSize: 13.5,
  fontWeight: 700,
};

const sousLigne: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#9AA3AF',
  marginTop: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
