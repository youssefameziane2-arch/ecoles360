import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { chargerPropositionsAdmin, deciderProposition, type PropositionAdmin } from '@/api/admin';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { Comparatif } from '@/pages/espace/FicheEditeur';
import { Button, EmptyState, Toast } from '@/ds/composants';
import { formaterDate } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

/**
 * File « Modifications de fiche à valider » — RG20.
 *
 * APPROUVER PUBLIE, REFUSER EXIGE UN MOTIF. Le motif n'est pas une formalité :
 * c'est ce que l'établissement lira pour corriger sa demande, et l'API refuse
 * un refus sans lui.
 *
 * ÉCART ASSUMÉ avec la maquette : l'approbation porte sur la proposition
 * entière, pas champ par champ.
 */
export function PropositionsAdmin() {
  useTitrePage('Modifications de fiche');

  return (
    <AvecIdentite
      role={['superadmin']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="Modifications de fiche"
          sousTitre="Rien n’est visible sur le site public avant votre décision"
        >
          <Contenu />
        </CoquilleEspace>
      )}
    />
  );
}

function Contenu() {
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; texte: string } | null>(null);

  const propositions = useQuery({
    queryKey: ['admin', 'propositions'],
    queryFn: chargerPropositionsAdmin,
  });

  if (propositions.isPending) {
    return <p style={texteDoux}>Chargement…</p>;
  }

  if (propositions.isError || !propositions.data) {
    return <p style={{ ...texteDoux, color: '#E63946' }}>La file n’a pas pu être chargée.</p>;
  }

  if (propositions.data.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 16 }}>
        <EmptyState
          icon="check-circle"
          title="Rien à valider"
          description="Les modifications proposées par les établissements arriveront ici."
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {message && (
        <Toast
          tone={message.tone}
          title={message.tone === 'success' ? 'Décision enregistrée' : 'Décision refusée'}
          message={message.texte}
          onClose={() => setMessage(null)}
        />
      )}

      {propositions.data.map((proposition) => (
        <CarteProposition key={proposition.id} proposition={proposition} onMessage={setMessage} />
      ))}
    </div>
  );
}

function CarteProposition({
  proposition,
  onMessage,
}: {
  proposition: PropositionAdmin;
  onMessage: (message: { tone: 'success' | 'error'; texte: string }) => void;
}) {
  const queryClient = useQueryClient();
  const [refusOuvert, setRefusOuvert] = useState(false);
  const [motif, setMotif] = useState('');

  const decision = useMutation({
    mutationFn: (choix: { decision: 'validee' } | { decision: 'rejetee'; motif: string }) =>
      deciderProposition(proposition.id, choix),
    onSuccess: (_donnees, choix) => {
      onMessage({
        tone: 'success',
        texte:
          choix.decision === 'validee'
            ? `Les modifications de « ${proposition.etablissement.nom} » sont publiées.`
            : `La proposition de « ${proposition.etablissement.nom} » a été refusée.`,
      });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'propositions'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'etablissements'] });
    },
    onError: (erreur: unknown) => {
      onMessage({
        tone: 'error',
        texte: erreur instanceof ApiError ? erreur.message : 'La décision a échoué.',
      });
    },
  });

  const nbChamps = Object.keys(proposition.champs_modifies).length;

  return (
    <div style={{ background: '#fff', border: '1px solid #F0D18B', borderRadius: 14, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '13px 20px',
          background: '#FCF1DE',
          borderBottom: '1px solid #F0D18B',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: '#7A5B12' }}>
            {proposition.etablissement.nom}
          </div>
          <div style={{ fontSize: 12, color: '#7A5B12', marginTop: 2 }}>
            {nbChamps} champ{nbChamps > 1 ? 's' : ''} · demandée le{' '}
            {formaterDate(proposition.proposee_le)} par {proposition.auteur.email}
          </div>
        </div>

        <a
          href={`/etablissements/${proposition.etablissement.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            border: '1px solid #C7D3E2',
            background: '#fff',
            color: '#1D3557',
            fontSize: 12.5,
            fontWeight: 600,
            padding: '8px 12px',
            borderRadius: 9,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Voir la fiche publique
        </a>
      </div>

      <div style={{ padding: 20 }}>
        <Comparatif champs={proposition.champs_modifies} />

        {refusOuvert ? (
          <form
            onSubmit={(evenement) => {
              evenement.preventDefault();
              decision.mutate({ decision: 'rejetee', motif });
            }}
            style={{ marginTop: 16 }}
          >
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#2A313B',
                marginBottom: 6,
              }}
            >
              Motif du refus — il sera transmis à l’établissement
            </label>
            <textarea
              value={motif}
              onChange={(evenement) => setMotif(evenement.target.value)}
              rows={2}
              required
              maxLength={200}
              style={{
                width: '100%',
                border: '1px solid #E1E5EA',
                borderRadius: 11,
                fontFamily: 'inherit',
                fontSize: 14,
                padding: '11px 13px',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              <Button variant="primary" size="sm" type="submit" disabled={decision.isPending}>
                {decision.isPending ? 'Envoi…' : 'Confirmer le refus'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setRefusOuvert(false)}>
                Annuler
              </Button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <Button
              variant="success"
              size="sm"
              disabled={decision.isPending}
              onClick={() => decision.mutate({ decision: 'validee' })}
            >
              Approuver et publier
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRefusOuvert(true)}>
              Refuser
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const texteDoux: React.CSSProperties = {
  font: "400 14px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};
