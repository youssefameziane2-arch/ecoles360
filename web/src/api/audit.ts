import { apiFetch, apiFetchPage } from './client';

/** Journal d'audit — livrable 11 §3.6, RG15, RG26. Lecture seule. */

export type Severite = 'info' | 'avertissement' | 'erreur';

export interface EntreeAudit {
  id: string;
  role_acteur: string;
  action: string;
  cible_type: string;
  cible_id: string;
  severite: Severite;
  details: Record<string, unknown> | null;
  cree_le: string;
  user: { name: string; email: string } | null;
}

export interface StatistiquesAudit {
  activite_par_profil: { role: string; actions: number }[];
  par_etablissement: {
    id: string;
    nom: string;
    slug: string;
    vues: number;
    clics: number;
    contacts: number;
    avis: number;
    note: string;
  }[];
}

/** Libellé humain d'un rôle acteur — `systeme` compris (avenant 3). */
export const LIBELLE_ROLE_ACTEUR: Record<string, string> = {
  superadmin: 'Administration',
  secretariat: 'Secrétariat',
  commercial: 'Commercial',
  etablissement: 'Établissement',
  systeme: 'Système',
};

/** Teinte de la pastille selon la gravité — l'œil doit trier sans lire. */
export const COULEUR_SEVERITE: Record<Severite, string> = {
  info: '#2E9E5B',
  avertissement: '#E9A23B',
  erreur: '#E63946',
};

/**
 * Traduit `avis.rejete` en « Avis rejeté ».
 *
 * Le code machine reste la vérité en base (RG26 : il ne change jamais) ; cette
 * table n'existe que pour l'affichage, et tombe en repli lisible sur une
 * action inconnue plutôt que de masquer une ligne.
 */
export const LIBELLE_ACTION: Record<string, string> = {
  'etablissement.valide': 'Établissement validé',
  'etablissement.suspendu': 'Établissement suspendu',
  'etablissement.reactive': 'Établissement réactivé',
  'etablissement.badges': 'Badges modifiés',
  'etablissement.essai_gratuit': 'Essai gratuit activé',
  'proposition_fiche.creee': 'Modification de fiche proposée',
  'proposition_fiche.approuvee': 'Modification de fiche approuvée',
  'proposition_fiche.refusee': 'Modification de fiche refusée',
  'avis.publie': 'Avis publié',
  'avis.rejete': 'Avis rejeté',
  'avis.mis_en_avant': 'Avis mis en avant',
  'avis.retire_de_lavant': 'Avis retiré de l’avant',
  'article.publie': 'Article publié',
  'article.approuve': 'Article approuvé',
  'article.refuse': 'Article refusé',
  'article.modifie': 'Article modifié',
  'article.supprime': 'Article supprimé',
  'article.mis_a_la_une': 'Article mis à la une',
  'article.retire_de_la_une': 'Article retiré de la une',
  'faq.creee': 'Question ajoutée',
  'faq.modifiee': 'Question modifiée',
  'faq.supprimee': 'Question supprimée',
  'faq.reordonnee': 'FAQ réordonnée',
  'sponsoring.cree': 'Campagne ouverte',
  'sponsoring.arrete': 'Campagne arrêtée',
  'parametre_facturation.modifie': 'Paramètre de facturation modifié',
  'blog.active': 'Blog activé',
  'blog.desactive': 'Blog désactivé',
  'compte.cree': 'Compte créé',
  'compte.suspendu': 'Compte suspendu',
  'compte.reactive': 'Compte réactivé',
  'compte.portees': 'Portées déléguées modifiées',
  'compte.motdepasse.reinitialise': 'Mot de passe réinitialisé',
  'facture.encaissee': 'Facture encaissée',
  'facture.emise': 'Facture émise',
  'purge.traces': 'Purge des traces',
};

export const libelleAction = (action: string): string =>
  LIBELLE_ACTION[action] ??
  // Repli : « quelque_chose.fait » devient « Quelque chose fait ».
  action.replace(/[._]/g, ' ').replace(/^./, (c) => c.toUpperCase());

export const chargerJournal = (params: { role?: string; domaine?: string; page?: number } = {}) => {
  const query = new URLSearchParams();
  if (params.role) query.set('role', params.role);
  if (params.domaine) query.set('domaine', params.domaine);
  if (params.page && params.page > 1) query.set('page', String(params.page));

  const suffixe = query.toString();

  return apiFetchPage<EntreeAudit>(`/admin/audit${suffixe ? `?${suffixe}` : ''}`);
};

export const chargerDomainesAudit = () => apiFetch<string[]>('/admin/audit/domaines');

export const chargerStatistiquesAudit = () =>
  apiFetch<StatistiquesAudit>('/admin/audit/statistiques');
