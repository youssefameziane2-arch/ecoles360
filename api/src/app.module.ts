import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { REDIS_CLIENT } from './redis/redis.constants';
import type Redis from 'ioredis';
import { validateEnv } from './config/env.validation';
import { EnveloppeInterceptor } from './common/interceptors';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AdminModule } from './modules/admin/admin.module';
import { SeoModule } from './modules/seo/seo.module';
import { CrmModule } from './modules/crm/crm.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { InscriptionsModule } from './modules/inscriptions/inscriptions.module';
import { AuthModule } from './modules/auth/auth.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { AvisModule } from './modules/avis/avis.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { ContenuModule } from './modules/contenu/contenu.module';
import { EspaceModule } from './modules/espace/espace.module';
import { EtablissementsModule } from './modules/etablissements/etablissements.module';
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
    /**
     * Limitation de débit — livrable 11 §5.
     *
     * Le compteur vit dans REDIS, pas en mémoire. La nuance est décisive dès
     * qu'un second conteneur `api` est lancé (livrable 14 §4.1) : avec un
     * compteur local, cinq tentatives par conteneur deviendraient dix, puis
     * quinze — la protection se diluerait à mesure que l'on met à l échelle.
     *
     * Plafond global de 60 requêtes par minute (lecture publique). Les routes
     * sensibles le resserrent par `@Throttle()` : connexion et
     * réinitialisation à 5/min, dépôt d'avis et demandes à 5/h.
     */
    ThrottlerModule.forRootAsync({
      inject: [REDIS_CLIENT],
      useFactory: (redis: Redis) => ({
        throttlers: [{ name: 'default', limit: 60, ttl: 60_000 }],
        storage: new ThrottlerStorageRedisService(redis),
      }),
    }),
    PrismaModule,
    NotificationsModule,
    RedisModule,
    AuthModule,
    HealthModule,
    EtablissementsModule,
    AvisModule,
    ArticlesModule,
    ContactsModule,
    ContenuModule,
    EspaceModule,
    AdminModule,
    SeoModule,
    CrmModule,
    InscriptionsModule,
  ],
  providers: [
    // Le throttler s'exécute AVANT les guards d authentification : une attaque
    // par force brute ne doit pas pouvoir consommer une vérification Argon2 —
    // coûteuse par construction — à chaque tentative.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Enveloppe {data, meta, links} du livrable 11 §1 — c'est une INTERFACE :
    // le client HTTP du front et les fixtures MSW sont écrits contre cette
    // forme exacte. Les sorties qui ne sont pas des ressources métier (sonde,
    // reçus HTML, exports CSV) s'en échappent par @SansEnveloppe().
    { provide: APP_INTERCEPTOR, useClass: EnveloppeInterceptor },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
