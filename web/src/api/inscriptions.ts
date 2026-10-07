import { apiFetch } from './client';
import type { TypeEtablissement } from './etablissements';

/**
 * Formules proposées — libellés de la maquette `isInscription` (`insPlanOpts`).
 *
 * LA MÊME LISTE QUE LE DTO SERVEUR, aux mêmes mots près : l'API les refuse
 * hors de cette liste (422). Les faire diverger d'un caractère rendrait le
 * formulaire infranchissable sans que rien ne l'explique au visiteur.
 */
export const FORMULES = [
  'Essai gratuit 1 mois',
  'Abonnement mensuel',
  'Abonnement annuel −10 %',
  'Paiement à la vue',
  'À définir avec un conseiller',
] as const;

export type Formule = (typeof FORMULES)[number];

export interface DemandeInscription {
  etablissement_nom: string;
  ville?: string;
  type_vise?: TypeEtablissement;
  contact_nom: string;
  contact_fonction?: string;
  telephone: string;
  email?: string;
  formule_visee?: Formule;
  message?: string;
  consentement: boolean;
}

export interface AccuseInscription {
  recue_le: string;
  message: string;
}

/**
 * `POST /inscriptions` — demande de référencement.
 *
 * Trois par heure et par adresse : au-delà, l'API répond 429. L'écran le dit
 * plutôt que d'afficher une erreur technique — un directeur qui s'y reprend à
 * deux fois ne doit pas croire que le site est cassé.
 */
export const deposerInscription = (demande: DemandeInscription) =>
  apiFetch<AccuseInscription>('/inscriptions', {
    method: 'POST',
    body: JSON.stringify(demande),
  });
