import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles, Utilisateur } from '../../common/decorators';
import { RoleCode } from '../../generated/prisma';
import type { UtilisateurAuthentifie } from '../auth/session.types';
import { CrmService } from './crm.service';
import { CrmLectureService } from './crm-lecture.service';
import { StatutProspectDto } from './dto/statut-prospect.dto';
import { RelanceDto } from './dto/relance.dto';

/**
 * CRM — pipeline commercial d'écoles360 (RG17, RG18).
 *
 * UN SEUL CONTRÔLEUR POUR DEUX ÉCRANS, et c'est la même donnée : la maquette
 * donne « CRM Clients » à l'administration et « Mes leads » au commercial,
 * mais ce sont les mêmes prospects — vus en entier, ou bornés au portefeuille
 * de celui qui regarde.
 *
 * LA PORTÉE SE DÉRIVE DU RÔLE, ICI ET NULLE PART AILLEURS. Les services la
 * reçoivent en paramètre et ne la devinent jamais : c'est ce qui rend
 * impossible le défaut où un service oublierait de filtrer et rendrait à un
 * commercial le portefeuille de ses collègues.
 *
 * LES ÉCRITURES NE SONT PAS BORNÉES ICI mais dans `CrmService.sien()`, qui
 * répond 404 sur le prospect d'un autre — un 403 confirmerait son existence.
 */
@ApiTags('crm')
@Roles(RoleCode.superadmin, RoleCode.commercial)
@Controller('crm')
export class CrmController {
  constructor(
    private readonly crm: CrmService,
    private readonly lecture: CrmLectureService,
  ) {}

  /** `null` pour l'administration — elle voit tout ; son identifiant pour un commercial. */
  private portee(utilisateur: UtilisateurAuthentifie): bigint | null {
    return utilisateur.role === RoleCode.superadmin ? null : utilisateur.userId;
  }

  @Get('indicateurs')
  @ApiOperation({
    summary: 'Indicateurs du pipeline — en cours, transformés, taux, relances dues, commissions',
    description:
      'Le taux de transformation se calcule sur les dossiers CLOS : compter les prospects en ' +
      'cours comme des échecs ferait baisser le taux à mesure qu’on prospecte.',
  })
  indicateurs(@Utilisateur() utilisateur: UtilisateurAuthentifie) {
    return this.lecture.indicateurs(this.portee(utilisateur));
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Le pipeline, colonne par colonne (RG17)' })
  pipeline(@Utilisateur() utilisateur: UtilisateurAuthentifie) {
    return this.lecture.pipeline(this.portee(utilisateur));
  }

  @Get('relances')
  @ApiOperation({
    summary: 'Relances à faire, les plus anciennes d’abord — l’agenda',
    description: 'Une relance « due » est programmée, pas encore effectuée, et sa date est passée.',
  })
  relances(@Utilisateur() utilisateur: UtilisateurAuthentifie) {
    return this.lecture.relancesDues(this.portee(utilisateur));
  }

  @Get('commissions')
  @ApiOperation({ summary: 'Commissions et leur facture d’origine (RG18)' })
  commissions(@Utilisateur() utilisateur: UtilisateurAuthentifie) {
    return this.lecture.commissions(this.portee(utilisateur));
  }

  @Patch('prospects/:id/statut')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Faire avancer un prospect dans le pipeline',
    description:
      '« transformé » n’est pas posable ici : ce statut signifie qu’une fiche existe, et il est ' +
      'posé en la créant.',
  })
  @ApiResponse({ status: 404, description: 'Inconnu, ou hors du portefeuille du demandeur.' })
  changerStatut(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: StatutProspectDto,
  ) {
    return this.crm.changerStatut(BigInt(id), dto.statut, {
      userId: utilisateur.userId,
      role: utilisateur.role,
    });
  }

  @Post('prospects/:id/relances')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Programmer une relance, ou consigner un échange qui vient d’avoir lieu (RG17)',
    description: 'Un prospect « nouveau » passe à « à contacter » dès sa première relance.',
  })
  ajouterRelance(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RelanceDto,
  ) {
    return this.crm.ajouterRelance(BigInt(id), dto, {
      userId: utilisateur.userId,
      role: utilisateur.role,
    });
  }

  @Patch('relances/:id/effectuee')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Marquer une relance programmée comme faite' })
  @ApiResponse({ status: 409, description: 'Relance déjà marquée faite.' })
  effectuerRelance(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.crm.effectuerRelance(BigInt(id), {
      userId: utilisateur.userId,
      role: utilisateur.role,
    });
  }
}
