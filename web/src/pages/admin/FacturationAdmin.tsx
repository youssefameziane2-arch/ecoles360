import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import {
  chargerFactures,
  chargerIndicateursFacturation,
  encaisserFacture,
  LIBELLE_FORMULE,
  type FactureAdmin,
  type IndicateursFacturation,
  type StatutPaiement,
} from '@/api/admin';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { Badge, Button, EmptyState, Toast } from '@/ds/composants';
import { formaterDate, formaterMad } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

const FILTRES: { cle?: StatutPaiement; label: string }[] = [
  { cle: undefined, label: 'Toutes' },
  { cle: 'non_payee', label: 'En attente' },
  { cle: 'payee', label: 'Encaissées' },
];

/**
 * Abonnement & facturation — écran `isAdminFact` de la maquette.
 *
 * L'ENCAISSEMENT EST LA SEULE ACTION DE CET ÉCRAN, et c'est la plus lourde de
 * conséquence du back-office : c'est lui qui lève la condition de la RG14 et
 * rend une fiche publiable. Il est donc confirmé, et irréversible — défaire
 * un encaissement est un acte comptable qui demande un avoir, pas un clic.
 *
 * AUCUNE GRILLE DE TARIFS N'EST AFFICHÉE ICI. Le tarif est propre à chaque
 * client et n'est jamais public : il se saisit à l'ouverture de l'abonnement,
 * depuis la fiche de l'établissement.
 */
export function FacturationAdmin() {
  useTitrePage('Abonnement & facturation');

  return (
    <AvecIdentite
      role={['superadmin']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="Abonnement & facturation"
          sousTitre="Factures émises, encaissements et commissions"
        >
          <Contenu />
        </CoquilleEspace>
      )}
    />
  );
}

function Contenu() {
  const queryClient = useQueryClient();
  const [filtre, setFiltre] = useState<StatutPaiement | undefined>();
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; texte: string } | null>(null);

  const indicateurs = useQuery({
    queryKey: ['admin', 'facturation'],
    queryFn: chargerIndicateursFacturation,
  });

  const factures = useQuery({
    queryKey: ['admin', 'factures', filtre],
    queryFn: () => chargerFactures(filtre),
  });

  const encaissement = useMutation({
    mutationFn: (id: string) => encaisserFacture(id),
    onSuccess: () => {
      setMessage({
        tone: 'success',
        texte: 'Facture encaissée. L’établissement peut désormais être publié (RG14).',
      });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'factures'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'facturation'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'etablissements'] });
    },
    onError: (erreur: unknown) =>
      setMessage({
        tone: 'error',
        texte:
          erreur instanceof ApiError ? erreur.message : 'L’encaissement n’a pas pu être enregistré.',
      }),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {message && (
        <Toast
          tone={message.tone}
          title={message.tone === 'success' ? 'Encaissé' : 'Refusé'}
          message={message.texte}
          onClose={() => setMessage(null)}
        />
      )}

      {indicateurs.data && <Indicateurs valeurs={indicateurs.data} />}

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {FILTRES.map((f) => {
          const actif = filtre === f.cle;

          return (
            <button
              key={f.label}
              type="button"
              onClick={() => setFiltre(f.cle)}
              style={{
                font: "600 12.5px/1 'Inter', sans-serif",
                color: actif ? '#fff' : '#5A6472',
                background: actif ? '#1D3557' : '#fff',
                border: `1px solid ${actif ? '#1D3557' : '#EAE6DE'}`,
                borderRadius: 999,
                padding: '8px 14px',
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {factures.isPending && <p style={texteDoux}>Chargement…</p>}

      {factures.data?.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 16 }}>
          <EmptyState
            icon="file-text"
            title="Aucune facture"
            description="Une facture s’émet depuis la fiche d’un établissement, une fois son abonnement ouvert."
          />
        </div>
      )}

      {factures.data?.map((facture) => (
        <LigneFacture
          key={facture.id}
          facture={facture}
          enCours={encaissement.isPending}
          onEncaisser={() => {
            if (
              !window.confirm(
                `Encaisser la facture ${facture.numero} — ${formaterMad(Number(facture.total_ttc))} ?\n\n` +
                  'Cette action est irréversible : la défaire demanderait un avoir.',
              )
            ) {
              return;
            }
            encaissement.mutate(facture.id);
          }}
        />
      ))}

      <p style={{ ...texteDoux, fontSize: 12.5 }}>
        Le tarif est <strong>propre à chaque client et n’est jamais public</strong> : il se saisit à
        l’ouverture de l’abonnement, depuis la fiche de l’établissement. L’encaissement est ce qui
        lève la condition de publication (RG14).
      </p>
    </div>
  );
}

function Indicateurs({ valeurs }: { valeurs: IndicateursFacturation }) {
  const tuiles = [
    {
      label: 'Encaissé ce mois',
      valeur: formaterMad(Number(valeurs.encaisse_ce_mois)),
      detail: `${valeurs.factures_encaissees_ce_mois} facture(s)`,
      accent: '#1F7A45',
    },
    {
      label: 'En attente de règlement',
      valeur: formaterMad(Number(valeurs.en_attente)),
      detail: `${valeurs.factures_en_attente} facture(s)`,
      accent: '#B57708',
    },
    {
      label: 'Abonnements en cours',
      valeur: String(valeurs.abonnements_actifs),
      detail: 'essais compris',
      accent: '#1D3557',
    },
    {
      label: 'Échéances sous 30 jours',
      valeur: String(valeurs.echeances_sous_30_jours),
      detail: 'à relancer',
      accent: '#C42B38',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
      }}
    >
      {tuiles.map((tuile) => (
        <div
          key={tuile.label}
          style={{
            background: '#fff',
            border: '1px solid #EAE6DE',
            borderRadius: 14,
            padding: '15px 17px',
          }}
        >
          <p
            style={{
              font: "600 11.5px/1.3 'Inter', sans-serif",
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              color: '#9AA3AF',
              margin: 0,
            }}
          >
            {tuile.label}
          </p>
          <p
            style={{
              font: "800 24px/1.2 'Inter', sans-serif",
              color: tuile.accent,
              margin: '7px 0 2px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {tuile.valeur}
          </p>
          <p style={{ font: "400 12px/1.4 'Inter', sans-serif", color: '#9AA3AF', margin: 0 }}>
            {tuile.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

function LigneFacture({
  facture,
  enCours,
  onEncaisser,
}: {
  facture: FactureAdmin;
  enCours: boolean;
  onEncaisser: () => void;
}) {
  const payee = facture.statut_paiement === 'payee';

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #EAE6DE',
        borderLeft: payee ? '4px solid #1F7A45' : '4px solid #E9A23B',
        borderRadius: 14,
        padding: '15px 18px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
            <span
              style={{
                font: "700 15px/1.2 'Inter', sans-serif",
                color: '#1A1A1A',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {facture.numero}
            </span>
            {payee ? <Badge tone="green">Encaissée</Badge> : <Badge tone="amber">En attente</Badge>}
            {facture.abonnement && (
              <Badge tone="grey">{LIBELLE_FORMULE[facture.abonnement.formule]}</Badge>
            )}
          </div>

          <div style={{ fontSize: 13, color: '#5A6472', marginTop: 4 }}>
            {facture.etablissement.nom}
          </div>

          <div style={{ fontSize: 12.5, color: '#9AA3AF', marginTop: 3 }}>
            Émise le {formaterDate(facture.emise_le)}
            {facture.payee_le && ` · réglée le ${formaterDate(facture.payee_le)}`}
          </div>
        </div>

        {/*
          LE DÉTAIL DU CALCUL EST AFFICHÉ, pas seulement le total. Une facture
          se vérifie : HT, TVA et TTC doivent pouvoir être lus et recoupés sans
          ouvrir un autre écran.
        */}
        <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          <div style={{ font: "800 19px/1.2 'Inter', sans-serif", color: '#1D3557' }}>
            {formaterMad(Number(facture.total_ttc))}
          </div>
          <div style={{ fontSize: 12, color: '#9AA3AF', marginTop: 2 }}>
            {formaterMad(Number(facture.montant_ht))} HT + {formaterMad(Number(facture.tva))} TVA
          </div>
        </div>

        {!payee && (
          <Button variant="success" size="sm" disabled={enCours} onClick={onEncaisser}>
            Encaisser
          </Button>
        )}
      </div>

      {facture.commissions.length > 0 && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 11,
            borderTop: '1px solid #F1EEE8',
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          {facture.commissions.map((commission) => (
            <div
              key={commission.id}
              style={{ font: "400 12.5px/1.5 'Inter', sans-serif", color: '#5A6472' }}
            >
              Commission {commission.taux_pct} % —{' '}
              <strong>{formaterMad(Number(commission.montant_mad))}</strong> pour{' '}
              {commission.commercial?.name ?? 'un commercial retiré'}
              {commission.statut === 'a_valider' && ' · à valider par la Direction (RG18)'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const texteDoux: React.CSSProperties = {
  font: "400 14px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};
