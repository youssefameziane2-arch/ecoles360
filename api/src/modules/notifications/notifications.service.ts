import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  NotificationCanal,
  NotificationType,
  PermissionPortee,
  RoleCode,
  UserStatut,
  type Prisma,
} from '../../generated/prisma';

/** Notifications rendues au centre — au-delà, on ne les lit plus. */
const PAR_PAGE = 30;

/** Client de transaction, ou le service lui-même hors transaction. */
type Ecrivain = Pick<PrismaService, 'notification' | 'user' | 'etablissement'>;

/**
 * Centre de notifications — table `Notification` du livrable 10 §2.20.
 *
 * LA TABLE EXISTAIT DEPUIS LE PREMIER JOUR ET N'A JAMAIS SERVI. Cinq types,
 * deux canaux (`in_app`, `email`), et pas une ligne écrite : le produit
 * comptait sur le hasard pour qu'un administrateur ouvre le bon écran au bon
 * moment. Une demande de parent arrivée un vendredi soir attendait qu'on
 * pense à regarder.
 *
 * `in_app` SEULEMENT, POUR L'INSTANT. L'envoi de courriel demande un compte
 * SMTP que le projet n'a pas (B-53) ; le canal est porté par la colonne, et
 * le jour où il existe, c'est un second enregistrement par notification —
 * rien de ce service ne change.
 *
 * ÉCRIRE UNE NOTIFICATION NE DOIT JAMAIS FAIRE ÉCHOUER CE QUI LA DÉCLENCHE.
 * Une demande de contact enregistrée dont la notification échoue reste une
 * demande enregistrée, visible dans la file. L'inverse — perdre la demande
 * parce qu'on n'a pas su prévenir — serait absurde. Les appels passent donc
 * par `sansRompre()` quand ils ne sont pas déjà dans la transaction de
 * l'appelant.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('Notifications');

  constructor(private readonly db: PrismaService) {}

  // ---------------------------------------------------------------------------
  //  Lecture — le centre lui-même
  // ---------------------------------------------------------------------------

  /**
   * Les notifications d'un compte, les non lues d'abord.
   *
   * PAS SEULEMENT LES NON LUES : on revient souvent chercher ce qu'on a lu
   * trop vite. Elles sont rangées derrière, pas effacées.
   */
  async lister(userId: bigint) {
    const [notifications, nonLues] = await Promise.all([
      this.db.notification.findMany({
        where: { user_id: userId },
        orderBy: [{ lue_le: { sort: 'asc', nulls: 'first' } }, { id: 'desc' }],
        take: PAR_PAGE,
        select: { id: true, type: true, contenu: true, lue_le: true, envoyee_le: true },
      }),
      this.db.notification.count({ where: { user_id: userId, lue_le: null } }),
    ]);

    return { notifications, non_lues: nonLues };
  }

  /**
   * Marque tout comme lu.
   *
   * TOUT, PAS UNE PAR UNE. Une notification n'est pas une tâche : elle
   * signale, elle ne se traite pas. Ce qu'on traite, c'est l'avis ou la
   * demande qu'elle annonce, et cela se fait sur l'écran dédié. Un bouton par
   * ligne donnerait l'illusion d'une seconde file à vider.
   */
  async marquerLues(userId: bigint): Promise<number> {
    const resultat = await this.db.notification.updateMany({
      where: { user_id: userId, lue_le: null },
      data: { lue_le: new Date() },
    });

    return resultat.count;
  }

  // ---------------------------------------------------------------------------
  //  Écriture — appelée par les services qui déclenchent
  // ---------------------------------------------------------------------------

  /**
   * Prévient l'établissement : son compte propriétaire, et les secrétariats
   * rattachés qui portent la portée donnée.
   *
   * LA PORTÉE COMMANDE LA DIFFUSION (RG05). Une secrétaire à qui l'on a confié
   * les avis n'a pas à être alertée d'une demande de contact : la notification
   * suivrait un accès qu'elle n'a pas, et l'écran qu'elle ouvrirait lui
   * répondrait 403.
   */
  async pourEtablissement(
    tx: Ecrivain,
    etablissementId: bigint,
    portee: PermissionPortee,
    type: NotificationType,
    contenu: string,
  ): Promise<void> {
    const fiche = await tx.etablissement.findUnique({
      where: { id: etablissementId },
      select: { proprietaire_user_id: true },
    });

    const secretariats = await tx.user.findMany({
      where: {
        etablissement_rattache_id: etablissementId,
        statut: UserStatut.actif,
        role: { code: RoleCode.secretariat },
        permissions: { some: { portee, revoquee_le: null } },
      },
      select: { id: true },
    });

    const destinataires = [
      ...(fiche?.proprietaire_user_id ? [fiche.proprietaire_user_id] : []),
      ...secretariats.map((compte) => compte.id),
    ];

    await this.ecrire(tx, destinataires, type, contenu);
  }

  /**
   * Prévient l'administration — tous les comptes `superadmin` actifs.
   *
   * TOUS, PAS UN SEUL. Ils partagent les mêmes files ; n'en prévenir qu'un
   * reviendrait à désigner un responsable que rien ne désigne, et la file
   * dormirait pendant ses congés.
   */
  async pourAdministration(tx: Ecrivain, type: NotificationType, contenu: string): Promise<void> {
    const admins = await tx.user.findMany({
      where: { statut: UserStatut.actif, role: { code: RoleCode.superadmin } },
      select: { id: true },
    });

    await this.ecrire(
      tx,
      admins.map((compte) => compte.id),
      type,
      contenu,
    );
  }

  /**
   * Exécute un envoi sans jamais rompre l'action qui l'a déclenché.
   *
   * L'ÉCHEC EST JOURNALISÉ, PAS PROPAGÉ. Perdre une demande de contact parce
   * qu'on n'a pas su prévenir serait absurde : la demande est le bien, la
   * notification n'en est que l'écho.
   */
  async sansRompre(action: () => Promise<void>): Promise<void> {
    try {
      await action();
    } catch (erreur) {
      this.logger.warn(
        `Notification non écrite : ${erreur instanceof Error ? erreur.message : String(erreur)}`,
      );
    }
  }

  /**
   * `createMany` plutôt qu'une boucle : une seule requête quel que soit le
   * nombre de destinataires, et surtout une seule occasion d'échouer.
   *
   * `envoyee_le` EST POSÉ TOUT DE SUITE sur le canal `in_app` : la
   * notification EST envoyée dès qu'elle est écrite, puisqu'elle s'affiche à
   * la prochaine ouverture. Pour le canal `email`, ce champ gardera son sens
   * — la date où le courriel est réellement parti, distincte de sa création.
   */
  private async ecrire(
    tx: Ecrivain,
    destinataires: bigint[],
    type: NotificationType,
    contenu: string,
  ): Promise<void> {
    if (destinataires.length === 0) {
      return;
    }

    const lignes: Prisma.NotificationCreateManyInput[] = destinataires.map((userId) => ({
      user_id: userId,
      type,
      // Tronqué à la colonne : `VarChar(255)`, et MySQL couperait en silence.
      contenu: contenu.slice(0, 255),
      canal: NotificationCanal.in_app,
      envoyee_le: new Date(),
    }));

    await tx.notification.createMany({ data: lignes });
  }
}
