import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AppException, ERROR_CODES } from '../errors';
import { CLE_SCOPES } from '../decorators/scopes.decorator';
import { RoleCode, type PermissionPortee } from '../../generated/prisma';

/**
 * Contrôle de portée déléguée — livrable 11 §2, RG05.
 *
 * « Les portées secrétariat (fiches / contacts / avis) sont vérifiées CÔTÉ
 * SERVEUR à chaque requête, jamais seulement côté interface. »
 *
 * L'interface du secrétariat masque déjà les sections hors portée — c'est du
 * confort, pas une sécurité : l'URL reste tapable. Ce guard est le contrôle
 * réel, et le livrable 13 §4 le met à l'épreuve en accédant directement à
 * l'URL depuis le parcours de recette de Sara.
 *
 * Les portées ne s'appliquent qu'au SECRÉTARIAT (RG25). Les autres rôles ont un
 * périmètre fixe : leur accès se décide par `@Roles()`, pas ici. Un Super Admin
 * traverse donc ce contrôle sans porter aucune portée, parce que son périmètre
 * les englobe toutes — et parce que lui en accorder une serait refusé par
 * RoleGuard, un rôle à périmètre fixe n'acceptant pas de permission unitaire.
 */
@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexte: ExecutionContext): boolean {
    const requises = this.reflector.getAllAndOverride<PermissionPortee[]>(CLE_SCOPES, [
      contexte.getHandler(),
      contexte.getClass(),
    ]);

    if (!requises?.length) {
      return true;
    }

    const utilisateur = contexte.switchToHttp().getRequest<Request>().utilisateur;

    if (!utilisateur) {
      throw new AppException(HttpStatus.UNAUTHORIZED, ERROR_CODES.NON_AUTHENTIFIE);
    }

    if (utilisateur.role === RoleCode.superadmin) {
      return true;
    }

    // TOUTES les portées demandées, pas au moins une : une route qui exige
    // `fiches` ET `contacts` manipule les deux.
    const manquantes = requises.filter((portee) => !utilisateur.permissions.includes(portee));

    if (manquantes.length > 0) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        ERROR_CODES.ACCES_REFUSE,
        'Cette action requiert une permission qui ne vous a pas été accordée.',
        { portees_manquantes: manquantes },
      );
    }

    return true;
  }
}
