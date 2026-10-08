import { Controller, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Utilisateur } from '../../common/decorators';
import type { UtilisateurAuthentifie } from '../auth/session.types';
import { NotificationsService } from './notifications.service';

/**
 * Centre de notifications — toutes les sessions, quel que soit le rôle.
 *
 * PAS DE `@Roles()`, ET C'EST VOULU. Chaque rôle a les siennes :
 * l'administration les files à traiter, l'établissement ses demandes et son
 * échéance, le commercial ses prospects. La portée est donnée par
 * `user_id` — on ne lit que les siennes, et il n'y a aucun paramètre qui
 * permette d'en désigner d'autres.
 */
@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Mes notifications, les non lues d’abord',
    description: 'Bornées au compte de la session — aucun identifiant en paramètre.',
  })
  mesNotifications(@Utilisateur() utilisateur: UtilisateurAuthentifie) {
    return this.notifications.lister(utilisateur.userId);
  }

  /**
   * TOUT D'UN COUP, PAS LIGNE PAR LIGNE. Une notification signale, elle ne se
   * traite pas : ce qu'on traite, c'est l'avis ou la demande qu'elle annonce,
   * sur son écran. Un bouton par ligne donnerait l'illusion d'une seconde
   * file à vider.
   */
  @Patch('lues')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Marquer toutes mes notifications comme lues' })
  @ApiResponse({ status: 204, description: 'Marquées lues.' })
  async marquerLues(@Utilisateur() utilisateur: UtilisateurAuthentifie): Promise<void> {
    await this.notifications.marquerLues(utilisateur.userId);
  }
}
