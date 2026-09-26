import { apiFetch } from './client';

/** Avis mis en avant sur l'accueil — RG27, sélection de l'administrateur. */
export interface AvisEnAvant {
  id: string;
  auteur_nom: string;
  note: number;
  commentaire: string;
  depose_le: string;
  etablissement: { nom: string; slug: string };
}

export const chargerAvisEnAvant = () => apiFetch<AvisEnAvant[]>('/avis/en-avant');
