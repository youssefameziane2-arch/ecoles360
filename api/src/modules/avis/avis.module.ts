import { Module } from '@nestjs/common';
import { AvisController } from './avis.controller';
import { AuditService } from '../../common/audit/audit.service';
import { AvisService } from './avis.service';
import { ModerationAvisService } from './moderation.service';

/**
 * Domaine « avis » — livrable 7 §3.
 *
 * Le service est exporté : la modération du back-office (lot 5) doit appeler
 * `recalculerNote` DANS sa propre transaction, pour que la décision et le
 * recalcul soient indissociables (RG08).
 */
@Module({
  controllers: [AvisController],
  providers: [AvisService, ModerationAvisService, AuditService],
  exports: [AvisService, ModerationAvisService],
})
export class AvisModule {}
