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
  // CES CLÉS ONT ÉTÉ RAPPROCHÉES DES ACTIONS RÉELLEMENT ÉMISES PAR L'API.
  // Cinq d'entre elles ne correspondaient à rien — `etablissement.suspendu`
  // quand l'API écrit `etablissement.statut.suspendue`, `etablissement.badges`
  // pour `etablissement.badges.bascule` — et le journal retombait sur son
  // repli : « Etablissement statut suspendue ». Lisible, mais c'est l'écran
  // que l'on montre pour prouver qu'on sait qui a fait quoi.
  'etablissement.creation': 'Établissement créé',
  // Émis par le seul semis de démonstration, qui fabrique un journal
  // vraisemblable. Sans ce libellé, la démonstration afficherait
  // « Etablissement valide » au milieu de lignes correctement traduites.
  'etablissement.valide': 'Établissement validé',
  'etablissement.statut.validee': 'Établissement validé',
  'etablissement.statut.suspendue': 'Établissement suspendu',
  'etablissement.statut.masquee': 'Établissement masqué',
  'etablissement.statut.en_attente': 'Établissement remis en attente',
  'etablissement.supprime': 'Établissement supprimé',
  'etablissement.badges.bascule': 'Badges modifiés',
  'etablissement.essai_gratuit.active': 'Essai gratuit activé',
  'etablissement.photos.ajout': 'Photos ajoutées',
  'etablissement.photos.remplacement': 'Photo remplacée',
  'etablissement.photos.legende': 'Légende de photo modifiée',
  'etablissement.photos.ordre': 'Galerie réordonnée',
  'etablissement.photos.suppression': 'Photo retirée',
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
  // PAS « Page À propos » : la même action sert désormais les trois pages
  // légales, et le journal affichait « Page « À propos » publiée — cookies ».
  // Le détail qui suit porte la clé ; le libellé ne doit donc plus nommer une
  // page en particulier.
  'page_cms.modifiee': 'Page publiée',
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
  'secretariat.portee.accordee': 'Portée déléguée accordée',
  'secretariat.portee.revoquee': 'Portée déléguée révoquée',
  'secretariat.compte.suspendu': 'Compte de secrétariat suspendu',
  'secretariat.compte.reactive': 'Compte de secrétariat réactivé',
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
