import { Module } from '@nestjs/common';
import { AvisController } from './avis.controller';
import { AvisService } from './avis.service';

/**
 * Domaine « avis » — livrable 7 §3.
 *
 * Le service est exporté : la modération du back-office (lot 5) doit appeler
 * `recalculerNote` DANS sa propre transaction, pour que la décision et le
 * recalcul soient indissociables (RG08).
 */
@Module({
  controllers: [AvisController],
  providers: [AvisService],
  exports: [AvisService],
})
export class AvisModule {}
