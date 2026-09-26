import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import {
  chargerAvisModeration,
  deciderAvis,
  LIBELLE_STATUT_AVIS,
  mettreAvisEnAvant,
  TON_STATUT_AVIS,
  type AvisModeration,
  type StatutAvis,
} from '@/api/moderation';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { Badge, Button, Textarea, Toast } from '@/ds/composants';
import { formaterDate } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

const FILTRES: { cle: StatutAvis | 'tous' | 'signales'; libelle: string }[] = [
  { cle: 'en_attente', libelle: 'À modérer' },
  { cle: 'signales', libelle: 'Signalés' },
  { cle: 'publie', libelle: 'Publiés' },
  { cle: 'rejete', libelle: 'Rejetés' },
  { cle: 'tous', libelle: 'Tous' },
];

type Message = { tone: 'success' | 'error'; texte: string };

/**
 * Modération des avis — écran `isAdminAvisAll` de la maquette, RG06 à RG08.
 *
 * C'EST L'ÉCRAN LE PLUS SENSIBLE DU BACK-OFFICE. Un annuaire payé par les
 * établissements qui modère leurs avis doit pouvoir prouver qu'il ne les
 * filtre pas à leur avantage — d'où le motif obligatoire au rejet, la trace du
 * modérateur, et l'affichage des signalements à côté de l'avis plutôt que dans
 * un écran séparé.
 */
export function AvisAdmin() {
  useTitrePage('Modération des avis');

  return (
    <AvecIdentite
      role={['superadmin']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="Avis"
          sousTitre="Modération globale et mise en avant sur l’accueil"
        >
          <Contenu />
        </CoquilleEspace>
      )}
    />
  );
}

function Contenu() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<Message | null>(null);
  const [filtre, setFiltre] = useState<(typeof FILTRES)[number]['cle']>('en_attente');

  const avis = useQuery({ queryKey: ['admin', 'avis'], queryFn: () => chargerAvisModeration() });

  const rafraichir = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'avis'] });
    // La note et le nombre d'avis d'une fiche changent avec la décision (RG08).
    void queryClient.invalidateQueries({ queryKey: ['etablissements'] });
    void queryClient.invalidateQueries({ queryKey: ['fiche'] });
  };

  const echec = (erreur: unknown, repli: string) =>
    setMessage({ tone: 'error', texte: erreur instanceof ApiError ? erreur.message : repli });

  const decision = useMutation({
    mutationFn: ({ id, choix, motif }: { id: string; choix: 'publie' | 'rejete'; motif?: string }) =>
      deciderAvis(id, choix, motif),
    onSuccess: (_, { choix }) => {
      setMessage({
        tone: 'success',
        texte:
          choix === 'publie'
            ? 'Avis publié — la note de la fiche a été recalculée.'
            : 'Avis rejeté. Il reste en base, avec son motif, pour l’audit.',
      });
      rafraichir();
    },
    onError: (erreur) => echec(erreur, 'La décision n’a pas pu être enregistrée.'),
  });

  const avant = useMutation({
    mutationFn: ({ id, actif }: { id: string; actif: boolean }) => mettreAvisEnAvant(id, actif),
    onSuccess: (_, { actif }) => {
      setMessage({
        tone: 'success',
        texte: actif ? 'Avis mis en avant sur l’accueil.' : 'Avis retiré de l’accueil.',
      });
      rafraichir();
    },
    onError: (erreur) => echec(erreur, 'La mise en avant a échoué.'),
  });

  if (avis.isPending) {
    return <p style={texteDoux}>Chargement…</p>;
  }

  if (avis.isError || !avis.data) {
    return <p style={{ ...texteDoux, color: '#E63946' }}>Les avis n’ont pas pu être chargés.</p>;
  }

  const tous = avis.data;
  const signale = (a: AvisModeration) => a.signalements.some((s) => s.statut === 'nouveau');

  const visibles = tous.filter((a) => {
    if (filtre === 'tous') return true;
    if (filtre === 'signales') return signale(a);

    return a.statut === filtre;
  });

  const compteur = (cle: (typeof FILTRES)[number]['cle']) =>
    cle === 'tous'
      ? tous.length
      : cle === 'signales'
        ? tous.filter(signale).length
        : tous.filter((a) => a.statut === cle).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 900 }}>
      {message && (
        <Toast
          tone={message.tone}
          title={message.tone === 'success' ? 'Enregistré' : 'Refusé'}
          message={message.texte}
          onClose={() => setMessage(null)}
        />
      )}

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {FILTRES.map(({ cle, libelle }) => {
          const choisi = cle === filtre;
          const n = compteur(cle);

          return (
            <button
              key={cle}
              type="button"
              onClick={() => setFiltre(cle)}
              style={{
                cursor: 'pointer',
                font: "600 12.5px/1 'Inter', sans-serif",
                padding: '7px 13px',
                borderRadius: 20,
                border: `1px solid ${choisi ? '#1D3557' : '#EAE6DE'}`,
                background: choisi ? '#1D3557' : '#fff',
                color: choisi ? '#fff' : '#5A6472',
                whiteSpace: 'nowrap',
              }}
            >
              {libelle}
              {n > 0 && ` (${n})`}
            </button>
          );
        })}
      </div>

      {visibles.length === 0 && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #EAE6DE',
            borderRadius: 14,
            padding: 44,
            textAlign: 'center',
            font: "400 14px/1.6 'Inter', sans-serif",
            color: '#9AA3AF',
          }}
        >
          Aucun avis dans cette catégorie.
        </div>
      )}

      {visibles.map((a) => (
        <LigneAvis
          key={a.id}
          avis={a}
          signale={signale(a)}
          fige={decision.isPending || avant.isPending}
          onPublier={() => decision.mutate({ id: a.id, choix: 'publie' })}
          onRejeter={(motif) => decision.mutate({ id: a.id, choix: 'rejete', motif })}
          onAvant={() => avant.mutate({ id: a.id, actif: !a.en_avant })}
        />
      ))}

      <p style={{ ...texteDoux, fontSize: 12.5 }}>
        Chaque décision est journalisée avec son auteur et son motif (RG15). Un avis rejeté
        n’est jamais supprimé : il reste consultable dans l’audit.
      </p>
    </div>
  );
}

function LigneAvis({
  avis,
  signale,
  fige,
  onPublier,
  onRejeter,
  onAvant,
}: {
  avis: AvisModeration;
  signale: boolean;
  fige: boolean;
  onPublier: () => void;
  onRejeter: (motif: string) => void;
  onAvant: () => void;
}) {
  const [rejetOuvert, setRejetOuvert] = useState(false);
  const [motif, setMotif] = useState('');

  return (
    <div
      style={{
        background: '#fff',
        // Le filet rouge signale un avis dénoncé : il doit sauter aux yeux
        // dans une file de quarante lignes.
        border: `1px solid ${signale ? '#F3C9CD' : '#EAE6DE'}`,
        borderRadius: 14,
        padding: '18px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <span
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: '#1D3557',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            font: "700 13px/1 'Inter', sans-serif",
            flex: 'none',
          }}
        >
          {initiales(avis.auteur_nom)}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ font: "700 14.5px/1.3 'Inter', sans-serif" }}>{avis.auteur_nom}</span>
            <span style={{ font: "400 12px/1.3 'Inter', sans-serif", color: '#9AA3AF' }}>
              sur <span style={{ color: '#1D3557', fontWeight: 600 }}>{avis.etablissement.nom}</span>
            </span>
            {avis.verifie && <Badge tone="green">Parent vérifié</Badge>}
            {avis.en_avant && <Badge tone="amber">★ En avant</Badge>}
          </div>
          <div style={{ font: "400 12px/1.4 'Inter', sans-serif", color: '#9AA3AF', marginTop: 2 }}>
            {formaterDate(avis.depose_le)}
            {/* LE CONTACT DE L'AUTEUR N'EST JAMAIS PUBLIC — il ne sert qu'au
                modérateur, pour vérifier un avis douteux. */}
            {` · ${avis.auteur_contact}`}
            {avis.moderateur && ` · modéré par ${avis.moderateur.name}`}
          </div>
        </div>

        <div style={{ flex: 'none', font: "400 14px/1 'Inter', sans-serif", letterSpacing: 1 }}>
          <span style={{ color: '#E9A23B' }}>{'★'.repeat(avis.note)}</span>
          <span style={{ color: '#D9DEE5' }}>{'★'.repeat(5 - avis.note)}</span>
        </div>

        <Badge tone={TON_STATUT_AVIS[avis.statut]}>{LIBELLE_STATUT_AVIS[avis.statut]}</Badge>
      </div>

      {avis.decision_motif && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#FDE8EA',
            color: '#C8313F',
            font: "600 11.5px/1.4 'Inter', sans-serif",
            padding: '5px 10px',
            borderRadius: 6,
            marginBottom: 9,
          }}
        >
          Motif du rejet : {avis.decision_motif}
        </div>
      )}

      <p style={{ margin: '0 0 12px', font: "400 14px/1.6 'Inter', sans-serif", color: '#3A424E' }}>
        {avis.commentaire}
      </p>

      {avis.reponse && (
        <div
          style={{
            background: '#FBFAF7',
            border: '1px solid #EAE6DE',
            borderRadius: 10,
            padding: '10px 13px',
            marginBottom: 12,
            font: "400 13px/1.55 'Inter', sans-serif",
            color: '#5A6472',
          }}
        >
          <strong>Réponse de l’établissement :</strong> {avis.reponse}
        </div>
      )}

      {/* LES SIGNALEMENTS S'AFFICHENT À CÔTÉ DE L'AVIS, pas dans un écran à
          part : on ne peut pas juger une dénonciation sans lire ce qu'elle
          vise (RG07). */}
      {avis.signalements.length > 0 && (
        <div
          style={{
            background: '#FDF2F3',
            border: '1px solid #F3C9CD',
            borderRadius: 10,
            padding: '10px 13px',
            marginBottom: 12,
          }}
        >
          <div style={{ font: "700 11.5px/1 'Inter', sans-serif", color: '#8E2833', marginBottom: 6 }}>
            {avis.signalements.length} signalement{avis.signalements.length > 1 ? 's' : ''}
          </div>
          {avis.signalements.map((s) => (
            <div
              key={s.id}
              style={{ font: "400 12.5px/1.55 'Inter', sans-serif", color: '#8E2833' }}
            >
              {s.motif}
              <span style={{ color: '#B98A90' }}> · {formaterDate(s.signale_le)}</span>
              {s.statut === 'traite' && <span style={{ color: '#B98A90' }}> · traité</span>}
            </div>
          ))}
        </div>
      )}

      {rejetOuvert && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          <Textarea
            label="Motif du rejet"
            required
            rows={3}
            value={motif}
            onChange={(evenement) => setMotif(evenement.target.value)}
            placeholder="Propos injurieux, contenu hors sujet, avis manifestement faux…"
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="primary"
              size="sm"
              disabled={motif.trim().length < 15 || fige}
              onClick={() => onRejeter(motif.trim())}
            >
              Confirmer le rejet
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setRejetOuvert(false)}>
              Annuler
            </Button>
          </div>
          {motif.trim().length > 0 && motif.trim().length < 15 && (
            <span style={{ font: "400 12px/1 'Inter', sans-serif", color: '#9AA3AF' }}>
              Encore {15 - motif.trim().length} caractères — un rejet doit s’expliquer.
            </span>
          )}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 9,
          flexWrap: 'wrap',
          borderTop: '1px solid #F1ECE3',
          paddingTop: 13,
        }}
      >
        {avis.statut !== 'publie' && (
          <Button variant="success" size="sm" disabled={fige} onClick={onPublier}>
            Publier
          </Button>
        )}

        {avis.statut !== 'rejete' && !rejetOuvert && (
          <Button variant="outline" size="sm" onClick={() => setRejetOuvert(true)}>
            Rejeter
          </Button>
        )}

        {avis.statut === 'publie' && (
          <Button variant="outline" size="sm" disabled={fige} onClick={onAvant}>
            ★ {avis.en_avant ? 'Retirer de l’accueil' : 'Mettre en avant sur l’accueil'}
          </Button>
        )}

        <a
          href={`/etablissements/${avis.etablissement.slug}`}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            font: "600 12.5px/1 'Inter', sans-serif",
            color: '#1D3557',
            border: '1px solid #E1E5EA',
            borderRadius: 9,
            padding: '8px 14px',
          }}
        >
          Voir la fiche
        </a>
      </div>
    </div>
  );
}

function initiales(nom: string): string {
  return nom
    .split(/\s+/)
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase() ?? '')
    .join('');
}

const texteDoux: React.CSSProperties = {
  font: "400 14px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};
