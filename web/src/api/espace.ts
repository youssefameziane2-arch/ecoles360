import type { MembreEquipe } from './etablissements';
import { apiFetch, apiFetchPage } from './client';
import type { TypeEtablissement } from './etablissements';

/**
 * Espace connecté — livrable 11 §3.2.
 *
 * AUCUNE DE CES ROUTES NE PREND D'IDENTIFIANT D'ÉTABLISSEMENT : le serveur le
 * lit dans la session (RG25). C'est volontaire et il ne faut pas « corriger »
 * cela en ajoutant un paramètre — ce serait rouvrir la porte à consulter la
 * fiche d'un autre établissement en changeant un chiffre dans l'URL.
 */

export type StatutDemande = 'nouvelle' | 'en_cours' | 'traitee';
export type CanalDemande = 'formulaire' | 'appel' | 'whatsapp';
export type StatutAvis = 'en_attente' | 'publie' | 'rejete';

export interface TableauDeBord {
  note_moy: string;
  nb_avis: number;
  /** Mois calendaire, vues simples et sponsorisées — la définition des statistiques (B-43). */
  vues_ce_mois: number;
  vues_par_mois: { mois: string; vues: number }[];
  canaux: { type: 'appel' | 'whatsapp' | 'vue' | 'vue_sponsorisee'; total: number }[];
  dernieres_demandes: {
    id: string;
    parent_nom: string;
    message: string | null;
    canal: CanalDemande;
    statut: StatutDemande;
    recue_le: string;
  }[];
  derniers_avis: {
    id: string;
    auteur_nom: string;
    note: number;
    commentaire: string;
    depose_le: string;
  }[];
}

/**
 * Comparatif avant / après, champ par champ — alimente l'écran de validation.
 *
 * Le tableau de chaînes est la forme HISTORIQUE (simple liste des champs
 * touchés, sans les valeurs) : des lignes antérieures la portent encore, et
 * l'affichage doit la tolérer.
 */
export type ChampsModifies = Record<string, { avant: unknown; apres: unknown }> | string[];

export interface PropositionFiche {
  id: string;
  etablissement_id: string;
  champs_modifies: ChampsModifies;
  payload: Record<string, unknown> | null;
  statut: 'en_attente' | 'validee' | 'rejetee';
  decision_motif: string | null;
  proposee_le: string;
  traitee_le: string | null;
}

/** Une autre enseigne du propriétaire — bloc « Autres projets » de la page profil. */
export interface AutreProjet {
  type: string;
  nom: string;
  ville?: string;
  description?: string;
}

export interface FicheEspace {
  id: string;
  slug: string;
  nom: string;
  type: TypeEtablissement;
  statut: 'en_attente' | 'validee' | 'masquee' | 'suspendue';
  description: string | null;
  adresse: string | null;
  quartier: string | null;
  tel: string | null;
  whatsapp: string | null;
  email: string | null;
  budget_min: number | null;
  budget_max: number | null;
  note_moy: string;
  nb_avis: number;
  sponsorise: boolean;
  verifie: boolean;
  premium: boolean;
  chiffres: { label: string; valeur: string }[] | null;
  faq: { q: string; r: string }[] | null;
  horaires: Record<string, string> | null;
  socials: Record<string, string> | null;
  autres_projets: AutreProjet[] | null;
  facilites: string[] | null;
  equipe: MembreEquipe[] | null;
  video_url: string | null;
  gamme_label: string | null;
  devis_label: string | null;
  langues: string | null;
  site_web: string | null;
  projet_pedagogique: string | null;
  lat: string | null;
  lng: string | null;
  ville: { nom: string; slug: string };
  photos: { id: string; chemin: string; alt: string | null; ordre: number }[];
  niveaux: { niveau: { id: string; libelle: string; categorie: string } }[];
  proposition_en_attente: PropositionFiche | null;
}

/** Champs qu'une proposition peut porter — miroir exact du DTO serveur. */
export interface ModificationsFiche {
  nom?: string;
  description?: string;
  adresse?: string;
  quartier?: string;
  tel?: string;
  whatsapp?: string;
  email?: string;
  budget_min?: number;
  budget_max?: number;
  chiffres?: { label: string; valeur: string }[];
  faq?: { q: string; r: string }[];
  horaires?: Record<string, string>;
  socials?: Record<string, string>;
  autres_projets?: AutreProjet[];
  facilites?: string[];
  equipe?: MembreEquipe[];
  video_url?: string;
  gamme_label?: string;
  devis_label?: string;
  langues?: string;
  site_web?: string;
  projet_pedagogique?: string;
}

export interface AvisEspace {
  id: string;
  auteur_nom: string;
  note: number;
  commentaire: string;
  statut: StatutAvis;
  verifie: boolean;
  reponse: string | null;
  reponse_le: string | null;
  depose_le: string;
}

export interface DemandeEspace {
  id: string;
  parent_nom: string;
  parent_tel: string;
  message: string | null;
  canal: CanalDemande;
  statut: StatutDemande;
  recue_le: string;
  traitee_le: string | null;
}

export const chargerTableauDeBord = () => apiFetch<TableauDeBord>('/mon-espace/dashboard');

/** Mois en cours, et même nombre de jours du mois précédent. */
export interface ComparaisonMensuelle {
  courant: number;
  precedent: number;
}

/** Page d'où vient une trace — `null` quand l'appelant ne l'a pas dit. */
export type SourceTrace = 'resultats' | 'fiche' | 'une' | null;

/** `GET /mon-espace/statistiques` — maquette `isEtabStats`. */
export interface StatistiquesEspace {
  /** `AAAA-MM`, en UTC. */
  mois_courant: string;
  depuis: string;
  indicateurs: {
    vues: ComparaisonMensuelle;
    appels: ComparaisonMensuelle;
    whatsapp: ComparaisonMensuelle;
  };
  /** Six points, le dernier étant le mois en cours. */
  vues_par_mois: { debut: string; vues: number }[];
  total_vues: number;
  origine_contacts: { source: SourceTrace; contacts: number }[];
  total_contacts: number;
}

export const chargerStatistiquesEspace = () =>
  apiFetch<StatistiquesEspace>('/mon-espace/statistiques');

export const chargerFicheEspace = () => apiFetch<FicheEspace>('/mon-espace/fiche');

export const proposerModifications = (modifications: ModificationsFiche) =>
  apiFetch<PropositionFiche>('/mon-espace/fiche/propositions', {
    method: 'POST',
    body: JSON.stringify(modifications),
  });

export const annulerProposition = (id: string) =>
  apiFetch<void>(`/mon-espace/fiche/propositions/${id}`, { method: 'DELETE' });

export const chargerAvisEspace = (page = 1) =>
  apiFetchPage<AvisEspace>(`/mon-espace/avis?page=${page}`);

export const repondreAvisEspace = (id: string, reponse: string) =>
  apiFetch<void>(`/mon-espace/avis/${id}/reponse`, {
    method: 'POST',
    body: JSON.stringify({ reponse }),
  });

export const chargerDemandesEspace = (page = 1) =>
  apiFetchPage<DemandeEspace>(`/mon-espace/demandes?page=${page}`);

export const changerStatutDemande = (id: string, statut: StatutDemande) =>
  apiFetch<void>(`/mon-espace/demandes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ statut }),
  });

// ---------------------------------------------------------------------------
//  Galerie — mêmes gestes que côté admin, bornés à SA fiche (RG05)
// ---------------------------------------------------------------------------

/**
 * AUCUNE ROUTE NE PREND D'IDENTIFIANT D'ÉTABLISSEMENT. La fiche vient de la
 * session : c'est ce qui rend la portée infranchissable, plutôt que de
 * compter sur le front pour envoyer le bon identifiant.
 */
export interface PhotoEspace {
  id: string;
  chemin: string;
  alt: string | null;
  ordre: number;
  poids: number | null;
}

export const chargerMesPhotos = () => apiFetch<PhotoEspace[]>('/mon-espace/fiche/photos');

export const ajouterMesPhotos = (fichiers: File[]) => {
  const corps = new FormData();
  fichiers.forEach((fichier) => corps.append('photos', fichier));

  return apiFetch<PhotoEspace[]>('/mon-espace/fiche/photos', { method: 'POST', body: corps });
};

export const remplacerMaPhoto = (photoId: string, fichier: File) => {
  const corps = new FormData();
  corps.append('photo', fichier);

  return apiFetch<PhotoEspace[]>(`/mon-espace/fiche/photos/${photoId}`, {
    method: 'PUT',
    body: corps,
  });
};

export const legenderMaPhoto = (photoId: string, alt: string) =>
  apiFetch<PhotoEspace[]>(`/mon-espace/fiche/photos/${photoId}`, {
    method: 'PATCH',
    body: JSON.stringify({ alt }),
  });

export const supprimerMaPhoto = (photoId: string) =>
  apiFetch<PhotoEspace[]>(`/mon-espace/fiche/photos/${photoId}`, { method: 'DELETE' });

/** La liste doit être COMPLÈTE : l'API répond 409 sinon. */
export const reordonnerMesPhotos = (ids: string[]) =>
  apiFetch<PhotoEspace[]>('/mon-espace/fiche/photos/ordre', {
    method: 'PUT',
    body: JSON.stringify({ ids }),
  });

// ---------------------------------------------------------------------------
//  Abonnement & facturation — maquette `isEtabCredits`
// ---------------------------------------------------------------------------

export type FormuleAbonnement = 'essai_gratuit' | 'mensuel' | 'annuel';
export type StatutAbonnement = 'essai' | 'actif' | 'expire' | 'resilie';
export type StatutFacture = 'non_payee' | 'payee';

export interface AbonnementEspace {
  formule: FormuleAbonnement;
  statut: StatutAbonnement;
  /** Nul sur un essai gratuit — le schéma l'impose. */
  tarif_mad: string | null;
  remise_pct: string | null;
  debut: string;
  echeance: string;
}

export interface FactureEspace {
  id: string;
  numero: string;
  objet: string;
  montant_ht: string;
  tva: string;
  total_ttc: string;
  statut_paiement: StatutFacture;
  emise_le: string;
  payee_le: string | null;
}

export interface FacturationEspaceDonnees {
  abonnement: AbonnementEspace | null;
  essai: { statut: StatutAbonnement; debut: string; echeance: string } | null;
  factures: FactureEspace[];
}

/**
 * `GET /mon-espace/facturation` — **403 pour un compte secrétariat**.
 *
 * La RG05 ne délègue que `fiches`, `contacts` et `avis` : la facturation n'est
 * pas une portée. L'écran ne s'affiche donc qu'au compte établissement.
 */
export const chargerMaFacturation = () =>
  apiFetch<FacturationEspaceDonnees>('/mon-espace/facturation');
