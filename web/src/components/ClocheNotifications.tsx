import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  chargerNotifications,
  marquerNotificationsLues,
  type Notification,
  type TypeNotification,
} from '@/api/espace';
import { Icon } from '@/ds/composants';
import { formaterDepuis } from '@/lib/formats';

/** Où mène chaque type — une notification sans suite ne sert à rien. */
const DESTINATION: Record<TypeNotification, { admin: string; espace: string }> = {
  demande: { admin: '/admin/etablissements', espace: '/espace/demandes' },
  moderation: { admin: '/admin/avis', espace: '/espace/avis' },
  proposition_fiche: { admin: '/admin/propositions', espace: '/espace/fiche' },
  echeance_abonnement: { admin: '/admin/facturation', espace: '/espace/facturation' },
  plafond_vue_atteint: { admin: '/admin/facturation', espace: '/espace/facturation' },
  // L'ADMINISTRATION SEULE reçoit celui-ci : une école qui demande à être
  // référencée n'a pas encore d'espace. La seconde branche n'existe que parce
  // que la carte est totale.
  inscription: { admin: '/admin/crm', espace: '/espace' },
};

const ICONE: Record<TypeNotification, string> = {
  demande: 'mail',
  moderation: 'star',
  proposition_fiche: 'pencil',
  echeance_abonnement: 'credit-card',
  plafond_vue_atteint: 'bar-chart',
  // `flag`, comme l'entrée « CRM Clients » du menu : l'icône de la cloche et
  // celle de l'écran où elle mène doivent se reconnaître.
  inscription: 'flag',
};

/**
 * Cloche de notifications — table `Notification` du livrable 10 §2.20.
 *
 * ELLE EXISTE PARCE QUE LE PRODUIT COMPTAIT SUR LE HASARD. Une demande de
 * parent, un avis à modérer, une proposition de fiche, une échéance
 * d'abonnement : rien ne prévenait personne. Il fallait ouvrir le bon écran
 * au bon moment.
 *
 * CHAQUE NOTIFICATION MÈNE QUELQUE PART. Une alerte qu'on ne peut pas suivre
 * est un reproche sans issue : cliquer ouvre l'écran qui permet d'agir, et
 * c'est l'ouverture du panneau — pas le clic sur une ligne — qui marque le
 * tout comme lu. Une notification signale, elle ne se traite pas.
 *
 * PAS DE RAFRAÎCHISSEMENT AUTOMATIQUE. Interroger le serveur toutes les
 * trente secondes sur chaque écran de chaque session coûterait plus que ce
 * que cela rapporte : la cloche se met à jour au changement d'écran, ce qui
 * suffit pour un outil de gestion.
 */
export function ClocheNotifications({ espace }: { espace: 'administration' | 'etablissement' | 'commercial' }) {
  const queryClient = useQueryClient();
  const [ouvert, setOuvert] = useState(false);

  const donnees = useQuery({ queryKey: ['notifications'], queryFn: chargerNotifications });

  const lues = useMutation({
    mutationFn: () => marquerNotificationsLues(),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const nonLues = donnees.data?.non_lues ?? 0;

  function basculer() {
    const ouvre = !ouvert;
    setOuvert(ouvre);

    // Marquées lues à L'OUVERTURE : les avoir vues, c'est les avoir lues.
    if (ouvre && nonLues > 0) {
      lues.mutate();
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={basculer}
        aria-label={`Notifications${nonLues > 0 ? ` — ${nonLues} non lue(s)` : ''}`}
        aria-expanded={ouvert}
        style={{
          position: 'relative',
          border: '1px solid #EAE6DE',
          background: '#fff',
          borderRadius: 10,
          width: 38,
          height: 38,
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Icon name="bell" size={17} color="#5A6472" />
        {nonLues > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -5,
              right: -5,
              minWidth: 18,
              height: 18,
              padding: '0 5px',
              borderRadius: 9,
              background: '#E63946',
              color: '#fff',
              font: "700 11px/18px 'Inter', sans-serif",
              textAlign: 'center',
            }}
          >
            {nonLues > 9 ? '9+' : nonLues}
          </span>
        )}
      </button>

      {ouvert && (
        <>
          {/*
            UN VOILE TRANSPARENT PLUTÔT QU'UN ÉCOUTEUR GLOBAL : cliquer
            n'importe où referme, sans avoir à poser et retirer un gestionnaire
            sur `document` — qu'on oublie de retirer un jour sur deux.
          */}
          <div
            onClick={() => setOuvert(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            aria-hidden
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 46,
              width: 340,
              maxHeight: 420,
              overflowY: 'auto',
              background: '#fff',
              border: '1px solid #EAE6DE',
              borderRadius: 14,
              boxShadow: '0 12px 30px rgba(29,53,87,.16)',
              zIndex: 41,
            }}
          >
            {donnees.data?.notifications.length === 0 && (
              <p style={{ ...texteDoux, padding: 18, textAlign: 'center' }}>
                Rien de neuf. Les demandes, avis et échéances s’afficheront ici.
              </p>
            )}

            {donnees.data?.notifications.map((notification) => (
              <Ligne key={notification.id} notification={notification} espace={espace} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Ligne({
  notification,
  espace,
}: {
  notification: Notification;
  espace: 'administration' | 'etablissement' | 'commercial';
}) {
  const destination = DESTINATION[notification.type];
  const vers = espace === 'administration' ? destination.admin : destination.espace;

  return (
    <a
      href={vers}
      style={{
        display: 'flex',
        gap: 11,
        alignItems: 'flex-start',
        padding: '13px 15px',
        borderBottom: '1px solid #F4F1EB',
        textDecoration: 'none',
        color: 'inherit',
        // Le fond pâle distingue ce qui n'a pas encore été vu — il disparaît
        // au prochain chargement, puisque l'ouverture marque tout comme lu.
        background: notification.lue_le ? '#fff' : '#FBFAF7',
      }}
    >
      <span
        style={{
          flex: 'none',
          width: 30,
          height: 30,
          borderRadius: 8,
          background: '#F1EEE8',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Icon name={ICONE[notification.type]} size={15} color="#1D3557" />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "500 13px/1.45 'Inter', sans-serif", color: '#2A313B' }}>
          {notification.contenu}
        </div>
        {notification.envoyee_le && (
          <div style={{ fontSize: 11.5, color: '#9AA3AF', marginTop: 3 }}>
            {formaterDepuis(notification.envoyee_le)}
          </div>
        )}
      </div>
    </a>
  );
}

const texteDoux: React.CSSProperties = {
  font: "400 13.5px/1.6 'Inter', sans-serif",
  color: '#9AA3AF',
  margin: 0,
};
