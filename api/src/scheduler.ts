// Sérialisation des identifiants BigInt — en TOUT PREMIER, comme main.ts.
import './common/serialisation/bigint';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SchedulerModule } from './scheduler.module';

/**
 * Point d'entrée du conteneur `scheduler` — compilé en `dist/scheduler.js`.
 *
 * MÊME IMAGE QUE L'API, COMMANDE DIFFÉRENTE (livrable 14 §2) :
 *
 *   docker compose run --rm api node dist/scheduler.js
 *
 * `createApplicationContext` ET NON `create` : ce processus n'écoute aucun
 * port. Monter un serveur HTTP pour un planificateur ouvrirait une porte dont
 * personne n'a besoin, et que le pare-feu ne protège pas à l'intérieur du
 * réseau Docker.
 *
 * IL NE SE TERMINE PAS, et c'est voulu : le contexte reste vivant pour que les
 * minuteries `@Cron` se déclenchent. Un processus qui rendrait la main
 * arrêterait le conteneur, que Docker relancerait en boucle — et les purges ne
 * tourneraient jamais.
 */
async function bootstrap(): Promise<void> {
  const contexte = await NestFactory.createApplicationContext(SchedulerModule, {
    logger: ['error', 'warn', 'log'],
  });

  contexte.enableShutdownHooks();

  new Logger('Scheduler').log(
    'Tâches planifiées actives — purge des demandes 02 h 00, des traces 02 h 30, du journal dimanche 04 h 00 (Africa/Casablanca).',
  );
}

void bootstrap();
