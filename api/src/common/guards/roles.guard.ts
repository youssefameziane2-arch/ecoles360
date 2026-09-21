import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AppException, ERROR_CODES } from '../errors';
import { CLE_ROLES } from '../decorators/roles.decorator';
import type { RoleCode } from '../../generated/prisma';

/**
 * Contrôle de rôle — livrable 11 §2, RG25.
 *
 * Lit les métadonnées posées par `@Roles()` au niveau de la route ou du
 * controller. Sans décorateur, la route est ouverte à tout compte authentifié :
 * le `SessionGuard` a déjà refusé l'anonyme, et beaucoup de routes de
 * `/mon-espace` n'ont pas d'exigence de rôle au-delà de ça.
 *
 * Aucun rôle n'est privilégié ici — le Super Admin n'est pas traité à part,
 * parce que « superadmin » figure explicitement dans les `@Roles()` des routes
 * qui le concernent. Un raccourci du type « superadmin passe partout » rendrait
 * impossible d'écrire une route interdite au Super Admin, or il en existe :
 * RG23 lui refuse le détail nominatif des leads.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexte: ExecutionContext): boolean {
    const requis = this.reflector.getAllAndOverride<RoleCode[]>(CLE_ROLES, [
      contexte.getHandler(),
      contexte.getClass(),
    ]);

    if (!requis?.length) {
      return true;
    }

    const utilisateur = contexte.switchToHttp().getRequest<Request>().utilisateur;

    if (!utilisateur || !requis.includes(utilisateur.role)) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        ERROR_CODES.ACCES_REFUSE,
        "Votre rôle ne vous permet pas d'accéder à cette ressource.",
      );
    }

    return true;
  }
}
