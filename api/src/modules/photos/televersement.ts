/**
 * Réglages communs aux deux points d'entrée de téléversement.
 *
 * L'admin (`/admin/etablissements/:id/photos`) et l'espace établissement
 * (`/mon-espace/fiche/photos`) acceptent EXACTEMENT les mêmes envois — même
 * nombre de fichiers, même schéma OpenAPI. Les recopier dans chaque
 * controller, c'est accepter qu'un jour l'un plafonne à douze et l'autre à
 * vingt sans que personne ne l'ait décidé.
 */

/**
 * Nombre de photos acceptées en un seul envoi.
 *
 * La galerie n'est pas plafonnée à douze — c'est la REQUÊTE qui l'est. Un
 * établissement qui en dépose trente le fera en trois fois, et chaque envoi
 * reste assez court pour qu'un réseau marocain moyen n'expire pas en route.
 */
export const PHOTOS_PAR_ENVOI = 12;

/** Schémas OpenAPI des envois multipart — Swagger ne les déduit pas des décorateurs. */
export const FORMULAIRE_PHOTOS = {
  type: 'object',
  properties: {
    photos: { type: 'array', items: { type: 'string', format: 'binary' } },
  },
} as const;

export const FORMULAIRE_PHOTO = {
  type: 'object',
  properties: { photo: { type: 'string', format: 'binary' } },
} as const;
