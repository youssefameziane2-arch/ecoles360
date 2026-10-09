import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationCanal, RoleCode } from '../../generated/prisma';
import { MailService } from './mail.service';
import { modeleNotification } from './modeles-mail';

/** Courriels traités par passage — voir l'en-tête. */
const LOT = 50;

/** Au-delà, on renonce : l'adresse ne répond pas et ne répondra pas. */
const TENTATIVES_MAX = 5;

/**
 * Expéditeur des courriels en attente — B-53.
 *
 * POURQUOI UNE FILE PLUTÔT QU'UN ENVOI DIRECT. Les notifications naissent au
 * cœur de transactions métier : valider une fiche, modérer un avis, encaisser
 * une facture. Tenir une session SMTP ouverte à l'intérieur d'un `BEGIN`
 * allonge le verrou de plusieurs secondes sous la main d'un serveur
 * extérieur — et si la transaction est ensuite annulée, le courriel est déjà
 * parti pour annoncer un fait qui n'a pas eu lieu. La notification est donc
 * écrite avec `envoyee_le` nul, la transaction se referme, et ce service la
 * reprend après coup.
 *
 * C'EST AUSSI CE QUI LA REND REPRENABLE. Une API redémarrée au mauvais moment
 * ne perd rien : les lignes non envoyées sont toujours là au passage suivant.
 * Un envoi direct, lui, aurait disparu avec le processus.
 *
 * PAR LOTS DE CINQUANTE, pas tout d'un coup. Un envoi massif — une purge
 * d'échéances sur huit mille fiches — saturerait le quota horaire de
 * l'hébergeur de messagerie, qui refuserait alors TOUT, y compris la
 * réinitialisation de mot de passe de quelqu'un qui attend. La file s'écoule
 * en plusieurs passages ; rien ne presse pour une notification.
 *
 * `TENTATIVES_MAX` BORNE L'ACHARNEMENT. Une adresse supprimée échoue à chaque
 * passage ; sans compteur, elle reviendrait toutes les minutes pour toujours
 * et noierait les vraies erreurs dans son bruit. Après cinq échecs, la ligne
 * est laissée en place, non envoyée : elle reste visible dans le centre de
 * notifications, qui est le canal qui, lui, n'échoue jamais.
 */
@Injectable()
export class ExpediteurMailService {
  private readonly logger = new Logger('Mail');

  constructor(
    private readonly db: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  /** Écoule un lot. Rend ce qui est parti et ce qui a échoué. */
  async ecouler(): Promise<{ envoyes: number; echecs: number }> {
    if (!this.mail.actif) {
      return { envoyes: 0, echecs: 0 };
    }

    const enAttente = await this.db.notification.findMany({
      where: {
        canal: NotificationCanal.email,
        envoyee_le: null,
        tentatives: { lt: TENTATIVES_MAX },
      },
      // Les plus anciennes d'abord : une file qui sert les derniers arrivés
      // laisse les premiers attendre indéfiniment dès qu'elle déborde.
      orderBy: { id: 'asc' },
      take: LOT,
      select: {
        id: true,
        type: true,
        contenu: true,
        user: { select: { email: true, role: { select: { code: true } } } },
      },
    });

    const appUrl = (this.config.get<string>('APP_URL') ?? '').replace(/\/+$/, '');
    let envoyes = 0;
    let echecs = 0;

    for (const notification of enAttente) {
      const parti = await this.mail.envoyer(
        modeleNotification(notification.user.email, {
          type: notification.type,
          contenu: notification.contenu,
          // Le superadmin et le secrétariat de la plateforme lisent les écrans
          // d'administration ; l'établissement et le commercial, leur espace.
          // Envoyer le mauvais lien ferait atterrir sur un 403.
          administration: notification.user.role.code === RoleCode.superadmin,
          appUrl,
        }),
      );

      if (parti) {
        envoyes += 1;
        await this.db.notification.update({
          where: { id: notification.id },
          data: { envoyee_le: new Date() },
        });
      } else {
        echecs += 1;
        await this.db.notification.update({
          where: { id: notification.id },
          data: { tentatives: { increment: 1 } },
        });
      }
    }

    if (envoyes > 0 || echecs > 0) {
      this.logger.log(`File écoulée — ${envoyes} parti(s), ${echecs} échec(s)`);
    }

    return { envoyes, echecs };
  }
}
