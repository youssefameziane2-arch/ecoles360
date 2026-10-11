import { useQuery } from '@tanstack/react-query';
import {
  chargerMaFacturation,
  chargerStatistiquesEspace,
  type AbonnementEspace,
  type FactureEspace,
} from '@/api/espace';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { useConseillerAffiche } from '@/components/MobilierAssistance';
import { Badge, Button, EmptyState } from '@/ds/composants';
import { formaterDate, formaterMad, formaterMois, formaterNombre } from '@/lib/formats';
import { lienTelephone } from '@/lib/telephone';
import { useTitrePage } from '@/lib/titre';

const LIBELLE_FORMULE = {
  essai_gratuit: 'Essai gratuit',
  mensuel: 'Abonnement mensuel',
  annuel: 'Abonnement annuel',
} as const;

/**
 * « Abonnement & facturation » — maquette `isEtabCredits`.
 *
 * RÉSERVÉ AU COMPTE ÉTABLISSEMENT. La RG05 ne délègue que `fiches`, `contacts`
 * et `avis` : une secrétaire à qui l'on a confié la boîte de contacts n'a pas
 * à lire ce que son école paie. Le serveur répond 403 à un compte
 * `secretariat` ; cet écran ne lui est pas proposé non plus, pour qu'il ne
 * bute pas sur une erreur là où il n'a simplement rien à faire.
 *
 * LECTURE SEULE, ET DÉFINITIVEMENT. Aucune souscription, aucune résiliation,
 * aucun paiement : le tarif se fixe avec un conseiller, l'encaissement se fait
 * hors plateforme, et c'est l'administration qui ouvre un abonnement et émet
 * la facture. Un bouton « Souscrire » promettrait un parcours qui n'existe pas.
 */
export function FacturationEspace() {
  useTitrePage('Abonnement & facturation');

  return (
    <AvecIdentite
      role={['etablissement']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="Abonnement & facturation"
          sousTitre="Votre formule, vos vues et vos factures"
        >
          <Contenu />
        </CoquilleEspace>
      )}
    />
  );
}

function Contenu() {
  const donnees = useQuery({ queryKey: ['espace', 'facturation'], queryFn: chargerMaFacturation });
  const stats = useQuery({ queryKey: ['espace', 'stats'], queryFn: chargerStatistiquesEspace });
  const { conseiller, numero } = useConseillerAffiche();

  if (donnees.isPending) return <p style={texteDoux}>Chargement…</p>;

  if (donnees.isError || !donnees.data) {
    return (
      <p role="alert" style={{ ...texteDoux, color: '#C42B38' }}>
        Vos informations d’abonnement n’ont pas pu être chargées.
      </p>
    );
  }

  const { abonnement, essai, factures } = donnees.data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <EnTeteFormule abonnement={abonnement} />

      {/*
        LES VUES SONT ICI PARCE QUE LA MAQUETTE LES Y MET, et la raison tient :
        la formule « paiement à la vue » (RG12) se facture dessus. Tant que
        l'école est sur un abonnement, l'écran dit explicitement qu'elles sont
        incluses — sans quoi le chiffre, posé seul sur une page de facturation,
        se lirait comme une somme à payer.
      */}
      {stats.data && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #EAE6DE',
            borderRadius: 16,
            padding: '18px 20px',
          }}
        >
          <p style={surtitre}>Vues de votre page profil · {formaterMois(stats.data.mois_courant)}</p>
          <p
            style={{
              font: "800 30px/1.1 'Inter', sans-serif",
              margin: '8px 0 0',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formaterNombre(stats.data.indicateurs.vues.courant)}
          </p>
          <p style={{ ...texteDoux, fontSize: 13, marginTop: 6 }}>
            {abonnement
              ? 'Incluses dans votre abonnement — aucun paiement à la vue ne s’applique.'
              : 'Aucun abonnement en cours : ces vues ne vous sont pas facturées non plus.'}
          </p>
        </div>
      )}

      <section>
        <h2 style={titreSection}>Les formules écoles360</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 12,
          }}
        >
          <CarteFormule
            nom="Essai gratuit"
            description="1 mois offert avec toutes les options, sans engagement ni carte bancaire."
            badge={essai ? 'Terminé' : 'Disponible'}
            ton={essai ? 'grey' : 'green'}
            etat={
              essai
                ? `Utilisé du ${formaterDate(essai.debut)} au ${formaterDate(essai.echeance)}`
                : 'Jamais utilisé — à demander à votre conseiller'
            }
            enAvant={abonnement?.formule === 'essai_gratuit'}
          />
          <CarteFormule
            nom="Abonnement"
            description="Mensuel ou annuel, avec −10 % si paiement de l’année en une fois."
            badge={abonnement && abonnement.formule !== 'essai_gratuit' ? 'Actif' : 'Sur demande'}
            ton={abonnement && abonnement.formule !== 'essai_gratuit' ? 'green' : 'navy'}
            etat={
              abonnement && abonnement.formule !== 'essai_gratuit'
                ? `Votre formule — ${abonnement.formule === 'annuel' ? 'annuelle' : 'mensuelle'} depuis le ${formaterDate(abonnement.debut)}`
                : 'Activable auprès de votre conseiller'
            }
            enAvant={Boolean(abonnement && abonnement.formule !== 'essai_gratuit')}
          />
          {/*
            « PAIEMENT À LA VUE » N'EST JAMAIS MARQUÉ ACTIF ici, et ce n'est pas
            un oubli : il ne se lit pas sur l'abonnement mais sur l'existence
            d'un `PaiementVue` (RG12), que cet écran ne charge pas. Afficher
            « Actif » au jugé serait pire que « Sur demande ».
          */}
          <CarteFormule
            nom="Paiement à la vue"
            description="Facturé selon les vues réelles de votre page profil ; tarif par vue défini avec votre conseiller."
            badge="Sur demande"
            ton="navy"
            etat="Activable auprès de votre conseiller"
            enAvant={false}
          />
        </div>
      </section>

      {/*
        « CONTACTER MON CONSEILLER » EST LE SEUL BOUTON DE L'ÉCRAN, et il doit
        aboutir. Il sert le conseiller réel, celui de la bannière du site ; sans
        conseiller en base, il disparaît plutôt que d'afficher un numéro mort.
      */}
      {numero && (
        <div
          style={{
            background: '#1D3557',
            borderRadius: 16,
            padding: '20px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ font: "700 16px/1.3 'Inter', sans-serif", color: '#fff', margin: 0 }}>
              Une question sur votre formule ?
            </p>
            <p style={{ ...texteDoux, color: '#AFC0D6', fontSize: 13.5, marginTop: 5 }}>
              Les tarifs se définissent avec votre conseiller
              {conseiller?.nom ? `, ${conseiller.nom}` : ''}. Aucun paiement ne se fait sur le
              site.
            </p>
          </div>
          <a href={lienTelephone(numero)} style={{ textDecoration: 'none' }}>
            <Button>Contacter mon conseiller</Button>
          </a>
        </div>
      )}

      <section>
        <h2 style={titreSection}>Vos factures</h2>
        {factures.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 16 }}>
            <EmptyState
              icon="file-text"
              title="Aucune facture"
              description="Les factures émises par écoles360 apparaîtront ici, avec leur objet et leur statut."
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {factures.map((facture) => (
              <LigneFacture key={facture.id} facture={facture} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EnTeteFormule({ abonnement }: { abonnement: AbonnementEspace | null }) {
  if (!abonnement) {
    return (
      <div style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 16 }}>
        <EmptyState
          icon="credit-card"
          title="Aucun abonnement en cours"
          description="Votre fiche n’est pas couverte par un abonnement. Votre conseiller peut en ouvrir un, ou activer un essai gratuit d’un mois."
        />
      </div>
    );
  }

  const essai = abonnement.formule === 'essai_gratuit';

  return (
    <div
      style={{
        background: '#1D3557',
        borderRadius: 18,
        padding: '26px 28px',
        color: '#fff',
      }}
    >
      <p style={{ ...surtitre, color: '#AFC0D6' }}>Votre formule</p>
      <p
        style={{
          font: "800 28px/1.15 'Inter', sans-serif",
          letterSpacing: '-0.6px',
          margin: '8px 0 0',
        }}
      >
        {LIBELLE_FORMULE[abonnement.formule]}
      </p>
      <p style={{ font: "400 14.5px/1.6 'Inter', sans-serif", color: '#C6D2E2', margin: '10px 0 0' }}>
        Toutes options incluses
        {abonnement.remise_pct && ` · −${abonnement.remise_pct} % (paiement de l’année en une fois)`}
      </p>
      <p style={{ font: "400 13.5px/1.6 'Inter', sans-serif", color: '#AFC0D6', margin: '6px 0 0' }}>
        {essai ? 'Fin de l’essai' : 'Renouvellement'} le {formaterDate(abonnement.echeance)}
        {/*
          LE TARIF N'EST AFFICHÉ QUE S'IL EST CONNU. Il est nul sur un essai —
          le schéma l'impose — et « 0 MAD » ferait croire à une formule gratuite
          permanente plutôt qu'à un mois offert.
        */}
        {abonnement.tarif_mad
          ? ` · ${formaterMad(Number(abonnement.tarif_mad))}`
          : ' · tarif défini avec votre conseiller'}
      </p>
    </div>
  );
}

function CarteFormule({
  nom,
  description,
  badge,
  ton,
  etat,
  enAvant,
}: {
  nom: string;
  description: string;
  badge: string;
  ton: 'grey' | 'green' | 'navy';
  etat: string;
  enAvant: boolean;
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: enAvant ? '1.5px solid #1D3557' : '1px solid #EAE6DE',
        borderRadius: 16,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
        <span style={{ font: "700 15.5px/1.2 'Inter', sans-serif" }}>{nom}</span>
        <Badge tone={ton}>{badge}</Badge>
      </div>
      <p style={{ ...texteDoux, fontSize: 13.5, margin: 0 }}>{description}</p>
      <p style={{ font: "600 12.5px/1.5 'Inter', sans-serif", color: '#1D3557', margin: 0 }}>
        {etat}
      </p>
    </div>
  );
}

function LigneFacture({ facture }: { facture: FactureEspace }) {
  const payee = facture.statut_paiement === 'payee';

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #EAE6DE',
        borderRadius: 13,
        padding: '13px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ font: "700 14.5px/1.2 'Inter', sans-serif" }}>{facture.objet}</div>
        <div style={{ fontSize: 12.5, color: '#9AA3AF', marginTop: 3 }}>
          {facture.numero} · émise le {formaterDate(facture.emise_le)}
          {facture.payee_le && ` · payée le ${formaterDate(facture.payee_le)}`}
        </div>
      </div>

      <Badge tone={payee ? 'green' : 'amber'}>{payee ? 'Payée' : 'En attente de règlement'}</Badge>

      <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        <div style={{ font: "800 17px/1.2 'Inter', sans-serif", color: '#1D3557' }}>
          {formaterMad(Number(facture.total_ttc))}
        </div>
        <div style={{ fontSize: 11.5, color: '#9AA3AF' }}>TTC</div>
      </div>
    </div>
  );
}

const texteDoux: React.CSSProperties = {
  font: "400 14px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};

const surtitre: React.CSSProperties = {
  font: "600 11.5px/1.3 'Inter', sans-serif",
  letterSpacing: '.05em',
  textTransform: 'uppercase',
  color: '#9AA3AF',
  margin: 0,
};

const titreSection: React.CSSProperties = {
  font: "700 18px/1.3 'Inter', sans-serif",
  margin: '0 0 12px',
};
