import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
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
 * DEUX LIGNES PAR NOTIFICATION DEPUIS B-53, exactement comme ce commentaire
 * l'annonçait : une en `in_app`, posée envoyée puisqu'elle s'affiche dès
 * qu'elle existe, et une en `email` laissée en attente, que
 * `ExpediteurMailService` reprend hors transaction. La seconde n'est écrite
 * que si un compte SMTP est configuré — sinon elle resterait éternellement en
 * file, et le centre compterait des envois qui n'auront jamais lieu.
 *
 * LE CENTRE NE MONTRE QUE `in_app`, et c'est ce qui rend la cloche juste. Les
 * deux canaux portent le même texte : les afficher tous les deux doublerait
 * chaque ligne et ferait compter deux non-lues pour un seul événement.
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

  constructor(
    private readonly db: PrismaService,
    private readonly mail: MailService,
  ) {}

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
    // `in_app` SEULEMENT : le doublon `email` porte le même texte, et le
    // montrer ferait apparaître chaque événement deux fois dans la cloche.
    const centre = { user_id: userId, canal: NotificationCanal.in_app };

    const [notifications, nonLues] = await Promise.all([
      this.db.notification.findMany({
        where: centre,
        orderBy: [{ lue_le: { sort: 'asc', nulls: 'first' } }, { id: 'desc' }],
        take: PAR_PAGE,
        select: { id: true, type: true, contenu: true, lue_le: true, envoyee_le: true },
      }),
      this.db.notification.count({ where: { ...centre, lue_le: null } }),
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
      // Borné à `in_app`, comme la lecture : marquer lue une ligne `email`
      // n'aurait aucun sens — personne ne lit une file d'envoi — et le
      // compteur rendu ici ne correspondrait plus à ce que la cloche affichait.
      where: { user_id: userId, canal: NotificationCanal.in_app, lue_le: null },
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

    // Tronqué à la colonne : `VarChar(255)`, et MySQL couperait en silence.
    const texte = contenu.slice(0, 255);
    const maintenant = new Date();

    const lignes: Prisma.NotificationCreateManyInput[] = destinataires.flatMap((userId) => [
      {
        user_id: userId,
        type,
        contenu: texte,
        canal: NotificationCanal.in_app,
        envoyee_le: maintenant,
      },
      // LE COURRIEL EST MIS EN FILE, PAS ENVOYÉ D'ICI. On est peut-être dans
      // la transaction de l'appelant : ouvrir une session SMTP y tiendrait un
      // verrou sous la main d'un serveur extérieur, et un `ROLLBACK` ensuite
      // laisserait un message parti pour un fait qui n'a pas eu lieu.
      // `ExpediteurMailService` reprend la ligne après la validation.
      //
      // RIEN N'EST MIS EN FILE SANS COMPTE SMTP : la ligne resterait en
      // attente pour toujours, et donnerait à lire une file d'envois qui
      // n'auront jamais lieu.
      ...(this.mail.actif
        ? [{ user_id: userId, type, contenu: texte, canal: NotificationCanal.email }]
        : []),
    ]);

    await tx.notification.createMany({ data: lignes });
  }
}
