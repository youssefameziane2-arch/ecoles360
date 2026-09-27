import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles, Utilisateur } from '../../common/decorators';
import { AppException, ERROR_CODES } from '../../common/errors';
import { RoleCode } from '../../generated/prisma';
import type { UtilisateurAuthentifie } from '../auth/session.types';
import { ArticlesService, type Redacteur } from './articles.service';
import { RedigerArticleDto } from './dto/rediger-article.dto';
import { BasculeBlogDto } from './dto/bascule-blog.dto';

/**
 * Rédaction d'articles — espaces établissement et commercial, avenant 3.
 *
 * OUVERT AU COMMERCIAL, comme la maquette (`commercial/blog`) : il rédige des
 * articles de plateforme, soumis à la même validation. Ce qu'il peut toucher
 * est défini par `Redacteur` dans le service — les siens, et eux seuls.
 *
 * FERMÉ AU SECRÉTARIAT. La maquette range le
 * blog parmi les droits que l'administrateur délègue (aux côtés de fiches,
 * contacts et avis), mais `PermissionPortee` n'en porte pas encore la valeur :
 * plutôt que de laisser un secrétariat publier au nom de l'établissement sans
 * que personne le lui ait accordé, la route lui est fermée jusqu'à ce que la
 * portée existe.
 */
@ApiTags('mon-espace')
@Roles(RoleCode.etablissement, RoleCode.commercial)
@Controller('mon-espace')
export class ArticlesEspaceController {
  constructor(private readonly articles: ArticlesService) {}

  @Get('blog')
  @ApiOperation({ summary: 'Articles du rédacteur connecté et état d’activation du blog' })
  async blog(@Utilisateur() utilisateur: UtilisateurAuthentifie) {
    const redacteur = this.redacteur(utilisateur);

    const [actif, articles] = await Promise.all([
      this.articles.blogActif(utilisateur.userId),
      this.articles.listerPourRedacteur(redacteur),
    ]);

    return { actif, articles };
  }

  @Put('blog')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Activer ou désactiver son blog',
    description: 'Le blog est fermé par défaut — la maquette le dit explicitement.',
  })
  basculerBlog(@Utilisateur() utilisateur: UtilisateurAuthentifie, @Body() dto: BasculeBlogDto) {
    return this.articles.basculerBlog(this.redacteur(utilisateur), dto.actif);
  }

  @Post('articles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un brouillon d’article' })
  @ApiResponse({ status: 409, description: 'Blog désactivé.' })
  creer(@Utilisateur() utilisateur: UtilisateurAuthentifie, @Body() dto: RedigerArticleDto) {
    return this.articles.creer(this.redacteur(utilisateur), dto);
  }

  @Put('articles/:id')
  @ApiOperation({
    summary: 'Réécrire un article',
    description: 'Il repasse en brouillon : un texte approuvé puis modifié quitte le site.',
  })
  @ApiResponse({ status: 404, description: 'Article inconnu ou appartenant à un autre compte.' })
  modifier(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RedigerArticleDto,
  ) {
    return this.articles.modifier(this.redacteur(utilisateur), BigInt(id), dto);
  }

  @Post('articles/:id/soumettre')
  @ApiOperation({ summary: 'Soumettre à la validation de l’administrateur' })
  @ApiResponse({ status: 409, description: 'Article déjà en attente.' })
  @ApiResponse({ status: 422, description: 'Article sans contenu.' })
  soumettre(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.articles.soumettre(this.redacteur(utilisateur), BigInt(id));
  }

  @Delete('articles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un de ses articles' })
  supprimer(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.articles.supprimer(this.redacteur(utilisateur), BigInt(id));
  }

  /**
   * Le rédacteur, tiré de la session — jamais d'un identifiant d'URL.
   *
   * Un compte `etablissement` sans rattachement est une anomalie de données,
   * pas un cas métier : mieux vaut un refus net que de le traiter en
   * rédacteur de plateforme, ce qui lui ouvrirait les articles sans fiche.
   */
  private redacteur(utilisateur: UtilisateurAuthentifie): Redacteur {
    if (utilisateur.role === RoleCode.commercial) {
      return { role: RoleCode.commercial, userId: utilisateur.userId };
    }

    if (!utilisateur.etablissementId) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        ERROR_CODES.ACCES_REFUSE,
        "Votre compte n'est rattaché à aucun établissement.",
      );
    }

    return {
      role: RoleCode.etablissement,
      userId: utilisateur.userId,
      etablissementId: utilisateur.etablissementId,
    };
  }
}
