import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { InscriptionDto } from './dto/inscription.dto';
import { InscriptionsService } from './inscriptions.service';

/** Demande de référencement — formulaire public, maquette `isInscription`. */
@ApiTags('inscriptions')
@Public()
@Controller('inscriptions')
export class InscriptionsController {
  constructor(private readonly inscriptions: InscriptionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  /**
   * TROIS PAR HEURE, PLUS SERRÉ QUE LA DEMANDE D'UN PARENT (cinq). Un parent
   * peut légitimement écrire à plusieurs écoles dans la même heure ; un
   * directeur n'inscrit son établissement qu'une fois. Ce qui passerait
   * au-delà serait, dans l'immense majorité des cas, un robot — et chaque
   * ligne qu'il déposerait atterrirait dans la colonne « Nouveaux » qu'un
   * commercial doit traiter à la main.
   */
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @ApiOperation({
    summary: 'Demander le référencement de son établissement',
    description:
      'Crée un prospect en « nouveau », sans commercial attribué (RG17) et sans fiche. ' +
      'Le consentement 09-08 est obligatoire : la demande est refusée sans lui (RG09).',
  })
  @ApiResponse({ status: 201, description: 'Demande enregistrée.' })
  @ApiResponse({ status: 422, description: 'Consentement absent, téléphone ou formule invalides.' })
  @ApiResponse({ status: 429, description: 'Trop de demandes depuis cette adresse.' })
  deposer(@Body() dto: InscriptionDto) {
    return this.inscriptions.deposer(dto);
  }
}
