import { Logger } from '@nestjs/common';
import { CommandFactory } from 'nest-commander';
import { CliModule } from './cli.module';

/**
 * Point d'entrée des commandes — compilé en `dist/cli.js`.
 *
 * Le fichier s'appelle `cli.ts` et non `main.cli.ts` : le livrable 10 §3 nomme
 * la source `main.cli.ts` mais les procédures d'exploitation du livrable 14
 * invoquent `node dist/cli.js`. Les deux ne peuvent pas être vrais — tsc
 * produirait `dist/main.cli.js`. C'est le chemin d'exécution qui fait foi :
 * c'est lui qui figure dans le runbook (docs/BACKLOG.md, B-15).
 *
 * Même image que l'API, commande différente (livrable 14 §2) :
 *
 *   docker compose run --rm api node dist/cli.js db:seed
 *
 * `logger: ['error', 'warn', 'log']` plutôt que le silence : une commande
 * lancée dans un conteneur éphémère n'a que sa sortie standard pour dire ce
 * qu'elle a fait, et son journal est la seule trace qui en restera.
 */
async function bootstrap(): Promise<void> {
  await CommandFactory.run(CliModule, {
    logger: ['error', 'warn', 'log'],
    // Une erreur dans un seeder doit faire échouer le processus : en CI, un
    // seed silencieusement incomplet donnerait des tests rouges sans cause
    // lisible (livrable 14 §3).
    errorHandler: (erreur) => {
      new Logger('CLI').error(erreur.message, erreur.stack);
      process.exitCode = 1;
    },
  });
}

void bootstrap();
