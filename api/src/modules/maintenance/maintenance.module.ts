import { Module } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ParametresFacturationService } from '../admin/parametres-facturation.service';
import { PurgesService } from './purges.service';
import { RappelsService } from './rappels.service';

/**
 * Purges de la loi 09-08.
 *
 * `PlanificateurService` N'EST PAS DÉCLARÉ ICI, volontairement : il n'a de
 * sens que dans le conteneur `scheduler`, et le charger dans l'API ferait
 * déclencher les purges par chaque réplique. C'est `SchedulerModule` qui
 * l'ajoute, et lui seul.
 */
@Module({
  providers: [
    PurgesService,
    RappelsService,
    AuditService,
    // DÉCLARÉS ICI, PAS IMPORTÉS : le conteneur `scheduler` ne charge ni
    // `AppModule` ni `AdminModule`. Les y chercher le ferait refuser de
    // démarrer — `tsc` passerait, Nest non. C est arrivé deux fois sur ce
    // projet.
    NotificationsService,
    ParametresFacturationService,
  ],
  exports: [PurgesService, RappelsService],
})
export class MaintenanceModule {}
