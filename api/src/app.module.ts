import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { validateEnv } from './config/env.validation';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

/**
 * Module racine — livrable 7 §3 : « imports des modules métier + ConfigModule,
 * BullModule, ScheduleModule ».
 *
 * LOT 1 — SOCLE. Seuls le ConfigModule et les deux modules d'infrastructure
 * (Prisma, Redis) sont câblés, plus la sonde de santé. Les quatorze modules
 * métier du livrable 11 §1 (auth · users · etablissements · fiches ·
 * abonnements · facturation · commissions · prospects · leads · avis ·
 * contacts · articles · cms · audit), `BullModule` et `ScheduleModule`
 * arrivent avec leurs lots respectifs.
 *
 * Le filtre d'exception est enregistré par `APP_FILTER` plutôt que par
 * `app.useGlobalFilters()` dans `main.ts` : déclaré ici, il passe par le
 * conteneur d'injection et pourra recevoir `AuditService` le jour où le
 * livrable 11 §4 demandera de journaliser les refus.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // La racine du dépôt porte le `.env` unique : Docker Compose l'utilise
      // pour interpoler ses variables, l'API pour se configurer. Un seul
      // fichier à copier depuis `.env.example`, comme l'exige le lot 1 §4.
      envFilePath: ['../.env', '.env'],
      validate: validateEnv,
    }),
    PrismaModule,
    RedisModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
