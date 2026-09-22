import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { AvisService } from './avis.service';
import { DeposerAvisDto } from './dto/deposer-avis.dto';
import { SignalerAvisDto } from './dto/signaler-avis.dto';

/** Avis publics — livrable 11 §3.1, RG06 à RG08. */
@ApiTags('avis')
@Public()
@Controller()
export class AvisController {
  constructor(private readonly avis: AvisService) {}

  @Get('etablissements/:slug/avis')
  @ApiOperation({ summary: "Avis publiés d'un établissement" })
  @ApiResponse({ status: 200, description: 'Avis publiés uniquement, avec la réponse éventuelle.' })
  publies(
    @Param('slug') slug: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.avis.publies(slug, page);
  }

  @Post('etablissements/:slug/avis')
  @HttpCode(HttpStatus.CREATED)
  // 5 dépôts par heure et par IP (livrable 11 §5) : assez pour une famille qui
  // évalue plusieurs établissements, trop peu pour une campagne organisée.
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @ApiOperation({
    summary: 'Déposer un avis',
    description: 'Créé en attente de modération — aucun chemin ne publie directement (RG06).',
  })
  @ApiResponse({ status: 201, description: 'Avis enregistré, en attente de modération.' })
  @ApiResponse({ status: 404, description: 'Établissement inexistant ou non publié.' })
  @ApiResponse({ status: 422, description: 'Note hors 1–5, ou champ manquant.' })
  deposer(@Param('slug') slug: string, @Body() dto: DeposerAvisDto) {
    return this.avis.deposer(slug, dto);
  }

  @Post('avis/:id/signalements')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @ApiOperation({
    summary: 'Signaler un avis',
    description: "Replace l'avis en file de modération et recalcule la note (RG07, RG08).",
  })
  @ApiResponse({ status: 204, description: 'Signalement enregistré.' })
  signaler(@Param('id', ParseIntPipe) id: number, @Body() dto: SignalerAvisDto) {
    return this.avis.signaler(BigInt(id), dto);
  }
}
