import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import {
  chargerAbonnements,
  emettreFacture,
  encaisserFacture,
  LIBELLE_FORMULE,
  ouvrirAbonnement,
  type AbonnementAdmin,
} from '@/api/admin';
import { Champ } from '@/components/Champs';
import { Badge, Button, Toast } from '@/ds/composants';
import { formaterDate, formaterMad } from '@/lib/formats';

/**
 * Abonnement et factures d'un établissement — sous sa ligne, dans la liste.
 *
 * C'EST ICI QUE LE TARIF SE SAISIT, et nulle part ailleurs. Le schéma le dit :
 * « le tarif est propre à chaque client et n'est jamais public ». Il n'existe
 * donc aucune grille à choisir — seulement le montant négocié pour ce
 * contrat-là.
 *
 * LA CHAÎNE EST VOLONTAIREMENT EN TROIS GESTES — ouvrir, facturer, encaisser —
 * parce que ce sont trois faits distincts : un accord, une pièce comptable, et
 * un règlement reçu. Les fondre en un seul bouton ferait écrire dans les
 * comptes un encaissement qui n'a pas eu lieu.
 */
export function AbonnementEtablissement({
  etablissementId,
  nom,
  onFerme,
}: {
  etablissementId: string;
  nom: string;
  onFerme: () => void;
}) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; texte: string } | null>(null);
  const [formule, setFormule] = useState<'mensuel' | 'annuel'>('annuel');
  const [tarif, setTarif] = useState('');

  const abonnements = useQuery({
    queryKey: ['admin', 'abonnements', etablissementId],
    queryFn: () => chargerAbonnements(etablissementId),
  });

  const rafraichir = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'abonnements', etablissementId] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'etablissements'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'factures'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'facturation'] });
  };

  const echec = (erreur: unknown, repli: string) =>
    setMessage({ tone: 'error', texte: erreur instanceof ApiError ? erreur.message : repli });

  const ouverture = useMutation({
    mutationFn: () =>
      ouvrirAbonnement(etablissementId, { formule, tarif_mad: Number(tarif) }),
    onSuccess: () => {
      setMessage({
        tone: 'success',
        texte: 'Abonnement ouvert. Émettez sa facture, puis encaissez-la pour pouvoir publier.',
      });
      setTarif('');
      rafraichir();
    },
    onError: (erreur) => echec(erreur, 'L’abonnement n’a pas pu être ouvert.'),
  });

  const emission = useMutation({
    mutationFn: (abonnementId: string) => emettreFacture(abonnementId),
    onSuccess: (facture) => {
      setMessage({
        tone: 'success',
        texte: `Facture ${facture.numero} émise — ${formaterMad(Number(facture.total_ttc))} TTC.`,
      });
      rafraichir();
    },
    onError: (erreur) => echec(erreur, 'La facture n’a pas pu être émise.'),
  });

  const encaissement = useMutation({
    mutationFn: (factureId: string) => encaisserFacture(factureId),
    onSuccess: () => {
      setMessage({
        tone: 'success',
        texte: 'Facture encaissée. L’établissement peut désormais être validé (RG14).',
      });
      rafraichir();
    },
    onError: (erreur) => echec(erreur, 'L’encaissement a échoué.'),
  });

  const enCours = abonnements.data?.find((a) => a.statut === 'actif' || a.statut === 'essai');
  const occupe = ouverture.isPending || emission.isPending || encaissement.isPending;

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #EAE6DE',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 20px',
          background: '#FBFAF7',
          borderBottom: '1px solid #EAE6DE',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            font: "700 11.5px/1.3 'Inter', sans-serif",
            letterSpacing: '.05em',
            textTransform: 'uppercase',
            color: '#9AA3AF',
          }}
        >
          Abonnement — {nom}
        </span>
        <span style={{ flex: 1 }} />
        <Button type="button" variant="ghost" size="sm" onClick={onFerme}>
          Fermer
        </Button>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {message && (
          <Toast
            tone={message.tone}
            title={message.tone === 'success' ? 'Fait' : 'Refusé'}
            message={message.texte}
            onClose={() => setMessage(null)}
          />
        )}

        {abonnements.isPending && <p style={texteDoux}>Chargement…</p>}

        {!enCours && (
          <form
            onSubmit={(evenement) => {
              evenement.preventDefault();
              if (Number(tarif) > 0) ouverture.mutate();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              {(['mensuel', 'annuel'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormule(f)}
                  style={{
                    flex: 1,
                    font: "600 13px/1 'Inter', sans-serif",
                    color: formule === f ? '#fff' : '#5A6472',
                    background: formule === f ? '#1D3557' : '#fff',
                    border: `1px solid ${formule === f ? '#1D3557' : '#EAE6DE'}`,
                    borderRadius: 10,
                    padding: '11px 14px',
                    cursor: 'pointer',
                  }}
                >
                  {LIBELLE_FORMULE[f]}
                </button>
              ))}
            </div>

            <Champ
              label="Tarif négocié, hors taxe (MAD)"
              valeur={tarif}
              onChange={setTarif}
              aide={
                formule === 'annuel'
                  ? 'La remise annuelle du paramétrage s’applique automatiquement (RG11).'
                  : 'Aucune remise sur le mensuel (RG11).'
              }
            />

            <div>
              <Button type="submit" disabled={occupe || Number(tarif) <= 0}>
                {ouverture.isPending ? 'Ouverture…' : 'Ouvrir l’abonnement'}
              </Button>
            </div>
          </form>
        )}

        {abonnements.data?.map((abonnement) => (
          <LigneAbonnement
            key={abonnement.id}
            abonnement={abonnement}
            occupe={occupe}
            onFacturer={() => emission.mutate(abonnement.id)}
            onEncaisser={(factureId) => {
              if (!window.confirm('Encaisser cette facture ? L’action est irréversible.')) return;
              encaissement.mutate(factureId);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function LigneAbonnement({
  abonnement,
  occupe,
  onFacturer,
  onEncaisser,
}: {
  abonnement: AbonnementAdmin;
  occupe: boolean;
  onFacturer: () => void;
  onEncaisser: (factureId: string) => void;
}) {
  const essai = abonnement.formule === 'essai_gratuit';
  const enCours = abonnement.statut === 'actif' || abonnement.statut === 'essai';

  return (
    <div
      style={{
        border: '1px solid #EAE6DE',
        borderRadius: 12,
        padding: '13px 15px',
        background: enCours ? '#FBFAF7' : '#fff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Badge tone={enCours ? 'green' : 'grey'}>{LIBELLE_FORMULE[abonnement.formule]}</Badge>

        <span style={{ fontSize: 13, color: '#5A6472' }}>
          du {formaterDate(abonnement.debut)} au {formaterDate(abonnement.echeance)}
        </span>

        {abonnement.tarif_mad && (
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>
            {formaterMad(Number(abonnement.tarif_mad))}
            {abonnement.remise_pct && Number(abonnement.remise_pct) > 0 && (
              <span style={{ fontWeight: 400, color: '#1F7A45' }}>
                {' '}
                − {abonnement.remise_pct} %
              </span>
            )}
          </span>
        )}

        <span style={{ flex: 1 }} />

        {/*
          FACTURER N'EST PROPOSÉ QUE SUR UN ABONNEMENT PAYANT. Un essai gratuit
          n'a pas de tarif : l'API refuse en 409, et montrer le bouton
          reviendrait à proposer une action qui ne peut qu'échouer.
        */}
        {!essai && enCours && (
          <Button variant="outline" size="sm" disabled={occupe} onClick={onFacturer}>
            Émettre une facture
          </Button>
        )}
      </div>

      {/*
        LE RÉCAPITULATIF PRÉCÈDE LE BOUTON, parce qu'« Émettre une facture »
        s'actionnait à l'aveugle : on validait une pièce comptable sans en
        connaître le montant, et on ne le découvrait qu'une fois émise. Les
        chiffres viennent du serveur, du même calcul que l'émission — les
        refaire ici ferait dériver l'aperçu de la facture.
      */}
      {!essai && enCours && abonnement.apercu && (
        <Recapitulatif apercu={abonnement.apercu} formule={abonnement.formule} />
      )}

      {essai && (
        <p style={{ ...texteDoux, fontSize: 12.5, marginTop: 8 }}>
          Un essai gratuit ne se facture pas (RG13) — il débloque la publication sans règlement.
        </p>
      )}

      {abonnement.factures.length > 0 && (
        <div
          style={{
            marginTop: 11,
            paddingTop: 10,
            borderTop: '1px solid #F1EEE8',
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
          }}
        >
          {abonnement.factures.map((facture) => {
            const payee = facture.statut_paiement === 'payee';

            return (
              <div
                key={facture.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
              >
                <span
                  style={{
                    font: "600 13px/1 'Inter', sans-serif",
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {facture.numero}
                </span>
                <span style={{ fontSize: 13, color: '#5A6472' }}>
                  {formaterMad(Number(facture.total_ttc))} TTC
                </span>
                {payee ? (
                  <Badge tone="green">Encaissée</Badge>
                ) : (
                  <Badge tone="amber">En attente</Badge>
                )}
                <span style={{ flex: 1 }} />
                {!payee && (
                  <Button
                    variant="success"
                    size="sm"
                    disabled={occupe}
                    onClick={() => onEncaisser(facture.id)}
                  >
                    Encaisser
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * « Récapitulatif » de la maquette `isAdminFactDetail` — objet, base HT,
 * remise, total HT, TVA, total TTC.
 *
 * LA REMISE N'APPARAÎT QUE SI ELLE EXISTE, comme dans la maquette : une ligne
 * « − 0 % » sur un abonnement mensuel ferait chercher une remise qu'aucune
 * règle n'accorde (RG11).
 */
function Recapitulatif({
  apercu,
  formule,
}: {
  apercu: NonNullable<AbonnementAdmin['apercu']>;
  formule: AbonnementAdmin['formule'];
}) {
  const remise = apercu.remise_pct > 0;

  return (
    <dl
      style={{
        margin: '12px 0 0',
        paddingTop: 11,
        borderTop: '1px solid #F1ECE3',
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
      }}
    >
      <Ligne libelle="Objet">Abonnement {LIBELLE_FORMULE[formule].toLowerCase()}</Ligne>
      <Ligne libelle="Base HT">{formaterMad(Number(apercu.base_ht))}</Ligne>
      {remise && (
        <Ligne libelle={`Remise annuelle − ${apercu.remise_pct} %`} tone="#1F7A45">
          − {formaterMad(Number(apercu.remise_mad))}
        </Ligne>
      )}
      <Ligne libelle="Total HT">{formaterMad(Number(apercu.montant_ht))}</Ligne>
      <Ligne libelle={`TVA ${apercu.tva_pct} %`}>{formaterMad(Number(apercu.tva))}</Ligne>
      <Ligne libelle="Total TTC" total>
        {formaterMad(Number(apercu.total_ttc))}
      </Ligne>
    </dl>
  );
}

function Ligne({
  libelle,
  tone,
  total,
  children,
}: {
  libelle: string;
  tone?: string;
  total?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        fontSize: total ? 15 : 13,
        ...(total ? { borderTop: '1px solid #EAE6DE', paddingTop: 9, marginTop: 2 } : {}),
      }}
    >
      <dt style={{ color: tone ?? (total ? '#1D3557' : '#5A6472'), fontWeight: total ? 700 : 400 }}>
        {libelle}
      </dt>
      <dd
        style={{
          margin: 0,
          textAlign: 'right',
          fontWeight: total ? 800 : 600,
          color: tone ?? (total ? '#1D3557' : '#1A1A1A'),
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {children}
      </dd>
    </div>
  );
}

const texteDoux: React.CSSProperties = {
  font: "400 14px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};
