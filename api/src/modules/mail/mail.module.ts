import { Global, Module } from '@nestjs/common';
import { ExpediteurMailService } from './expediteur.service';
import { MailService } from './mail.service';

/**
 * Courriel — B-53, livrable 11 §6.
 *
 * `@Global()` POUR LA MÊME RAISON QUE `NotificationsModule` : les services qui
 * ont quelque chose à annoncer sont répartis dans tout le domaine métier
 * (avis, contacts, facturation, propositions, authentification), et les
 * obliger chacun à importer ce module produirait une liste d'imports qu'on
 * oublie d'allonger — un oubli qui ne se voit pas au typage, seulement au
 * refus de Nest de démarrer.
 *
 * ÉCART ASSUMÉ AVEC LE LIVRABLE, le même que pour les purges : il range les
 * envois dans une file BullMQ `mail` servie par un conteneur `worker`. La
 * table `notifications` EST déjà cette file — durable, reprenable après un
 * redémarrage, et visible par l'administrateur dans un écran qu'il a déjà.
 * Ajouter BullMQ demanderait un conteneur, un état de job dans Redis et une
 * seconde source de vérité sur ce qui est parti.
 */
@Global()
@Module({
  providers: [MailService, ExpediteurMailService],
  exports: [MailService, ExpediteurMailService],
})
export class MailModule {}
