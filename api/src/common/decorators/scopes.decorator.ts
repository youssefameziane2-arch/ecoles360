import { SetMetadata } from '@nestjs/common';
import type { PermissionPortee } from '../../generated/prisma';

export const CLE_SCOPES = 'ecoles360:scopes';

/**
 * Exige une portée déléguée — livrable 11 §2, RG05.
 *
 * Les portées ne concernent que le secrétariat : les trois autres rôles ont un
 * périmètre fixe (RG25). Un Super Admin traverse ce contrôle sans portée, parce
 * que son périmètre les englobe toutes.
 *
 * @example @Scopes('contacts')
 */
export const Scopes = (...portees: PermissionPortee[]): MethodDecorator & ClassDecorator =>
  SetMetadata(CLE_SCOPES, portees);
