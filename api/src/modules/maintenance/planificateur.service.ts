import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExpediteurMailService } from '../mail/expediteur.service';
import { PurgesService } from './purges.service';
import { RappelsService } from './rappels.service';

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

  constructor(
    private readonly purges: PurgesService,
    private readonly rappels: RappelsService,
    private readonly mail: ExpediteurMailService,
  ) {}

  /**
   * La file de courriels, toutes les minutes.
   *
   * PAS PLUS SOUVENT : une notification n'est pas une alerte temps réel, et
   * descendre à dix secondes multiplierait par six les requêtes sur une table
   * presque toujours vide. Pas moins souvent non plus — une réinitialisation
   * de mot de passe qui met un quart d'heure à partir fait recommencer la
   * demande, et le second jeton invalide le premier.
   *
   * LE SERVICE SE TAIT QUAND AUCUN COMPTE SMTP N'EST CONFIGURÉ : il rend
   * aussitôt la main, sans toucher la base.
   */
  @Cron(CronExpression.EVERY_MINUTE, { name: 'mail:file' })
  async ecoulerCourriels(): Promise<void> {
    await this.executer('mail:file', () => this.mail.ecouler());
  }

  @Cron('0 0 2 * * *', { name: 'purge:demandes', timeZone: 'Africa/Casablanca' })
  async purgerDemandes(): Promise<void> {
    await this.executer('purge:demandes', () => this.purges.demandes());
  }

  @Cron('0 30 2 * * *', { name: 'purge:traces', timeZone: 'Africa/Casablanca' })
  async purgerTraces(): Promise<void> {
    await this.executer('purge:traces', () => this.purges.traces());
  }

  // Après `purge:traces` : les deux balaient le même seuil de douze mois, et
  // les enchaîner évite qu'une nuit les traite et l'autre pas.
  @Cron('0 45 2 * * *', { name: 'purge:recherches', timeZone: 'Africa/Casablanca' })
  async purgerRecherches(): Promise<void> {
    await this.executer('purge:recherches', () => this.purges.recherches());
  }

  @Cron('0 0 4 * * 0', { name: 'purge:audit', timeZone: 'Africa/Casablanca' })
  async purgerAudit(): Promise<void> {
    await this.executer('purge:audit', () => this.purges.purgerAudit());
  }

  /**
   * 08 h 00 — PAS LA NUIT, CONTRAIREMENT AUX PURGES. Un rappel est fait pour
   * être lu : le poser à 2 h du matin le noierait sous les notifications de
   * la journée avant que quiconque ouvre son écran. Les purges, elles, ne
   * s'adressent à personne.
   */
  @Cron('0 0 8 * * *', { name: 'rappel:echeances', timeZone: 'Africa/Casablanca' })
  async rappelerEcheances(): Promise<void> {
    await this.executer('rappel:echeances', () => this.rappels.echeancesProches());
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
