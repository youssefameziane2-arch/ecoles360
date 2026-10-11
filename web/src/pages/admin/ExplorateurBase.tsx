import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chargerCatalogueBase, chargerTableBase } from '@/api/admin';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { Pagination } from '@/ds/composants';
import { formaterDateHeure } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

/**
 * Explorateur de base — écran `isAdminDb` de la maquette.
 *
 * LECTURE SEULE, SIX TABLES, AUCUNE REQUÊTE LIBRE. Il n'y a pas de champ SQL,
 * pas de sélection de colonnes, pas de nom de table saisissable : le serveur
 * ne connaît que six clés et refuse tout le reste en 422.
 *
 * CE QU'IL NE MONTRE PAS, ET POURQUOI C'EST LE POINT : le hachage de mot de
 * passe des comptes, le contact d'un auteur d'avis (loi 09-08), et le
 * téléphone d'un lead — celui-ci appartient à l'établissement qui l'a reçu
 * (RG23), pas à qui parcourt la base. Un explorateur sert à compter et à
 * vérifier, pas à extraire un fichier de prospection.
 *
 * L'ÉCRAN LE DIT À L'UTILISATEUR, plutôt que de le taire : un administrateur
 * qui ne trouve pas une colonne doit savoir qu'elle est écartée exprès, et
 * non croire à une lacune.
 */
export function ExplorateurBase() {
  useTitrePage('Base de données');

  return (
    <AvecIdentite
      role={['superadmin']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="Base de données"
          sousTitre="Consultation en lecture seule — six tables"
        >
          <Contenu />
        </CoquilleEspace>
      )}
    />
  );
}

function Contenu() {
  const [table, setTable] = useState('etablissements');
  const [page, setPage] = useState(1);

  const catalogue = useQuery({
    queryKey: ['admin', 'base', 'catalogue'],
    queryFn: chargerCatalogueBase,
    staleTime: 3_600_000,
  });

  const lignes = useQuery({
    queryKey: ['admin', 'base', table, page],
    queryFn: () => chargerTableBase(table, page),
  });

  const colonnes = catalogue.data?.find((t) => t.cle === table)?.colonnes ?? [];

  function choisir(cle: string) {
    setTable(cle);
    // LA PAGE REVIENT À 1 : rester en page 4 sur une table qui n'en a qu'une
    // afficherait un tableau vide sans que rien n'explique pourquoi.
    setPage(1);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {catalogue.data?.map((onglet) => (
          <button
            key={onglet.cle}
            type="button"
            onClick={() => choisir(onglet.cle)}
            aria-pressed={onglet.cle === table}
            style={{
              border: `1px solid ${onglet.cle === table ? '#1D3557' : '#E1E5EA'}`,
              background: onglet.cle === table ? '#1D3557' : '#fff',
              color: onglet.cle === table ? '#fff' : '#3A424E',
              font: "600 12.5px/1 'Inter', sans-serif",
              padding: '9px 14px',
              borderRadius: 20,
              cursor: 'pointer',
            }}
          >
            {onglet.libelle}
          </button>
        ))}
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid #EAE6DE',
          borderRadius: 16,
          overflowX: 'auto',
        }}
      >
        {lignes.isPending && <p style={{ ...texteDoux, padding: 18 }}>Chargement…</p>}

        {lignes.data && (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr>
                {colonnes.map((colonne) => (
                  <th
                    key={colonne}
                    style={{
                      textAlign: 'left',
                      font: "700 11.5px/1 'Inter', sans-serif",
                      letterSpacing: '.04em',
                      textTransform: 'uppercase',
                      color: '#9AA3AF',
                      padding: '14px 16px',
                      borderBottom: '1px solid #EAE6DE',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {colonne}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.data.data.map((ligne, rang) => (
                <tr key={String(ligne.id ?? rang)}>
                  {colonnes.map((colonne) => (
                    <td
                      key={colonne}
                      style={{
                        font: "400 13px/1.4 'Inter', sans-serif",
                        color: '#2A313B',
                        padding: '12px 16px',
                        borderBottom: '1px solid #F4F1EB',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {afficher(ligne[colonne])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {lignes.data?.data.length === 0 && (
          <p style={{ ...texteDoux, padding: 18 }}>Cette table est vide.</p>
        )}
      </div>

      {lignes.data && lignes.data.meta.total_pages > 1 && (
        <Pagination
          page={lignes.data.meta.page}
          pageCount={lignes.data.meta.total_pages}
          onChange={setPage}
        />
      )}

      <p style={{ ...texteDoux, fontSize: 12.5 }}>
        Lecture seule, et <strong>colonnes choisies une par une</strong>. Sont volontairement
        absents : le hachage de mot de passe des comptes, le contact d’un auteur d’avis (loi
        09-08) et le téléphone d’un lead — il appartient à l’établissement qui l’a reçu (RG23).
      </p>
    </div>
  );
}

/**
 * UNE DATE RESTE UNE DATE, un booléen reste lisible.
 *
 * Rendre la valeur brute afficherait `2026-10-08T14:22:00.000Z` et `true` :
 * exact, illisible. Et `null` doit se distinguer d'une chaîne vide — c'est
 * souvent toute la question qu'on vient poser à cet écran.
 */
function afficher(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return '—';
  if (typeof valeur === 'boolean') return valeur ? 'oui' : 'non';

  if (typeof valeur === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(valeur)) {
    return formaterDateHeure(valeur);
  }

  return String(valeur);
}

const texteDoux: React.CSSProperties = {
  font: "400 14px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};
