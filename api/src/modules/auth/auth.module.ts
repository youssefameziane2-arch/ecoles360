import { Global, type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard, ScopesGuard, SessionGuard } from '../../common/guards';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CsrfMiddleware } from './csrf.middleware';
import { LocalStrategy, SessionSerializer } from './strategies';

/**
 * Authentification et autorisation — livrable 11 §2.
 *
 * Global : `SessionGuard` est enregistré en `APP_GUARD` et a besoin
 * d'`AuthService` sur toutes les routes de l'application, y compris celles des
 * modules métier qui n'importeront jamais ce module explicitement.
 *
 * L'ORDRE DES TROIS GUARDS EST SIGNIFIANT. Nest les exécute dans l'ordre de
 * déclaration :
 *
 *   1. SessionGuard  — qui êtes-vous ? (et êtes-vous encore actif ?)
 *   2. RolesGuard    — votre rôle vous y autorise-t-il ?
 *   3. ScopesGuard   — votre portée déléguée vous y autorise-t-elle ?
 *
 * L'inverse serait incorrect : RolesGuard et ScopesGuard lisent
 * `requete.utilisateur`, que seul SessionGuard peut y avoir attaché.
 *
 * Le middleware CSRF est appliqué à TOUTES les routes et filtre lui-même les
 * méthodes sûres. L'inscrire route par route serait une liste à tenir à jour —
 * et la première route de mutation qu'on oublierait d'y ajouter serait une
 * faille silencieuse.
 */
@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    SessionSerializer,
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ScopesGuard },
  ],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consommateur: MiddlewareConsumer): void {
    consommateur.apply(CsrfMiddleware).forRoutes('*');
  }
}
