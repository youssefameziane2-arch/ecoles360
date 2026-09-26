import { apiFetch } from './client';

/** Conseiller commercial joignable — bannière d'aide du site public. */
export interface Conseiller {
  id: string;
  nom: string;
  telephone: string;
}

export const chargerConseillers = () => apiFetch<Conseiller[]>('/conseillers');
