import { Module } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { CrmService } from './crm.service';
import { CrmLectureService } from './crm-lecture.service';
import { CrmController } from './crm.controller';

/**
 * CRM commercial d'écoles360 — prospects, relances, commissions (RG17, RG18).
 *
 * `AuditService` est déclaré ici, pas importé : il n'est exporté par aucun
 * module global, et chaque module qui journalise le fournit lui-même. L'oubli
 * ne se voit pas au typage — il fait échouer Nest au démarrage.
 */
@Module({
  controllers: [CrmController],
  providers: [CrmService, CrmLectureService, AuditService],
  exports: [CrmService, CrmLectureService],
})
export class CrmModule {}
