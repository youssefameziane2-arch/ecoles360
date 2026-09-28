import { apiFetch } from './client';

/** Pages éditoriales pilotées depuis le back-office — livrable 11 §3.7. */

export interface ValeurAPropos {
  titre: string;
  texte: string;
}

/** `texte` : paragraphes séparés par une ligne vide. */
export interface EngagementAPropos {
  titre: string;
  texte: string;
}

export interface MembreEquipe {
  nom: string;
  role: string;
}

export interface CoordonneesAPropos {
  email: string;
  telephone: string;
  adresse: string;
  whatsapp?: string;
  horaires?: string;
}

export interface BlocsAPropos {
  accroche: string;
  mission: string;
  /** Paragraphes séparés par une ligne vide. */
  histoire: string;
  valeurs: ValeurAPropos[];
  engagements: EngagementAPropos[];
  equipe: MembreEquipe[];
  coordonnees: CoordonneesAPropos;
}

export interface PageAPropos {
  cle: 'a-propos';
  titre: string;
  /**
   * PARTIELLE PAR PRUDENCE : une base semée avant l'ajout d'un bloc peut ne pas
   * le porter encore. L'écran masque ce qui manque au lieu de planter.
   */
  blocs: Partial<BlocsAPropos>;
  modifiee_le: string | null;
}

export const chargerPageAPropos = () => apiFetch<PageAPropos>('/contenu/pages/a-propos');

/** La page entière : un bloc absent du corps disparaît du site. */
export const publierPageAPropos = (page: { titre: string; blocs: BlocsAPropos }) =>
  apiFetch<PageAPropos>('/admin/pages/a-propos', { method: 'PUT', body: JSON.stringify(page) });

/** Découpe un texte en paragraphes — une ligne vide les sépare. */
export const paragraphes = (texte: string | undefined) =>
  (texte ?? '')
    .split(/\n\s*\n/)
    .map((paragraphe) => paragraphe.trim())
    .filter(Boolean);
