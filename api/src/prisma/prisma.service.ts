import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';

/**
 * Accès aux données — livrable 7 §1 : « Prisma 5 · PrismaService (provider
 * injectable, OnModuleInit/OnModuleDestroy) ».
 *
 * C'est le seul point d'entrée vers MySQL : les douze services métier du
 * livrable 11 §4 l'injectent, y compris pour leurs transactions
 * `$transaction` + `$queryRaw … FOR UPDATE` (RG12, RG14, RG27).
 *
 * `$connect()` est appelé à l'initialisation du module plutôt que laissé à la
 * connexion paresseuse de Prisma : la première requête n'a pas à payer
 * l'établissement de la connexion, et le journal de démarrage dit tout de
 * suite si la base répond.
 *
 * MAIS UN ÉCHEC N'INTERROMPT PAS LE DÉMARRAGE — et c'est délibéré. Abandonner
 * ici produirait une boucle de redémarrage : le conteneur mourrait avant
 * d'avoir pu répondre, `GET /api/v1/health` ne répondrait jamais, et
 * l'exploitant lirait « connection refused » sans savoir si la panne vient de
 * l'API ou de sa base. En restant debout, le service répond 503 en nommant la
 * dépendance fautive (lot 1 §5), le HEALTHCHECK le marque `unhealthy`
 * (livrable 14 §2.2) — donc rien ne le considère comme prêt —, et Prisma
 * rétablit la connexion de lui-même à la requête suivante dès que MySQL
 * revient. Le diagnostic est exact et la reprise automatique.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Connexion MySQL établie.');
    } catch (erreur) {
      const message = erreur instanceof Error ? erreur.message.split('\n')[0] : String(erreur);
      this.logger.error(
        `Connexion MySQL indisponible au démarrage : ${message}. ` +
          "L'API démarre quand même et répondra 503 sur /api/v1/health jusqu'au rétablissement.",
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Connexion MySQL fermée.');
  }

  /**
   * Aller-retour minimal vers MySQL, utilisé par la sonde de santé.
   *
   * `SELECT 1` n'interroge aucune table : la sonde teste la connexion et la
   * capacité du serveur à répondre, pas l'état du schéma — elle reste donc
   * valable avant la première migration comme après la vingtième.
   */
  async verifierConnexion(): Promise<void> {
    await this.$queryRaw`SELECT 1`;
  }
}
