import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { randomBytes } from 'node:crypto';
import { Public, Utilisateur } from '../../common/decorators';
import { AuthService } from './auth.service';
import { LoginDto, MotDePasseOublieDto, ResetMotDePasseDto } from './dto';
import { NOM_COOKIE_CSRF } from './csrf.middleware';
import type { UtilisateurAuthentifie } from './session.types';

/**
 * Promisifie les rappels d'express-session, qui suivent la convention Node
 * (erreur en premier argument, potentiellement absente).
 *
 * Le rejet est toujours une Error : propager un `undefined` produirait une
 * promesse rejetée sans cause, et le filtre global ne pourrait rien en dire.
 */
function promesse(action: (rappel: (erreur?: unknown) => void) => void): Promise<void> {
  return new Promise<void>((resoudre, rejeter) => {
    action((erreur) => {
      if (erreur) {
        rejeter(
          erreur instanceof Error
            ? erreur
            : new Error(`Échec de l'opération de session : ${JSON.stringify(erreur)}`),
        );
        return;
      }
      resoudre();
    });
  });
}

/**
 * `/api/v1/auth` — livrable 11 §3.1.
 *
 * Les comptes établissement sont créés par un administrateur à la
 * transformation d'un prospect (RG17) : il n'y a pas d'auto-inscription
 * publique, et donc pas de route d'enregistrement ici.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * Ouverture de session.
   *
   * Limitée à 5 tentatives par minute (livrable 11 §5) : le coût d'une attaque
   * par force brute devient prohibitif sans gêner un utilisateur qui se trompe
   * deux ou trois fois.
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Ouvrir une session' })
  @ApiResponse({ status: 200, description: 'Session ouverte ; cookie et jeton CSRF posés.' })
  @ApiResponse({ status: 401, description: 'Identifiants incorrects.' })
  @ApiResponse({ status: 429, description: 'Trop de tentatives.' })
  async login(
    @Body() dto: LoginDto,
    @Req() requete: Request,
    @Res({ passthrough: true }) reponse: Response,
  ): Promise<{ utilisateur: UtilisateurAuthentifie; csrf: string }> {
    const utilisateur = await this.auth.validerIdentifiants(dto.email, dto.mot_de_passe);

    // Régénération de l'identifiant de session AVANT d'y écrire quoi que ce
    // soit : sans cela, un identifiant obtenu par un tiers avant la connexion
    // resterait valide après — c'est la fixation de session.
    await promesse((rappel) => requete.session.regenerate(rappel));

    // `logIn` passe par SessionSerializer : c'est Passport qui écrit la
    // session, pas nous. Écrire `session.passport` à la main fonctionnerait
    // aussi, mais dupliquerait une convention dont Passport reste le seul
    // propriétaire — et la moindre divergence de forme casserait
    // `passport.session()` de façon opaque.
    await promesse((rappel) => requete.logIn(utilisateur, rappel));

    const csrf = this.poserJetonCsrf(requete, reponse);

    // Écriture explicite dans Redis avant de répondre : sans elle, la réponse
    // pourrait partir avant que la session ne soit persistée, et la requête
    // suivante du client ne trouverait aucune session à son identifiant.
    await promesse((rappel) => requete.session.save(rappel));

    return { utilisateur, csrf };
  }

  /** Fermeture de session — la clé Redis est détruite, pas seulement le cookie. */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Fermer la session' })
  @ApiResponse({ status: 204, description: 'Session détruite.' })
  async logout(
    @Req() requete: Request,
    @Res({ passthrough: true }) reponse: Response,
  ): Promise<void> {
    await new Promise<void>((resoudre) => {
      requete.session.destroy(() => resoudre());
    });

    reponse.clearCookie(NOM_COOKIE_CSRF);
  }

  /**
   * Profil courant — rôle, portées et établissement rattaché.
   *
   * C'est la source unique du front pour décider quoi afficher (livrable 12
   * §3) : la nav du secrétariat s'y réduit aux portées accordées.
   */
  @Get('me')
  @ApiOperation({ summary: 'Profil de la session courante' })
  @ApiResponse({ status: 200, description: 'Rôle, portées et établissement rattaché.' })
  @ApiResponse({ status: 401, description: 'Aucune session.' })
  me(@Utilisateur() utilisateur: UtilisateurAuthentifie): UtilisateurAuthentifie {
    return utilisateur;
  }

  /**
   * Demande de réinitialisation.
   *
   * Répond TOUJOURS `202`, que l'adresse existe ou non. Distinguer les deux
   * ferait de ce formulaire un annuaire de comptes : il suffirait d'essayer des
   * adresses pour savoir lesquelles sont inscrites.
   */
  @Public()
  @Post('mot-de-passe-oublie')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Demander un lien de réinitialisation' })
  @ApiResponse({
    status: 202,
    description: "Réponse identique que l'adresse existe ou non, pour ne pas révéler les comptes.",
  })
  async motDePasseOublie(@Body() dto: MotDePasseOublieDto): Promise<{ message: string }> {
    const jeton = await this.auth.demanderReinitialisation(dto.email);

    // LOT 3 — le jeton part en file `mail` dès l'introduction de BullMQ
    // (livrable 11 §6, docs/BACKLOG.md B-20). Il n'est jamais journalisé ni
    // renvoyé au client : le connaître suffirait à changer le mot de passe.
    void jeton;

    return {
      message:
        'Si cette adresse correspond à un compte, un lien de réinitialisation vient d’être envoyé.',
    };
  }

  /**
   * Réinitialisation effective.
   *
   * Détruit toutes les sessions actives du compte (RG25) : si le mot de passe a
   * été changé parce qu'un tiers y avait accès, ce tiers perd l'accès à
   * l'instant même.
   */
  @Public()
  @Post('reset-mot-de-passe')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Définir un nouveau mot de passe' })
  @ApiResponse({ status: 204, description: 'Mot de passe changé, sessions actives révoquées.' })
  @ApiResponse({ status: 422, description: 'Jeton invalide, déjà utilisé ou expiré.' })
  async resetMotDePasse(@Body() dto: ResetMotDePasseDto): Promise<void> {
    await this.auth.reinitialiserMotDePasse(dto.jeton, dto.nouveau_mot_de_passe);
  }

  /**
   * Pose le jeton CSRF double-submit.
   *
   * Le même secret est écrit dans la session (côté serveur) et dans un cookie
   * LISIBLE par le JavaScript — c'est voulu : le front doit pouvoir le relire
   * pour le renvoyer en en-tête. La protection ne vient pas du secret du
   * cookie, mais du fait qu'un site tiers ne peut pas LIRE le cookie d'un autre
   * domaine pour construire l'en-tête, alors qu'il peut déclencher l'envoi
   * automatique du cookie de session.
   */
  private poserJetonCsrf(requete: Request, reponse: Response): string {
    const csrf = randomBytes(32).toString('hex');
    requete.session.csrf = csrf;

    reponse.cookie(NOM_COOKIE_CSRF, csrf, {
      httpOnly: false, // délibéré — voir ci-dessus
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return csrf;
  }
}
