import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';

/**
 * Module racine de la CLI — livrable 10 §3.
 *
 * Volontairement plus maigre qu'`AppModule` : ni controllers, ni Redis, ni
 * Swagger. Une commande de seed n'a besoin que de la configuration et de
 * Prisma. Ce qui n'est pas chargé ne peut pas échouer au démarrage — et une
 * commande lancée dans un conteneur éphémère doit démarrer vite et sans
 * dépendre de services qu'elle n'utilise pas.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['../.env', '.env'],
      validate: validateEnv,
    }),
    PrismaModule,
    DatabaseModule,
  ],
})
export class CliModule {}
