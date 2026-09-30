import { Module } from '@nestjs/common';
import { CompteAdminCommand } from './compte-admin.command';
import { SeedCommand } from './seed.command';
import { DemoSeeder } from './seeders/demo.seeder';
import { ReferentielsSeeder } from './seeders/referentiels.seeder';

/**
 * Module des commandes de base de données.
 *
 * Chargé par le module CLI, jamais par `AppModule` : les seeders n'ont rien à
 * faire dans le conteneur qui sert les requêtes HTTP. C'est aussi ce qui permet
 * au conteneur `api` et à la commande de partager la même image avec deux
 * points d'entrée différents (livrable 14 §2).
 */
@Module({
  providers: [ReferentielsSeeder, DemoSeeder, SeedCommand, CompteAdminCommand],
  exports: [ReferentielsSeeder, DemoSeeder],
})
export class DatabaseModule {}
