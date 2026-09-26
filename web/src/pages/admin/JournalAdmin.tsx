import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  chargerDomainesAudit,
  chargerJournal,
  chargerStatistiquesAudit,
  COULEUR_SEVERITE,
  libelleAction,
  LIBELLE_ROLE_ACTEUR,
  type EntreeAudit,
} from '@/api/audit';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { Button } from '@/ds/composants';
import { formaterDateHeure, formaterNombre, formaterNote } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

const TOUS = 'Tous';

/** Teinte de la barre d'activité, par profil — mêmes couleurs que les menus. */
const COULEUR_PROFIL: Record<string, string> = {
  superadmin: '#E63946',
  secretariat: '#1D3557',
  commercial: '#E9A23B',
  etablissement: '#2E9E5B',
  systeme: '#9AA3AF',
};

/**
 * Journal d'audit — écran `isAdminJournal` de la maquette, RG15, RG26.
 *
 * TROIS BLOCS, dans l'ordre de la maquette : l'activité par profil, les
 * statistiques par établissement, et le journal lui-même.
 *
 * AUCUNE ACTION SUR CET ÉCRAN, ET C'EST VOLONTAIRE (RG26). Pas de suppression,
 * pas d'édition, pas même un archivage : un registre qu'on peut retoucher ne
 * prouve rien. C'est précisément son immuabilité qui permet de trancher le
 * jour où un établissement conteste le rejet d'un de ses avis.
 */
export function JournalAdmin() {
  useTitrePage('Journal d’audit');

  return (
    <AvecIdentite
      role={['superadmin']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="Journal d’audit"
          sousTitre="Traçabilité des actions et activité par profil — lecture seule"
        >
          <Contenu />
        </CoquilleEspace>
      )}
    />
  );
}

function Contenu() {
  const [domaine, setDomaine] = useState(TOUS);
  const [page, setPage] = useState(1);

  const stats = useQuery({
    queryKey: ['admin', 'audit', 'statistiques'],
    queryFn: chargerStatistiquesAudit,
  });
  const domaines = useQuery({
    queryKey: ['admin', 'audit', 'domaines'],
    queryFn: chargerDomainesAudit,
  });
  const journal = useQuery({
    queryKey: ['admin', 'audit', domaine, page],
    queryFn: () => chargerJournal({ domaine: domaine === TOUS ? undefined : domaine, page }),
  });

  const profils = stats.data?.activite_par_profil ?? [];
  const maximum = Math.max(1, ...profils.map((p) => p.actions));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1000 }}>
      <div className="e3-journal-tete" style={{ display: 'grid', gap: 20, alignItems: 'start' }}>
        <Carte titre="Activité par profil" sousTitre="Actions enregistrées ce mois-ci">
          {profils.length === 0 && (
            <p style={texteDoux}>Aucune action enregistrée depuis le début du mois.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {profils.map((profil) => (
              <div key={profil.role}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <span style={{ font: "600 13px/1.3 'Inter', sans-serif", color: '#3A424E' }}>
                    {LIBELLE_ROLE_ACTEUR[profil.role] ?? profil.role}
                  </span>
                  <span style={{ font: "800 13px/1 'Inter', sans-serif", color: '#1D3557' }}>
                    {formaterNombre(profil.actions)}
                  </span>
                </div>
                <div
                  style={{ height: 8, background: '#F1F3F6', borderRadius: 8, overflow: 'hidden' }}
                >
                  <div
                    style={{
                      height: '100%',
                      // Barre relative au profil le plus actif : en absolu, un
                      // mois calme afficherait cinq traits invisibles.
                      width: `${Math.round((profil.actions / maximum) * 100)}%`,
                      background: COULEUR_PROFIL[profil.role] ?? '#1D3557',
                      borderRadius: 8,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Carte>

        <Carte titre="Statistiques par établissement">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <Entete>Établissement</Entete>
                  <Entete droite>Vues</Entete>
                  <Entete droite>Clics</Entete>
                  <Entete droite>Contacts</Entete>
                  <Entete droite>Avis</Entete>
                </tr>
              </thead>
              <tbody>
                {stats.data?.par_etablissement.map((e) => (
                  <tr key={e.id} style={{ borderTop: '1px solid #F1ECE3' }}>
                    <td style={{ font: "600 13px/1.4 'Inter', sans-serif", padding: '11px 8px 11px 0' }}>
                      {e.nom}
                    </td>
                    <Cellule>{formaterNombre(e.vues)}</Cellule>
                    <Cellule>{formaterNombre(e.clics)}</Cellule>
                    <Cellule>{formaterNombre(e.contacts)}</Cellule>
                    <td
                      style={{
                        font: "700 13px/1.4 'Inter', sans-serif",
                        textAlign: 'right',
                        padding: '11px 0 11px 8px',
                        color: '#E9A23B',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {e.avis > 0 ? `★ ${formaterNote(e.note)} (${e.avis})` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Carte>
      </div>

      <Carte
        titre="Journal d’audit"
        entete={
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {[TOUS, ...(domaines.data ?? [])].map((nom) => {
              const choisi = nom === domaine;

              return (
                <button
                  key={nom}
                  type="button"
                  onClick={() => {
                    setDomaine(nom);
                    setPage(1);
                  }}
                  style={{
                    cursor: 'pointer',
                    font: "600 12px/1 'Inter', sans-serif",
                    padding: '6px 12px',
                    borderRadius: 20,
                    border: `1px solid ${choisi ? '#1D3557' : '#EAE6DE'}`,
                    background: choisi ? '#1D3557' : '#fff',
                    color: choisi ? '#fff' : '#5A6472',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {nom}
                </button>
              );
            })}
          </div>
        }
      >
        {journal.isPending && <p style={texteDoux}>Chargement…</p>}

        {journal.data?.data.length === 0 && (
          <p style={texteDoux}>Aucune action enregistrée dans ce domaine.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {journal.data?.data.map((entree) => (
            <Ligne key={entree.id} entree={entree} />
          ))}
        </div>

        {journal.data && journal.data.meta.total_pages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 16,
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Précédent
            </Button>
            <span style={{ ...texteDoux, fontSize: 13 }}>
              Page {journal.data.meta.page} sur {journal.data.meta.total_pages} —{' '}
              {formaterNombre(journal.data.meta.total)} action
              {journal.data.meta.total > 1 ? 's' : ''}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= journal.data.meta.total_pages}
              onClick={() => setPage(page + 1)}
            >
              Suivant
            </Button>
          </div>
        )}
      </Carte>

      <p style={{ ...texteDoux, fontSize: 12.5 }}>
        Le journal est en lecture seule : aucune entrée ne peut être modifiée ni supprimée
        (RG26). C’est ce qui lui donne sa valeur de preuve.
      </p>
    </div>
  );
}

function Ligne({ entree }: { entree: EntreeAudit }) {
  const details = entree.details ?? {};
  const motif = typeof details.motif === 'string' ? details.motif : null;
  const cible =
    typeof details.titre === 'string'
      ? details.titre
      : typeof details.question === 'string'
        ? details.question
        : typeof details.cle === 'string'
          ? details.cle
          : `${entree.cible_type} #${entree.cible_id}`;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        padding: '12px 0',
        borderBottom: '1px solid #F1ECE3',
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: COULEUR_SEVERITE[entree.severite],
          flex: 'none',
        }}
        aria-hidden
      />

      <div style={{ minWidth: 150 }}>
        <div style={{ font: "700 13.5px/1.3 'Inter', sans-serif" }}>
          {entree.user?.name ?? 'Système'}
        </div>
        <div style={{ font: "400 11.5px/1.3 'Inter', sans-serif", color: '#9AA3AF' }}>
          {LIBELLE_ROLE_ACTEUR[entree.role_acteur] ?? entree.role_acteur}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 200 }}>
        <span style={{ font: "600 13.5px/1.4 'Inter', sans-serif", color: '#1D3557' }}>
          {libelleAction(entree.action)}
        </span>{' '}
        <span style={{ font: "400 13px/1.4 'Inter', sans-serif", color: '#5A6472' }}>· {cible}</span>
        {/* LE MOTIF EST RENDU ICI : c'est ce qui distingue un rejet motivé
            d'une censure, et c'est tout l'intérêt de consulter le journal. */}
        {motif && (
          <div style={{ font: "400 12.5px/1.5 'Inter', sans-serif", color: '#9AA3AF', marginTop: 2 }}>
            « {motif} »
          </div>
        )}
      </div>

      <span
        style={{
          font: "400 12px/1.4 'Inter', sans-serif",
          color: '#9AA3AF',
          whiteSpace: 'nowrap',
        }}
      >
        {formaterDateHeure(entree.cree_le)}
      </span>
    </div>
  );
}

function Carte({
  titre,
  sousTitre,
  entete,
  children,
}: {
  titre: string;
  sousTitre?: string;
  entete?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #EAE6DE',
        borderRadius: 14,
        padding: '22px 24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: sousTitre ? 4 : 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ font: "700 16px/1.3 'Inter', sans-serif" }}>{titre}</div>
        {entete}
      </div>
      {sousTitre && (
        <div
          style={{
            font: "400 12.5px/1.4 'Inter', sans-serif",
            color: '#9AA3AF',
            marginBottom: 16,
          }}
        >
          {sousTitre}
        </div>
      )}
      {children}
    </div>
  );
}

function Entete({ children, droite }: { children: React.ReactNode; droite?: boolean }) {
  return (
    <th
      style={{
        font: "700 11px/1 'Inter', sans-serif",
        textTransform: 'uppercase',
        letterSpacing: '.4px',
        color: '#9AA3AF',
        padding: droite ? '0 8px 10px' : '0 8px 10px 0',
        textAlign: droite ? 'right' : 'left',
      }}
    >
      {children}
    </th>
  );
}

function Cellule({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        font: "400 13px/1.4 'Inter', sans-serif",
        textAlign: 'right',
        padding: '11px 8px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </td>
  );
}

const texteDoux: React.CSSProperties = {
  font: "400 14px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};
