import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { EtablissementsService } from './etablissements.service';
import { RechercheEtablissementsDto } from './dto/recherche-etablissements.dto';

/**
 * Site public — livrable 11 §3.1.
 *
 * Sans authentification : la recherche et la consultation des fiches sont
 * gratuites et ne demandent aucun compte (livrable 3). Ces routes sont aussi
 * celles qu'appelle le serveur de rendu SSR sur le réseau interne Docker
 * (livrable 12 §2) — il n'existe pas de chemin privilégié vers le métier.
 */
@ApiTags('etablissements')
@Public()
@Controller()
export class EtablissementsController {
  constructor(private readonly etablissements: EtablissementsService) {}

  @Get('etablissements')
  @ApiOperation({
    summary: 'Rechercher des établissements',
    description:
      'Seules les fiches validées sont servies (RG03). Les fiches sponsorisées ' +
      'apparaissent en tête sans jamais évincer un résultat pertinent (RG19).',
  })
  @ApiResponse({ status: 200, description: 'Collection paginée, 18 fiches par page (RG05).' })
  @ApiResponse({ status: 422, description: 'Filtre invalide.' })
  rechercher(@Query() filtres: RechercheEtablissementsDto) {
    return this.etablissements.rechercher(filtres);
  }

  @Get('etablissements/:slug')
  @ApiOperation({ summary: "Fiche complète d'un établissement" })
  @ApiResponse({ status: 200, description: 'Fiche publiée.' })
  @ApiResponse({
    status: 404,
    description:
      "Fiche inexistante OU non validée — un 403 confirmerait l'existence d'un dossier déposé.",
  })
  parSlug(@Param('slug') slug: string) {
    return this.etablissements.parSlug(slug);
  }

  @Get('villes')
  @ApiOperation({ summary: 'Référentiel des villes (RG01)' })
  villes() {
    return this.etablissements.villes();
  }

  @Get('niveau-filieres')
  @ApiOperation({ summary: 'Référentiel des niveaux et filières (RG02)' })
  niveauxFilieres() {
    return this.etablissements.niveauxFilieres();
  }
}
