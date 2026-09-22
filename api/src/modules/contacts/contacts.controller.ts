import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { ContactsService } from './contacts.service';
import { DemandeContactDto } from './dto/demande-contact.dto';
import { TracerEvenementDto } from './dto/tracer-evenement.dto';

/** Mise en relation et traçage — livrable 11 §3.1, RG09 et RG10. */
@ApiTags('contacts')
@Public()
@Controller('etablissements/:slug')
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Post('demandes-contact')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @ApiOperation({
    summary: 'Adresser une demande de contact',
    description:
      'Le consentement 09-08 est obligatoire : la demande est refusée sans lui (RG09). ' +
      'Un lead est créé dans la même transaction (RG21).',
  })
  @ApiResponse({ status: 201, description: 'Demande enregistrée, lead créé.' })
  @ApiResponse({ status: 422, description: 'Consentement absent ou téléphone invalide.' })
  demande(@Param('slug') slug: string, @Body() dto: DemandeContactDto) {
    return this.contacts.deposerDemande(slug, dto);
  }

  @Post('evenements')
  @HttpCode(HttpStatus.NO_CONTENT)
  // Plafond large : c'est de la télémétrie déclenchée par la navigation, pas
  // une action utilisateur. Un plafond serré fausserait les statistiques.
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Tracer une interaction',
    description: 'Appel, WhatsApp, vue de fiche ou vue de page profil (RG10).',
  })
  @ApiResponse({ status: 204, description: 'Événement enregistré.' })
  tracer(@Param('slug') slug: string, @Body() dto: TracerEvenementDto) {
    return this.contacts.tracer(slug, dto);
  }
}
