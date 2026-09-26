import { apiFetch } from './client';

/** FAQ éditoriale — livrable 11 §3.7. */

export interface QuestionFaq {
  id: string;
  question: string;
  reponse: string;
}

export interface RubriqueFaq {
  groupe: string;
  items: QuestionFaq[];
}

/** Une question vue du back-office — champs de gestion compris. */
export interface QuestionFaqAdmin extends QuestionFaq {
  groupe: string;
  ordre: number;
  publiee: boolean;
  modifiee_le: string | null;
}

export interface SaisieQuestionFaq {
  question: string;
  reponse: string;
  groupe: string;
  publiee: boolean;
}

export const chargerFaq = () => apiFetch<RubriqueFaq[]>('/faq');

export const chargerFaqAdmin = () => apiFetch<QuestionFaqAdmin[]>('/admin/faq');

export const creerQuestionFaq = (saisie: SaisieQuestionFaq) =>
  apiFetch<QuestionFaqAdmin>('/admin/faq', { method: 'POST', body: JSON.stringify(saisie) });

export const modifierQuestionFaq = (id: string, saisie: SaisieQuestionFaq) =>
  apiFetch<QuestionFaqAdmin>(`/admin/faq/${id}`, { method: 'PUT', body: JSON.stringify(saisie) });

export const supprimerQuestionFaq = (id: string) =>
  apiFetch<void>(`/admin/faq/${id}`, { method: 'DELETE' });

/**
 * Renvoie la LISTE COMPLÈTE des identifiants, dans le nouvel ordre.
 *
 * Le serveur refuse un envoi partiel : c'est sa façon de détecter qu'une
 * question a été ajoutée ou supprimée par quelqu'un d'autre pendant que cet
 * écran était ouvert.
 */
export const reordonnerFaq = (ids: string[]) =>
  apiFetch<void>('/admin/faq/ordre', {
    method: 'PUT',
    body: JSON.stringify({ ids: ids.map(Number) }),
  });
