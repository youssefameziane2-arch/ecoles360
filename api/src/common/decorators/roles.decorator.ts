import { SetMetadata } from '@nestjs/common';
import type { RoleCode } from '../../generated/prisma';

export const CLE_ROLES = 'ecoles360:roles';

/**
 * Restreint une route à certains rôles — livrable 11 §2, RG25.
 *
 * @example @Roles('superadmin')
 * @example @Roles('superadmin', 'commercial')
 */
export const Roles = (...roles: RoleCode[]): MethodDecorator & ClassDecorator =>
  SetMetadata(CLE_ROLES, roles);
