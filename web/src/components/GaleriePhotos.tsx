import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { Button, EmptyState, Icon } from '@/ds/composants';

/** Formats que l'API accepte — repris tel quel dans l'attribut `accept`. */
const FORMATS = 'image/jpeg,image/png,image/webp';

/** Une photo, telle que la rendent les deux API. */
export interface Photo {
  id: string;
  chemin: string;
  alt: string | null;
  ordre: number;
  poids: number | null;
}

/**
 * Les six gestes, injectés par l'écran qui monte la galerie.
 *
 * L'ADMIN ET L'ÉTABLISSEMENT N'APPELLENT PAS LES MÊMES ROUTES — l'un vise une
 * fiche par son identifiant, l'autre la sienne par sa session (RG05) — mais
 * ils font exactement les mêmes gestes, sur les mêmes données, avec la même
 * ergonomie. Dupliquer l'écran garantirait qu'une correction n'atterrisse un
 * jour que d'un côté.
 */
export interface OperationsGalerie {
  lister: () => Promise<Photo[]>;
  ajouter: (fichiers: File[]) => Promise<Photo[]>;
  remplacer: (photoId: string, fichier: File) => Promise<Photo[]>;
  legender: (photoId: string, alt: string) => Promise<Photo[]>;
  supprimer: (photoId: string) => Promise<Photo[]>;
  reordonner: (ids: string[]) => Promise<Photo[]>;
}

/**
 * Galerie d'une fiche — ajout, remplacement, ordre.
 *
 * LA PREMIÈRE PHOTO EST LA VIGNETTE des résultats de recherche. C'est la
 * seule chose que cet écran doit rendre évidente : l'ordre n'est pas
 * décoratif, il décide de ce qu'un parent voit avant de cliquer. D'où le
 * bandeau « Vignette » sur la première, et les flèches pour la changer.
 *
 * REMPLACER PLUTÔT QUE SUPPRIMER-PUIS-AJOUTER. Une photo floue se corrige sans
 * perdre sa place ni sa légende — c'est la demande telle qu'elle arrive, et
 * c'est ce que la route `PUT …/photos/:id` fait.
 */
export function GaleriePhotos({
  titre,
  cle,
  operations,
  aInvalider,
  onFerme,
}: {
  titre: string;
  /** Clé de cache — propre à la fiche, pour que deux galeries ne se mêlent pas. */
  cle: readonly unknown[];
  operations: OperationsGalerie;
  /** Requêtes que la vignette influence — listes du back-office, fiche publique. */
  aInvalider?: readonly unknown[];
  onFerme?: () => void;
}) {
  const queryClient = useQueryClient();
  const champFichiers = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const photos = useQuery({
    queryKey: cle,
    queryFn: operations.lister,
  });

  /**
   * Chaque écriture rend la galerie complète : on la pose dans le cache au
   * lieu de la redemander. Une invalidation ferait clignoter la grille le
   * temps d'un aller-retour, juste après une action qu'on vient de confirmer.
   */
  const ecriture = useMutation({
    mutationFn: (operation: () => Promise<Photo[]>) => operation(),
    onSuccess: (galerie) => {
      queryClient.setQueryData(cle, galerie);

      if (aInvalider) {
        void queryClient.invalidateQueries({ queryKey: aInvalider });
      }

      setMessage(null);
    },
    onError: (erreur: unknown) =>
      setMessage(
        erreur instanceof ApiError
          ? erreur.message
          : 'Le téléversement a échoué. Réessayez dans un instant.',
      ),
  });

  const liste = photos.data ?? [];

  const deplacer = (index: number, sens: -1 | 1) => {
    const cible = index + sens;

    if (cible < 0 || cible >= liste.length) {
      return;
    }

    const ids = liste.map((photo) => photo.id);
    [ids[index], ids[cible]] = [ids[cible]!, ids[index]!];

    ecriture.mutate(() => operations.reordonner(ids));
  };

  return (
    <div style={carte}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Icon name="image" size={18} color="#E63946" />
        <h2 style={{ font: "800 16px/1.2 'Inter', sans-serif", margin: 0, flex: 1 }}>{titre}</h2>
        {onFerme && (
          <Button variant="ghost" size="sm" onClick={onFerme}>
            Fermer
          </Button>
        )}
      </div>

      <p style={indication}>
        La première photo sert de vignette dans les résultats de recherche. JPEG, PNG ou WebP,
        5 Mo maximum par fichier.
      </p>

      {message && (
        <p role="alert" style={{ ...indication, color: '#C42B38', fontWeight: 600 }}>
          {message}
        </p>
      )}

      <input
        ref={champFichiers}
        type="file"
        accept={FORMATS}
        multiple
        hidden
        onChange={(evenement) => {
          const fichiers = [...(evenement.target.files ?? [])];

          if (fichiers.length > 0) {
            ecriture.mutate(() => operations.ajouter(fichiers));
          }

          // Remise à zéro : sans elle, re-choisir LE MÊME fichier n'émettrait
          // pas de nouvel évènement `change`.
          evenement.target.value = '';
        }}
      />

      <div style={{ display: 'flex', gap: 8, margin: '10px 0 16px' }}>
        <Button
          variant="primary"
          size="sm"
          disabled={ecriture.isPending}
          onClick={() => champFichiers.current?.click()}
        >
          {ecriture.isPending ? 'Envoi…' : 'Ajouter des photos'}
        </Button>
      </div>

      {photos.isPending && <p style={indication}>Chargement de la galerie…</p>}

      {photos.isSuccess && liste.length === 0 && (
        <EmptyState
          icon="image"
          title="Aucune photo"
          description="La fiche s’affichera sans galerie tant qu’aucune photo n’est téléversée."
        />
      )}

      <div style={grille}>
        {liste.map((photo, index) => (
          <Vignette
            key={photo.id}
            photo={photo}
            estVignette={index === 0}
            premiere={index === 0}
            derniere={index === liste.length - 1}
            occupe={ecriture.isPending}
            onDeplacer={(sens) => deplacer(index, sens)}
            onRemplacer={(fichier) =>
              ecriture.mutate(() => operations.remplacer(photo.id, fichier))
            }
            onLegender={(alt) =>
              ecriture.mutate(() => operations.legender(photo.id, alt))
            }
            onSupprimer={() =>
              ecriture.mutate(() => operations.supprimer(photo.id))
            }
          />
        ))}
      </div>
    </div>
  );
}

function Vignette({
  photo,
  estVignette,
  premiere,
  derniere,
  occupe,
  onDeplacer,
  onRemplacer,
  onLegender,
  onSupprimer,
}: {
  photo: Photo;
  estVignette: boolean;
  premiere: boolean;
  derniere: boolean;
  occupe: boolean;
  onDeplacer: (sens: -1 | 1) => void;
  onRemplacer: (fichier: File) => void;
  onLegender: (alt: string) => void;
  onSupprimer: () => void;
}) {
  const champRemplacement = useRef<HTMLInputElement>(null);
  const [legende, setLegende] = useState(photo.alt ?? '');
  const [confirmation, setConfirmation] = useState(false);

  const legendeModifiee = legende.trim() !== (photo.alt ?? '');

  return (
    <figure style={vignette}>
      <div style={{ position: 'relative', aspectRatio: '4 / 3', background: '#EEF1F4' }}>
        <img
          src={photo.chemin}
          alt={photo.alt ?? ''}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {estVignette && <span style={ruban}>Vignette</span>}

        <div style={barreOutils}>
          <OutilRond
            icone="chevron-left"
            libelle="Reculer dans la galerie"
            disabled={premiere || occupe}
            onClick={() => onDeplacer(-1)}
          />
          <OutilRond
            icone="chevron-right"
            libelle="Avancer dans la galerie"
            disabled={derniere || occupe}
            onClick={() => onDeplacer(1)}
          />
        </div>
      </div>

      <figcaption style={{ padding: 10 }}>
        <label style={etiquette} htmlFor={`legende-${photo.id}`}>
          Légende
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            id={`legende-${photo.id}`}
            value={legende}
            placeholder="Cour de récréation"
            maxLength={160}
            onChange={(evenement) => setLegende(evenement.target.value)}
            style={saisie}
          />
          {legendeModifiee && (
            <button
              type="button"
              onClick={() => onLegender(legende.trim())}
              disabled={occupe || legende.trim().length === 0}
              style={{ ...boutonTexte, color: '#1F7A45' }}
            >
              Enregistrer
            </button>
          )}
        </div>

        <input
          ref={champRemplacement}
          type="file"
          accept={FORMATS}
          hidden
          onChange={(evenement) => {
            const fichier = evenement.target.files?.[0];

            if (fichier) {
              onRemplacer(fichier);
            }

            evenement.target.value = '';
          }}
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            type="button"
            disabled={occupe}
            onClick={() => champRemplacement.current?.click()}
            style={boutonTexte}
          >
            Remplacer
          </button>

          {/*
            DEUX TEMPS AVANT DE SUPPRIMER. Le fichier quitte le volume et ne
            revient pas ; une case cliquée de travers dans une grille de
            vignettes serrées coûterait une photo que l'école devrait
            re-fournir.
          */}
          {confirmation ? (
            <>
              <button
                type="button"
                disabled={occupe}
                onClick={onSupprimer}
                style={{ ...boutonTexte, color: '#C42B38', fontWeight: 700 }}
              >
                Confirmer
              </button>
              <button
                type="button"
                onClick={() => setConfirmation(false)}
                style={{ ...boutonTexte, color: '#9AA3AF' }}
              >
                Annuler
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={occupe}
              onClick={() => setConfirmation(true)}
              style={{ ...boutonTexte, color: '#C42B38' }}
            >
              Supprimer
            </button>
          )}
        </div>
      </figcaption>
    </figure>
  );
}

function OutilRond({
  icone,
  libelle,
  disabled,
  onClick,
}: {
  icone: string;
  libelle: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={libelle}
      title={libelle}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(255,255,255,.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        boxShadow: '0 2px 8px rgba(0,0,0,.16)',
      }}
    >
      <Icon name={icone} size={15} color="#1A1A1A" />
    </button>
  );
}

const carte: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #EAE6DE',
  borderRadius: 16,
  padding: '18px 20px 20px',
};

const grille: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
  gap: 12,
};

const vignette: React.CSSProperties = {
  margin: 0,
  border: '1px solid #EAE6DE',
  borderRadius: 12,
  overflow: 'hidden',
  background: '#fff',
};

const ruban: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  left: 8,
  background: '#E63946',
  color: '#fff',
  font: "700 10px/1 'Inter', sans-serif",
  letterSpacing: '.6px',
  textTransform: 'uppercase',
  padding: '5px 8px',
  borderRadius: 6,
};

const barreOutils: React.CSSProperties = {
  position: 'absolute',
  right: 8,
  bottom: 8,
  display: 'flex',
  gap: 6,
};

const etiquette: React.CSSProperties = {
  display: 'block',
  font: "600 10.5px/1 'Inter', sans-serif",
  letterSpacing: '.5px',
  textTransform: 'uppercase',
  color: '#9AA3AF',
  marginBottom: 5,
};

const saisie: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  height: 32,
  padding: '0 8px',
  font: "400 12.5px/1 'Inter', sans-serif",
  border: '1px solid #E1E5EA',
  borderRadius: 8,
  outline: 'none',
  background: '#fff',
};

const boutonTexte: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  font: "600 12.5px/1 'Inter', sans-serif",
  color: '#1D3557',
  cursor: 'pointer',
};

const indication: React.CSSProperties = {
  font: "400 12.5px/1.5 'Inter', sans-serif",
  color: '#5A6472',
  margin: '0 0 4px',
};
