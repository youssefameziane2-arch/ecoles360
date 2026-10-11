import { Global, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

/**
 * Centre de notifications — table `Notification` du livrable 10 §2.20.
 *
 * GLOBAL, VOLONTAIREMENT. Les moments qui déclenchent une notification sont
 * dispersés — une demande de contact dans `contacts`, une proposition dans
 * `espace`, un avis dans `avis`, une échéance dans `scheduler`. Les déclarer
 * un par un dans chaque module obligerait à toucher cinq fichiers de plus à
 * chaque nouveau type, et l'oubli ne se verrait qu'au démarrage de Nest.
 */
@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
