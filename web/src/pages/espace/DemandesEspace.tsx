import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  changerStatutDemande,
  chargerDemandesEspace,
  type DemandeEspace as Demande,
  type StatutDemande,
} from '@/api/espace';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { Button, EmptyState, RequestCard } from '@/ds/composants';
import { formaterDepuis, formaterNombre } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

/** Le composant `RequestCard` indexe ses teintes sur ces libellés exacts. */
const STATUT_DS: Record<StatutDemande, 'Nouveau' | 'En cours' | 'Traité'> = {
  nouvelle: 'Nouveau',
  en_cours: 'En cours',
  traitee: 'Traité',
};

const CANAL_DS: Record<Demande['canal'], 'Formulaire' | 'Appel' | 'WhatsApp'> = {
  formulaire: 'Formulaire',
  appel: 'Appel',
  whatsapp: 'WhatsApp',
};

/** Transition suivante dans le pipeline (RG09) — la dernière étape est terminale. */
const SUIVANT: Partial<Record<StatutDemande, { cible: StatutDemande; libelle: string }>> = {
  nouvelle: { cible: 'en_cours', libelle: 'Marquer en cours' },
  en_cours: { cible: 'traitee', libelle: 'Marquer traitée' },
};

/**
 * Demandes de contact reçues — RG09.
 *
 * LE TÉLÉPHONE DU PARENT EST AFFICHÉ ICI, et nulle part sur le site public :
 * c'est la contrepartie du consentement qu'il a donné, et la raison d'être de
 * cet écran pour l'établissement.
 */
export function DemandesEspacePage() {
  useTitrePage('Demandes de contact');

  return (
    <AvecIdentite
      role={['etablissement', 'secretariat']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="Demandes de contact"
          sousTitre="Les parents qui vous ont laissé leurs coordonnées"
        >
          <Contenu />
        </CoquilleEspace>
      )}
    />
  );
}

function Contenu() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const demandes = useQuery({
    queryKey: ['espace', 'demandes', page],
    queryFn: () => chargerDemandesEspace(page),
  });

  const transition = useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: StatutDemande }) =>
      changerStatutDemande(id, statut),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['espace', 'demandes'] });
      void queryClient.invalidateQueries({ queryKey: ['espace', 'dashboard'] });
    },
  });

  if (demandes.isPending) {
    return <p style={texteDoux}>Chargement…</p>;
  }

  if (demandes.isError || !demandes.data) {
    return <p style={{ ...texteDoux, color: '#E63946' }}>Les demandes n’ont pas pu être chargées.</p>;
  }

  if (demandes.data.meta.total === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 16 }}>
        <EmptyState
          icon="inbox"
          title="Aucune demande pour le moment"
          description="Les demandes envoyées depuis votre fiche publique arriveront ici."
        />
      </div>
    );
  }

  const meta = demandes.data.meta;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={texteDoux}>
        {formaterNombre(meta.total)} demande{meta.total > 1 ? 's' : ''} — page {meta.page} sur{' '}
        {meta.total_pages}
      </p>

      {demandes.data.data.map((demande) => (
        <div key={demande.id} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <RequestCard
            name={demande.parent_nom}
            channel={CANAL_DS[demande.canal]}
            message={demande.message ?? 'Sans message'}
            time={formaterDepuis(demande.recue_le)}
            status={STATUT_DS[demande.statut]}
            style={{ borderRadius: '14px 14px 0 0', borderBottom: 'none' }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              background: '#FBFAF7',
              border: '1px solid #EAE6DE',
              borderTop: '1px solid #F1ECE3',
              borderRadius: '0 0 14px 14px',
              padding: '12px 15px',
            }}
          >
            <a
              href={`tel:${demande.parent_tel.replace(/\s/g, '')}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: '#1D3557',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                padding: '9px 13px',
                borderRadius: 9,
                textDecoration: 'none',
              }}
            >
              📞 {demande.parent_tel}
            </a>

            <a
              href={`https://wa.me/${demande.parent_tel.replace(/\D/g, '').replace(/^0/, '212')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#2E9E5B',
                color: '#fff',
                fontSize: 12.5,
                fontWeight: 600,
                padding: '9px 13px',
                borderRadius: 9,
                textDecoration: 'none',
              }}
            >
              WhatsApp
            </a>

            <span style={{ flex: 1 }} />

            {SUIVANT[demande.statut] && (
              <Button
                variant="outline"
                size="sm"
                disabled={transition.isPending}
                onClick={() =>
                  transition.mutate({ id: demande.id, statut: SUIVANT[demande.statut]!.cible })
                }
              >
                {SUIVANT[demande.statut]!.libelle}
              </Button>
            )}
          </div>
        </div>
      ))}

      {meta.total_pages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
          <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= meta.total_pages}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}

const texteDoux: React.CSSProperties = {
  font: "400 14px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};
