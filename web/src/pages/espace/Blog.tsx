import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { chargerEtablissementsAdmin } from '@/api/admin';
import {
  basculerBlogEspace,
  chargerArticlesAdmin,
  chargerCategoriesProposees,
  chargerBlogEspace,
  creerArticle,
  deciderArticle,
  LIBELLE_STATUT,
  mettreALaUne,
  modifierArticle,
  modifierArticleAdmin,
  redigerArticleAdmin,
  soumettreArticle,
  supprimerArticle,
  supprimerArticleAdmin,
  TON_STATUT,
  type ArticleGestion,
  type SaisieArticle,
} from '@/api/articles';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { Badge, Button, Icon, Input, Textarea, Toast } from '@/ds/composants';
import { formaterDate } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

/**
 * Repli quand le référentiel n'a pas encore répondu, ou qu'il est vide.
 *
 * CES SIX VALEURS ÉTAIENT ÉCRITES EN DUR ICI, et c'est d'elles que venait le
 * contenu de la base — la migration qui a créé le référentiel les y a reprises.
 * Elles ne restent que comme filet : l'écran « Contenu du site » commande
 * désormais la liste, et une catégorie ajoutée là doit apparaître ici sans
 * qu'on touche à ce fichier.
 */
const CATEGORIES_DE_REPLI = [
  'Conseils aux parents',
  'Vie des établissements',
  'Vie scolaire',
  'Budget',
  'Orientation',
  'Actualités',
];

const TOUS = 'Tous';

type Message = { tone: 'success' | 'error'; texte: string };

/**
 * Blog — espaces établissement et commercial, et back-office, avenant 3.
 *
 * UN SEUL ÉCRAN POUR LES DEUX RÔLES, comme la maquette (`isBlogList` sert
 * `admin/blog` et `etablissement/blog`). L'administrateur y gagne les boutons
 * de décision et la mise à la une ; le reste est identique. Les séparer ferait
 * diverger deux vues du même objet.
 */
export function BlogEspace() {
  useTitrePage('Blog');

  return (
    <AvecIdentite
      // Le commercial y rédige des articles de plateforme ; le serveur borne
      // ce qu'il voit à ses propres articles (`Redacteur`).
      role={['etablissement', 'commercial']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="Blog"
          sousTitre="Rédigez vos articles — publiés après validation par l’administrateur"
        >
          <Contenu admin={false} />
        </CoquilleEspace>
      )}
    />
  );
}

export function BlogAdmin() {
  useTitrePage('Blog');

  return (
    <AvecIdentite
      // La portée `blog` (RG05) ouvre cet écran au secrétariat ; le serveur
      // vérifie la portée, cette liste ne fait que laisser passer le rôle.
      role={['superadmin', 'secretariat']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="Blog"
          sousTitre="Rédaction, circuit de validation et articles à la une"
        >
          <Contenu admin />
        </CoquilleEspace>
      )}
    />
  );
}

function Contenu({ admin }: { admin: boolean }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<Message | null>(null);
  const [enEdition, setEnEdition] = useState<string | null>(null);
  const [redactionOuverte, setRedactionOuverte] = useState(false);
  const [filtre, setFiltre] = useState(TOUS);

  const espace = useQuery({
    queryKey: ['espace', 'blog'],
    queryFn: chargerBlogEspace,
    enabled: !admin,
  });
  const backOffice = useQuery({
    queryKey: ['admin', 'articles'],
    queryFn: () => chargerArticlesAdmin(),
    enabled: admin,
  });

  /**
   * Les fiches au nom desquelles l'administrateur peut publier.
   *
   * TOUTES, PAS SEULEMENT LES VALIDÉES : on remplit le blog d'une école
   * pendant qu'on prépare sa fiche, avant de la publier. L'article suivra.
   */
  const fiches = useQuery({
    queryKey: ['admin', 'etablissements'],
    queryFn: () => chargerEtablissementsAdmin({}),
    enabled: admin,
    select: (liste) => liste.map((e) => ({ id: e.id, nom: e.nom })),
  });

  const rafraichir = () => {
    void queryClient.invalidateQueries({ queryKey: admin ? ['admin', 'articles'] : ['espace', 'blog'] });
    // Le blog public est en cache : sans cette invalidation, un article
    // approuvé n'apparaîtrait qu'au prochain rechargement complet.
    void queryClient.invalidateQueries({ queryKey: ['articles'] });
  };

  const echec = (erreur: unknown, repli: string) =>
    setMessage({ tone: 'error', texte: erreur instanceof ApiError ? erreur.message : repli });

  const activation = useMutation({
    mutationFn: (actif: boolean) => basculerBlogEspace(actif),
    onSuccess: (_, actif) => {
      setMessage({
        tone: 'success',
        texte: actif
          ? 'Blog activé. Vous pouvez désormais rédiger des articles.'
          : 'Blog désactivé. La rédaction est suspendue ; vos articles restent en place.',
      });
      rafraichir();
    },
    onError: (erreur) => echec(erreur, 'Le blog n’a pas pu être basculé.'),
  });

  const redaction = useMutation({
    mutationFn: ({ id, saisie }: { id: string | null; saisie: SaisieArticle }) => {
      if (admin) {
        return id ? modifierArticleAdmin(id, saisie) : redigerArticleAdmin(saisie);
      }

      return id ? modifierArticle(id, saisie) : creerArticle(saisie);
    },
    onSuccess: (_, { id }) => {
      setMessage({
        tone: 'success',
        texte: admin
          ? id
            ? 'Article mis à jour.'
            : 'Article publié sur le blog.'
          : id
            ? 'Article enregistré en brouillon — soumettez-le pour publication.'
            : 'Brouillon créé.',
      });
      setRedactionOuverte(false);
      setEnEdition(null);
      rafraichir();
    },
    onError: (erreur) => echec(erreur, 'L’article n’a pas pu être enregistré.'),
  });

  const soumission = useMutation({
    mutationFn: (id: string) => soumettreArticle(id),
    onSuccess: () => {
      setMessage({ tone: 'success', texte: 'Article soumis à la validation de l’administrateur.' });
      rafraichir();
    },
    onError: (erreur) => echec(erreur, 'L’article n’a pas pu être soumis.'),
  });

  const suppression = useMutation({
    mutationFn: (id: string) => (admin ? supprimerArticleAdmin(id) : supprimerArticle(id)),
    onSuccess: () => {
      setMessage({ tone: 'success', texte: 'Article supprimé.' });
      rafraichir();
    },
    onError: (erreur) => echec(erreur, 'L’article n’a pas pu être supprimé.'),
  });

  const decision = useMutation({
    mutationFn: ({ id, choix, motif }: { id: string; choix: 'approuve' | 'refuse'; motif?: string }) =>
      deciderArticle(id, choix, motif),
    onSuccess: (_, { choix }) => {
      setMessage({
        tone: 'success',
        texte: choix === 'approuve' ? 'Article publié sur le site.' : 'Article refusé — l’auteur en est informé.',
      });
      rafraichir();
    },
    onError: (erreur) => echec(erreur, 'La décision n’a pas pu être enregistrée.'),
  });

  const une = useMutation({
    mutationFn: ({ id, actif }: { id: string; actif: boolean }) => mettreALaUne(id, actif),
    onSuccess: (_, { actif }) => {
      setMessage({
        tone: 'success',
        texte: actif ? 'Article mis à la une du blog.' : 'Article retiré de la une.',
      });
      rafraichir();
    },
    onError: (erreur) => echec(erreur, 'La mise à la une a échoué.'),
  });

  const requete = admin ? backOffice : espace;

  if (requete.isPending) {
    return <p style={texteDoux}>Chargement…</p>;
  }

  if (requete.isError) {
    return <p style={{ ...texteDoux, color: '#E63946' }}>Le blog n’a pas pu être chargé.</p>;
  }

  const actif = admin ? true : (espace.data?.actif ?? false);
  const articles = admin ? (backOffice.data ?? []) : (espace.data?.articles ?? []);

  // ÉCRAN D'ACTIVATION — la maquette le montre seul, sans la liste derrière :
  // tant que le blog est fermé, il n'y a rien à faire d'autre que l'ouvrir.
  if (!actif) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {message && <Bandeau message={message} onFermer={() => setMessage(null)} />}

        <div
          style={{
            background: '#fff',
            border: '1px solid #EAE6DE',
            borderRadius: 16,
            padding: 34,
            textAlign: 'center',
            maxWidth: 640,
            margin: '8px auto',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#E7EDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Icon name="book-open" size={28} color="#1D3557" />
          </div>
          <div style={{ font: "800 19px/1.3 'Inter', sans-serif", letterSpacing: '-0.3px' }}>
            Activez votre blog
          </div>
          <div
            style={{
              font: "400 13.5px/1.6 'Inter', sans-serif",
              color: '#5A6472',
              marginTop: 8,
            }}
          >
            Le blog est <strong>désactivé</strong> par défaut. Activez-le pour rédiger des articles ;
            chaque article sera publié sur le site public après validation de l’administrateur.
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="primary"
              size="md"
              disabled={activation.isPending}
              onClick={() => activation.mutate(true)}
            >
              {activation.isPending ? 'Activation…' : 'Activer le blog'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const categories = [TOUS, ...new Set(articles.map((article) => article.categorie))];
  const visibles = filtre === TOUS ? articles : articles.filter((a) => a.categorie === filtre);
  const enAttente = articles.filter((a) => a.statut === 'en_attente').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
      {message && <Bandeau message={message} onFermer={() => setMessage(null)} />}

      {!admin && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: '#E6F4EC',
            border: '1px solid #BFE3CC',
            borderRadius: 12,
            padding: '12px 16px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              font: "600 13px/1 'Inter', sans-serif",
              color: '#1F7A45',
            }}
          >
            <Icon name="check" size={16} color="#1F7A45" />
            Blog activé pour votre compte
          </div>
          <button
            type="button"
            onClick={() => activation.mutate(false)}
            disabled={activation.isPending}
            style={{
              border: '1px solid #C7D3E2',
              background: '#fff',
              color: '#5A6472',
              font: "600 12.5px/1 'Inter', sans-serif",
              padding: '7px 13px',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Désactiver le blog
          </button>
        </div>
      )}

      <CircuitValidation admin={admin} enAttente={enAttente} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ ...texteDoux, maxWidth: 560, fontSize: 13.5 }}>
          {admin
            ? 'Contrôle total du blog : rédigez, validez les articles soumis par les établissements et les commerciaux, et choisissez ceux « à la une » sur le blog.'
            : 'Vos articles sont relus par l’administrateur avant publication.'}
        </div>

        <Button
          variant={redactionOuverte ? 'outline' : 'primary'}
          size="md"
          onClick={() => {
            setRedactionOuverte(!redactionOuverte);
            setEnEdition(null);
          }}
        >
          {redactionOuverte ? 'Annuler' : '+ Nouvel article'}
        </Button>
      </div>

      {redactionOuverte && (
        <Formulaire
          intitule="Nouvel article"
          enCours={redaction.isPending}
          onValider={(saisie) => redaction.mutate({ id: null, saisie })}
          onAnnuler={() => setRedactionOuverte(false)}
          etablissements={admin ? fiches.data : undefined}
        />
      )}

      {categories.length > 2 && (
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {categories.map((nom) => {
            const choisi = nom === filtre;

            return (
              <button
                key={nom}
                type="button"
                onClick={() => setFiltre(nom)}
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
                {nom}
              </button>
            );
          })}
        </div>
      )}

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
          {articles.length === 0
            ? 'Aucun article pour le moment. Rédigez le premier.'
            : 'Aucun article dans cette catégorie.'}
        </div>
      )}

      {visibles.map((article) =>
        enEdition === article.id ? (
          <Formulaire
            key={article.id}
            intitule="Modifier l’article"
            valeurs={article}
            enCours={redaction.isPending}
            onValider={(saisie) => redaction.mutate({ id: article.id, saisie })}
            onAnnuler={() => setEnEdition(null)}
          />
        ) : (
          <LigneArticle
            key={article.id}
            article={article}
            admin={admin}
            fige={decision.isPending || suppression.isPending || une.isPending}
            onModifier={() => {
              setEnEdition(article.id);
              setRedactionOuverte(false);
            }}
            onSoumettre={() => soumission.mutate(article.id)}
            onApprouver={() => decision.mutate({ id: article.id, choix: 'approuve' })}
            onRefuser={(motif) => decision.mutate({ id: article.id, choix: 'refuse', motif })}
            onUne={() => une.mutate({ id: article.id, actif: !article.a_la_une })}
            onSupprimer={() => suppression.mutate(article.id)}
          />
        ),
      )}
    </div>
  );
}

/** Rappel du circuit — les trois états, dans l'ordre, comme la maquette. */
function CircuitValidation({ admin, enAttente }: { admin: boolean; enAttente: number }) {
  const etapes = [
    { libelle: 'Brouillon', fond: '#F1F3F6', texte: '#5A6472', point: '#9AA3AF' },
    { libelle: 'En attente de validation', fond: '#FCF1DE', texte: '#B57708', point: '#E9A23B' },
    { libelle: 'Approuvé — en ligne', fond: '#E6F4EC', texte: '#1F7A45', point: '#2E9E5B' },
  ];

  return (
    <div
      style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 14, padding: '16px 20px' }}
    >
      <div
        style={{
          font: "700 11.5px/1 'Inter', sans-serif",
          letterSpacing: '.5px',
          textTransform: 'uppercase',
          color: '#9AA3AF',
          marginBottom: 12,
        }}
      >
        Circuit de validation
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {etapes.map((etape, rang) => (
          <span key={etape.libelle} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: etape.fond,
                color: etape.texte,
                font: "600 12.5px/1 'Inter', sans-serif",
                padding: '7px 12px',
                borderRadius: 20,
              }}
            >
              <span
                style={{ width: 8, height: 8, borderRadius: '50%', background: etape.point }}
                aria-hidden
              />
              {etape.libelle}
            </span>
            {rang < etapes.length - 1 && <Icon name="chevron-right" size={15} color="#C9D2DE" />}
          </span>
        ))}
      </div>

      <div
        style={{ font: "400 12.5px/1.5 'Inter', sans-serif", color: '#5A6472', marginTop: 11 }}
      >
        {admin
          ? enAttente > 0
            ? `${enAttente} article${enAttente > 1 ? 's' : ''} en attente de votre décision. Un refus exige un motif, transmis à l’auteur.`
            : 'Aucun article en attente. Un refus exige un motif, transmis à l’auteur.'
          : 'Un article modifié après publication repasse en brouillon et quitte le site : il devra être resoumis.'}
      </div>
    </div>
  );
}

function LigneArticle({
  article,
  admin,
  fige,
  onModifier,
  onSoumettre,
  onApprouver,
  onRefuser,
  onUne,
  onSupprimer,
}: {
  article: ArticleGestion;
  admin: boolean;
  fige: boolean;
  onModifier: () => void;
  onSoumettre: () => void;
  onApprouver: () => void;
  onRefuser: (motif: string) => void;
  onUne: () => void;
  onSupprimer: () => void;
}) {
  const [refusOuvert, setRefusOuvert] = useState(false);
  const [motif, setMotif] = useState('');
  const [confirmation, setConfirmation] = useState(false);

  const enAttente = article.statut === 'en_attente';
  const publie = article.statut === 'approuve';

  /**
   * SIGNALÉ AU SEUL RELECTEUR, et seulement sur un article en attente : c'est
   * le moment où la question se pose. L'afficher sur un brouillon de l'auteur
   * lui ferait croire à un refus à venir, alors que rien n'est encore décidé.
   */
  const referentiel = useQuery({
    queryKey: ['categories-articles'],
    queryFn: chargerCategoriesProposees,
    enabled: admin && enAttente,
    staleTime: 3_600_000,
  });

  const categorieInedite =
    admin &&
    enAttente &&
    referentiel.data !== undefined &&
    !referentiel.data.some((c) => c.libelle === article.categorie);

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #EAE6DE',
        borderRadius: 14,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span
          style={{
            font: "700 11px/1 'Inter', sans-serif",
            letterSpacing: '.4px',
            textTransform: 'uppercase',
            color: '#E63946',
          }}
        >
          {article.categorie}
        </span>
        {/*
          LE RELECTEUR DOIT SAVOIR AVANT DE DÉCIDER. Approuver un article dont
          la catégorie est inédite l'ajoute au référentiel (règle du client du
          7 octobre 2026) : il ne tranche pas que la publication, il adopte
          aussi un libellé que toute la rédaction se verra proposer ensuite.
          Sans cette mention, l'adoption serait silencieuse.
        */}
        {categorieInedite && (
          <span
            style={{
              font: "700 11px/1 'Inter', sans-serif",
              color: '#B57708',
              background: '#FCF1DE',
              border: '1px solid #F0D18B',
              padding: '4px 9px',
              borderRadius: 20,
            }}
            title="Cette catégorie n’existe pas encore dans la liste proposée. L’approuver l’y ajoutera."
          >
            Nouvelle catégorie
          </span>
        )}
        <Badge tone={TON_STATUT[article.statut]}>{LIBELLE_STATUT[article.statut]}</Badge>
        {article.a_la_une && (
          <span
            style={{
              font: "700 11px/1 'Inter', sans-serif",
              color: '#B57708',
              background: '#FCF1DE',
              border: '1px solid #F0D18B',
              padding: '4px 9px',
              borderRadius: 6,
            }}
          >
            ★ À la une
          </span>
        )}
      </div>

      <div style={{ font: "700 15.5px/1.3 'Inter', sans-serif", letterSpacing: '-0.2px' }}>
        {article.titre}
      </div>

      <div style={{ font: "400 12.5px/1.4 'Inter', sans-serif", color: '#9AA3AF' }}>
        {article.etablissement?.nom ?? article.auteur?.name ?? 'écoles360'}
        {' · '}
        {formaterDate(article.publie_le ?? article.soumis_le ?? article.cree_le)}
      </div>

      {/* LE MOTIF DU REFUS EST AFFICHÉ À L'AUTEUR, pas seulement stocké : c'est
          toute la raison d'être du champ. */}
      {article.statut === 'refuse' && article.motif_refus && (
        <div
          style={{
            background: '#FDF2F3',
            border: '1px solid #F3C9CD',
            borderRadius: 10,
            padding: '10px 13px',
            font: "400 13px/1.55 'Inter', sans-serif",
            color: '#8E2833',
          }}
        >
          <strong>Motif du refus :</strong> {article.motif_refus}
        </div>
      )}

      {refusOuvert && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Textarea
            label="Motif du refus (transmis à l’auteur)"
            required
            rows={3}
            value={motif}
            onChange={(evenement) => setMotif(evenement.target.value)}
            placeholder="Expliquez ce qui doit être corrigé pour que l’article soit publiable."
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="primary"
              size="sm"
              disabled={motif.trim().length < 20 || fige}
              onClick={() => onRefuser(motif.trim())}
            >
              Confirmer le refus
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setRefusOuvert(false)}>
              Annuler
            </Button>
          </div>
          {motif.trim().length > 0 && motif.trim().length < 20 && (
            <span style={{ font: "400 12px/1 'Inter', sans-serif", color: '#9AA3AF' }}>
              Encore {20 - motif.trim().length} caractères — un refus doit s’expliquer.
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
        <Button variant="outline" size="sm" onClick={onModifier}>
          Modifier
        </Button>

        {!admin && !enAttente && !publie && (
          <Button variant="primary" size="sm" disabled={fige} onClick={onSoumettre}>
            Soumettre à validation
          </Button>
        )}

        {admin && enAttente && !refusOuvert && (
          <>
            <Button variant="success" size="sm" disabled={fige} onClick={onApprouver}>
              Approuver
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRefusOuvert(true)}>
              Refuser
            </Button>
          </>
        )}

        {admin && publie && (
          <Button variant="outline" size="sm" disabled={fige} onClick={onUne}>
            ★ {article.a_la_une ? 'Retirer de la une' : 'Mettre à la une'}
          </Button>
        )}

        {publie && (
          <a
            href={`/blog/${article.slug}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              font: "600 12.5px/1 'Inter', sans-serif",
              color: '#1D3557',
              border: '1px solid #E1E5EA',
              borderRadius: 8,
              padding: '8px 13px',
            }}
          >
            <Icon name="external-link" size={14} color="#1D3557" />
            Voir en ligne
          </a>
        )}

        {confirmation ? (
          <>
            <Button variant="primary" size="sm" disabled={fige} onClick={onSupprimer}>
              Confirmer la suppression
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmation(false)}>
              Annuler
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setConfirmation(true)}>
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Rédaction d'un article — formulaire à gauche, aperçu à droite.
 *
 * L'APERÇU EST LA CARTE PUBLIÉE, pas une décoration : la maquette le place là
 * pour que l'auteur voie ce que le lecteur verra sur le blog — titre tronqué,
 * chapeau trop long, catégorie mal choisie se repèrent tout de suite.
 */
function Formulaire({
  intitule,
  valeurs,
  enCours,
  onValider,
  onAnnuler,
  etablissements,
}: {
  intitule: string;
  valeurs?: ArticleGestion;
  enCours: boolean;
  onValider: (saisie: SaisieArticle) => void;
  onAnnuler: () => void;
  /** Back-office seulement : la liste des fiches au nom desquelles publier. */
  etablissements?: { id: string; nom: string }[];
}) {
  /**
   * LA LISTE VIENT DU RÉFÉRENTIEL, plus du code. Une catégorie ajoutée depuis
   * « Contenu du site » apparaît ici sans redéploiement ; une catégorie
   * retirée cesse d'être proposée sans toucher aux articles qui la portent.
   */
  const referentiel = useQuery({
    queryKey: ['categories-articles'],
    queryFn: chargerCategoriesProposees,
    staleTime: 3_600_000,
  });

  const categories = referentiel.data?.length
    ? referentiel.data.map((c) => c.libelle)
    : CATEGORIES_DE_REPLI;

  const [titre, setTitre] = useState(valeurs?.titre ?? '');
  const [categorie, setCategorie] = useState(valeurs?.categorie ?? '');
  const [chapeau, setChapeau] = useState(valeurs?.chapeau ?? '');
  const [contenu, setContenu] = useState(valeurs?.contenu ?? '');
  const [auteur, setAuteur] = useState('');

  const complet = titre.trim() !== '' && categorie.trim() !== '';

  return (
    <form
      onSubmit={(evenement) => {
        evenement.preventDefault();
        if (!complet) return;

        onValider({
          titre: titre.trim(),
          categorie: categorie.trim(),
          chapeau: chapeau.trim() || undefined,
          contenu: contenu.trim() || undefined,
          ...(auteur ? { etablissement_id: Number(auteur) } : {}),
        });
      }}
      className="e3-blog-editeur"
      style={{ display: 'grid', gap: 20, alignItems: 'start' }}
    >
      <div
        style={{
          background: '#fff',
          border: '1px solid #D9DEE5',
          borderRadius: 14,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ font: "700 16px/1.3 'Inter', sans-serif" }}>{intitule}</div>

        {/*
          AU NOM DE QUI — back-office seulement, et à la création seulement.
          C'est ce qui remplit le bloc « Blog » d'une fiche tant que l'école
          n'a pas de compte : sans lui, la fiche affiche « n'a pas encore
          publié » et se rabat sur les articles d'écoles360.

          Absent à la modification : changer l'auteur d'un article déjà publié
          le ferait disparaître d'une fiche pour apparaître sur une autre, sans
          que personne ne s'en aperçoive.
        */}
        {etablissements && !valeurs && (
          <label style={{ display: 'block' }}>
            <span
              style={{
                display: 'block',
                font: "600 12px/1.4 'Inter', sans-serif",
                color: '#5A6472',
                marginBottom: 5,
              }}
            >
              Publier au nom de
            </span>
            <select
              value={auteur}
              onChange={(evenement) => setAuteur(evenement.target.value)}
              style={{
                width: '100%',
                height: 40,
                padding: '0 11px',
                font: "400 14px/1.5 'Inter', sans-serif",
                color: '#1A1A1A',
                background: '#fff',
                border: '1px solid #D9DEE5',
                borderRadius: 9,
              }}
            >
              <option value="">écoles360 — article de la plateforme</option>
              {etablissements.map((etablissement) => (
                <option key={etablissement.id} value={etablissement.id}>
                  {etablissement.nom}
                </option>
              ))}
            </select>
          </label>
        )}

        <Input
          label="Titre de l’article"
          required
          value={titre}
          onChange={(evenement) => setTitre(evenement.target.value)}
          placeholder="Ex. : Comment choisir une école primaire ?"
        />

        <div>
          <Input
            label="Catégorie"
            required
            value={categorie}
            onChange={(evenement) => setCategorie(evenement.target.value)}
            placeholder="Vie des établissements"
          />
          {/*
            LA MAQUETTE PROPOSE UNE LISTE PLUS « Autre catégorie… ». Ici la
            saisie est libre et les pastilles servent de raccourci : une
            catégorie inédite est validée AVEC l'article, par la même relecture.
            Un circuit de validation séparé pour les catégories serait une
            deuxième file d'attente pour le même arbitrage.
          */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {categories.map((nom) => (
              <button
                key={nom}
                type="button"
                onClick={() => setCategorie(nom)}
                style={{
                  border: '1px solid #EAE6DE',
                  background: categorie === nom ? '#FBE9EA' : '#fff',
                  color: categorie === nom ? '#E63946' : '#5A6472',
                  font: "600 12.5px/1 'Inter', sans-serif",
                  padding: '7px 12px',
                  borderRadius: 20,
                  cursor: 'pointer',
                }}
              >
                {nom}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          label="Chapeau / extrait"
          rows={3}
          value={chapeau}
          onChange={(evenement) => setChapeau(evenement.target.value)}
          placeholder="Résumé affiché sur la carte de l’article…"
        />

        <div>
          <Textarea
            label="Contenu de l’article"
            rows={9}
            value={contenu}
            onChange={(evenement) => setContenu(evenement.target.value)}
            placeholder="Rédigez ici le corps de l’article. Laissez une ligne vide entre deux paragraphes."
          />
          <div style={{ font: "400 11.5px/1.5 'Inter', sans-serif", color: '#9AA3AF', marginTop: 6 }}>
            Texte publié sur la page de l’article. Un article sans contenu ne peut pas être soumis.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            borderTop: '1px solid #F1ECE3',
            paddingTop: 17,
            flexWrap: 'wrap',
          }}
        >
          <Button variant="primary" size="md" type="submit" disabled={!complet || enCours}>
            {enCours ? 'Envoi…' : 'Enregistrer le brouillon'}
          </Button>
          <Button variant="ghost" size="md" onClick={onAnnuler}>
            Annuler
          </Button>
        </div>
      </div>

      <div
        style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 14, overflow: 'hidden' }}
      >
        <div style={{ padding: '18px 20px' }}>
          <div
            style={{
              font: "700 11px/1 'Inter', sans-serif",
              letterSpacing: '.4px',
              textTransform: 'uppercase',
              color: '#E63946',
              marginBottom: 8,
            }}
          >
            {categorie || 'Catégorie'}
          </div>
          <div style={{ font: "800 17px/1.3 'Inter', sans-serif", letterSpacing: '-0.3px' }}>
            {titre || 'Titre de l’article'}
          </div>
          {chapeau && (
            <div
              style={{
                font: "400 13.5px/1.6 'Inter', sans-serif",
                color: '#5A6472',
                marginTop: 8,
              }}
            >
              {chapeau}
            </div>
          )}
          {contenu && (
            <div
              style={{
                font: "400 13px/1.7 'Inter', sans-serif",
                color: '#3A424E',
                marginTop: 12,
                borderTop: '1px solid #F1ECE3',
                paddingTop: 12,
                whiteSpace: 'pre-wrap',
              }}
            >
              {contenu.slice(0, 400)}
              {contenu.length > 400 && '…'}
            </div>
          )}
          <div style={{ marginTop: 14, font: "400 12px/1 'Inter', sans-serif", color: '#9AA3AF' }}>
            Aperçu de la carte publiée sur le blog
          </div>
        </div>
      </div>
    </form>
  );
}

function Bandeau({ message, onFermer }: { message: Message; onFermer: () => void }) {
  return (
    <Toast
      tone={message.tone}
      title={message.tone === 'success' ? 'Enregistré' : 'Refusé'}
      message={message.texte}
      onClose={onFermer}
    />
  );
}

const texteDoux: React.CSSProperties = {
  font: "400 14px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};
