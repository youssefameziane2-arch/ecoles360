import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import type { SessionPassport, UtilisateurAuthentifie } from '../session.types';

/**
 * Sérialisation de session Passport — livrable 11 §2.
 *
 * SEUL L'IDENTIFIANT EST ÉCRIT dans Redis. Recopier le rôle, les portées ou le
 * rattachement les figerait à l'ouverture de session : une portée révoquée
 * resterait active jusqu'à la reconnexion, ce que la RG05 et la RG25
 * interdisent.
 *
 * La désérialisation ne touche donc PAS la base : elle rend l'identifiant tel
 * quel. Le rechargement autoritaire — et le contrôle de suspension — est le
 * travail du `SessionGuard`, qui s'exécute sur chaque requête. Interroger la
 * base ici aussi doublerait chaque requête d'une lecture inutile.
 */
@Injectable()
export class SessionSerializer extends PassportSerializer {
  serializeUser(
    utilisateur: UtilisateurAuthentifie,
    fait: (erreur: Error | null, charge: SessionPassport) => void,
  ): void {
    fait(null, { userId: utilisateur.userId.toString() });
  }

  deserializeUser(
    charge: SessionPassport,
    fait: (erreur: Error | null, charge: SessionPassport) => void,
  ): void {
    fait(null, charge);
  }
}
