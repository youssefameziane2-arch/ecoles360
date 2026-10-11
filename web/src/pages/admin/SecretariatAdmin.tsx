import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import {
  basculerPortee,
  basculerStatutCompte,
  chargerEtablissementsAdmin,
  chargerSecretariat,
  EFFET_PORTEE,
  LIBELLE_PORTEE,
  type CompteSecretariat,
  type PorteeDeleguee,
} from '@/api/admin';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { CreationCompte } from '@/components/CreationCompte';
import { Badge, Button, EmptyState, Toast } from '@/ds/composants';
import { formaterDate } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

const PORTEES: PorteeDeleguee[] = ['fiches', 'contacts', 'avis', 'blog'];

/**
 * Secrétariat — écran `isAdminUsers` de la maquette.
 *
 * CE QUE CET ÉCRAN PILOTE EXISTAIT DÉJÀ SANS LUI. La RG05 délègue trois
 * portées, le modèle `Permission` les date et les révoque depuis le premier
 * jour — mais seul le seeder savait les poser. Un administrateur n'avait aucun
 * moyen de voir qui accédait à quoi, ni de le changer.
 *
 * UNE PORTÉE COCHÉE OUVRE UN ÉCRAN, ET L'ÉCRAN LE DIT. Chaque case porte sa
 * conséquence en clair — « lire les demandes de parents et les faire
 * avancer » — plutôt que le seul mot `contacts`. Qui délègue un accès doit
 * savoir ce qu'il ouvre ; un intitulé technique laisse deviner.
 */
export function SecretariatAdmin() {
  useTitrePage('Secrétariat');

  return (
    <AvecIdentite
      role={['superadmin']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="Secrétariat"
          sousTitre="Comptes rattachés aux établissements et portées déléguées"
        >
          <Contenu />
        </CoquilleEspace>
      )}
    />
  );
}

function Contenu() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; texte: string } | null>(null);

  const cle = ['admin', 'secretariat'];

  const comptes = useQuery({ queryKey: cle, queryFn: chargerSecretariat });

  const etablissements = useQuery({
    queryKey: ['admin', 'etablissements'],
    queryFn: () => chargerEtablissementsAdmin({}),
  });

  /**
   * Chaque écriture rend la liste entière : on la pose dans le cache plutôt
   * que de la redemander. Cocher une portée ne doit pas faire clignoter les
   * six autres lignes.
   */
  const ecriture = useMutation({
    mutationFn: (operation: () => Promise<CompteSecretariat[]>) => operation(),
    onSuccess: (liste) => {
      queryClient.setQueryData(cle, liste);
      setMessage(null);
    },
    onError: (erreur: unknown) =>
      setMessage({
        tone: 'error',
        texte:
          erreur instanceof ApiError
            ? erreur.message
            : "L'action a échoué. Réessayez dans un instant.",
      }),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {message && (
        <Toast
          tone={message.tone}
          title="Action refusée"
          message={message.texte}
          onClose={() => setMessage(null)}
        />
      )}

      {/*
        LA LISTE DES ÉTABLISSEMENTS N'EST CHARGÉE QUE POUR CE FORMULAIRE, et
        sans filtre de statut : un secrétariat se rattache aussi bien à une
        fiche encore en attente qu'à une fiche publiée.
      */}
      <CreationCompte
        role="secretariat"
        etablissements={(etablissements.data ?? []).map((e) => ({ id: e.id, nom: e.nom }))}
      />

      {comptes.isPending && <p style={texteDoux}>Chargement…</p>}

      {comptes.data?.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 16 }}>
          <EmptyState
            icon="users"
            title="Aucun compte de secrétariat"
            description="Les comptes sont créés à la demande d’un établissement, puis rattachés à sa fiche."
          />
        </div>
      )}

      {comptes.data?.map((compte) => (
        <LigneCompte
          key={compte.id}
          compte={compte}
          enCours={ecriture.isPending}
          onAction={(operation) => ecriture.mutate(operation)}
        />
      ))}

      <p style={{ ...texteDoux, fontSize: 12.5 }}>
        Une portée retirée est <strong>révoquée et datée</strong>, jamais effacée : le journal
        garde qui l’a accordée, quand, et quand elle a été reprise (RG15). Suspendre un compte
        coupe ses sessions <strong>immédiatement</strong> (RG25).
      </p>
    </div>
  );
}

function LigneCompte({
  compte,
  enCours,
  onAction,
}: {
  compte: CompteSecretariat;
  enCours: boolean;
  onAction: (operation: () => Promise<CompteSecretariat[]>) => void;
}) {
  const suspendu = compte.statut === 'suspendu';

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #EAE6DE',
        borderLeft: suspendu ? '4px solid #C42B38' : '1px solid #EAE6DE',
        borderRadius: 14,
        padding: '15px 18px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>{compte.name}</span>
            {suspendu ? <Badge tone="red">Suspendu</Badge> : <Badge tone="green">Actif</Badge>}
          </div>

          <div style={{ fontSize: 12.5, color: '#9AA3AF', marginTop: 4 }}>
            {compte.email} · compte créé le {formaterDate(compte.cree_le)}
          </div>

          {/*
            LE RATTACHEMENT EST LA PREMIÈRE CHOSE À VÉRIFIER. Les portées ne
            disent QUE CE QU'ON PEUT FAIRE ; c'est le rattachement qui dit SUR
            QUELLE FICHE. Un compte sans rattachement n'accède à rien, et la
            RG25 l'interdit — le signaler vaut mieux que de l'afficher comme
            les autres.
          */}
          <div
            style={{
              fontSize: 12.5,
              marginTop: 4,
              color: compte.etablissementRattache ? '#1F7A45' : '#B57708',
            }}
          >
            {compte.etablissementRattache
              ? `Rattaché à ${compte.etablissementRattache.nom}`
              : 'Aucun établissement rattaché — ce compte n’accède à rien'}
          </div>
        </div>

        <Button
          variant={suspendu ? 'success' : 'outline'}
          size="sm"
          disabled={enCours}
          onClick={() => onAction(() => basculerStatutCompte(compte.id, !suspendu))}
        >
          {suspendu ? 'Réactiver' : 'Suspendre'}
        </Button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 8,
          marginTop: 14,
          paddingTop: 13,
          borderTop: '1px solid #F1EEE8',
        }}
      >
        {PORTEES.map((portee) => {
          const accordee = compte.portees.includes(portee);
          const detail = compte.accordees.find((a) => a.portee === portee);

          return (
            <button
              key={portee}
              type="button"
              disabled={enCours}
              aria-pressed={accordee}
              onClick={() => onAction(() => basculerPortee(compte.id, portee, !accordee))}
              title={EFFET_PORTEE[portee]}
              style={{
                textAlign: 'left',
                border: `1px solid ${accordee ? '#1D3557' : '#EAE6DE'}`,
                background: accordee ? '#F3F6FA' : '#fff',
                borderRadius: 11,
                padding: '10px 12px',
                cursor: enCours ? 'default' : 'pointer',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  font: "700 13px/1.2 'Inter', sans-serif",
                  color: accordee ? '#1D3557' : '#5A6472',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 15,
                    height: 15,
                    borderRadius: 4,
                    border: `1.5px solid ${accordee ? '#1D3557' : '#C7CDD6'}`,
                    background: accordee ? '#1D3557' : '#fff',
                    color: '#fff',
                    fontSize: 10,
                    lineHeight: '13px',
                    textAlign: 'center',
                    flex: 'none',
                  }}
                >
                  {accordee ? '✓' : ''}
                </span>
                {LIBELLE_PORTEE[portee]}
              </span>

              <span
                style={{
                  display: 'block',
                  font: "400 11.5px/1.45 'Inter', sans-serif",
                  color: '#5A6472',
                  marginTop: 5,
                }}
              >
                {EFFET_PORTEE[portee]}
              </span>

              {accordee && detail && (
                <span
                  style={{
                    display: 'block',
                    font: "400 11px/1.4 'Inter', sans-serif",
                    color: '#9AA3AF',
                    marginTop: 4,
                  }}
                >
                  Accordée par {detail.accordeur.name} le {formaterDate(detail.accordee_le)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const texteDoux: React.CSSProperties = {
  font: "400 14px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};
