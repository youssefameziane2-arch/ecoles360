import { useQuery } from '@tanstack/react-query';
import { chargerCommerciaux, type CommercialAdmin } from '@/api/crm';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { Badge, EmptyState } from '@/ds/composants';
import { formaterDate, formaterMad } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

/**
 * Commerciaux — écran `isAdminCommerciaux` de la maquette.
 *
 * LES COMPTES SUSPENDUS Y FIGURENT, et c'est volontaire : un commercial
 * suspendu garde ses prospects et ses commissions. Les masquer ferait
 * disparaître des dossiers du décompte et de l'argent dû de la liste des
 * choses à payer — exactement ce qu'on ne veut pas perdre de vue.
 *
 * CET ÉCRAN NE CRÉE PAS DE COMPTE. Qui a le droit d'en créer un, et par quel
 * chemin le mot de passe atteint son titulaire, ne sont écrits nulle part
 * dans les livrables. En attendant, un compte se pose par la commande
 * `compte:creer --role=commercial`.
 */
export function CommerciauxAdmin() {
  useTitrePage('Commerciaux');

  return (
    <AvecIdentite
      role={['superadmin']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="Commerciaux"
          sousTitre="Portefeuilles, transformations et commissions"
        >
          <Contenu />
        </CoquilleEspace>
      )}
    />
  );
}

function Contenu() {
  const commerciaux = useQuery({ queryKey: ['admin', 'commerciaux'], queryFn: chargerCommerciaux });

  if (commerciaux.isPending) return <p style={texteDoux}>Chargement…</p>;

  if (commerciaux.data?.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 16 }}>
        <EmptyState
          icon="briefcase"
          title="Aucun commercial"
          description="Un compte se crée par la commande « compte:creer --role=commercial »."
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {commerciaux.data?.map((commercial) => (
        <Ligne key={commercial.id} commercial={commercial} />
      ))}

      <p style={{ ...texteDoux, fontSize: 12.5 }}>
        Les comptes suspendus restent dans cette liste : ils gardent leurs dossiers et leurs
        commissions. Confier ou retirer un dossier se fait depuis « CRM Clients ».
      </p>
    </div>
  );
}

function Ligne({ commercial }: { commercial: CommercialAdmin }) {
  const suspendu = commercial.statut === 'suspendu';

  // SUR LES DOSSIERS CLOS SEULEMENT : compter les prospects en cours comme des
  // échecs ferait baisser le taux à mesure qu'on prospecte.
  const clos = commercial.transformes + commercial.perdus;
  const taux = clos === 0 ? null : Math.round((commercial.transformes / clos) * 100);

  const chiffres = [
    { label: 'Portefeuille', valeur: String(commercial.prospects) },
    { label: 'Transformés', valeur: String(commercial.transformes) },
    { label: 'Taux', valeur: taux === null ? '—' : `${taux} %` },
    {
      label: 'Relances dues',
      valeur: String(commercial.relances_dues),
      alerte: commercial.relances_dues > 0,
    },
    { label: 'Commissions', valeur: formaterMad(Number(commercial.commissions_mad)) },
  ];

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ font: "700 15px/1.2 'Inter', sans-serif", color: '#1A1A1A' }}>
          {commercial.name}
        </span>
        {suspendu ? <Badge tone="red">Suspendu</Badge> : <Badge tone="green">Actif</Badge>}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12.5, color: '#9AA3AF' }}>
          {commercial.email}
          {commercial.telephone && ` · ${commercial.telephone}`}
        </span>
      </div>

      <div style={{ fontSize: 12, color: '#9AA3AF', marginTop: 3 }}>
        Compte créé le {formaterDate(commercial.cree_le)}
        {!commercial.telephone && ' · sans ligne — n’apparaît pas sur la bannière d’aide du site'}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: 10,
          marginTop: 13,
          paddingTop: 12,
          borderTop: '1px solid #F1EEE8',
        }}
      >
        {chiffres.map((chiffre) => (
          <div key={chiffre.label}>
            <div
              style={{
                font: "600 11px/1.3 'Inter', sans-serif",
                letterSpacing: '.04em',
                textTransform: 'uppercase',
                color: '#9AA3AF',
              }}
            >
              {chiffre.label}
            </div>
            <div
              style={{
                font: "700 16px/1.3 'Inter', sans-serif",
                color: chiffre.alerte ? '#C42B38' : '#1A1A1A',
                fontVariantNumeric: 'tabular-nums',
                marginTop: 2,
              }}
            >
              {chiffre.valeur}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const texteDoux: React.CSSProperties = {
  font: "400 14px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};
