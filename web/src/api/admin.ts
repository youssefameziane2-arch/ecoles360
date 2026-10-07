import { apiFetch } from './client';
import type { EntreeAudit } from './audit';
import type { TypeEtablissement } from './etablissements';
import type { ChampsModifies } from './espace';

/** Back-office admin — livrable 11 §3.4. Réservé au Super Admin (RG25). */

export type StatutEtablissement = 'en_attente' | 'validee' | 'masquee' | 'suspendue';

/**
 * DEUX FAÇONS DE NE PAS ÊTRE EN LIGNE, et il ne faut pas les confondre
 * (tranché par le client, 7 octobre 2026) :
 *
 * - `masquee` — la fiche est **en cours de mise à jour**. Elle sort du site le
 *   temps des travaux et y revient. Ce n'est pas une sanction.
 * - `suspendue` — l'établissement est **retiré du site jusqu'à réactivation**.
 *
 * Les libellés le disent, parce que « Masquée » seul ne dit pas pourquoi, et
 * qu'un administrateur qui lit sa liste doit distinguer une fiche en travaux
 * d'une fiche sanctionnée sans avoir à ouvrir le journal.
 */
export const LIBELLE_STATUT: Record<StatutEtablissement, string> = {
  en_attente: 'En attente',
  validee: 'Publiée',
  masquee: 'En mise à jour',
  suspendue: 'Suspendue',
};

export interface EtablissementAdmin {
  id: string;
  nom: string;
  slug: string;
  type: TypeEtablissement;
  statut: StatutEtablissement;
  sponsorise: boolean;
  verifie: boolean;
  premium: boolean;
  cree_le: string;
  ville: { nom: string };
  proprietaire: { name: string; email: string } | null;
  /** Au plus un abonnement en cours — RG14. Vide tant que rien n'est encaissé. */
  abonnements: { formule: 'essai_gratuit' | 'mensuel' | 'annuel'; statut: string; echeance: string }[];
}

export interface PropositionAdmin {
  id: string;
  etablissement_id: string;
  champs_modifies: ChampsModifies;
  payload: Record<string, unknown> | null;
  proposee_le: string;
  etablissement: { id: string; nom: string; slug: string };
  auteur: { id: string; email: string };
}

export const chargerEtablissementsAdmin = (filtres: {
  statut?: StatutEtablissement;
  type?: TypeEtablissement;
}) => {
  const params = new URLSearchParams();
  if (filtres.statut) params.set('statut', filtres.statut);
  if (filtres.type) params.set('type', filtres.type);
  const query = params.toString();

  return apiFetch<EtablissementAdmin[]>(`/admin/etablissements${query ? `?${query}` : ''}`);
};

/** RG03 — répond 409 vers `validee` tant que l'abonnement n'est pas encaissé (RG14). */
export const changerStatutEtablissement = (id: string, statut: StatutEtablissement) =>
  apiFetch<void>(`/admin/etablissements/${id}/statut`, {
    method: 'PATCH',
    body: JSON.stringify({ statut }),
  });

/** RG13 — essai sans tarif ni facture, débloque la validation. */
export const activerEssaiGratuit = (id: string) =>
  apiFetch<void>(`/admin/etablissements/${id}/essai-gratuit`, { method: 'POST' });

export const basculerBadges = (
  id: string,
  badges: { sponsorise?: boolean; verifie?: boolean; premium?: boolean },
) =>
  apiFetch<void>(`/admin/etablissements/${id}/badges`, {
    method: 'PATCH',
    body: JSON.stringify(badges),
  });

export const chargerPropositionsAdmin = () =>
  apiFetch<PropositionAdmin[]>('/admin/propositions-fiche');

export const deciderProposition = (
  id: string,
  decision: { decision: 'validee' } | { decision: 'rejetee'; motif: string },
) =>
  apiFetch<void>(`/admin/propositions-fiche/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(decision),
  });

// ---------------------------------------------------------------------------
//  Création d'une fiche — livrable 11 §3.4
// ---------------------------------------------------------------------------

/** Familles de caractéristiques, telles que les nomme le schéma. */
export type CategorieCaracteristique =
  | 'niveau'
  | 'filiere'
  | 'langue'
  | 'activite'
  | 'matiere'
  | 'cursus'
  | 'domaine'
  | 'format';

export const LIBELLE_CATEGORIE: Record<CategorieCaracteristique, string> = {
  niveau: 'Niveaux',
  filiere: 'Filières',
  langue: 'Langues',
  activite: 'Activités',
  matiere: 'Matières',
  cursus: 'Cursus',
  domaine: 'Domaines',
  format: 'Formats',
};

export interface ReferentielEtablissements {
  villes: { id: string; nom: string; region: string | null }[];
  caracteristiques: { id: string; libelle: string; categorie: CategorieCaracteristique }[];
}

export interface NouvelEtablissement {
  nom: string;
  ville_id: number;
  type: TypeEtablissement;
  adresse?: string;
  quartier?: string;
  tel?: string;
  whatsapp?: string;
  email?: string;
  site_web?: string;
  description?: string;
  langues?: string;
  budget_min?: number;
  budget_max?: number;
  groupe?: string;
  caracteristiques?: number[];
}

export const chargerReferentielEtablissements = () =>
  apiFetch<ReferentielEtablissements>('/admin/etablissements/referentiel');

/** La fiche naît « en attente » (RG03) et sans propriétaire (RG04). */
export const creerEtablissement = (dto: NouvelEtablissement) =>
  apiFetch<{ id: string; nom: string; slug: string }>('/admin/etablissements', {
    method: 'POST',
    body: JSON.stringify(dto),
  });

// ---------------------------------------------------------------------------
//  Galerie photo
// ---------------------------------------------------------------------------

export interface PhotoAdmin {
  id: string;
  chemin: string;
  alt: string | null;
  ordre: number;
  poids: number | null;
}

/**
 * Chaque écriture rend la GALERIE ENTIÈRE, pas la seule photo touchée.
 *
 * Supprimer renumérote les suivantes, réordonner les déplace toutes : un
 * retour partiel obligerait l'écran à rejouer ces règles de son côté pour
 * rester juste, et à diverger le jour où elles changent.
 */
export const chargerPhotosAdmin = (etablissementId: string) =>
  apiFetch<PhotoAdmin[]>(`/admin/etablissements/${etablissementId}/photos`);

export const ajouterPhotos = (etablissementId: string, fichiers: File[]) => {
  const corps = new FormData();
  fichiers.forEach((fichier) => corps.append('photos', fichier));

  return apiFetch<PhotoAdmin[]>(`/admin/etablissements/${etablissementId}/photos`, {
    method: 'POST',
    body: corps,
  });
};

/** Garde la place dans la galerie et la légende — seul le fichier change. */
export const remplacerPhoto = (etablissementId: string, photoId: string, fichier: File) => {
  const corps = new FormData();
  corps.append('photo', fichier);

  return apiFetch<PhotoAdmin[]>(`/admin/etablissements/${etablissementId}/photos/${photoId}`, {
    method: 'PUT',
    body: corps,
  });
};

export const legenderPhoto = (etablissementId: string, photoId: string, alt: string) =>
  apiFetch<PhotoAdmin[]>(`/admin/etablissements/${etablissementId}/photos/${photoId}`, {
    method: 'PATCH',
    body: JSON.stringify({ alt }),
  });

export const supprimerPhoto = (etablissementId: string, photoId: string) =>
  apiFetch<PhotoAdmin[]>(`/admin/etablissements/${etablissementId}/photos/${photoId}`, {
    method: 'DELETE',
  });

/** La liste doit être COMPLÈTE : l'API répond 409 sinon. */
export const reordonnerPhotos = (etablissementId: string, ids: string[]) =>
  apiFetch<PhotoAdmin[]>(`/admin/etablissements/${etablissementId}/photos/ordre`, {
    method: 'PUT',
    body: JSON.stringify({ ids }),
  });

/** Une file qui attend une décision humaine — bloc « À traiter ». */
export interface FileATraiter {
  file: 'propositions' | 'avis' | 'articles';
  en_attente: number;
  /** Date de la plus ancienne en attente — nulle quand la file est vide. */
  plus_ancienne: string | null;
}

/** Nombre sur la fenêtre de 30 jours, et sur les 30 jours d'avant. */
export interface Comparaison {
  courant: number;
  precedent: number;
}

/** `GET /admin/tableau-de-bord` — maquette `isAdminDash`, un seul aller-retour. */
export interface TableauDeBordAdmin {
  fenetre_jours: number;
  activite: EntreeAudit[];
  a_traiter: FileATraiter[];
  visites: {
    vues_fiches: Comparaison;
    demandes: Comparaison;
    vues_par_jour: { jour: string; vues: number }[];
  };
  top_etablissements: {
    id: string;
    nom: string;
    slug: string;
    type: TypeEtablissement;
    statut: StatutEtablissement;
    quartier: string | null;
    note_moy: string;
    nb_avis: number;
    ville: { nom: string };
    vues: number;
  }[];
}

export const chargerTableauDeBordAdmin = () =>
  apiFetch<TableauDeBordAdmin>('/admin/tableau-de-bord');

/** Les quatre périodes de l'écran « Statistiques » — maquette `adStatPeriods`. */
export type PeriodeStatistiques = '7j' | '30j' | '90j' | '12m';

/** `GET /admin/statistiques` — maquette `isAdminStats`, un seul aller-retour. */
export interface StatistiquesAdmin {
  periode: PeriodeStatistiques;
  granularite: 'jour' | 'semaine' | 'mois';
  depuis: string;
  indicateurs: { vues_fiches: number; demandes: number; nouveaux_avis: number };
  courbe: { debut: string; vues: number }[];
  vues_par_type: { type: TypeEtablissement; vues: number }[];
  top_etablissements: {
    id: string;
    nom: string;
    slug: string;
    type: TypeEtablissement;
    statut: StatutEtablissement;
    note_moy: string;
    nb_avis: number;
    ville: { nom: string; slug: string };
    vues: number;
    contacts: number;
  }[];
  options: { villes: { nom: string; slug: string }[] };
}

export const chargerStatistiquesAdmin = (filtres: {
  periode: PeriodeStatistiques;
  ville?: string;
  type?: TypeEtablissement;
}) => {
  const query = new URLSearchParams({ periode: filtres.periode });
  if (filtres.ville) query.set('ville', filtres.ville);
  if (filtres.type) query.set('type', filtres.type);

  return apiFetch<StatistiquesAdmin>(`/admin/statistiques?${query.toString()}`);
};

// ---------------------------------------------------------------------------
//  Secrétariat — comptes et portées déléguées (RG05, RG25)
// ---------------------------------------------------------------------------

export type PorteeDeleguee = 'fiches' | 'contacts' | 'avis';

export const LIBELLE_PORTEE: Record<PorteeDeleguee, string> = {
  fiches: 'Fiches',
  contacts: 'Demandes de contact',
  avis: 'Modération des avis',
};

/** Ce que chaque portée ouvre réellement — l'écran doit le dire, pas le supposer. */
export const EFFET_PORTEE: Record<PorteeDeleguee, string> = {
  fiches: 'Voir et proposer des modifications de la fiche.',
  contacts: 'Lire les demandes de parents et les faire avancer.',
  avis: 'Répondre aux avis publiés et les signaler.',
};

export interface CompteSecretariat {
  id: string;
  name: string;
  email: string;
  statut: 'actif' | 'suspendu';
  cree_le: string;
  etablissementRattache: { id: string; nom: string; slug: string } | null;
  portees: PorteeDeleguee[];
  accordees: { portee: PorteeDeleguee; accordee_le: string; accordeur: { name: string } }[];
}

export const chargerSecretariat = () => apiFetch<CompteSecretariat[]>('/admin/secretariat');

/** La ligne est conservée et datée : une portée se révoque, elle ne s'efface pas. */
export const basculerPortee = (id: string, portee: PorteeDeleguee, accordee: boolean) =>
  apiFetch<CompteSecretariat[]>(`/admin/secretariat/${id}/portee`, {
    method: 'PATCH',
    body: JSON.stringify({ portee, accordee }),
  });

/** Suspendre DÉTRUIT les sessions en cours (RG25) — l'accès tombe aussitôt. */
export const basculerStatutCompte = (id: string, suspendu: boolean) =>
  apiFetch<CompteSecretariat[]>(`/admin/secretariat/${id}/statut`, {
    method: 'PATCH',
    body: JSON.stringify({ suspendu }),
  });

/**
 * Supprime une fiche créée par erreur.
 *
 * Refusée en 409 dès qu'elle porte un historique — la cascade emporterait
 * des factures que la loi impose de garder (RG14). Pour retirer une école du
 * site sans rien perdre, c'est « Suspendre ».
 */
export const supprimerEtablissement = (id: string) =>
  apiFetch<void>(`/admin/etablissements/${id}`, { method: 'DELETE' });

// -----------------------------------------------------------------------------
//  Profil complet d'une fiche — les blocs que la création ne couvre pas
// -----------------------------------------------------------------------------

export interface ProfilEtablissement {
  id: string;
  nom: string;
  slug: string;
  statut: StatutEtablissement;
  description: string | null;
  projet_pedagogique: string | null;
  adresse: string | null;
  quartier: string | null;
  tel: string | null;
  whatsapp: string | null;
  email: string | null;
  site_web: string | null;
  langues: string | null;
  budget_min: number | null;
  budget_max: number | null;
  gamme_label: string | null;
  video_url: string | null;
  facilites: string[] | null;
  equipe: { nom: string; role: string; photo?: string }[] | null;
  faq: { q: string; r: string }[] | null;
  chiffres: { label: string; valeur: string }[] | null;
  horaires: Record<string, string> | null;
  socials: Record<string, string> | null;
  autres_projets: { type: string; nom: string; ville?: string; description?: string }[] | null;
  ville: { id: string; nom: string; slug: string };
  photos: { id: string; chemin: string; alt: string | null; ordre: number }[];
}

export const chargerProfilEtablissement = (id: string) =>
  apiFetch<ProfilEtablissement>(`/admin/etablissements/${id}/profil`);

/**
 * Écrit le profil, SANS PASSER PAR UNE PROPOSITION.
 *
 * La RG20 borne l'établissement — il propose, l'administration publie. Elle
 * ne dit pas que l'administration doive se proposer des modifications à
 * elle-même : elle est l'autorité de validation.
 */
export const ecrireProfilEtablissement = (id: string, profil: Record<string, unknown>) =>
  apiFetch<void>(`/admin/etablissements/${id}/profil`, {
    method: 'PUT',
    body: JSON.stringify(profil),
  });

// -----------------------------------------------------------------------------
//  Facturation — RG11, RG14, RG18
// -----------------------------------------------------------------------------

export type FormuleAbonnement = 'essai_gratuit' | 'mensuel' | 'annuel';
export type StatutPaiement = 'non_payee' | 'payee';
export type StatutCommission = 'a_valider' | 'validee' | 'reglee';

export const LIBELLE_FORMULE: Record<FormuleAbonnement, string> = {
  essai_gratuit: 'Essai gratuit',
  mensuel: 'Mensuel',
  annuel: 'Annuel',
};

export interface IndicateursFacturation {
  encaisse_ce_mois: string;
  factures_encaissees_ce_mois: number;
  en_attente: string;
  factures_en_attente: number;
  abonnements_actifs: number;
  echeances_sous_30_jours: number;
}

export interface CommissionFacture {
  id: string;
  taux_pct: string;
  montant_mad: string;
  statut: StatutCommission;
  commercial: { name: string } | null;
}

export interface FactureAdmin {
  id: string;
  numero: string;
  objet: string;
  montant_ht: string;
  tva: string;
  total_ttc: string;
  statut_paiement: StatutPaiement;
  emise_le: string;
  payee_le: string | null;
  etablissement: { id: string; nom: string; slug: string };
  abonnement: { formule: FormuleAbonnement; debut: string; echeance: string } | null;
  commissions: CommissionFacture[];
}

export const chargerIndicateursFacturation = () =>
  apiFetch<IndicateursFacturation>('/admin/facturation');

export const chargerFactures = (statut?: StatutPaiement) =>
  apiFetch<FactureAdmin[]>(`/admin/factures${statut ? `?statut=${statut}` : ''}`);

/** Le tarif vient de l'écran : il est propre à chaque client, aucun barème ne le fournit. */
export const ouvrirAbonnement = (
  etablissementId: string,
  saisie: { formule: 'mensuel' | 'annuel'; tarif_mad: number; remise_pct?: number },
) =>
  apiFetch<{ id: string }>(`/admin/etablissements/${etablissementId}/abonnement`, {
    method: 'POST',
    body: JSON.stringify(saisie),
  });

/** Le montant vient de l'abonnement, jamais de la requête. */
export const emettreFacture = (abonnementId: string, commission_pct?: number) =>
  apiFetch<FactureAdmin>(`/admin/abonnements/${abonnementId}/facture`, {
    method: 'POST',
    body: JSON.stringify(commission_pct === undefined ? {} : { commission_pct }),
  });

/** C'est l'encaissement, et lui seul, qui lève la condition de la RG14. */
export const encaisserFacture = (factureId: string) =>
  apiFetch<void>(`/admin/factures/${factureId}/encaissement`, { method: 'PATCH' });

export interface AbonnementAdmin {
  id: string;
  formule: FormuleAbonnement;
  tarif_mad: string | null;
  remise_pct: string | null;
  debut: string;
  echeance: string;
  statut: 'essai' | 'actif' | 'expire' | 'resilie';
  factures: { id: string; numero: string; total_ttc: string; statut_paiement: StatutPaiement }[];
}

export const chargerAbonnements = (etablissementId: string) =>
  apiFetch<AbonnementAdmin[]>(`/admin/etablissements/${etablissementId}/abonnements`);

// ---------------------------------------------------------------------------
//  Création de compte — RG25
// ---------------------------------------------------------------------------

export interface CompteCree {
  id: string;
  email: string;
  name: string;
  /**
   * RENDU UNE SEULE FOIS, et par le serveur seul. Il n'est stocké nulle part
   * en clair — ni en base, qui n'en garde qu'un hachage Argon2id, ni au
   * journal d'audit. Recharger l'écran ne le retrouvera pas : c'est à
   * l'administrateur de le transmettre à son titulaire.
   */
  mot_de_passe: string;
}

export interface NouveauCompte {
  email: string;
  nom: string;
  role: 'secretariat' | 'commercial';
  telephone?: string;
  /** Secrétariat seulement — l'API refuse un commercial rattaché. */
  etablissement_id?: string;
}

export const creerCompte = (compte: NouveauCompte) =>
  apiFetch<CompteCree>('/admin/comptes', { method: 'POST', body: JSON.stringify(compte) });

/** Les sessions en cours du titulaire sont détruites (RG25). */
export const reinitialiserMotDePasse = (id: string) =>
  apiFetch<{ id: string; email: string; nom: string; mot_de_passe: string }>(
    `/admin/comptes/${id}/mot-de-passe`,
    { method: 'POST' },
  );
