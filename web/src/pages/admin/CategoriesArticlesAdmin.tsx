import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import {
  chargerCategoriesProposees,
  creerCategorieArticle,
  supprimerCategorieArticle,
  type CategorieArticle,
} from '@/api/articles';
import { Button, Input, Toast } from '@/ds/composants';

/**
 * Catégories d'articles — onglet « Catégories » de « Contenu du site ».
 *
 * CETTE LISTE PROPOSE, ELLE N'IMPOSE PAS. `Article.categorie` reste une chaîne
 * libre côté base : retirer une catégorie ne déclasse aucun article déjà
 * écrit, elle cesse seulement d'être offerte à la rédaction. L'écran le dit,
 * parce que « supprimer » laisse spontanément craindre le contraire.
 *
 * LA LISTE A ÉTÉ REPRISE DES ARTICLES EXISTANTS, pas des cinq catégories de la
 * maquette : la base en portait six autres, et un écran de gestion qui ignore
 * ce qui est réellement utilisé ne gère rien.
 *
 * LES DEMANDES DE CATÉGORIE DE LA MAQUETTE NE SONT PAS LÀ. Elle montre des
 * propositions d'établissements à approuver, mais aucune règle ne dit qui peut
 * demander, ce qui se passe au refus, ni si l'article attend. C'est une
 * décision du client (B-50), pas un oubli.
 */
export function CategoriesArticlesAdmin() {
  const queryClient = useQueryClient();
  const [libelle, setLibelle] = useState('');
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; texte: string } | null>(null);

  const cle = ['categories-articles'];
  const categories = useQuery({ queryKey: cle, queryFn: chargerCategoriesProposees });

  const rafraichir = () => void queryClient.invalidateQueries({ queryKey: cle });

  const echec = (erreur: unknown, repli: string) =>
    setMessage({ tone: 'error', texte: erreur instanceof ApiError ? erreur.message : repli });

  const ajout = useMutation({
    mutationFn: () => creerCategorieArticle(libelle.trim()),
    onSuccess: () => {
      setLibelle('');
      setMessage(null);
      rafraichir();
    },
    onError: (erreur) => echec(erreur, 'La catégorie n’a pas pu être ajoutée.'),
  });

  const retrait = useMutation({
    mutationFn: (id: string) => supprimerCategorieArticle(id),
    onSuccess: (resultat) => {
      /**
       * LE NOMBRE D'ARTICLES CONCERNÉS EST DIT APRÈS COUP, pas demandé avant.
       * Retirer une catégorie encore portée est le cas courant — on renomme
       * une rubrique —, et une confirmation à chaque fois ferait du bruit. Ce
       * qu'il faut, c'est savoir ce qu'on a laissé derrière.
       */
      setMessage({
        tone: 'success',
        texte:
          resultat.articles_concernes > 0
            ? `Catégorie retirée. ${resultat.articles_concernes} article(s) gardent ce libellé et ne seront plus reclassables dessous.`
            : 'Catégorie retirée. Aucun article ne portait ce libellé.',
      });
      rafraichir();
    },
    onError: (erreur) => echec(erreur, 'La catégorie n’a pas pu être retirée.'),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {message && (
        <Toast
          tone={message.tone}
          title={message.tone === 'success' ? 'Catégories' : 'Action refusée'}
          message={message.texte}
          onClose={() => setMessage(null)}
        />
      )}

      <div style={carte}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <Input
              label="Nouvelle catégorie"
              value={libelle}
              placeholder="Orientation"
              onChange={(e) => setLibelle(e.target.value)}
            />
          </div>
          <Button onClick={() => ajout.mutate()} disabled={ajout.isPending || !libelle.trim()}>
            + Ajouter la catégorie
          </Button>
        </div>
      </div>

      {categories.isPending && <p style={texteDoux}>Chargement…</p>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
        {categories.data?.map((categorie) => (
          <Puce
            key={categorie.id}
            categorie={categorie}
            enCours={retrait.isPending}
            onRetirer={() => retrait.mutate(categorie.id)}
          />
        ))}
      </div>

      {categories.data?.length === 0 && (
        <p style={texteDoux}>
          Aucune catégorie proposée. La rédaction devra en saisir une à la main, et les variantes
          orthographiques s’accumuleront.
        </p>
      )}

      <p style={{ ...texteDoux, fontSize: 12.5 }}>
        Cette liste est ce que la rédaction se voit <strong>proposer</strong>. Retirer une catégorie
        ne déclasse aucun article déjà publié : il garde son libellé, mais plus personne ne pourra
        en classer de nouveaux dessous.
      </p>
    </div>
  );
}

function Puce({
  categorie,
  enCours,
  onRetirer,
}: {
  categorie: CategorieArticle;
  enCours: boolean;
  onRetirer: () => void;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 9,
        background: '#fff',
        border: '1px solid #E1E5EA',
        borderRadius: 20,
        padding: '8px 10px 8px 14px',
        font: "600 13px/1 'Inter', sans-serif",
        color: '#3A424E',
      }}
    >
      {categorie.libelle}
      <button
        type="button"
        disabled={enCours}
        onClick={onRetirer}
        aria-label={`Retirer la catégorie ${categorie.libelle}`}
        style={{
          border: 'none',
          background: '#F1EEE8',
          color: '#5A6472',
          borderRadius: '50%',
          width: 20,
          height: 20,
          lineHeight: '20px',
          cursor: enCours ? 'default' : 'pointer',
          font: "700 13px/1 'Inter', sans-serif",
        }}
      >
        ×
      </button>
    </span>
  );
}

const carte: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #EAE6DE',
  borderRadius: 16,
  padding: '18px 20px',
};

const texteDoux: React.CSSProperties = {
  font: "400 14px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};
