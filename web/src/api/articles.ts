import { apiFetch, apiFetchPage } from './client';

/** Blog — livrable 11 §3.5, avenant 3. */

export type StatutArticle = 'brouillon' | 'en_attente' | 'approuve' | 'refuse';

export const LIBELLE_STATUT: Record<StatutArticle, string> = {
  brouillon: 'Brouillon',
  en_attente: 'En attente de validation',
  approuve: 'Publié',
  refuse: 'Refusé',
};

/** Teinte du badge — le circuit doit se lire d'un coup d'œil. */
export const TON_STATUT: Record<StatutArticle, 'grey' | 'amber' | 'green' | 'red'> = {
  brouillon: 'grey',
  en_attente: 'amber',
  approuve: 'green',
  refuse: 'red',
};

export interface CarteArticle {
  id: string;
  slug: string;
  titre: string;
  categorie: string;
  chapeau: string | null;
  image_chemin: string | null;
  a_la_une: boolean;
  publie_le: string | null;
  etablissement: { nom: string; slug: string } | null;
}

export interface ArticleComplet extends CarteArticle {
  contenu: string | null;
  auteur: { name: string } | null;
  a_lire_aussi: CarteArticle[];
}

/** Vue de gestion — statut, motif et dates du circuit compris. */
export interface ArticleGestion extends CarteArticle {
  contenu: string | null;
  statut: StatutArticle;
  motif_refus: string | null;
  soumis_le: string | null;
  cree_le: string;
  auteur: { name: string; email: string } | null;
}

export interface SaisieArticle {
  titre: string;
  categorie: string;
  chapeau?: string;
  contenu?: string;
}

// --- Public ---------------------------------------------------------------

export const chargerArticles = (params: { categorie?: string; page?: number } = {}) => {
  const query = new URLSearchParams();
  if (params.categorie) query.set('categorie', params.categorie);
  if (params.page && params.page > 1) query.set('page', String(params.page));

  const suffixe = query.toString();

  return apiFetchPage<CarteArticle>(`/articles${suffixe ? `?${suffixe}` : ''}`);
};

export const chargerArticleALaUne = () => apiFetch<CarteArticle | null>('/articles/a-la-une');

export const chargerCategoriesArticles = () => apiFetch<string[]>('/articles/categories');

export const chargerArticle = (slug: string) => apiFetch<ArticleComplet>(`/articles/${slug}`);

/** Articles publiés par un établissement — vide s'il n'a rien publié. */
export const chargerArticlesEtablissement = (slug: string) =>
  apiFetch<CarteArticle[]>(`/articles/etablissements/${slug}`);

// --- Espace établissement -------------------------------------------------

export interface BlogEspace {
  actif: boolean;
  articles: ArticleGestion[];
}

export const chargerBlogEspace = () => apiFetch<BlogEspace>('/mon-espace/blog');

export const basculerBlogEspace = (actif: boolean) =>
  apiFetch<void>('/mon-espace/blog', { method: 'PUT', body: JSON.stringify({ actif }) });

export const creerArticle = (saisie: SaisieArticle) =>
  apiFetch<ArticleGestion>('/mon-espace/articles', {
    method: 'POST',
    body: JSON.stringify(saisie),
  });

export const modifierArticle = (id: string, saisie: SaisieArticle) =>
  apiFetch<ArticleGestion>(`/mon-espace/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(saisie),
  });

export const soumettreArticle = (id: string) =>
  apiFetch<ArticleGestion>(`/mon-espace/articles/${id}/soumettre`, { method: 'POST' });

export const supprimerArticle = (id: string) =>
  apiFetch<void>(`/mon-espace/articles/${id}`, { method: 'DELETE' });

// --- Back-office ----------------------------------------------------------

export const chargerArticlesAdmin = (statut?: StatutArticle) =>
  apiFetch<ArticleGestion[]>(`/admin/articles${statut ? `?statut=${statut}` : ''}`);

export const redigerArticleAdmin = (saisie: SaisieArticle) =>
  apiFetch<ArticleGestion>('/admin/articles', { method: 'POST', body: JSON.stringify(saisie) });

export const modifierArticleAdmin = (id: string, saisie: SaisieArticle) =>
  apiFetch<ArticleGestion>(`/admin/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(saisie),
  });

export const supprimerArticleAdmin = (id: string) =>
  apiFetch<void>(`/admin/articles/${id}`, { method: 'DELETE' });

export const deciderArticle = (id: string, decision: 'approuve' | 'refuse', motif?: string) =>
  apiFetch<ArticleGestion>(`/admin/articles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(motif ? { decision, motif } : { decision }),
  });

export const mettreALaUne = (id: string, aLaUne: boolean) =>
  apiFetch<void>(`/admin/articles/${id}/a-la-une`, {
    method: 'PATCH',
    body: JSON.stringify({ a_la_une: aLaUne }),
  });
