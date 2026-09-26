/// <reference types="vite/client" />

/**
 * Variables d'environnement lues par le front.
 *
 * VITE N'EXPOSE QUE CE QUI EST PRÉFIXÉ `VITE_`, et tout ce qui l'est PART DANS
 * LE BUNDLE, donc devient public. Aucun secret ne doit figurer ici : le mot de
 * passe de la base, la clé de session et les jetons vivent côté serveur, dans
 * le `.env` de l'API.
 *
 * Les déclarer ici plutôt que de lire `import.meta.env` à l'aveugle donne deux
 * choses : l'autocomplétion, et une erreur de compilation le jour où une
 * variable est renommée sans que tous ses usages suivent.
 */
interface ImportMetaEnv {
  /**
   * Numéro du conseiller affiché sur la bannière d'aide du site public, et
   * utilisé pour les liens `tel:` et WhatsApp.
   *
   * Absent, le repli est le numéro de la maquette — qui appartient à une
   * personne réelle. Voir `web/.env.example`.
   */
  readonly VITE_TELEPHONE_CONSEILLER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
