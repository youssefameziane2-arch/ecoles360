import type { PermissionPortee, RoleCode } from '../../generated/prisma';

/**
 * Identité attachée à la requête par le SessionGuard — livrable 11 §2.
 *
 * « attache { userId, role, permissions[], etablissementId } à la requête »
 *
 * Elle est RECONSTRUITE à chaque requête depuis la base, jamais lue depuis le
 * cookie : c'est ce qui rend la révocation immédiate (RG25). Une permission
 * retirée, un compte suspendu ou un changement de rôle prennent effet à la
 * requête suivante, sans attendre l'expiration d'une session.
 */
export interface UtilisateurAuthentifie {
  userId: bigint;
  email: string;
  role: RoleCode;
  /** Portées déléguées NON révoquées (RG05) — vide hors secrétariat. */
  permissions: PermissionPortee[];
  /** Établissement rattaché — propriétaire ou secrétariat (RG25). */
  etablissementId: bigint | null;
}

/**
 * Charge utile réellement stockée dans Redis.
 *
 * Volontairement réduite à l'identifiant : tout le reste est rechargé à chaque
 * requête. Recopier le rôle ou les portées dans la session les figerait à
 * l'ouverture, et une révocation ne s'appliquerait qu'à la reconnexion.
 */
export interface SessionPassport {
  userId: string;
}

declare module 'express-session' {
  interface SessionData {
    passport?: { user?: SessionPassport };
    /** Jeton CSRF double-submit (livrable 11 §5). */
    csrf?: string;
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      utilisateur?: UtilisateurAuthentifie;
    }
  }
}
