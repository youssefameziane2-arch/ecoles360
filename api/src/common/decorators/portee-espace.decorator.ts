import { SetMetadata } from '@nestjs/common';
import type { PermissionPortee } from '../../generated/prisma';

export const CLE_PORTEE_ESPACE = 'ecoles360:portee-espace';

/**
 * Exige une portée sur une route de l'espace connecté — livrable 11 §2, RG05.
 *
 * DIFFÈRE DE `@Scopes()` sur un point précis : `@Scopes()` s'applique à
 * n'importe quel rôle non-superadmin, alors qu'ici seul le SECRÉTARIAT est
 * soumis au contrôle de portée. Un compte établissement a un périmètre fixe
 * sur sa propre fiche (RG25) — il n'a jamais de ligne `Permission`, et lui
 * exiger une portée le bloquerait sur sa propre ressource.
 *
 * @example @PorteeEspace('fiches')
 */
export const PorteeEspace = (portee: PermissionPortee): MethodDecorator & ClassDecorator =>
  SetMetadata(CLE_PORTEE_ESPACE, portee);
