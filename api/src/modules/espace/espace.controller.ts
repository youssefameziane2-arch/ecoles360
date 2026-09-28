import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PorteeEspace, Roles, Utilisateur } from '../../common/decorators';
import { PorteeEspaceGuard } from '../../common/guards';
import { AppException, ERROR_CODES } from '../../common/errors';
import { POIDS_MAX_OCTETS, type FichierTeleverse } from '../../common/stockage/stockage.service';
import { PermissionPortee, RoleCode } from '../../generated/prisma';
import type { UtilisateurAuthentifie } from '../auth/session.types';
import { EspaceService } from './espace.service';
import { FicheProposalService } from './fiche-proposal.service';
import { ProposerFicheDto } from './dto/proposer-fiche.dto';
import { RepondreAvisDto } from './dto/repondre-avis.dto';
import { TransitionDemandeDto } from './dto/transition-demande.dto';
import { PhotosService } from '../photos/photos.service';
import { LegendePhotoDto } from '../photos/dto/legende-photo.dto';
import { OrdrePhotosDto } from '../photos/dto/ordre-photos.dto';
import { FORMULAIRE_PHOTO, FORMULAIRE_PHOTOS, PHOTOS_PAR_ENVOI } from '../photos/televersement';

/**
 * Espace connecté établissement — livrable 11 §3.2.
 *
 * Miroir secrétariat (RG05) : les mêmes routes servent un compte
 * `secretariat` rattaché, filtré par `PorteeEspaceGuard` selon la portée
 * déléguée — pas de duplication de controller sous `/secretariat`, ce qui
 * éviterait deux implémentations à faire diverger.
 */
@ApiTags('mon-espace')
@Roles(RoleCode.etablissement, RoleCode.secretariat)
@UseGuards(PorteeEspaceGuard)
@Controller('mon-espace')
export class EspaceController {
  constructor(
    private readonly espace: EspaceService,
    private readonly propositions: FicheProposalService,
    private readonly photos: PhotosService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Indicateurs du mois' })
  tableauDeBord(@Utilisateur() utilisateur: UtilisateurAuthentifie) {
    return this.espace.tableauDeBord(this.etablissementIdOuRefuse(utilisateur));
  }

  /**
   * SANS `@PorteeEspace`, COMME `dashboard` : un secrétariat rattaché lit ces
   * chiffres quelle que soit sa délégation. Il les lit déjà — le tableau de
   * bord rend `vues_ce_mois` et `canaux` sans portée — et les lui retirer ici
   * créerait une règle que la RG05 ne pose pas : ses trois portées (`fiches`,
   * `contacts`, `avis`) bornent des écritures et des données personnelles,
   * pas l'audience agrégée de la fiche.
   */
  @Get('statistiques')
  @ApiOperation({
    summary: 'Statistiques de ma fiche — vues du mois, vues mensuelles, origine des contacts',
    description:
      'Bornées à l’établissement de la session : aucun identifiant ne passe en paramètre.',
  })
  statistiques(@Utilisateur() utilisateur: UtilisateurAuthentifie) {
    return this.espace.statistiques(this.etablissementIdOuRefuse(utilisateur));
  }

  @Get('fiche')
  @PorteeEspace(PermissionPortee.fiches)
  @ApiOperation({ summary: 'Ma fiche' })
  async fiche(@Utilisateur() utilisateur: UtilisateurAuthentifie) {
    const etablissementId = this.etablissementIdOuRefuse(utilisateur);
    const [fiche, propositionEnAttente] = await Promise.all([
      this.espace.fiche(etablissementId),
      this.propositions.enAttentePour(etablissementId),
    ]);

    return { ...fiche, proposition_en_attente: propositionEnAttente };
  }

  @Post('fiche/propositions')
  @PorteeEspace(PermissionPortee.fiches)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Proposer une modification de fiche',
    description: 'Crée une proposition en attente — aucune écriture directe (RG20).',
  })
  @ApiResponse({ status: 201, description: 'Proposition créée, en attente de validation.' })
  @ApiResponse({
    status: 409,
    description: 'Une proposition est déjà en attente pour cette fiche.',
  })
  proposer(@Utilisateur() utilisateur: UtilisateurAuthentifie, @Body() dto: ProposerFicheDto) {
    return this.propositions.proposer(
      this.etablissementIdOuRefuse(utilisateur),
      utilisateur.userId,
      utilisateur.role,
      dto,
    );
  }

  /**
   * LES PHOTOS NE PASSENT PAS PAR LA FILE DE PROPOSITIONS (RG20).
   *
   * Le circuit de validation existe pour le TEXTE de la fiche — tarifs,
   * promesses, effectifs — dont une affirmation fausse engage la plateforme.
   * Une photo de cour de récréation n'appelle pas la même relecture, et
   * l'exiger reviendrait à faire attendre deux jours un établissement qui
   * corrige une image floue. Le levier de contrôle reste entier :
   * l'administrateur voit la galerie, peut supprimer une photo, et tout est
   * journalisé (RG15).
   */
  @Get('fiche/photos')
  @PorteeEspace(PermissionPortee.fiches)
  @ApiOperation({ summary: 'Ma galerie, dans l’ordre d’affichage' })
  mesPhotos(@Utilisateur() utilisateur: UtilisateurAuthentifie) {
    return this.photos.lister(this.etablissementIdOuRefuse(utilisateur));
  }

  @Post('fiche/photos')
  @PorteeEspace(PermissionPortee.fiches)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('photos', PHOTOS_PAR_ENVOI, { limits: { fileSize: POIDS_MAX_OCTETS } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: FORMULAIRE_PHOTOS })
  @ApiOperation({ summary: 'Ajouter des photos à ma galerie' })
  @ApiResponse({ status: 422, description: 'Format refusé ou fichier trop lourd.' })
  ajouterPhotos(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @UploadedFiles() fichiers: FichierTeleverse[] = [],
  ) {
    return this.photos.ajouter(
      this.etablissementIdOuRefuse(utilisateur),
      fichiers,
      this.acteur(utilisateur),
    );
  }

  @Put('fiche/photos/ordre')
  @PorteeEspace(PermissionPortee.fiches)
  @ApiOperation({ summary: 'Réordonner ma galerie — la première sert de vignette' })
  @ApiResponse({ status: 409, description: 'La galerie a changé depuis le chargement.' })
  reordonnerPhotos(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Body() dto: OrdrePhotosDto,
  ) {
    return this.photos.reordonner(
      this.etablissementIdOuRefuse(utilisateur),
      dto.ids,
      this.acteur(utilisateur),
    );
  }

  @Put('fiche/photos/:id')
  @PorteeEspace(PermissionPortee.fiches)
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: POIDS_MAX_OCTETS } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: FORMULAIRE_PHOTO })
  @ApiOperation({ summary: 'Remplacer une photo — sa place et sa légende sont conservées' })
  remplacerPhoto(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() fichier?: FichierTeleverse,
  ) {
    if (!fichier) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ECHOUEE,
        'Aucun fichier reçu.',
      );
    }

    return this.photos.remplacer(
      this.etablissementIdOuRefuse(utilisateur),
      BigInt(id),
      fichier,
      this.acteur(utilisateur),
    );
  }

  @Patch('fiche/photos/:id')
  @PorteeEspace(PermissionPortee.fiches)
  @ApiOperation({ summary: 'Modifier la légende d’une photo' })
  legenderPhoto(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LegendePhotoDto,
  ) {
    return this.photos.legender(
      this.etablissementIdOuRefuse(utilisateur),
      BigInt(id),
      dto.alt,
      this.acteur(utilisateur),
    );
  }

  @Delete('fiche/photos/:id')
  @PorteeEspace(PermissionPortee.fiches)
  @ApiOperation({ summary: 'Retirer une photo — son chemin reste au journal (RG15)' })
  supprimerPhoto(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.photos.supprimer(
      this.etablissementIdOuRefuse(utilisateur),
      BigInt(id),
      this.acteur(utilisateur),
    );
  }

  @Delete('fiche/propositions/:id')
  @PorteeEspace(PermissionPortee.fiches)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Annuler ma proposition en attente' })
  annuler(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.propositions.annuler(
      this.etablissementIdOuRefuse(utilisateur),
      BigInt(id),
      utilisateur.userId,
    );
  }

  @Get('avis')
  @PorteeEspace(PermissionPortee.avis)
  @ApiOperation({ summary: 'Avis reçus, tous statuts' })
  avis(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.espace.avis(this.etablissementIdOuRefuse(utilisateur), page);
  }

  @Post('avis/:id/reponse')
  @PorteeEspace(PermissionPortee.avis)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Répondre à un avis' })
  @ApiResponse({ status: 204, description: 'Réponse enregistrée.' })
  @ApiResponse({ status: 409, description: 'Une réponse existe déjà (RG07).' })
  repondreAvis(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RepondreAvisDto,
  ) {
    return this.espace.repondreAvis(this.etablissementIdOuRefuse(utilisateur), BigInt(id), dto);
  }

  @Get('demandes')
  @PorteeEspace(PermissionPortee.contacts)
  @ApiOperation({ summary: 'Demandes de contact reçues' })
  demandes(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.espace.demandes(this.etablissementIdOuRefuse(utilisateur), page);
  }

  @Patch('demandes/:id')
  @PorteeEspace(PermissionPortee.contacts)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Faire avancer une demande dans le pipeline' })
  transitionDemande(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransitionDemandeDto,
  ) {
    return this.espace.transitionDemande(
      this.etablissementIdOuRefuse(utilisateur),
      BigInt(id),
      utilisateur.userId,
      dto,
    );
  }

  /**
   * `PorteeEspaceGuard` a déjà refusé une requête sans établissement rattaché
   * — ce garde-fou ne devrait jamais se déclencher. Il évite seulement de
   * propager un `etablissementId` nul plus loin si l'invariant venait à
   * changer sans que ce controller ne soit relu.
   */
  private etablissementIdOuRefuse(utilisateur: UtilisateurAuthentifie): bigint {
    if (!utilisateur.etablissementId) {
      throw new AppException(HttpStatus.FORBIDDEN, ERROR_CODES.ACCES_REFUSE);
    }

    return utilisateur.etablissementId;
  }

  /**
   * Qui signe l'écriture au journal.
   *
   * Le rôle RÉEL de la personne, pas `etablissement` par défaut : un
   * secrétariat agissant sur portée déléguée (RG05) doit apparaître comme tel
   * au journal, sinon la trace attribue à l'établissement un geste qu'il n'a
   * pas fait.
   */
  private acteur(utilisateur: UtilisateurAuthentifie): { userId: bigint; role: RoleCode } {
    return { userId: utilisateur.userId, role: utilisateur.role };
  }
}
