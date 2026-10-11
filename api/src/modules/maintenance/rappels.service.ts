import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ParametresFacturationService } from '../admin/parametres-facturation.service';
import {
  AbonnementStatut,
  NotificationType,
  PermissionPortee,
  type Prisma,
} from '../../generated/prisma';

/** Repli si le paramètre a disparu — une semaine, la valeur semée. */
const RAPPEL_DEFAUT_J = 7;

/**
 * Rappel d'échéance d'abonnement — RG14, paramètre `rappel_echeance_j`.
 *
 * CE PARAMÈTRE EXISTAIT ET NE DÉCLENCHAIT RIEN. Il est réglable depuis l'écran
 * « Paramètres » depuis le premier jour, semé à 7 jours, et aucune ligne de
 * code ne le lisait. Un abonnement expirait, la fiche cessait de pouvoir être
 * validée, et personne n'avait été prévenu — ni l'école, ni l'administration.
 *
 * L'ÉCOLE ET L'ADMINISTRATION, LES DEUX. L'école parce que c'est elle qui
 * renouvelle ; l'administration parce que c'est elle qui encaisse et qui perd
 * la publication d'une fiche si rien n'est fait (RG14). Ne prévenir que l'une
 * laisserait l'autre découvrir l'expiration après coup.
 *
 * UNE SEULE FOIS PAR ABONNEMENT, et c'est ce qui demande le plus de soin : la
 * tâche tourne chaque nuit, et sans garde elle réécrirait le même rappel sept
 * nuits d'affilée. Le garde est l'existence d'une notification du même type
 * pour ce compte depuis la dernière ouverture de fenêtre — pas un drapeau
 * ajouté au schéma, qu'il aurait fallu remettre à zéro au renouvellement.
 */
@Injectable()
export class RappelsService {
  private readonly logger = new Logger('Rappels');

  constructor(
    private readonly db: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly parametres: ParametresFacturationService,
  ) {}

  async echeancesProches(): Promise<number> {
    const jours = await this.parametres.entier('rappel_echeance_j', RAPPEL_DEFAUT_J);
    const limite = new Date(Date.now() + jours * 24 * 3600 * 1000);

    /**
     * `echeance <= limite` ET `>= aujourd'hui` : un abonnement DÉJÀ expiré
     * n'est pas « proche de l'échéance », il est échu. Le rappeler
     * indéfiniment transformerait l'alerte en bruit, et c'est le propre d'une
     * alerte permanente de ne plus être lue.
     */
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    const abonnements = await this.db.abonnement.findMany({
      where: {
        statut: { in: [AbonnementStatut.actif, AbonnementStatut.essai] },
        echeance: { gte: aujourdhui, lte: limite },
      },
      select: {
        id: true,
        formule: true,
        echeance: true,
        etablissement: { select: { id: true, nom: true } },
      },
    });

    let envoyes = 0;

    for (const abonnement of abonnements) {
      const deja = await this.dejaRappele(abonnement.etablissement.id, jours);

      if (deja) {
        continue;
      }

      const essai = abonnement.formule === 'essai_gratuit';
      const echeance = abonnement.echeance.toISOString().slice(0, 10);

      await this.notifications.sansRompre(async () => {
        await this.notifications.pourEtablissement(
          this.db,
          abonnement.etablissement.id,
          // LA PORTÉE `fiches` ET NON `contacts` : c'est la publication de la
          // fiche qui est en jeu (RG14), pas la boîte de demandes.
          PermissionPortee.fiches,
          NotificationType.echeance_abonnement,
          essai
            ? `Votre essai gratuit se termine le ${echeance}. Sans abonnement, votre fiche ne pourra plus être publiée.`
            : `Votre abonnement arrive à échéance le ${echeance}.`,
        );

        await this.notifications.pourAdministration(
          this.db,
          NotificationType.echeance_abonnement,
          `${abonnement.etablissement.nom} — ${essai ? 'essai gratuit' : 'abonnement'} à échéance le ${echeance}.`,
        );
      });

      envoyes += 1;
    }

    this.logger.log(`Rappels d'échéance : ${envoyes} abonnement(s) à ${jours} jours ou moins`);

    return envoyes;
  }

  /**
   * Un rappel a-t-il déjà été posé pour cet établissement dans la fenêtre ?
   *
   * LA FENÊTRE SERT DE MÉMOIRE. Chercher « une notification d'échéance pour ce
   * compte depuis `jours` jours » suffit : au renouvellement, l'échéance
   * repart loin, la fenêtre se vide d'elle-même, et le rappel suivant pourra
   * partir sans qu'on ait eu à réinitialiser quoi que ce soit.
   */
  private async dejaRappele(etablissementId: bigint, jours: number): Promise<boolean> {
    const depuis = new Date(Date.now() - jours * 24 * 3600 * 1000);

    const where: Prisma.NotificationWhereInput = {
      type: NotificationType.echeance_abonnement,
      envoyee_le: { gte: depuis },
      user: {
        OR: [
          { etablissementsPossedes: { some: { id: etablissementId } } },
          { etablissement_rattache_id: etablissementId },
        ],
      },
    };

    return (await this.db.notification.count({ where })) > 0;
  }
}
