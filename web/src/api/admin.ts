import { apiFetch } from './client';
import type { TypeEtablissement } from './etablissements';
import type { ChampsModifies } from './espace';

/** Back-office admin — livrable 11 §3.4. Réservé au Super Admin (RG25). */

export type StatutEtablissement = 'en_attente' | 'validee' | 'masquee' | 'suspendue';

export const LIBELLE_STATUT: Record<StatutEtablissement, string> = {
  en_attente: 'En attente',
  validee: 'Publiée',
  masquee: 'Masquée',
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
