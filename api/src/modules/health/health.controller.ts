import { Controller, Get, Header, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public, SansEnveloppe } from '../../common/decorators';
import { AppException, ERROR_CODES } from '../../common/errors';
import { HealthResponseDto, StatutSante } from './dto/health-response.dto';
import { HealthService } from './health.service';

/**
 * `GET /api/v1/health` — lot 1 §5.
 *
 * Route publique et sans effet de bord. Elle restera hors de toute
 * authentification quand le `SessionGuard` global arrivera (livrable 11 §2) :
 * une sonde qui exige une session ne peut pas servir de HEALTHCHECK Docker.
 *
 * Deux réponses, un seul contenu :
 *   · 200 — `HealthResponseDto`, toutes les dépendances répondent ;
 *   · 503 — format d'erreur du livrable 11 §1, le rapport complet étant porté
 *     par `details`. La panne est ainsi diagnosticable sans second appel, et
 *     sans exception au contrat d'erreur de l'API.
 */
@ApiTags('health')
// Hors de toute authentification, et ce n'est pas un oubli : un HEALTHCHECK
// Docker ne peut pas ouvrir de session, et une sonde qui exigerait un compte
// ne pourrait plus dire si le service est debout (livrable 14 §2.2).
@Public()
// Hors enveloppe : le HEALTHCHECK Docker et la sonde UptimeRobot lisent une
// charge plate, et les envelopper casserait leur configuration (livrable 14 §5).
@SansEnveloppe()
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  // Une sonde mise en cache ne surveille plus rien : elle rapporterait l'état
  // du service au moment du premier appel, indéfiniment.
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @ApiOperation({
    summary: 'Sonde de santé',
    description:
      'Vérifie réellement la connexion MySQL (`SELECT 1`) et la connexion Redis (`PING`). ' +
      'Sert de `HEALTHCHECK` Docker, de condition `service_healthy` pour les autres ' +
      'conteneurs et de sonde externe (livrable 14 §2.2 et §5).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Toutes les dépendances répondent.',
    type: HealthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description:
      'Au moins une dépendance est en échec. Le rapport complet est porté par `details`.',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', example: ERROR_CODES.SERVICE_INDISPONIBLE },
        message: { type: 'string', example: 'Une dépendance du service est indisponible.' },
        details: { $ref: '#/components/schemas/HealthResponseDto' },
      },
    },
  })
  async verifier(): Promise<HealthResponseDto> {
    const rapport = await this.health.verifier();

    if (rapport.statut === StatutSante.Degrade) {
      throw new AppException(
        HttpStatus.SERVICE_UNAVAILABLE,
        ERROR_CODES.SERVICE_INDISPONIBLE,
        undefined,
        { ...rapport },
      );
    }

    return rapport;
  }
}
