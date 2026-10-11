import { useState } from 'react';
import { PricingCard } from '@/ds/composants';

/**
 * « Formules de visibilité » — `plans` de la maquette `isInscription`.
 *
 * AUCUN MONTANT N'EST AFFICHÉ, ET CE N'EST PAS UN MANQUE : la maquette
 * elle-même écrit « Tarif communiqué par votre conseiller » et « Tarif par vue
 * défini avec votre conseiller ». Le schéma dit la même chose — le tarif est
 * une donnée de contrat, portée par l'abonnement d'un établissement, jamais
 * une grille publique. Inventer un prix ici le rendrait opposable le jour où
 * un directeur le lirait avant de signer.
 *
 * LA BASCULE NE CHANGE QUE LA CARTE DU MILIEU, comme dans la maquette : les
 * deux autres formules ne connaissent pas de périodicité. Elle ne calcule
 * rien, elle annonce la remise de 10 % sur le paiement annuel en une fois
 * (RG11) — qui, elle, est une règle de gestion, pas un prix.
 */
export function FormulesVisibilite({ onChoisir }: { onChoisir?: () => void }) {
  const [annuel, setAnnuel] = useState(false);

  const formules = [
    {
      nom: 'Essai gratuit',
      surtitre: 'Pour démarrer',
      titre: '1 mois offert',
      sousTitre: 'Toutes les options incluses pendant 1 mois, sans engagement.',
      enAvant: false,
      bascule: false,
      action: 'Commencer gratuitement',
      note: 'Sans carte bancaire',
      atouts: [
        'Fiche établissement complète',
        'Photos et vidéos illimitées',
        'Contacts directs (appel & WhatsApp)',
        'Demandes de parents illimitées',
        'Statistiques détaillées',
      ],
    },
    {
      nom: 'Abonnement',
      surtitre: 'Le plus choisi',
      titre: annuel ? 'Annuel — économisez 10 %' : 'Mensuel, sans engagement',
      sousTitre: annuel
        ? 'Une seule facture pour l’année, remise de 10 % incluse.'
        : 'Résiliable à tout moment. Passez à l’annuel quand vous voulez.',
      enAvant: true,
      bascule: true,
      action: 'Choisir cet abonnement',
      note: 'Tarif communiqué par votre conseiller',
      atouts: [
        'Tout l’essai gratuit, sans limite de durée',
        'Mise en avant « Sponsorisé »',
        'Priorité dans les résultats',
        'Conseiller dédié',
        '−10 % si paiement annuel en une fois',
      ],
    },
    {
      nom: 'Paiement à la vue',
      surtitre: 'Au résultat',
      titre: 'Payez ce qui est vu',
      sousTitre: 'Facturé selon les vues réelles de votre page profil.',
      enAvant: false,
      bascule: false,
      action: 'Nous contacter',
      note: 'Tarif par vue défini avec votre conseiller',
      atouts: [
        'Sans abonnement ni engagement',
        'Payez uniquement les vues de votre profil',
        'Tarif par vue propre à votre établissement',
        'Suivi des vues en temps réel',
        'Plafond mensuel ajustable',
      ],
    },
  ];

  return (
    <section style={{ maxWidth: 1180, margin: '72px auto 0', padding: '0 32px' }}>
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            font: "700 12px/1 'Inter', sans-serif",
            letterSpacing: '.8px',
            textTransform: 'uppercase',
            color: '#E63946',
            margin: '0 0 10px',
          }}
        >
          Formules de visibilité
        </p>
        <h2
          style={{
            margin: 0,
            font: "800 32px/1.2 'Inter', sans-serif",
            letterSpacing: '-0.8px',
          }}
        >
          Choisissez votre niveau de visibilité
        </h2>
      </div>

      <div
        role="group"
        aria-label="Périodicité de l’abonnement"
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 4,
          margin: '22px auto 0',
          padding: 4,
          width: 'fit-content',
          background: '#F1EEE8',
          borderRadius: 12,
        }}
      >
        <Bascule actif={!annuel} onClick={() => setAnnuel(false)}>
          Mensuel
        </Bascule>
        <Bascule actif={annuel} onClick={() => setAnnuel(true)}>
          Annuel −10 %
        </Bascule>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          marginTop: 28,
          alignItems: 'start',
        }}
      >
        {formules.map((formule) => (
          <div key={formule.nom} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p
              style={{
                font: "600 11.5px/1 'Inter', sans-serif",
                letterSpacing: '.6px',
                textTransform: 'uppercase',
                color: '#9AA3AF',
                margin: 0,
              }}
            >
              {formule.surtitre}
            </p>

            {/*
              `PricingCard` N'A PAS DE FENTE POUR LE SOUS-TITRE de la maquette :
              il expose `name`, `price`, `unit`, `credits`, `features` et `cta`,
              rien d'autre. Le sous-titre et la note sont donc rendus autour de
              la carte plutôt qu'à l'intérieur. Écart consigné dans
              docs/design-system/CORRECTIFS.md — la carte du design system reste
              employée telle quelle, jamais recopiée à la main.
            */}
            <PricingCard
              name={formule.nom}
              price={<span style={{ fontSize: 26 }}>{formule.titre}</span>}
              credits={null}
              features={formule.atouts}
              popular={formule.enAvant}
              cta={formule.action}
              onSelect={onChoisir}
            />

            <p
              style={{
                font: "400 13px/1.5 'Inter', sans-serif",
                color: '#5A6472',
                margin: 0,
              }}
            >
              {formule.sousTitre}
            </p>
            <p
              style={{
                font: "600 12.5px/1.4 'Inter', sans-serif",
                color: '#9AA3AF',
                margin: 0,
              }}
            >
              {formule.note}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Bascule({
  actif,
  onClick,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      onClick={onClick}
      style={{
        border: 'none',
        cursor: 'pointer',
        borderRadius: 9,
        padding: '10px 18px',
        font: "600 14px/1 'Inter', sans-serif",
        background: actif ? '#1D3557' : 'transparent',
        color: actif ? '#fff' : '#5A6472',
      }}
    >
      {children}
    </button>
  );
}
