import { Global, Inject, Logger, Module, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

/**
 * Module Redis — global, à l'image de `PrismaModule`.
 *
 * Le module POSSÈDE la connexion : c'est lui qui la crée, c'est lui qui la
 * ferme. La conséquence pratique est qu'un test qui remplace `RedisService` par
 * un double — la suite « Redis en échec » du livrable 13 §2.2 — ne laisse pas
 * une socket ouverte : Jest rendrait la main sans jamais terminer, et la CI
 * expirerait sur une cause invisible.
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const logger = new Logger('RedisClient');
        const url = config.getOrThrow<string>('REDIS_URL');

        const client = new Redis(url, {
          // Valeur exigée par BullMQ, qui refuse de démarrer avec la valeur par
          // défaut d'ioredis (livrable 11 §6) : la poser ici évite une seconde
          // connexion divergente au lot des files.
          maxRetriesPerRequest: null,
          enableReadyCheck: true,
          // Sans plafond, une Redis absente ferait boucler la reconnexion en
          // silence ; 2 s de palier maximum gardent la reprise rapide sans
          // saturer le journal.
          retryStrategy: (tentative) => Math.min(tentative * 200, 2000),
        });

        client.on('ready', () => logger.log('Connexion Redis établie.'));
        // Sans écouteur « error », ioredis remonte une exception non capturée
        // et abat le processus dès la première coupure : la sonde doit pouvoir
        // rapporter un 503, pas mourir avec lui.
        client.on('error', (erreur: Error) => logger.warn(`Redis : ${erreur.message}`));

        return client;
      },
    },
    RedisService,
  ],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  private readonly logger = new Logger(RedisModule.name);

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async onModuleDestroy(): Promise<void> {
    if (this.client.status === 'end') {
      return;
    }

    try {
      // `quit()` vide la file de commandes avant de fermer — c'est la sortie
      // propre quand le serveur répond.
      await this.client.quit();
    } catch {
      // Redis déjà injoignable : `quit()` rejette, et la socket resterait en
      // attente de reconnexion. On coupe net plutôt que de retenir l'arrêt.
      this.client.disconnect();
    }

    this.logger.log('Connexion Redis fermée.');
  }
}
