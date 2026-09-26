import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AppException, ERROR_CODES } from '../errors';
import { CLE_PORTEE_ESPACE } from '../decorators/portee-espace.decorator';
import { RoleCode, type PermissionPortee } from '../../generated/prisma';

/**
 * Contrôle d'accès à l'espace connecté — livrable 11 §2, RG05, RG25.
 *
 * Trois cas, dans cet ordre :
 *
 *   1. ÉTABLISSEMENT — périmètre fixe sur sa propre fiche, jamais de portée à
 *      vérifier (RG25). C'est le propriétaire ; la portée n'a de sens que
 *      pour un accès délégué.
 *   2. SECRÉTARIAT — l'accès dépend de la portée déléguée et non révoquée
 *      (RG05). Sans elle, refus explicite plutôt qu'un silence qui laisserait
 *      croire à une erreur serveur.
 *   3. Tout autre rôle — n'a rien à faire sur `/espace/*` ; `@Roles()` filtre
 *      déjà en amont, ce cas ne devrait être atteint que si une route oublie
 *      de le poser.
 *
 * Applique aussi la règle RG25 « secrétariat toujours rattaché » : un compte
 * établissement ou secrétariat sans `etablissementId` est une incohérence de
 * données, pas un refus d'accès — elle est signalée distinctement.
 */
@Injectable()
export class PorteeEspaceGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexte: ExecutionContext): boolean {
    const portee = this.reflector.getAllAndOverride<PermissionPortee>(CLE_PORTEE_ESPACE, [
      contexte.getHandler(),
      contexte.getClass(),
    ]);

    const utilisateur = contexte.switchToHttp().getRequest<Request>().utilisateur;

    if (!utilisateur) {
      throw new AppException(HttpStatus.UNAUTHORIZED, ERROR_CODES.NON_AUTHENTIFIE);
    }

    if (!utilisateur.etablissementId) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        ERROR_CODES.ACCES_REFUSE,
        "Votre compte n'est rattaché à aucun établissement.",
      );
    }

    if (utilisateur.role === RoleCode.etablissement) {
      return true;
    }

    if (utilisateur.role === RoleCode.secretariat) {
      if (portee && !utilisateur.permissions.includes(portee)) {
        throw new AppException(
          HttpStatus.FORBIDDEN,
          ERROR_CODES.ACCES_REFUSE,
          'Cette action requiert une permission qui ne vous a pas été accordée.',
          { portees_manquantes: [portee] },
        );
      }
      return true;
    }

    throw new AppException(HttpStatus.FORBIDDEN, ERROR_CODES.ACCES_REFUSE);
  }
}
