/**
 * Dictionnaire des codes d'erreur et de leurs messages français.
 *
 * Livrable 11 §1 — « Format d'erreur uniforme :
 *   { "code": "plafond_vue_atteint", "message": "…", "details": { } }
 *   messages en français, exploitables tels quels par l'UI (toasts, états vides
 *   du design system). »
 *
 * Deux règles tiennent ce fichier :
 *   1. le `code` est le contrat machine — stable, en snake_case, JAMAIS traduit
 *      ni renommé une fois publié : le front s'en sert pour router l'affichage
 *      (livrable 13 §3 : « 409 reponse_existante affiché tel quel ») ;
 *   2. le `message` est le contrat humain — français (Maroc), vouvoiement,
 *      affichable sans reformulation.
 *
 * Les codes métier (plafond_vue_atteint, facture_non_payee, reponse_existante,
 * proposition_deja_en_attente…) sont ajoutés ici par le lot qui les introduit.
 */

/** Codes transverses, produits par le socle lui-même. */
export const ERROR_CODES = {
  /** 401 — aucune session valide. */
  NON_AUTHENTIFIE: 'non_authentifie',
  /** 403 — rôle ou portée insuffisants. */
  ACCES_REFUSE: 'acces_refuse',
  /** 404 — ressource inexistante, ou fiche non validée (RG03). */
  RESSOURCE_INTROUVABLE: 'ressource_introuvable',
  /** 405 — méthode non autorisée sur la ressource. */
  METHODE_NON_AUTORISEE: 'methode_non_autorisee',
  /** 409 — conflit métier générique. */
  CONFLIT_METIER: 'conflit_metier',
  /** 422 — échec de validation d'un DTO class-validator. */
  VALIDATION_ECHOUEE: 'validation_echouee',
  /** 429 — plafond de limitation de débit atteint. */
  TROP_DE_REQUETES: 'trop_de_requetes',
  /** 500 — défaillance non prévue ; le détail reste côté serveur. */
  ERREUR_INTERNE: 'erreur_interne',
  /** 503 — une dépendance de l'API est indisponible (sonde de santé). */
  SERVICE_INDISPONIBLE: 'service_indisponible',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Message par défaut de chaque code. Un service peut fournir un message plus
 * précis à la construction de l'exception ; à défaut, c'est celui-ci qui part.
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.NON_AUTHENTIFIE]: 'Vous devez être connecté pour accéder à cette ressource.',
  [ERROR_CODES.ACCES_REFUSE]: "Vous n'avez pas les droits nécessaires pour cette action.",
  [ERROR_CODES.RESSOURCE_INTROUVABLE]: "La ressource demandée n'existe pas.",
  [ERROR_CODES.METHODE_NON_AUTORISEE]: "Cette méthode n'est pas autorisée sur cette ressource.",
  [ERROR_CODES.CONFLIT_METIER]: "L'opération est en conflit avec l'état actuel de la ressource.",
  [ERROR_CODES.VALIDATION_ECHOUEE]: 'Les données envoyées sont invalides.',
  [ERROR_CODES.TROP_DE_REQUETES]: 'Trop de requêtes. Merci de réessayer dans un instant.',
  [ERROR_CODES.ERREUR_INTERNE]: "Une erreur interne est survenue. L'incident a été enregistré.",
  [ERROR_CODES.SERVICE_INDISPONIBLE]: 'Une dépendance du service est indisponible.',
};

/**
 * Code par défaut associé à un statut HTTP, pour les exceptions Nest levées
 * sans code métier (NotFoundException, ForbiddenException…).
 *
 * Statuts du livrable 11 §1 : 401 · 403 · 404 · 409 · 422 · 429.
 */
export const DEFAULT_CODE_BY_STATUS: Readonly<Record<number, ErrorCode>> = {
  401: ERROR_CODES.NON_AUTHENTIFIE,
  403: ERROR_CODES.ACCES_REFUSE,
  404: ERROR_CODES.RESSOURCE_INTROUVABLE,
  405: ERROR_CODES.METHODE_NON_AUTORISEE,
  409: ERROR_CODES.CONFLIT_METIER,
  422: ERROR_CODES.VALIDATION_ECHOUEE,
  429: ERROR_CODES.TROP_DE_REQUETES,
  503: ERROR_CODES.SERVICE_INDISPONIBLE,
};
