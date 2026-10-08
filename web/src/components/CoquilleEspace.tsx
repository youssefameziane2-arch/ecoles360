import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import { chargerPropositionsAdmin } from '@/api/admin';
import { chargerAvisModeration } from '@/api/moderation';
import { chargerTableauDeBord } from '@/api/espace';
import { chargerIndicateursCrm } from '@/api/crm';
import { Icon, SidebarNav } from '@/ds/composants';

/** Réponse de `GET /auth/me` — livrable 11 §2. */
export interface Identite {
  userId: string;
  email: string;
  role: 'superadmin' | 'secretariat' | 'commercial' | 'etablissement';
  permissions: ('fiches' | 'contacts' | 'avis' | 'blog')[];
  etablissementId: string | null;
}

const LIBELLE_ROLE: Record<Identite['role'], string> = {
  superadmin: 'Administration',
  secretariat: 'Secrétariat',
  commercial: 'Espace commercial',
  etablissement: 'Espace établissement',
};

interface EntreeNav {
  key: string;
  label: string;
  icone: string;
  /** Portée exigée — secrétariat seulement (RG05). */
  portee?: 'fiches' | 'contacts' | 'avis' | 'blog';
  /**
   * N'APPARAÎT QUE POUR UN SECRÉTARIAT. Les entrées ordinaires s'affichent
   * pour tous et ne se filtrent par portée QUE pour un secrétariat — c'est ce
   * qui permet à un établissement de voir sa fiche sans permission. La
   * relecture du blog est l'inverse : elle n'a de sens que déléguée, et un
   * établissement ne doit pas y trouver un lien vers le back-office.
   */
  reserveeAuSecretariat?: boolean;
  /** Source du compteur affiché en pastille. */
  compteur?: 'avis' | 'demandes' | 'propositions' | 'prospects';
}

/** Navigation de l'espace établissement — ordre et libellés de la maquette. */
const NAV_ETABLISSEMENT: EntreeNav[] = [
  { key: '/espace', label: 'Tableau de bord', icone: 'layout-grid' },
  { key: '/espace/fiche', label: 'Ma fiche', icone: 'pencil', portee: 'fiches' },
  { key: '/espace/statistiques', label: 'Statistiques', icone: 'bar-chart' },
  { key: '/espace/avis', label: 'Avis reçus', icone: 'star', portee: 'avis', compteur: 'avis' },
  { key: '/espace/demandes', label: 'Demandes de contact', icone: 'mail', portee: 'contacts', compteur: 'demandes' },
  { key: '/espace/blog', label: 'Blog', icone: 'book-open' },
  {
    key: '/admin/blog',
    label: 'Relecture du blog',
    icone: 'book-open',
    portee: 'blog',
    reserveeAuSecretariat: true,
  },
  { key: '/espace/facturation', label: 'Abonnement & facturation', icone: 'credit-card' },
];

/** Navigation du back-office — ordre et libellés de la maquette. */
const NAV_ADMIN: EntreeNav[] = [
  { key: '/admin', label: 'Tableau de bord', icone: 'layout-grid' },
  { key: '/admin/etablissements', label: 'Établissements', icone: 'building' },
  { key: '/admin/propositions', label: 'Modifications de fiche', icone: 'pencil', compteur: 'propositions' },
  { key: '/admin/secretariat', label: 'Secrétariat', icone: 'users' },
  { key: '/admin/commerciaux', label: 'Commerciaux', icone: 'briefcase' },
  { key: '/admin/crm', label: 'CRM Clients', icone: 'flag', compteur: 'prospects' },
  { key: '/admin/facturation', label: 'Abonnement & facturation', icone: 'credit-card' },
  { key: '/admin/sponsorings', label: 'Sponsoring', icone: 'star' },
  { key: '/admin/avis', label: 'Avis', icone: 'heart', compteur: 'avis' },
  { key: '/admin/blog', label: 'Blog', icone: 'book-open' },
  { key: '/admin/contenu', label: 'Contenu du site', icone: 'globe' },
  { key: '/admin/statistiques', label: 'Statistiques', icone: 'bar-chart' },
  { key: '/admin/journal', label: 'Journal d’audit', icone: 'calendar' },
  // `database` n'existe pas au jeu d'icônes du design system — l'entrée se
  // serait affichée sans glyphe. `search` est le plus proche : on vient ici
  // chercher une ligne, pas administrer la base.
  { key: '/admin/base', label: 'Base de données', icone: 'search' },
  { key: '/admin/parametres', label: 'Paramètres', icone: 'settings' },
];

/** Navigation de l'espace commercial — ordre et libellés de la maquette. */
const NAV_COMMERCIAL: EntreeNav[] = [
  { key: '/commercial', label: 'Tableau de bord', icone: 'layout-grid' },
  { key: '/commercial/agenda', label: 'Agenda & tâches', icone: 'calendar' },
  { key: '/commercial/leads', label: 'Mes leads', icone: 'flag', compteur: 'prospects' },
  { key: '/commercial/transferts', label: 'Transferts & commissions', icone: 'credit-card' },
  { key: '/commercial/statistiques', label: 'Statistiques', icone: 'bar-chart' },
  { key: '/commercial/blog', label: 'Blog', icone: 'book-open' },
];

/**
 * Les trois espaces connectés. Le secrétariat n'en a pas en propre : il
 * travaille dans l'espace établissement, filtré par ses portées (RG05).
 */
type Espace = 'administration' | 'etablissement' | 'commercial';

const ESPACE_DU_ROLE: Record<Identite['role'], Espace> = {
  superadmin: 'administration',
  commercial: 'commercial',
  etablissement: 'etablissement',
  secretariat: 'etablissement',
};

const NAV_DE_L_ESPACE: Record<Espace, EntreeNav[]> = {
  administration: NAV_ADMIN,
  etablissement: NAV_ETABLISSEMENT,
  commercial: NAV_COMMERCIAL,
};

/**
 * Coquille des espaces connectés — maquette « Espace écoles360 ».
 *
 * LA NAVIGATION EST COMPLÈTE, MÊME LÀ OÙ LE MODULE N'EXISTE PAS ENCORE. Les
 * entrées non construites mènent à un écran qui le dit franchement plutôt
 * qu'à une page introuvable : la structure du produit reste lisible, et
 * personne ne croit à une fonctionnalité qui répondrait dans le vide.
 *
 * LES ENTRÉES HORS PORTÉE SONT MASQUÉES (RG05) — confort d'interface, pas
 * sécurité : le serveur refuse la route de toute façon.
 */
export function CoquilleEspace({
  titre,
  sousTitre,
  children,
  identite,
}: {
  titre: string;
  sousTitre?: string;
  children: React.ReactNode;
  identite: Identite;
}) {
  const naviguer = useNavigate();
  const { pathname } = useLocation();
  const espace = ESPACE_DU_ROLE[identite.role];
  const admin = espace === 'administration';

  const propositions = useQuery({
    queryKey: ['admin', 'propositions'],
    queryFn: chargerPropositionsAdmin,
    enabled: admin,
  });

  // Réservé à l'espace établissement, et non « tout sauf l'admin » : la route
  // est gardée côté serveur, un commercial ne récolterait qu'un 403 à chaque
  // écran pour une pastille qui ne figure pas dans son menu.
  const tableau = useQuery({
    queryKey: ['espace', 'dashboard'],
    queryFn: chargerTableauDeBord,
    enabled: espace === 'etablissement',
  });

  // File de modération : la pastille du menu « Avis » compte ce qui attend
  // une décision, pas le total des avis (maquette : badge « 5 »).
  const avisAModerer = useQuery({
    queryKey: ['admin', 'avis'],
    queryFn: () => chargerAvisModeration(),
    enabled: admin,
  });

  /**
   * Les prospects que personne n'a encore regardés.
   *
   * C'EST LE SEUL SIGNAL QU'UNE DEMANDE EST ARRIVÉE. Le formulaire public
   * dépose un prospect en « nouveau » (B-46) et aucun courriel ne prévient
   * personne — il n'y a pas d'envoi d'e-mail dans le projet. Sans cette
   * pastille, une demande déposée un vendredi soir attendrait qu'un commercial
   * pense à ouvrir l'écran.
   *
   * La route est bornée au portefeuille côté serveur : un commercial voit les
   * siens, l'administration voit tout. Le menu n'a rien à filtrer.
   */
  const prospects = useQuery({
    queryKey: ['crm', 'indicateurs'],
    queryFn: chargerIndicateursCrm,
    enabled: admin || espace === 'commercial',
  });

  const deconnexion = useMutation({
    mutationFn: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      window.location.href = '/';
    },
  });

  const compteurs = {
    avis: admin
      ? avisAModerer.data?.filter((avis) => avis.statut === 'en_attente').length
      : undefined,
    demandes: tableau.data?.dernieres_demandes.filter((d) => d.statut === 'nouvelle').length,
    propositions: propositions.data?.length,
    prospects: prospects.data?.nouveaux,
  } as const;

  const entrees = NAV_DE_L_ESPACE[espace]
    .filter((entree) => !entree.reserveeAuSecretariat || identite.role === 'secretariat')
    .filter(
      (entree) =>
        !entree.portee ||
        identite.role !== 'secretariat' ||
        identite.permissions.includes(entree.portee),
    )
    .map((entree) => ({
      key: entree.key,
      label: entree.label,
      icon: <Icon name={entree.icone} size={16} />,
      // `|| undefined` et non `?? undefined` : un compteur à zéro ne doit pas
      // afficher de pastille. `??` laisserait passer le 0, et le menu
      // annoncerait « 0 » en rouge à côté d'une entrée sans rien à traiter.
      count: entree.compteur ? compteurs[entree.compteur] || undefined : undefined,
    }));

  // L'entrée active est la plus spécifique qui préfixe l'URL : `/espace/avis`
  // l'emporte sur `/espace`, sinon le tableau de bord resterait allumé partout.
  const active = [...entrees]
    .sort((a, b) => b.key.length - a.key.length)
    .find((entree) => pathname === entree.key || pathname.startsWith(`${entree.key}/`))?.key;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FAF8F4' }}>
      <div style={{ flex: 'none', position: 'sticky', top: 0, height: '100vh' }}>
        <SidebarNav
          // `commercial` n'existe pas dans les SOURCES du design system, mais le
          // bundle réellement chargé le connaît (« Espace commercial ») : c'est
          // lui qui fait foi à l'exécution — voir CORRECTIFS.md.
          theme={identite.role === 'secretariat' ? 'secretariat' : espace}
          items={entrees}
          activeKey={active}
          onSelect={(cle) => naviguer(cle)}
          user={{ name: identite.email, role: LIBELLE_ROLE[identite.role] }}
          logoSrc="/ecoles360-logo-dark.png"
        />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            background: '#fff',
            borderBottom: '1px solid #EAE6DE',
            padding: '18px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: '-0.4px' }}>
              {titre}
            </h1>
            {sousTitre && (
              <div style={{ fontSize: 13.5, color: '#9AA3AF', marginTop: 2 }}>{sousTitre}</div>
            )}
          </div>

          <button
            type="button"
            onClick={() => deconnexion.mutate()}
            disabled={deconnexion.isPending}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid #EAE6DE',
              background: '#fff',
              color: '#5A6472',
              fontFamily: 'inherit',
              fontSize: 13.5,
              fontWeight: 600,
              padding: '10px 14px',
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            <Icon name="external-link" size={16} color="#5A6472" />
            {deconnexion.isPending ? 'Déconnexion…' : 'Déconnexion'}
          </button>
        </header>

        <main style={{ flex: 1, minWidth: 0, padding: '24px 32px 48px' }}>{children}</main>
      </div>
    </div>
  );
}

/**
 * Écran d'un module encore à construire.
 *
 * Dit ce qui manque et pourquoi, plutôt que d'afficher une page vide ou un
 * 404 : l'entrée de menu existe parce que le produit la prévoit, et le
 * visiteur doit pouvoir faire la différence entre « pas encore fait » et
 * « cassé ».
 */
export function ModuleAVenir({
  titre,
  sousTitre,
  explication,
  identite,
}: {
  titre: string;
  sousTitre?: string;
  explication: string;
  identite: Identite;
}) {
  return (
    <CoquilleEspace identite={identite} titre={titre} sousTitre={sousTitre}>
      <div
        style={{
          background: '#fff',
          border: '1px solid #EAE6DE',
          borderRadius: 16,
          padding: '56px 32px',
          textAlign: 'center',
          maxWidth: 620,
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            margin: '0 auto 16px',
            borderRadius: '50%',
            background: '#F1F3F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="settings" size={26} color="#9AA3AF" />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 700 }}>Module en construction</h2>
        <p style={{ margin: 0, fontSize: 14.5, color: '#5A6472', lineHeight: 1.6 }}>{explication}</p>
      </div>
    </CoquilleEspace>
  );
}

/**
 * Charge l'identité avant de rendre un écran connecté.
 *
 * Une 401 est déjà interceptée par le client HTTP, qui redirige vers la
 * connexion — ce composant n'a donc pas à gérer l'anonyme, seulement l'attente
 * et le cas où le rôle ne correspond pas à l'espace demandé.
 */
export function AvecIdentite({
  role,
  rendu,
}: {
  role: Identite['role'][];
  rendu: (identite: Identite) => React.ReactNode;
}) {
  const identite = useQuery({ queryKey: ['me'], queryFn: () => apiFetch<Identite>('/auth/me') });

  if (identite.isPending) {
    return <div style={{ padding: 40, font: "400 15px/1.6 'Inter', sans-serif" }}>Chargement…</div>;
  }

  if (identite.isError || !identite.data) {
    return (
      <div style={{ padding: 40 }}>
        <h1 className="titre-section">Espace indisponible</h1>
        <p className="sous-titre-section">Rechargez la page dans un instant.</p>
      </div>
    );
  }

  if (!role.includes(identite.data.role)) {
    return (
      <div style={{ padding: 40 }}>
        <h1 className="titre-section">Accès refusé</h1>
        <p className="sous-titre-section">
          Votre rôle ({LIBELLE_ROLE[identite.data.role]}) ne donne pas accès à cet espace.
        </p>
      </div>
    );
  }

  return <>{rendu(identite.data)}</>;
}
