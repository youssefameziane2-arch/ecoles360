import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import {
  activerEssaiGratuit,
  ajouterPhotos,
  basculerBadges,
  changerStatutEtablissement,
  supprimerEtablissement,
  chargerEtablissementsAdmin,
  chargerPhotosAdmin,
  legenderPhoto,
  LIBELLE_STATUT,
  remplacerPhoto,
  reordonnerPhotos,
  supprimerPhoto,
  type EtablissementAdmin,
  type StatutEtablissement,
} from '@/api/admin';
import { LIBELLE_TYPE, type TypeEtablissement } from '@/api/etablissements';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { Badge, Button, EmptyState, Toast } from '@/ds/composants';
import { formaterDate } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';
import { GaleriePhotos } from '@/components/GaleriePhotos';
import { FormulaireEtablissement } from './FormulaireEtablissement';


const STATUTS: StatutEtablissement[] = ['en_attente', 'validee', 'suspendue', 'masquee'];
const TYPES = Object.keys(LIBELLE_TYPE) as TypeEtablissement[];

const TON_STATUT: Record<StatutEtablissement, 'amber' | 'green' | 'red' | 'grey'> = {
  en_attente: 'amber',
  validee: 'green',
  suspendue: 'red',
  masquee: 'grey',
};

/**
 * Établissements — écran `isAdminEtab` de la maquette.
 *
 * LA VALIDATION EST VERROUILLÉE PAR L'ABONNEMENT (RG14). L'API répond 409 tant
 * que rien n'est encaissé ; cet écran l'explique et propose l'action qui
 * débloque — activer l'essai gratuit (RG13) — plutôt que d'afficher un refus
 * sans issue. La facturation complète (facture, encaissement) reste à venir.
 */
export function EtablissementsAdmin() {
  useTitrePage('Établissements');

  return (
    <AvecIdentite
      role={['superadmin']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="Établissements"
          sousTitre="Validez les inscriptions, gérez les statuts et la mise en avant"
        >
          <Contenu />
        </CoquilleEspace>
      )}
    />
  );
}

function Contenu() {
  const queryClient = useQueryClient();
  const [statut, setStatut] = useState<StatutEtablissement | undefined>();
  const [type, setType] = useState<TypeEtablissement | undefined>();
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; texte: string } | null>(null);
  const [creation, setCreation] = useState(false);

  /**
   * La galerie s'ouvre SOUS la ligne concernée, pas dans une fenêtre modale.
   *
   * Une modale masquerait la liste, et la première chose qu'on veut vérifier
   * après avoir changé la vignette, c'est justement à quoi ressemble la ligne
   * dans la liste.
   */
  const [galerie, setGalerie] = useState<{ id: string; nom: string } | null>(null);

  const etablissements = useQuery({
    queryKey: ['admin', 'etablissements', statut, type],
    queryFn: () => chargerEtablissementsAdmin({ statut, type }),
  });

  const rafraichir = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'etablissements'] });
  };

  const action = useMutation({
    mutationFn: async (operation: () => Promise<unknown>) => operation(),
    onSuccess: () => {
      setMessage({ tone: 'success', texte: 'Action effectuée.' });
      rafraichir();
    },
    onError: (erreur: unknown) => {
      setMessage({
        tone: 'error',
        texte:
          erreur instanceof ApiError
            ? erreur.message
            : "L'action a échoué. Réessayez dans un instant.",
      });
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {message && (
        <Toast
          tone={message.tone}
          title={message.tone === 'success' ? 'Fait' : 'Action refusée'}
          message={message.texte}
          onClose={() => setMessage(null)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {!creation && (
          <Button variant="primary" size="sm" onClick={() => setCreation(true)}>
            + Ajouter un établissement
          </Button>
        )}
      </div>

      {creation && (
        <FormulaireEtablissement
          onAnnuler={() => setCreation(false)}
          onCree={(fiche) => {
            setCreation(false);
            rafraichir();
            setMessage({
              tone: 'success',
              texte: `« ${fiche.nom} » est créée, en attente de validation. Ajoutez ses photos, puis activez l’essai gratuit pour la publier.`,
            });
            // On enchaîne directement sur la galerie : une fiche sans photo
            // n'a pas de vignette, et c'est le premier manque qu'on voit.
            setGalerie({ id: fiche.id, nom: fiche.nom });
          }}
        />
      )}

      {galerie && (
        <GaleriePhotos
          titre={`Photos — ${galerie.nom}`}
          cle={['admin', 'photos', galerie.id]}
          aInvalider={['admin', 'etablissements']}
          operations={{
            lister: () => chargerPhotosAdmin(galerie.id),
            ajouter: (fichiers) => ajouterPhotos(galerie.id, fichiers),
            remplacer: (photoId, fichier) => remplacerPhoto(galerie.id, photoId, fichier),
            legender: (photoId, alt) => legenderPhoto(galerie.id, photoId, alt),
            supprimer: (photoId) => supprimerPhoto(galerie.id, photoId),
            reordonner: (ids) => reordonnerPhotos(galerie.id, ids),
          }}
          onFerme={() => setGalerie(null)}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <FiltreChips
          libelle="Statut"
          valeurs={STATUTS.map((s) => ({ cle: s, label: LIBELLE_STATUT[s] }))}
          actif={statut}
          onChange={(cle) => setStatut(cle as StatutEtablissement | undefined)}
        />
        <FiltreChips
          libelle="Type"
          valeurs={TYPES.map((t) => ({ cle: t, label: LIBELLE_TYPE[t] }))}
          actif={type}
          onChange={(cle) => setType(cle as TypeEtablissement | undefined)}
        />
      </div>

      {etablissements.isPending && <p style={texteDoux}>Chargement…</p>}

      {etablissements.data?.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 16 }}>
          <EmptyState
            icon="building"
            title="Aucun établissement ne correspond"
            description="Changez les filtres pour élargir la liste."
          />
        </div>
      )}

      {etablissements.data?.map((etablissement) => (
        <LigneEtablissement
          key={etablissement.id}
          etablissement={etablissement}
          enCours={action.isPending}
          galerieOuverte={galerie?.id === etablissement.id}
          onAction={(operation) => action.mutate(operation)}
          onGalerie={() =>
            setGalerie(
              galerie?.id === etablissement.id
                ? null
                : { id: etablissement.id, nom: etablissement.nom },
            )
          }
        />
      ))}

      <p style={{ ...texteDoux, fontSize: 12.5 }}>
        « Valider » n’est possible qu’une fois l’abonnement encaissé (RG14). L’essai gratuit
        (RG13) débloque la publication sans facture.
      </p>
    </div>
  );
}

function LigneEtablissement({
  etablissement,
  enCours,
  galerieOuverte,
  onAction,
  onGalerie,
}: {
  etablissement: EtablissementAdmin;
  enCours: boolean;
  galerieOuverte: boolean;
  onAction: (operation: () => Promise<unknown>) => void;
  onGalerie: () => void;
}) {
  const abonnement = etablissement.abonnements[0];

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #EAE6DE',
        borderLeft: etablissement.sponsorise ? '4px solid #E63946' : '1px solid #EAE6DE',
        borderRadius: 14,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <a
            href={`/etablissements/${etablissement.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 15, fontWeight: 700, color: '#1D3557', textDecoration: 'none' }}
          >
            {etablissement.nom}
          </a>
          <Badge tone={TON_STATUT[etablissement.statut]}>
            {LIBELLE_STATUT[etablissement.statut]}
          </Badge>
          {etablissement.sponsorise && <Badge tone="red">Sponsorisé</Badge>}
          {etablissement.verifie && <Badge tone="green">Vérifié</Badge>}
        </div>

        <div style={{ fontSize: 12.5, color: '#9AA3AF', marginTop: 4 }}>
          {etablissement.ville.nom} · {LIBELLE_TYPE[etablissement.type]} · inscrit le{' '}
          {formaterDate(etablissement.cree_le)}
          {etablissement.proprietaire && ` · ${etablissement.proprietaire.email}`}
        </div>

        <div style={{ fontSize: 12.5, color: abonnement ? '#1F7A45' : '#B57708', marginTop: 4 }}>
          {abonnement
            ? `Abonnement ${abonnement.formule.replace('_', ' ')} — échéance ${formaterDate(abonnement.echeance)}`
            : 'Aucun abonnement encaissé'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button
          variant={galerieOuverte ? 'navy' : 'outline'}
          size="sm"
          onClick={onGalerie}
          aria-expanded={galerieOuverte}
        >
          Photos
        </Button>

        {!abonnement && (
          <Button
            variant="outline"
            size="sm"
            disabled={enCours}
            onClick={() => onAction(() => activerEssaiGratuit(etablissement.id))}
          >
            Activer l’essai gratuit
          </Button>
        )}

        {etablissement.statut !== 'validee' && (
          <Button
            variant="success"
            size="sm"
            disabled={enCours}
            onClick={() => onAction(() => changerStatutEtablissement(etablissement.id, 'validee'))}
          >
            {etablissement.statut === 'en_attente' ? 'Valider' : 'Réactiver'}
          </Button>
        )}

        {etablissement.statut === 'validee' && (
          <Button
            variant="outline"
            size="sm"
            disabled={enCours}
            onClick={() => onAction(() => changerStatutEtablissement(etablissement.id, 'suspendue'))}
          >
            Suspendre
          </Button>
        )}

        {/*
          SUPPRIMER N'EST PROPOSÉ QUE SUR UNE FICHE JAMAIS PUBLIÉE — la faute
          de frappe du jour même. Dès qu'elle a été validée, ou qu'elle porte
          un avis, une demande ou un abonnement, l'API refuse en 409 : la
          cascade emporterait des factures que la loi impose de garder (RG14).
          Masquer le bouton dans ce cas évite de proposer une action qui ne
          peut qu'échouer.
        */}
        {etablissement.statut === 'en_attente' && !abonnement && (
          <Button
            variant="ghost"
            size="sm"
            disabled={enCours}
            onClick={() => {
              if (!window.confirm(`Supprimer définitivement « ${etablissement.nom} » ?`)) return;
              onAction(() => supprimerEtablissement(etablissement.id));
            }}
          >
            Supprimer
          </Button>
        )}

        <Button
          variant={etablissement.sponsorise ? 'navy' : 'ghost'}
          size="sm"
          disabled={enCours}
          onClick={() =>
            onAction(() =>
              basculerBadges(etablissement.id, { sponsorise: !etablissement.sponsorise }),
            )
          }
        >
          ★ {etablissement.sponsorise ? 'Retirer la mise en avant' : 'Mettre en avant'}
        </Button>
      </div>
    </div>
  );
}

function FiltreChips({
  libelle,
  valeurs,
  actif,
  onChange,
}: {
  libelle: string;
  valeurs: { cle: string; label: string }[];
  actif?: string;
  onChange: (cle: string | undefined) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '.5px',
          textTransform: 'uppercase',
          color: '#9AA3AF',
          width: 48,
          flex: 'none',
        }}
      >
        {libelle}
      </span>
      <Chip actif={actif === undefined} onClick={() => onChange(undefined)}>
        Tous
      </Chip>
      {valeurs.map((valeur) => (
        <Chip key={valeur.cle} actif={actif === valeur.cle} onClick={() => onChange(valeur.cle)}>
          {valeur.label}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  children,
  actif,
  onClick,
}: {
  children: React.ReactNode;
  actif: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      style={{
        border: `1px solid ${actif ? '#E63946' : '#EAE6DE'}`,
        background: actif ? '#FDE8EA' : '#fff',
        color: actif ? '#C42B38' : '#5A6472',
        fontSize: 12.5,
        fontWeight: 600,
        padding: '8px 14px',
        borderRadius: 20,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

const texteDoux: React.CSSProperties = {
  font: "400 14px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};
