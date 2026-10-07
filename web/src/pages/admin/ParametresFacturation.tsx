import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/api/client';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { Button, Toast } from '@/ds/composants';
import { formaterDate } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

interface ParametreFacturation {
  cle: string;
  valeur: string;
  libelle: string;
  maj_le: string | null;
}

/** Unité affichée à côté du champ — la valeur stockée reste un nombre nu. */
const UNITE: Record<string, string> = {
  tva_pct: '%',
  duree_essai_gratuit_jours: 'jours',
  remise_annuelle_pct: '%',
  rappel_echeance_j: 'jours',
  conservation_facture_ans: 'ans',
  // Oublié à l'ajout du paramètre : le seul taux de l'écran sans son signe,
  // sur la ligne où une erreur d'unité se paierait en salaire (RG18).
  commission_pct: '%',
};

const chargerParametres = () => apiFetch<ParametreFacturation[]>('/admin/parametres-facturation');

const enregistrerParametre = (cle: string, valeur: string) =>
  apiFetch<void>(`/admin/parametres-facturation/${cle}`, {
    method: 'PUT',
    body: JSON.stringify({ valeur }),
  });

/**
 * Paramètres de facturation — livrable 11 §3.4, livrable 10 §5.
 *
 * ÉCRAN DESSINÉ SANS RÉFÉRENCE : la maquette ne contient pas cet écran. Il
 * reprend donc les conventions des autres — mêmes cartes, même filet
 * `#EAE6DE`, même bandeau de confirmation.
 *
 * CE SONT DES CONSTANTES GLOBALES, PAS DES TARIFS (RG14). Le prix payé par un
 * établissement est négocié avec son conseiller et vit sur son abonnement ;
 * rien de ce qui est ici n'est propre à un client.
 */
export function ParametresFacturation() {
  useTitrePage('Paramètres de facturation');

  return (
    <AvecIdentite
      role={['superadmin']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="Paramètres de facturation"
          sousTitre="Constantes globales — aucun tarif d’établissement ici"
        >
          <Contenu />
        </CoquilleEspace>
      )}
    />
  );
}

function Contenu() {
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; texte: string } | null>(null);

  const parametres = useQuery({
    queryKey: ['admin', 'parametres-facturation'],
    queryFn: chargerParametres,
  });

  if (parametres.isPending) {
    return <p style={texteDoux}>Chargement…</p>;
  }

  if (parametres.isError || !parametres.data) {
    return <p style={{ ...texteDoux, color: '#E63946' }}>Les paramètres n’ont pas pu être chargés.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
      {message && (
        <Toast
          tone={message.tone}
          title={message.tone === 'success' ? 'Enregistré' : 'Refusé'}
          message={message.texte}
          onClose={() => setMessage(null)}
        />
      )}

      {parametres.data.map((parametre) => (
        <LigneParametre key={parametre.cle} parametre={parametre} onMessage={setMessage} />
      ))}

      <p style={{ ...texteDoux, fontSize: 12.5 }}>
        Chaque modification est journalisée avec l’ancienne et la nouvelle valeur (RG15, RG26).
      </p>
    </div>
  );
}

function LigneParametre({
  parametre,
  onMessage,
}: {
  parametre: ParametreFacturation;
  onMessage: (message: { tone: 'success' | 'error'; texte: string }) => void;
}) {
  const queryClient = useQueryClient();
  const [valeur, setValeur] = useState(parametre.valeur);

  const enregistrement = useMutation({
    mutationFn: () => enregistrerParametre(parametre.cle, valeur),
    onSuccess: () => {
      onMessage({ tone: 'success', texte: `« ${parametre.libelle} » mis à jour.` });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'parametres-facturation'] });
    },
    onError: (erreur: unknown) => {
      onMessage({
        tone: 'error',
        texte:
          erreur instanceof ApiError ? erreur.message : 'L’enregistrement a échoué.',
      });
    },
  });

  const modifie = valeur.trim() !== parametre.valeur;

  return (
    <form
      onSubmit={(evenement) => {
        evenement.preventDefault();
        enregistrement.mutate();
      }}
      style={{
        background: '#fff',
        border: '1px solid #EAE6DE',
        borderRadius: 14,
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 240 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700 }}>{parametre.libelle}</div>
        <div style={{ fontSize: 12, color: '#9AA3AF', marginTop: 3, fontFamily: 'ui-monospace, monospace' }}>
          {parametre.cle}
          {parametre.maj_le && ` · modifié le ${formaterDate(parametre.maj_le)}`}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          value={valeur}
          onChange={(evenement) => setValeur(evenement.target.value)}
          inputMode="decimal"
          aria-label={parametre.libelle}
          style={{
            width: 90,
            height: 40,
            padding: '0 12px',
            border: '1px solid #E1E5EA',
            borderRadius: 10,
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 600,
            textAlign: 'right',
            color: '#1A1A1A',
          }}
        />
        <span style={{ fontSize: 13, color: '#9AA3AF', minWidth: 40 }}>
          {UNITE[parametre.cle] ?? ''}
        </span>

        <Button
          variant="primary"
          size="sm"
          type="submit"
          disabled={!modifie || enregistrement.isPending}
        >
          {enregistrement.isPending ? 'Envoi…' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}

const texteDoux: React.CSSProperties = {
  font: "400 14px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};
