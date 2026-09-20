import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Command, CommandRunner } from 'nest-commander';
import { DemoSeeder } from './seeders/demo.seeder';
import { ReferentielsSeeder } from './seeders/referentiels.seeder';

/**
 * `db:seed` — livrable 10 §3.
 *
 * Deux familles, dans cet ordre :
 *   · les RÉFÉRENTIELS, dans tous les environnements — sans eux l'application
 *     n'a pas de sens (pas de rôle, donc pas de compte ; pas de ville, donc pas
 *     de fiche ; pas de taux de TVA, donc pas de facture) ;
 *   · les DONNÉES DE DÉMONSTRATION, jamais en production.
 *
 * Le refus en production est un garde-fou volontairement brutal : ces données
 * comportent des comptes aux mots de passe connus. Les poser à côté de vraies
 * fiches clientes serait une faille, pas une maladresse.
 *
 * L'ensemble est idempotent : rejouer la commande ne duplique rien.
 *
 *   pnpm --filter api db:seed
 *   docker compose run --rm api node dist/cli.js db:seed
 */
@Injectable()
@Command({ name: 'db:seed', description: 'Référentiels puis données de démonstration' })
export class SeedCommand extends CommandRunner {
  private readonly logger = new Logger('SeedCommand');

  constructor(
    private readonly config: ConfigService,
    private readonly referentiels: ReferentielsSeeder,
    private readonly demo: DemoSeeder,
  ) {
    super();
  }

  // Signature imposée par CommandRunner. La commande ne prend ni argument ni
  // option : son comportement est entièrement dicté par NODE_ENV.
  async run(_parametres: string[]): Promise<void> {
    const environnement = this.config.get<string>('NODE_ENV', 'development');

    this.logger.log(`Référentiels (environnement : ${environnement})`);
    await this.referentiels.roles(); // RG25 — préalable à tout compte
    await this.referentiels.villes();
    await this.referentiels.niveauxFilieres();
    await this.referentiels.parametresFacturation();
    await this.referentiels.contenuSite();

    if (environnement === 'production') {
      this.logger.warn(
        'Données de démonstration ignorées : NODE_ENV=production. ' +
          'Les comptes de démonstration ont des mots de passe connus.',
      );
      return;
    }

    this.logger.log('Données de démonstration');
    const comptes = await this.demo.comptes();
    const { almassira } = await this.demo.donnees(comptes);
    await this.demo.leads(almassira, comptes.etablissement);
    await this.demo.cms(almassira, comptes);
    await this.demo.audit(almassira, comptes);

    this.logger.log('Base de démonstration reconstruite.');
  }
}
