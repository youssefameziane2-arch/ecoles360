import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import type { UtilisateurAuthentifie } from '../session.types';

/**
 * Stratégie `passport-local` — livrable 11 §3.1.
 *
 * Les champs sont renommés : Passport attend `username` / `password`, le
 * contrat du livrable expose `email` / `mot_de_passe`. Le vocabulaire du
 * produit est français (livrable 11 §1), y compris dans les charges utiles.
 *
 * La vérification elle-même vit dans `AuthService` : la stratégie n'est qu'un
 * adaptateur. C'est ce qui permet aux tests du livrable 13 §2.1 d'éprouver les
 * règles d'authentification sans monter de pile HTTP.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly auth: AuthService) {
    super({ usernameField: 'email', passwordField: 'mot_de_passe' });
  }

  validate(email: string, motDePasse: string): Promise<UtilisateurAuthentifie> {
    // Lève un 401 indifférencié en cas d'échec — jamais de message qui
    // distinguerait un e-mail inconnu d'un mot de passe faux.
    return this.auth.validerIdentifiants(email, motDePasse);
  }
}
