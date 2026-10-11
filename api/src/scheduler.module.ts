import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { PlanificateurService } from './modules/maintenance/planificateur.service';

/**
 * Module racine du conteneur `scheduler` — livrable 14 §2.
 *
 * VOLONTAIREMENT PLUS MAIGRE QU'`AppModule` : ni contrôleurs, ni Redis, ni
 * Swagger, ni garde d'authentification. Ce processus n'écoute aucun port et ne
 * répond à personne ; il se réveille à l'heure dite. Ce qui n'est pas chargé
 * ne peut pas échouer au démarrage, et un conteneur de tâches qui ne démarre
 * pas est un conteneur dont personne ne remarque l'absence.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['../.env', '.env'],
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    MaintenanceModule,
  ],
  providers: [PlanificateurService],
})
export class SchedulerModule {}
