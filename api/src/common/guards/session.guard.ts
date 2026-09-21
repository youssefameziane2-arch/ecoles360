import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AppException, ERROR_CODES } from '../errors';
import { CLE_PUBLIC } from '../decorators/public.decorator';
import { AuthService } from '../../modules/auth/auth.service';

/**
 * Garde de session globale — livrable 11 §2.
 *
 * « Un SessionGuard enregistré globalement (APP_GUARD) résout la session
 * Passport, refuse l'anonyme partout sauf sur les routes marquées @Public(),
 * rejette les comptes suspendu (403, RG25) et attache { userId, role,
 * permissions[], etablissementId } à la requête. »
 *
 * FERMÉ PAR DÉFAUT. C'est le point le plus important de ce fichier : une route
 * ajoutée sans réflexion est protégée, pas exposée. L'oubli d'un `@Public()`
 * rend une page publique inaccessible — on le voit immédiatement. L'oubli
 * inverse, dans un modèle ouvert par défaut, publierait des données sans que
 * rien ne l'annonce.
 *
 * L'IDENTITÉ EST RECHARGÉE à chaque requête, jamais lue depuis le cookie :
 * c'est ce qui fait qu'une portée révoquée ou un compte suspendu prennent effet
 * à la requête suivante (RG05, RG25), sans attendre la fin de la session.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(contexte: ExecutionContext): Promise<boolean> {
    const estPublic = this.reflector.getAllAndOverride<boolean>(CLE_PUBLIC, [
      contexte.getHandler(),
      contexte.getClass(),
    ]);

    const requete = contexte.switchToHttp().getRequest<Request>();

    // Une route publique résout quand même l'identité si une session existe :
    // le site public affiche « Mon espace » à un utilisateur déjà connecté, et
    // une fiche peut être servie différemment à son propriétaire.
    if (estPublic) {
      await this.attacherIdentiteSiPossible(requete);
      return true;
    }

    const identifiant = requete.session?.passport?.user?.userId;

    if (!identifiant) {
      throw new AppException(HttpStatus.UNAUTHORIZED, ERROR_CODES.NON_AUTHENTIFIE);
    }

    const userId = BigInt(identifiant);

    // Compte suspendu ou supprimé : 403, et la session est détruite dans la
    // foulée. La laisser vivre obligerait à refaire ce contrôle à chaque
    // requête d'un compte qui n'a plus aucun droit.
    if (!(await this.auth.compteActif(userId))) {
      await this.detruireSession(requete);

      throw new AppException(
        HttpStatus.FORBIDDEN,
        ERROR_CODES.ACCES_REFUSE,
        'Votre compte a été suspendu. Contactez un administrateur.',
      );
    }

    requete.utilisateur = await this.auth.chargerIdentite(userId);

    return true;
  }

  private async attacherIdentiteSiPossible(requete: Request): Promise<void> {
    const identifiant = requete.session?.passport?.user?.userId;

    if (!identifiant) {
      return;
    }

    try {
      const userId = BigInt(identifiant);

      if (await this.auth.compteActif(userId)) {
        requete.utilisateur = await this.auth.chargerIdentite(userId);
      }
    } catch {
      // Sur une route publique, une session illisible ne doit rien casser :
      // le visiteur est simplement traité comme anonyme.
    }
  }

  private async detruireSession(requete: Request): Promise<void> {
    await new Promise<void>((resoudre) => {
      requete.session?.destroy(() => resoudre());
    });
  }
}
