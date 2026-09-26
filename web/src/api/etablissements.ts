import { apiFetch, apiFetchPage } from './client';

/** Les six types du référentiel (RG02). */
export type TypeEtablissement =
  | 'creche'
  | 'primaire'
  | 'college'
  | 'lycee'
  | 'universite'
  | 'superieur'
  | 'formation';

/** Libellés français des types — vocabulaire des maquettes. */
export const LIBELLE_TYPE: Record<TypeEtablissement, string> = {
  creche: 'Crèche',
  primaire: 'Primaire',
  college: 'Collège',
  lycee: 'Lycée',
  universite: 'Université',
  superieur: 'École supérieure',
  formation: 'Centre de formation',
};

export interface EtablissementListe {
  id: string;
  slug: string;
  nom: string;
  type: TypeEtablissement;
  ville: { nom: string; slug: string };
  quartier: string | null;
  description: string | null;
  /** Décimal sérialisé en chaîne par l'API (livrable 11 §1). */
  note_moy: string;
  nb_avis: number;
  budget_min: number | null;
  budget_max: number | null;
  sponsorise: boolean;
  verifie: boolean;
  premium: boolean;
  /** Position approximative — publique dès la liste, alimente la carte des résultats. */
  lat: string | null;
  lng: string | null;
  /**
   * Canaux de contact, publics dès la liste.
   *
   * La maquette pose « appeler », « WhatsApp » et « site web » directement sur
   * la carte de résultat : les cacher obligerait à ouvrir la fiche pour
   * composer un numéro, ce que ces boutons existent justement pour éviter.
   */
  tel: string | null;
  whatsapp: string | null;
  site_web: string | null;
  /**
   * Étendue du groupe scolaire — « Crèche → Lycée ».
   *
   * Nul hors groupe, et nul aussi sous deux cycles : l'étiquette
   * « Crèche → Crèche » n'apprendrait rien.
   */
  groupe: {
    nom: string;
    slug: string;
    premier: TypeEtablissement;
    dernier: TypeEtablissement;
  } | null;
  photo: { chemin: string; alt: string | null } | null;
}

/** Un cycle du même groupe scolaire — puce du bandeau multi-cycles. */
export interface CycleFrere {
  nom: string;
  slug: string;
  type: TypeEtablissement;
  /** La fiche affichée — sa puce est pleine, et ne mène nulle part. */
  actif: boolean;
}

export interface EtablissementDetail extends EtablissementListe {
  /** Cycles frères, dans l'ordre de la scolarité. Vide hors groupe. */
  cycles: CycleFrere[];
  adresse: string | null;
  tel: string | null;
  whatsapp: string | null;
  email: string | null;
  chiffres: { label: string; valeur: string }[] | null;
  faq: { q: string; r: string }[] | null;
  horaires: Record<string, string> | null;
  socials: Record<string, string> | null;
  autres_projets: { type: string; nom: string; ville?: string; description?: string }[] | null;
  facilites: string[] | null;
  video_url: string | null;
  /** Vignette de la vidéo — à défaut, celle de YouTube est déduite du lien. */
  video_poster: string | null;
  langues: string | null;
  site_web: string | null;
  projet_pedagogique: string | null;
  gamme_label: string | null;
  photos: { chemin: string; alt: string | null }[];
  niveaux: { id: string; libelle: string; categorie: 'niveau' | 'filiere' }[];
}

export interface AvisPublic {
  id: string;
  auteur_nom: string;
  note: number;
  commentaire: string;
  verifie: boolean;
  en_avant: boolean;
  reponse: string | null;
  reponse_le: string | null;
  depose_le: string;
}

export interface Ville {
  id: string;
  nom: string;
  slug: string;
  region: string | null;
  /** Fiches validées uniquement (RG03) — jamais celles en attente ou suspendues. */
  nb_etablissements: number;
}

/** Les huit familles du référentiel de caractéristiques (RG02). */
export type CategorieCaracteristique =
  | 'niveau'
  | 'filiere'
  | 'langue'
  | 'activite'
  | 'matiere'
  | 'cursus'
  | 'domaine'
  | 'format';

export interface NiveauFiliere {
  id: string;
  libelle: string;
  categorie: CategorieCaracteristique;
}

/** Filtres de la barre de recherche — noms alignés sur le contrat (livrable 11 §1). */
export interface FiltresRecherche {
  q?: string;
  ville?: string;
  /**
   * Types cochés — plusieurs à la fois.
   *
   * La plupart des établissements marocains sont des groupes scolaires qui
   * couvrent la crèche, le primaire, le collège et le lycée. Un parent qui
   * cherche pour deux enfants coche plusieurs cycles ; le contraindre à un
   * seul type lui ferait faire quatre recherches.
   */
  type?: TypeEtablissement[];
  niveaux?: string[];
  budget_min?: number;
  budget_max?: number;
  note_min?: number;
  tri?: 'note' | 'recent' | 'nom';
  page?: number;
  per_page?: number;
}

/**
 * Sérialise les filtres en chaîne de requête.
 *
 * Les valeurs vides sont omises plutôt qu'envoyées vides : `?ville=` serait
 * rejeté par la validation, et l'URL resterait illisible pour un visiteur qui
 * la partage.
 */
export function versQuery(filtres: FiltresRecherche): string {
  const params = new URLSearchParams();

  for (const [cle, valeur] of Object.entries(filtres)) {
    if (valeur === undefined || valeur === null || valeur === '') continue;
    params.set(cle, Array.isArray(valeur) ? valeur.join(',') : String(valeur));
  }

  const chaine = params.toString();
  return chaine ? `?${chaine}` : '';
}

export const rechercherEtablissements = (filtres: FiltresRecherche) =>
  apiFetchPage<EtablissementListe>(`/etablissements${versQuery(filtres)}`);

export const chargerEtablissement = (slug: string) =>
  apiFetch<EtablissementDetail>(`/etablissements/${slug}`);

/** Trois établissements comparables — même type, même ville d'abord. */
export const chargerSimilaires = (slug: string) =>
  apiFetch<EtablissementListe[]>(`/etablissements/${slug}/similaires`);

export const chargerAvis = (slug: string, page = 1) =>
  apiFetchPage<AvisPublic>(`/etablissements/${slug}/avis?page=${page}`);

/** Agrégats d'une ville — alimente la page `/villes/:slug`. */
export interface VilleDetail extends Ville {
  /** Moyenne des fiches validées, en chaîne comme tous les décimaux (livrable 11 §1). */
  note_moyenne: string | null;
  par_type: { type: TypeEtablissement; total: number }[];
  quartiers: string[];
}

export const chargerVilles = () => apiFetch<Ville[]>('/villes');

export const chargerVille = (slug: string) => apiFetch<VilleDetail>(`/villes/${slug}`);

export const chargerNiveauxFilieres = () => apiFetch<NiveauFiliere[]>('/niveau-filieres');

/**
 * Familles de filtres proposées selon le type d'établissement.
 *
 * Reprise de `TYPE_FILTER_KEYS` dans la maquette. Un parent qui cherche une
 * crèche n'a que faire des filières d'ingénierie ; à l'inverse, le centre de
 * formation se filtre par domaine et par format, pas par matière scolaire.
 *
 * SANS TYPE CHOISI, on retombe sur langues et activités : ce sont les deux
 * familles communes à tous les types, celles qu'on peut poser sans savoir ce
 * qu'on cherche.
 */
export const FAMILLES_PAR_TYPE: Record<TypeEtablissement, CategorieCaracteristique[]> = {
  creche: ['langue', 'activite'],
  primaire: ['matiere', 'activite'],
  college: ['langue', 'activite'],
  lycee: ['langue', 'activite', 'filiere'],
  universite: ['langue', 'activite', 'filiere', 'cursus'],
  superieur: ['langue', 'activite', 'filiere', 'cursus'],
  formation: ['langue', 'format', 'domaine'],
};

export const FAMILLES_PAR_DEFAUT: CategorieCaracteristique[] = ['langue', 'activite'];

/** Intitulé de rangée, tel qu'il s'affiche à gauche des puces. */
export const LIBELLE_FAMILLE: Record<CategorieCaracteristique, string> = {
  niveau: 'Niveaux',
  filiere: 'Filière',
  langue: 'Langues',
  activite: 'Activités',
  matiere: 'Matières',
  cursus: 'Cursus',
  domaine: 'Domaine',
  format: 'Format',
};

export const deposerAvis = (
  slug: string,
  avis: { auteur_nom: string; auteur_contact: string; note: number; commentaire: string },
) =>
  apiFetch<{ id: string; statut: string }>(`/etablissements/${slug}/avis`, {
    method: 'POST',
    body: JSON.stringify(avis),
  });

/** `POST /avis/{id}/signalements` — RG07. L'avis quitte l'affichage public à la décision de modération. */
export const signalerAvis = (avisId: string, signalement: { motif: string; contact?: string }) =>
  apiFetch<void>(`/avis/${avisId}/signalements`, {
    method: 'POST',
    body: JSON.stringify(signalement),
  });

export const envoyerDemandeContact = (
  slug: string,
  demande: {
    parent_nom: string;
    parent_tel: string;
    message?: string;
    canal: 'formulaire' | 'appel' | 'whatsapp';
    consentement: boolean;
  },
) =>
  apiFetch<{ id: string }>(`/etablissements/${slug}/demandes-contact`, {
    method: 'POST',
    body: JSON.stringify(demande),
  });

/**
 * Trace une interaction — RG10.
 *
 * Volontairement « au mieux » : un échec de télémétrie ne doit jamais
 * interrompre la navigation d'un parent ni faire apparaître d'erreur.
 */
export function tracerEvenement(
  slug: string,
  type: 'appel' | 'whatsapp' | 'vue' | 'vue_sponsorisee',
  source?: 'resultats' | 'fiche' | 'une',
): void {
  void apiFetch(`/etablissements/${slug}/evenements`, {
    method: 'POST',
    body: JSON.stringify({ type, source }),
  }).catch(() => undefined);
}
