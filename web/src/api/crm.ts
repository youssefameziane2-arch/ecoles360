import { apiFetch } from './client';

/**
 * CRM commercial d'écoles360 — prospects, relances, commissions (RG17, RG18).
 *
 * UNE SEULE SÉRIE DE ROUTES POUR DEUX ÉCRANS. « CRM Clients » côté
 * administration et « Mes leads » côté commercial lisent les mêmes prospects :
 * c'est le serveur qui borne au portefeuille selon le rôle de la session. Le
 * front n'envoie donc aucun filtre de propriété — il ne saurait pas le faire
 * honnêtement, et un filtre côté client ne protège rien.
 */

export type StatutProspect =
  | 'nouveau'
  | 'a_contacter'
  | 'chaud'
  | 'relance'
  | 'transforme'
  | 'perdu';

export const LIBELLE_STATUT_PROSPECT: Record<StatutProspect, string> = {
  nouveau: 'Nouveau',
  a_contacter: 'À contacter',
  chaud: 'Chaud',
  relance: 'En relance',
  transforme: 'Transformé',
  perdu: 'Perdu',
};

export const TON_STATUT_PROSPECT: Record<StatutProspect, string> = {
  nouveau: '#1D3557',
  a_contacter: '#E9A23B',
  chaud: '#C42B38',
  relance: '#7B5BA6',
  transforme: '#1F7A45',
  perdu: '#9AA3AF',
};

export type StatutCommission = 'a_valider' | 'validee' | 'reglee';

export interface RelanceProspect {
  id: string;
  note: string | null;
  prevue_le: string | null;
  effectuee_le: string | null;
  commercial: { name: string } | null;
}

export interface Prospect {
  id: string;
  etablissement_nom: string;
  ville: string | null;
  type_vise: string | null;
  contact_nom: string;
  contact_fonction: string | null;
  telephone: string;
  email: string | null;
  formule_visee: string | null;
  message: string | null;
  source: 'formulaire' | 'telephone' | 'manuel';
  statut_pipeline: StatutProspect;
  cree_le: string;
  etablissement: { id: string; nom: string; slug: string; statut: string } | null;
  commercial: { id: string; name: string } | null;
  relances: RelanceProspect[];
}

export interface ColonnePipeline {
  statut: StatutProspect;
  prospects: Prospect[];
}

export interface IndicateursCrm {
  total: number;
  en_cours: number;
  transformes: number;
  perdus: number;
  /** `null` tant qu'aucun dossier n'est clos — 0 % affirmerait un échec. */
  taux_transformation: number | null;
  /** Prospects jamais ouverts — la pastille du menu « CRM Clients » (B-46). */
  nouveaux: number;
  relances_dues: number;
  commissions_a_valider: string;
  commissions_validees: string;
  commissions_reglees: string;
}

export interface RelanceDue {
  id: string;
  note: string | null;
  prevue_le: string;
  prospect: {
    id: string;
    etablissement_nom: string;
    contact_nom: string;
    telephone: string;
    statut_pipeline: StatutProspect;
  };
  commercial: { id: string; name: string } | null;
}

export interface CommissionCrm {
  id: string;
  taux_pct: string;
  montant_mad: string;
  statut: StatutCommission;
  validee_le: string | null;
  commercial: { id: string; name: string } | null;
  facture: {
    id: string;
    numero: string;
    total_ttc: string;
    statut_paiement: 'non_payee' | 'payee';
    emise_le: string;
    etablissement: { nom: string; slug: string };
  };
}

export interface CommercialAdmin {
  id: string;
  name: string;
  email: string;
  telephone: string | null;
  statut: 'actif' | 'suspendu';
  cree_le: string;
  prospects: number;
  transformes: number;
  perdus: number;
  relances_dues: number;
  commissions: number;
  commissions_mad: string;
}

export const chargerIndicateursCrm = () => apiFetch<IndicateursCrm>('/crm/indicateurs');

export const chargerPipeline = () => apiFetch<ColonnePipeline[]>('/crm/pipeline');

export const chargerRelancesDues = () => apiFetch<RelanceDue[]>('/crm/relances');

export const chargerCommissions = () => apiFetch<CommissionCrm[]>('/crm/commissions');

/** « transformé » n'est pas posable ici : il se pose en créant la fiche. */
export const changerStatutProspect = (id: string, statut: StatutProspect) =>
  apiFetch<void>(`/crm/prospects/${id}/statut`, {
    method: 'PATCH',
    body: JSON.stringify({ statut }),
  });

export const ajouterRelance = (
  prospectId: string,
  saisie: { note?: string; prevue_le?: string; effectuee?: boolean },
) =>
  apiFetch<RelanceProspect>(`/crm/prospects/${prospectId}/relances`, {
    method: 'POST',
    body: JSON.stringify(saisie),
  });

export const effectuerRelance = (id: string) =>
  apiFetch<void>(`/crm/relances/${id}/effectuee`, { method: 'PATCH' });

// --- Réservé à la Direction (RG18) ------------------------------------------

export const chargerCommerciaux = () => apiFetch<CommercialAdmin[]>('/admin/commerciaux');

/** `null` rend le dossier au pot commun — un départ, par exemple. */
export const assignerProspect = (prospectId: string, commercialId: string | null) =>
  apiFetch<void>(`/admin/crm/prospects/${prospectId}/commercial`, {
    method: 'PATCH',
    body: JSON.stringify({ commercial_id: commercialId === null ? null : Number(commercialId) }),
  });
