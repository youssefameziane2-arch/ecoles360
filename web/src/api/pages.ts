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

// -----------------------------------------------------------------------------
//  Pages légales — loi 09-08 (RG09)
// -----------------------------------------------------------------------------

export const CLES_LEGALES = ['mentions-legales', 'confidentialite', 'cookies'] as const;

export type CleLegale = (typeof CLES_LEGALES)[number];

export interface SectionLegale {
  titre: string;
  corps: string;
}

export interface PageLegale {
  cle: CleLegale;
  titre: string;
  blocs: { sections?: SectionLegale[] };
  modifiee_le: string | null;
}

export const chargerPageLegale = (cle: CleLegale) => apiFetch<PageLegale>(`/contenu/pages/${cle}`);

/** La page entière : une section absente du corps disparaît du site. */
export const publierPageLegale = (
  cle: CleLegale,
  page: { titre: string; sections: SectionLegale[] },
) =>
  apiFetch<PageLegale>(`/admin/pages/legales/${cle}`, {
    method: 'PUT',
    body: JSON.stringify(page),
  });

/**
 * Le semis pose le plan des rubriques, jamais le texte : il marque chaque
 * section d'un `[à compléter …]`. Ce test dit qu'une page n'est pas prête à
 * partir en ligne — l'écran d'administration s'en sert pour le signaler.
 */
export const aCompleter = (page: PageLegale | undefined) =>
  (page?.blocs.sections ?? []).some((section) => section.corps.includes('[à compléter'));
