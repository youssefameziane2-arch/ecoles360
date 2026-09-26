import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { ArticlesService } from './articles.service';

/**
 * Blog public — livrable 11 §3.5.
 *
 * Lecture seule et anonyme. Seuls les articles APPROUVÉS sortent d'ici : un
 * brouillon ou un article refusé n'existe pas pour un visiteur, et répond 404
 * plutôt que 403 — dire « interdit » reviendrait à confirmer son existence.
 */
@ApiTags('blog')
@Public()
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  @Get()
  @ApiOperation({
    summary: 'Articles publiés, paginés',
    description: 'L’article à la une est exclu de la grille : il occupe déjà le bandeau de tête.',
  })
  lister(
    @Query('categorie') categorie?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
  ) {
    return this.articles.listerPublic({ categorie, page });
  }

  @Get('a-la-une')
  @ApiOperation({ summary: 'Article mis en avant, ou null' })
  aLaUne() {
    return this.articles.aLaUne();
  }

  @Get('categories')
  @ApiOperation({
    summary: 'Catégories portées par au moins un article publié',
    description: 'Alimente les pastilles de filtre du blog — pas de catégorie vide affichée.',
  })
  categories() {
    return this.articles.categoriesPubliees();
  }

  @Get('etablissements/:slug')
  @ApiOperation({
    summary: 'Articles publiés par un établissement',
    description: 'Vide si l’établissement n’a rien publié — le front se rabat sur le site.',
  })
  parEtablissement(@Param('slug') slug: string) {
    return this.articles.articlesDeLEtablissement(slug);
  }

  // DÉCLARÉ EN DERNIER : `:slug` capterait « a-la-une », « categories » et
  // « etablissements/… » s'il venait avant, et ces routes deviendraient des 404.
  @Get(':slug')
  @ApiOperation({ summary: 'Un article publié et trois lectures associées' })
  @ApiResponse({ status: 404, description: 'Article inconnu ou non publié.' })
  parSlug(@Param('slug') slug: string) {
    return this.articles.parSlug(slug);
  }
}
