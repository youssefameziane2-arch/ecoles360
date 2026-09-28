import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { FaqService } from './faq.service';
import { ConseillersService } from './conseillers.service';
import { PagesCmsService } from './pages-cms.service';

/**
 * Contenu éditorial public — livrable 11 §3.7.
 *
 * Lecture seule et anonyme : la FAQ et la page « À propos » s'affichent avant
 * toute connexion et sans cookie.
 */
@ApiTags('contenu')
@Public()
@Controller()
export class ContenuController {
  constructor(
    private readonly faq: FaqService,
    private readonly conseillers: ConseillersService,
    private readonly pages: PagesCmsService,
  ) {}

  @Get('conseillers')
  @ApiOperation({
    summary: 'Conseillers commerciaux joignables',
    description:
      'Alimente la bannière d’aide du site public : un nom et une ligne directe. ' +
      'Seuls les comptes actifs qui portent un téléphone sortent.',
  })
  conseillersJoignables() {
    return this.conseillers.joignables();
  }

  @Get('faq')
  @ApiOperation({
    summary: 'Questions fréquentes, groupées par rubrique',
    description:
      'Seules les questions publiées sortent. Les rubriques suivent l’ordre de ' +
      'leur première question, lui-même fixé depuis le back-office.',
  })
  @ApiResponse({ status: 200, description: 'Rubriques et questions publiées.' })
  questionsFrequentes() {
    return this.faq.publique();
  }

  @Get('contenu/pages/:cle')
  @ApiOperation({
    summary: 'Page éditoriale — « a-propos » aujourd’hui',
    description: 'Le contenu tel que le back-office l’a publié, sans l’auteur de la modification.',
  })
  @ApiResponse({ status: 404, description: 'Clé de page inconnue.' })
  page(@Param('cle') cle: string) {
    return this.pages.lire(cle);
  }
}
