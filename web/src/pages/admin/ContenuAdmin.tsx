import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import {
  chargerFaqAdmin,
  creerQuestionFaq,
  modifierQuestionFaq,
  reordonnerFaq,
  supprimerQuestionFaq,
  type QuestionFaqAdmin,
  type SaisieQuestionFaq,
} from '@/api/faq';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { Badge, Button, Checkbox, Icon, Input, Textarea, Toast } from '@/ds/composants';
import { useTitrePage } from '@/lib/titre';

/** Rubriques de la maquette, proposées d'abord — la saisie libre reste possible. */
const RUBRIQUES_MAQUETTE = ['Pour les parents', 'Pour les établissements'];

type Message = { tone: 'success' | 'error'; texte: string };

/**
 * Contenu du site — FAQ publique (livrable 11 §3.7).
 *
 * ÉCRAN DESSINÉ SANS RÉFÉRENCE : la maquette montre la FAQ côté visiteur, pas
 * son écran de gestion. Il reprend donc les conventions des autres écrans du
 * back-office — mêmes cartes, même filet `#EAE6DE`, mêmes boutons.
 *
 * LE RANG SE CHANGE PAR DEUX FLÈCHES, PAS PAR GLISSER-DÉPOSER. Le
 * glisser-déposer est inatteignable au clavier, se comporte mal sur écran
 * tactile et demande une bibliothèque de plus ; deux flèches font le même
 * travail sur une liste d'une dizaine de lignes, et restent utilisables par
 * tout le monde.
 */
export function ContenuAdmin() {
  useTitrePage('Contenu du site');

  return (
    <AvecIdentite
      role={['superadmin']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="Contenu du site"
          sousTitre="Questions fréquentes affichées sur l’accueil et sur /faq"
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
  const [enEdition, setEnEdition] = useState<string | null>(null);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);

  const faq = useQuery({ queryKey: ['admin', 'faq'], queryFn: chargerFaqAdmin });

  const rafraichir = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'faq'] });
    // La FAQ publique est en cache elle aussi : sans cette invalidation, un
    // administrateur qui corrige une réponse puis ouvre /faq dans le même
    // onglet lirait encore l'ancienne.
    void queryClient.invalidateQueries({ queryKey: ['faq'] });
  };

  const echec = (erreur: unknown, repli: string) =>
    setMessage({ tone: 'error', texte: erreur instanceof ApiError ? erreur.message : repli });

  const creation = useMutation({
    mutationFn: (saisie: SaisieQuestionFaq) => creerQuestionFaq(saisie),
    onSuccess: () => {
      setMessage({ tone: 'success', texte: 'Question ajoutée en fin de liste.' });
      setAjoutOuvert(false);
      rafraichir();
    },
    onError: (erreur) => echec(erreur, 'La question n’a pas pu être ajoutée.'),
  });

  const modification = useMutation({
    mutationFn: ({ id, saisie }: { id: string; saisie: SaisieQuestionFaq }) =>
      modifierQuestionFaq(id, saisie),
    onSuccess: () => {
      setMessage({ tone: 'success', texte: 'Question mise à jour.' });
      setEnEdition(null);
      rafraichir();
    },
    onError: (erreur) => echec(erreur, 'La modification n’a pas pu être enregistrée.'),
  });

  const suppression = useMutation({
    mutationFn: (id: string) => supprimerQuestionFaq(id),
    onSuccess: () => {
      setMessage({ tone: 'success', texte: 'Question retirée du site.' });
      rafraichir();
    },
    onError: (erreur) => echec(erreur, 'La question n’a pas pu être supprimée.'),
  });

  const reordonnancement = useMutation({
    mutationFn: (ids: string[]) => reordonnerFaq(ids),
    onSuccess: rafraichir,
    onError: (erreur) => echec(erreur, 'Le nouvel ordre n’a pas pu être enregistré.'),
  });

  if (faq.isPending) {
    return <p style={texteDoux}>Chargement…</p>;
  }

  if (faq.isError || !faq.data) {
    return <p style={{ ...texteDoux, color: '#E63946' }}>La FAQ n’a pas pu être chargée.</p>;
  }

  const items = faq.data;

  const deplacer = (index: number, sens: -1 | 1) => {
    const cible = index + sens;
    if (cible < 0 || cible >= items.length) return;

    const ids = items.map((item) => item.id);
    [ids[index], ids[cible]] = [ids[cible] as string, ids[index] as string];
    reordonnancement.mutate(ids);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 860 }}>
      {message && (
        <Toast
          tone={message.tone}
          title={message.tone === 'success' ? 'Enregistré' : 'Refusé'}
          message={message.texte}
          onClose={() => setMessage(null)}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Questions fréquentes</div>
          <div style={{ ...texteDoux, fontSize: 13, marginTop: 2 }}>
            {items.length} question{items.length > 1 ? 's' : ''} — les quatre premières sont
            reprises sur l’accueil.
          </div>
        </div>

        <Button
          variant={ajoutOuvert ? 'outline' : 'primary'}
          size="sm"
          onClick={() => {
            setAjoutOuvert(!ajoutOuvert);
            setEnEdition(null);
          }}
        >
          {ajoutOuvert ? 'Annuler' : 'Ajouter une question'}
        </Button>
      </div>

      {ajoutOuvert && (
        <Formulaire
          intitule="Nouvelle question"
          enCours={creation.isPending}
          onValider={(saisie) => creation.mutate(saisie)}
          onAnnuler={() => setAjoutOuvert(false)}
        />
      )}

      {items.length === 0 && (
        <p style={texteDoux}>
          Aucune question pour le moment. La page /faq affichera un message d’attente.
        </p>
      )}

      {items.map((item, index) => {
        const nouvelleRubrique = index === 0 || items[index - 1]?.groupe !== item.groupe;

        return (
          <div key={item.id}>
            {/* L'intertitre marque la rubrique telle qu'elle sortira côté
                public : les rubriques suivent l'ordre des questions, il faut
                donc les voir bouger en même temps que les lignes. */}
            {nouvelleRubrique && (
              <div
                style={{
                  font: "800 13px/1 'Inter', sans-serif",
                  letterSpacing: '.4px',
                  textTransform: 'uppercase',
                  color: '#1D3557',
                  margin: index === 0 ? '4px 0 10px' : '22px 0 10px',
                }}
              >
                {item.groupe}
              </div>
            )}

            {enEdition === item.id ? (
              <Formulaire
                intitule="Modifier la question"
                valeurs={item}
                enCours={modification.isPending}
                onValider={(saisie) => modification.mutate({ id: item.id, saisie })}
                onAnnuler={() => setEnEdition(null)}
              />
            ) : (
              <Ligne
                item={item}
                premier={index === 0}
                dernier={index === items.length - 1}
                fige={reordonnancement.isPending || suppression.isPending}
                onMonter={() => deplacer(index, -1)}
                onDescendre={() => deplacer(index, 1)}
                onModifier={() => {
                  setEnEdition(item.id);
                  setAjoutOuvert(false);
                }}
                onSupprimer={() => suppression.mutate(item.id)}
              />
            )}
          </div>
        );
      })}

      <p style={{ ...texteDoux, fontSize: 12.5 }}>
        Chaque ajout, modification et suppression est journalisé (RG15, RG26). Le texte d’une
        question supprimée reste dans le journal d’audit.
      </p>
    </div>
  );
}

function Ligne({
  item,
  premier,
  dernier,
  fige,
  onMonter,
  onDescendre,
  onModifier,
  onSupprimer,
}: {
  item: QuestionFaqAdmin;
  premier: boolean;
  dernier: boolean;
  fige: boolean;
  onMonter: () => void;
  onDescendre: () => void;
  onModifier: () => void;
  onSupprimer: () => void;
}) {
  const [confirmation, setConfirmation] = useState(false);

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #EAE6DE',
        borderRadius: 14,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 'none', paddingTop: 2 }}>
        <BoutonRang libelle="Monter" retourne actif={!premier && !fige} onClick={onMonter} />
        <BoutonRang libelle="Descendre" actif={!dernier && !fige} onClick={onDescendre} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: '#1A1A1A' }}>{item.question}</span>
          {!item.publiee && <Badge tone="grey">Dépubliée</Badge>}
        </div>
        <p style={{ ...texteDoux, fontSize: 13.5, marginTop: 6 }}>{item.reponse}</p>
      </div>

      <div style={{ display: 'flex', gap: 8, flex: 'none', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {confirmation ? (
          <>
            <Button variant="primary" size="sm" onClick={onSupprimer} disabled={fige}>
              Confirmer
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmation(false)}>
              Annuler
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={onModifier}>
              Modifier
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmation(true)}>
              Supprimer
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Flèche de rang.
 *
 * Le design system ne livre qu'un `chevron-down` — pas de `chevron-up` : la
 * flèche du haut est donc le même chevron retourné, plutôt qu'une icône
 * maison qui n'aurait ni le même trait ni le même gabarit.
 */
function BoutonRang({
  libelle,
  retourne,
  actif,
  onClick,
}: {
  libelle: string;
  retourne?: boolean;
  actif: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={libelle}
      title={libelle}
      disabled={!actif}
      onClick={onClick}
      style={{
        width: 28,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #EAE6DE',
        borderRadius: 7,
        background: '#fff',
        cursor: actif ? 'pointer' : 'default',
        opacity: actif ? 1 : 0.35,
      }}
    >
      <Icon
        name="chevron-down"
        size={14}
        color="#5A6472"
        style={retourne ? { transform: 'rotate(180deg)' } : undefined}
      />
    </button>
  );
}

/** Saisie d'une question — même formulaire à la création et à la modification. */
function Formulaire({
  intitule,
  valeurs,
  enCours,
  onValider,
  onAnnuler,
}: {
  intitule: string;
  valeurs?: QuestionFaqAdmin;
  enCours: boolean;
  onValider: (saisie: SaisieQuestionFaq) => void;
  onAnnuler: () => void;
}) {
  const [question, setQuestion] = useState(valeurs?.question ?? '');
  const [reponse, setReponse] = useState(valeurs?.reponse ?? '');
  const [groupe, setGroupe] = useState(valeurs?.groupe ?? RUBRIQUES_MAQUETTE[0] ?? '');
  const [publiee, setPubliee] = useState(valeurs?.publiee ?? true);

  const complet = question.trim() !== '' && reponse.trim() !== '' && groupe.trim() !== '';

  return (
    <form
      onSubmit={(evenement) => {
        evenement.preventDefault();
        if (!complet) return;

        onValider({
          question: question.trim(),
          reponse: reponse.trim(),
          groupe: groupe.trim(),
          publiee,
        });
      }}
      style={{
        background: '#fff',
        border: '1px solid #D9DEE5',
        borderRadius: 14,
        padding: '18px 18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 14.5, fontWeight: 700 }}>{intitule}</div>

      <Input
        label="Question"
        required
        value={question}
        onChange={(evenement) => setQuestion(evenement.target.value)}
        placeholder="écoles360, c’est gratuit pour les parents ?"
      />

      <Textarea
        label="Réponse"
        required
        rows={4}
        value={reponse}
        onChange={(evenement) => setReponse(evenement.target.value)}
        placeholder="Oui, totalement. La recherche et la prise de contact sont gratuites."
      />

      <div>
        <Input
          label="Rubrique"
          required
          value={groupe}
          onChange={(evenement) => setGroupe(evenement.target.value)}
          placeholder="Pour les parents"
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {RUBRIQUES_MAQUETTE.map((rubrique) => (
            <button
              key={rubrique}
              type="button"
              onClick={() => setGroupe(rubrique)}
              style={{
                border: '1px solid #EAE6DE',
                background: groupe === rubrique ? '#FBE9EA' : '#fff',
                color: groupe === rubrique ? '#E63946' : '#5A6472',
                font: "600 12.5px/1 'Inter', sans-serif",
                padding: '7px 12px',
                borderRadius: 20,
                cursor: 'pointer',
              }}
            >
              {rubrique}
            </button>
          ))}
        </div>
      </div>

      <Checkbox
        label="Publiée sur le site"
        checked={publiee}
        onChange={(evenement) => setPubliee(evenement.target.checked)}
      />

      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="primary" size="sm" type="submit" disabled={!complet || enCours}>
          {enCours ? 'Envoi…' : 'Enregistrer'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onAnnuler}>
          Annuler
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
