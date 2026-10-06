import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PurgesService } from './purges.service';

/**
 * Tâches récurrentes — livrable 10 §6.3.
 *
 * NE TOURNE QUE DANS LE CONTENEUR `scheduler`, jamais dans `api`. Si ce
 * service était chargé par `AppModule`, chaque réplique de l'API déclencherait
 * les mêmes purges à la même seconde : la loi 09-08 n'en souffrirait pas, mais
 * l'agrégation des traces, elle, écrirait les mêmes lignes en concurrence.
 * Un exemplaire unique est la garantie la plus simple, et c'est pourquoi le
 * livrable 14 déclare `scheduler` comme un service à part.
 *
 * LES HEURES SONT CELLES DU LIVRABLE, pas des valeurs choisies : 02 h 00 pour
 * les demandes, 02 h 30 pour les traces, dimanche 04 h 00 pour le journal.
 * Elles sont décalées entre elles pour qu'une purge longue n'empiète pas sur
 * la suivante, et placées avant la sauvegarde de 03 h — celle-ci enregistre
 * donc une base déjà minimisée.
 *
 * UNE TÂCHE QUI ÉCHOUE NE DOIT PAS EMPORTER LES AUTRES. Chacune est donc
 * enveloppée : une erreur est journalisée et la planification continue. Sans
 * cela, une exception non rattrapée dans un @Cron remonterait au processus et
 * pourrait arrêter le conteneur, ce qui suspendrait toutes les purges
 * suivantes sans que rien ne le signale.
 */
@Injectable()
export class PlanificateurService {
  private readonly logger = new Logger('Planificateur');

  constructor(private readonly purges: PurgesService) {}

  @Cron('0 0 2 * * *', { name: 'purge:demandes', timeZone: 'Africa/Casablanca' })
  async purgerDemandes(): Promise<void> {
    await this.executer('purge:demandes', () => this.purges.demandes());
  }

  @Cron('0 30 2 * * *', { name: 'purge:traces', timeZone: 'Africa/Casablanca' })
  async purgerTraces(): Promise<void> {
    await this.executer('purge:traces', () => this.purges.traces());
  }

  @Cron('0 0 4 * * 0', { name: 'purge:audit', timeZone: 'Africa/Casablanca' })
  async purgerAudit(): Promise<void> {
    await this.executer('purge:audit', () => this.purges.purgerAudit());
  }

  private async executer(nom: string, tache: () => Promise<unknown>): Promise<void> {
    try {
      await tache();
    } catch (erreur) {
      this.logger.error(
        `${nom} a échoué — la planification continue`,
        erreur instanceof Error ? erreur.stack : String(erreur),
      );
    }
  }
}
