import { Module } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { PurgesService } from './purges.service';

/**
 * Purges de la loi 09-08.
 *
 * `PlanificateurService` N'EST PAS DÉCLARÉ ICI, volontairement : il n'a de
 * sens que dans le conteneur `scheduler`, et le charger dans l'API ferait
 * déclencher les purges par chaque réplique. C'est `SchedulerModule` qui
 * l'ajoute, et lui seul.
 */
@Module({
  providers: [PurgesService, AuditService],
  exports: [PurgesService],
})
export class MaintenanceModule {}
