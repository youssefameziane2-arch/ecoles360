import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { chargerAvisEspace, repondreAvisEspace, type AvisEspace as Avis } from '@/api/espace';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { Badge, Button, EmptyState, ReviewCard } from '@/ds/composants';
import { formaterDepuis, formaterNombre } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

const LIBELLE_STATUT: Record<Avis['statut'], string> = {
  en_attente: 'En attente de modération',
  publie: 'Publié',
  rejete: 'Rejeté',
};

const TON_STATUT: Record<Avis['statut'], 'amber' | 'green' | 'grey'> = {
  en_attente: 'amber',
  publie: 'green',
  rejete: 'grey',
};

/**
 * Avis reçus — écran `isEtabAvis` de la maquette.
 *
 * L'ÉTABLISSEMENT VOIT AUSSI LES AVIS EN ATTENTE, avec leur statut affiché.
 * C'est ce qui rend la modération lisible de son côté : un avis défavorable
 * qui n'apparaît pas encore sur le site public n'a pas été effacé, il attend
 * une décision (RG06).
 */
export function AvisEspacePage() {
  useTitrePage('Avis reçus');

  return (
    <AvecIdentite
      role={['etablissement', 'secretariat']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="Avis reçus"
          sousTitre="Vous pouvez répondre une fois à chaque avis"
        >
          <Contenu />
        </CoquilleEspace>
      )}
    />
  );
}

function Contenu() {
  const [page, setPage] = useState(1);
  const avis = useQuery({ queryKey: ['espace', 'avis', page], queryFn: () => chargerAvisEspace(page) });

  if (avis.isPending) {
    return <p style={texteDoux}>Chargement…</p>;
  }

  if (avis.isError || !avis.data) {
    return <p style={{ ...texteDoux, color: '#E63946' }}>Les avis n’ont pas pu être chargés.</p>;
  }

  if (avis.data.meta.total === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 16 }}>
        <EmptyState
          icon="star"
          title="Aucun avis pour le moment"
          description="Les avis déposés par les parents apparaîtront ici, y compris ceux en attente de modération."
        />
      </div>
    );
  }

  const meta = avis.data.meta;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={texteDoux}>
        {formaterNombre(meta.total)} avis — page {meta.page} sur {meta.total_pages}
      </p>

      {avis.data.data.map((ligne) => (
        <CarteAvisEspace key={ligne.id} avis={ligne} />
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

function CarteAvisEspace({ avis }: { avis: Avis }) {
  const queryClient = useQueryClient();
  const [ouvert, setOuvert] = useState(false);
  const [reponse, setReponse] = useState('');

  const envoi = useMutation({
    mutationFn: () => repondreAvisEspace(avis.id, reponse),
    onSuccess: () => {
      setOuvert(false);
      void queryClient.invalidateQueries({ queryKey: ['espace', 'avis'] });
    },
  });

  const erreur = envoi.error instanceof ApiError ? envoi.error : null;

  return (
    <div style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 14, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          borderBottom: '1px solid #F1ECE3',
          background: '#FBFAF7',
          flexWrap: 'wrap',
        }}
      >
        <Badge tone={TON_STATUT[avis.statut]}>{LIBELLE_STATUT[avis.statut]}</Badge>
        {avis.verifie && <Badge tone="navy">Parent vérifié</Badge>}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9AA3AF' }}>
          {formaterDepuis(avis.depose_le)}
        </span>
      </div>

      <ReviewCard
        author={avis.auteur_nom}
        date={formaterDepuis(avis.depose_le)}
        rating={avis.note}
        body={avis.commentaire}
        reply={avis.reponse}
        style={{ border: 'none', borderRadius: 0 }}
      />

      <div style={{ padding: '0 16px 16px' }}>
        {avis.reponse ? (
          <p style={{ ...texteDoux, margin: 0, fontSize: 12.5 }}>
            Vous avez déjà répondu à cet avis — une seule réponse est possible.
          </p>
        ) : ouvert ? (
          <form
            onSubmit={(evenement) => {
              evenement.preventDefault();
              envoi.mutate();
            }}
          >
            <textarea
              value={reponse}
              onChange={(evenement) => setReponse(evenement.target.value)}
              rows={3}
              required
              placeholder="Votre réponse publique, visible par tous les parents."
              style={{
                width: '100%',
                border: '1px solid #E1E5EA',
                borderRadius: 11,
                fontFamily: 'inherit',
                fontSize: 14,
                lineHeight: 1.55,
                padding: '12px 14px',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
            {erreur && (
              <p style={{ fontSize: 13, color: '#E63946', margin: '8px 0 0' }} role="alert">
                {erreur.message}
              </p>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              <Button variant="primary" size="sm" type="submit" disabled={envoi.isPending}>
                {envoi.isPending ? 'Envoi…' : 'Publier ma réponse'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setOuvert(false)}>
                Annuler
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setOuvert(true)}>
            Répondre
          </Button>
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
