import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { FaqService } from './faq.service';
import { ConseillersService } from './conseillers.service';

/**
 * Contenu éditorial public — livrable 11 §3.7.
 *
 * Lecture seule et anonyme : la FAQ est une page d'aide, elle doit s'afficher
 * avant toute connexion et sans cookie.
 */
@ApiTags('contenu')
@Public()
@Controller()
export class ContenuController {
  constructor(
    private readonly faq: FaqService,
    private readonly conseillers: ConseillersService,
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
}
