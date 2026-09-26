import { apiFetch } from './client';

/** Modération des avis — livrable 11 §3.3, RG06 à RG08. */

export type StatutAvis = 'en_attente' | 'publie' | 'rejete';

export const LIBELLE_STATUT_AVIS: Record<StatutAvis, string> = {
  en_attente: 'En attente',
  publie: 'Publié',
  rejete: 'Rejeté',
};

export const TON_STATUT_AVIS: Record<StatutAvis, 'amber' | 'green' | 'red'> = {
  en_attente: 'amber',
  publie: 'green',
  rejete: 'red',
};

export interface SignalementAvis {
  id: string;
  motif: string;
  statut: 'nouveau' | 'traite';
  signale_le: string;
}

export interface AvisModeration {
  id: string;
  auteur_nom: string;
  auteur_contact: string;
  note: number;
  commentaire: string;
  statut: StatutAvis;
  verifie: boolean;
  en_avant: boolean;
  decision_motif: string | null;
  reponse: string | null;
  depose_le: string;
  modere_le: string | null;
  etablissement: { id: string; nom: string; slug: string };
  moderateur: { name: string } | null;
  signalements: SignalementAvis[];
}

export const chargerAvisModeration = (statut?: StatutAvis) =>
  apiFetch<AvisModeration[]>(`/admin/avis${statut ? `?statut=${statut}` : ''}`);

export const deciderAvis = (id: string, decision: 'publie' | 'rejete', motif?: string) =>
  apiFetch<AvisModeration>(`/admin/avis/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(motif ? { decision, motif } : { decision }),
  });

export const mettreAvisEnAvant = (id: string, enAvant: boolean) =>
  apiFetch<void>(`/admin/avis/${id}/en-avant`, {
    method: 'PATCH',
    body: JSON.stringify({ en_avant: enAvant }),
  });
