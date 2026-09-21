import { HttpStatus, Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { AppException, ERROR_CODES } from '../../common/errors';
import { AuthService } from './auth.service';

/** Cookie portant le jeton CSRF — lisible par le JavaScript du front, délibérément. */
export const NOM_COOKIE_CSRF = 'ecoles360_csrf';

/** En-tête que le client doit renvoyer (livrable 12 §4). */
export const NOM_ENTETE_CSRF = 'x-csrf-token';

/** Méthodes sans effet de bord : rien à protéger. */
const METHODES_SURES = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Protection CSRF double-submit — livrable 11 §5, livrable 7 §6.
 *
 * « CSRF double-submit sur toute mutation POST / PATCH / PUT / DELETE. »
 *
 * LE PROBLÈME. Le cookie de session part automatiquement avec toute requête
 * vers notre domaine, y compris celles déclenchées depuis un site tiers. Un
 * formulaire caché sur une page malveillante pourrait donc poster vers
 * `/api/v1/admin/utilisateurs/42` avec la session de l'administrateur qui la
 * consulte.
 *
 * LA PARADE. Le même secret est écrit à deux endroits : la session côté serveur
 * et un cookie que le JavaScript peut lire. Le client doit le renvoyer en
 * en-tête. Un site tiers déclenche bien l'envoi du cookie — c'est le propre du
 * navigateur — mais il ne peut pas LIRE ce cookie, car la politique de même
 * origine l'en empêche. Il ne peut donc pas construire l'en-tête.
 *
 * La comparaison se fait à temps constant : sur une égalité de chaînes
 * ordinaire, le temps de réponse trahit le nombre de caractères devinés.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(requete: Request, _reponse: Response, suivant: NextFunction): void {
    if (METHODES_SURES.has(requete.method)) {
      return suivant();
    }

    // L'ouverture de session pose le jeton : elle ne peut pas le présenter.
    // Elle est protégée autrement — limitation de débit et, surtout, le fait
    // qu'une connexion forcée depuis un site tiers ne lui donne aucun accès.
    if (requete.path.endsWith('/auth/login')) {
      return suivant();
    }

    // Pas de session : il n'y a pas de cookie à détourner, donc pas de CSRF
    // possible. Les routes publiques en mutation (dépôt d'avis, demande de
    // contact) sont protégées par la limitation de débit (livrable 11 §5).
    const attendu = requete.session?.csrf;

    if (!attendu) {
      return suivant();
    }

    const recu = requete.get(NOM_ENTETE_CSRF);

    if (!recu || !AuthService.comparerEnTempsConstant(attendu, recu)) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        ERROR_CODES.ACCES_REFUSE,
        'Jeton de sécurité absent ou invalide. Rechargez la page et réessayez.',
      );
    }

    return suivant();
  }
}
