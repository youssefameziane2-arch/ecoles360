import { apiFetch } from './client';
import type { TypeEtablissement } from './etablissements';

/** Campagnes de sponsoring — livrable 11 §3.4, RG19. */

export type NiveauSponsoring = 'premium' | 'gold' | 'silver';

export const LIBELLE_NIVEAU: Record<NiveauSponsoring, string> = {
  premium: 'Premium',
  gold: 'Gold',
  silver: 'Silver',
};

/** Teinte du badge — la hiérarchie doit se lire d'un coup d'œil. */
export const TON_NIVEAU: Record<NiveauSponsoring, 'red' | 'amber' | 'grey'> = {
  premium: 'red',
  gold: 'amber',
  silver: 'grey',
};

export interface Sponsoring {
  id: string;
  niveau: NiveauSponsoring;
  categorie: TypeEtablissement | null;
  mot_cle: string | null;
  debut: string;
  fin: string;
  tarif_mad: string;
  etablissement: { id: string; nom: string; slug: string };
  ville: { nom: string; slug: string } | null;
}

export interface NouvelleCampagne {
  etablissement_id: number;
  niveau: NiveauSponsoring;
  ville_id?: number;
  categorie?: TypeEtablissement;
  mot_cle?: string;
  debut: string;
  fin: string;
  tarif_mad: number;
}

export const chargerSponsorings = () => apiFetch<Sponsoring[]>('/admin/sponsorings');

export const creerSponsoring = (campagne: NouvelleCampagne) =>
  apiFetch<Sponsoring>('/admin/sponsorings', {
    method: 'POST',
    body: JSON.stringify(campagne),
  });

export const arreterSponsoring = (id: string) =>
  apiFetch<void>(`/admin/sponsorings/${id}`, { method: 'DELETE' });

/** Une campagne court-elle aujourd'hui ? — même test que le serveur. */
export function estActive(campagne: Sponsoring): boolean {
  const aujourdhui = new Date().toISOString().slice(0, 10);

  return campagne.debut.slice(0, 10) <= aujourdhui && campagne.fin.slice(0, 10) >= aujourdhui;
}
