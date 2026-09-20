import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

/**
 * Accès à Redis 7 — livrable 7 §1.
 *
 * Une seule instance dessert les quatre usages du projet : sessions Passport
 * (connect-redis), files BullMQ, CacheModule et compteurs de limitation de
 * débit. Les lots suivants s'y branchent ; le lot 1 n'en utilise que la sonde.
 *
 * Le service expose un COMPORTEMENT, il ne possède pas la connexion : sa
 * fermeture appartient à `RedisModule`, qui l'a créée. Un test qui remplace ce
 * service par un double — comme le fait la suite « Redis en échec » du
 * livrable 13 — ne laisse donc aucune connexion ouverte derrière lui.
 */
@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  /** Client brut, pour les modules qui en ont besoin (BullMQ, connect-redis). */
  get instance(): Redis {
    return this.client;
  }

  /**
   * Aller-retour minimal vers Redis, utilisé par la sonde de santé.
   *
   * `PING` doit répondre `PONG` : une réponse différente signale un serveur en
   * chargement (`LOADING`) ou un intermédiaire qui intercepte — les deux
   * comptent comme une indisponibilité, pas comme un succès.
   */
  async verifierConnexion(): Promise<void> {
    const reponse: string = await this.client.ping();

    if (reponse !== 'PONG') {
      throw new Error(`Réponse inattendue au PING Redis : « ${reponse} »`);
    }
  }
}
