import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UtilisateurAuthentifie } from '../../modules/auth/session.types';

/**
 * Injecte l'identité résolue par le `SessionGuard`.
 *
 * Le non-null est assumé : sur une route non marquée `@Public()`, le guard a
 * déjà refusé l'anonyme. Sur une route publique, ce décorateur n'a pas de sens.
 *
 * @example async maFiche(@Utilisateur() utilisateur: UtilisateurAuthentifie)
 */
export const Utilisateur = createParamDecorator(
  (_donnees: unknown, contexte: ExecutionContext): UtilisateurAuthentifie =>
    contexte.switchToHttp().getRequest<Request>().utilisateur!,
);
