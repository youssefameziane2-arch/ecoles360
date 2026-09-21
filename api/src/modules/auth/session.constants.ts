import type { ConfigService } from '@nestjs/config';

/** Préfixe des clés de session dans Redis, à défaut de `SESSION_PREFIX`. */
export const PREFIXE_SESSION_PAR_DEFAUT = 'ecoles360:sess:';

/**
 * Préfixe effectif des clés de session — SOURCE UNIQUE.
 *
 * Deux endroits en dépendent : le magasin `connect-redis` qui ÉCRIT les
 * sessions, et le balayage de `AuthService.revoquerSessions` qui les DÉTRUIT
 * (RG25). Les configurer séparément fonctionnait tant que les deux chaînes
 * coïncidaient — et le jour où elles divergeaient, la révocation ne trouvait
 * plus rien à supprimer. Sans erreur, sans journal : les sessions d'un compte
 * suspendu seraient restées actives, et personne ne l'aurait su.
 *
 * Les faire dériver d'ici rend cette divergence impossible.
 */
export function prefixeSession(config: ConfigService): string {
  return config.get<string>('SESSION_PREFIX', PREFIXE_SESSION_PAR_DEFAUT);
}
