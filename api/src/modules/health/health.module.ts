import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * Module de la sonde de santé.
 *
 * `PrismaService` et `RedisService` viennent des modules globaux du socle :
 * aucun import n'est nécessaire ici.
 */
@Module({
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
