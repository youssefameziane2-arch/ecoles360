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
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles, Utilisateur } from '../../common/decorators';
import { AppException, ERROR_CODES } from '../../common/errors';
import { POIDS_MAX_OCTETS, type FichierTeleverse } from '../../common/stockage/stockage.service';
import {
  ArticleStatut,
  AvisStatut,
  EtablissementStatut,
  RoleCode,
  type EtablissementType,
} from '../../generated/prisma';
import type { UtilisateurAuthentifie } from '../auth/session.types';
import { FicheProposalService } from '../espace/fiche-proposal.service';
import { AdminEtablissementsService } from './admin-etablissements.service';
import { ParametresFacturationService } from './parametres-facturation.service';
import { AuditLectureService } from './audit-lecture.service';
import { TableauDeBordAdminService } from './tableau-de-bord-admin.service';
import { StatistiquesAdminService } from './statistiques-admin.service';
import { StatistiquesAdminDto } from './dto/statistiques-admin.dto';
import { SponsoringsService } from '../sponsorings/sponsorings.service';
import { ArticlesService } from '../articles/articles.service';
import { DecisionArticleDto } from '../articles/dto/decision-article.dto';
import { BasculeUneDto } from '../articles/dto/bascule-une.dto';
import { RedigerArticleDto } from '../articles/dto/rediger-article.dto';
import { ModerationAvisService } from '../avis/moderation.service';
import { DecisionAvisDto } from '../avis/dto/decision-avis.dto';
import { BasculeEnAvantDto } from '../avis/dto/bascule-en-avant.dto';
import { FaqService } from '../contenu/faq.service';
import { FaqItemDto } from '../contenu/dto/faq-item.dto';
import { OrdreFaqDto } from '../contenu/dto/ordre-faq.dto';
import { PageAProposDto } from '../contenu/dto/page-a-propos.dto';
import { PagesCmsService } from '../contenu/pages-cms.service';
import { CreerSponsoringDto } from '../sponsorings/dto/creer-sponsoring.dto';
import { PhotosService } from '../photos/photos.service';
import { LegendePhotoDto } from '../photos/dto/legende-photo.dto';
import { OrdrePhotosDto } from '../photos/dto/ordre-photos.dto';
import { FORMULAIRE_PHOTO, FORMULAIRE_PHOTOS, PHOTOS_PAR_ENVOI } from '../photos/televersement';
import { BadgesEtablissementDto } from './dto/badges-etablissement.dto';
import { CreerEtablissementDto } from './dto/creer-etablissement.dto';
import { ParametreFacturationDto } from './dto/parametre-facturation.dto';
import { DecisionPropositionDto } from './dto/decision-proposition.dto';
import { TransitionStatutEtablissementDto } from './dto/transition-statut-etablissement.dto';

/**
 * Back-office admin — établissements et propositions de fiche.
 *
 * livrable 11 §3.4. Réservé au Super Admin (RG25) : les autres rôles du
 * back-office (commercial) n'ont pas accès aux établissements, à
 * l'abonnement ni aux propositions — seulement à leurs prospects (hors
 * périmètre de cette passe).
 */
@ApiTags('admin')
@Roles(RoleCode.superadmin)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly etablissements: AdminEtablissementsService,
    private readonly propositions: FicheProposalService,
    private readonly parametresFacturation: ParametresFacturationService,
    private readonly sponsoringsService: SponsoringsService,
    private readonly faqService: FaqService,
    private readonly pagesCms: PagesCmsService,
    private readonly articlesService: ArticlesService,
    private readonly moderationAvis: ModerationAvisService,
    private readonly photosService: PhotosService,
    private readonly audit: AuditLectureService,
    private readonly tableauDeBordService: TableauDeBordAdminService,
    private readonly statistiquesService: StatistiquesAdminService,
  ) {}

  @Get('statistiques')
  @ApiOperation({
    summary: 'Statistiques de la plateforme — indicateurs, courbe, vues par type, classement',
    description:
      'Période (7j, 30j, 90j, 12m), ville et type commandent tous les blocs. Une seule requête ' +
      'pour tout l’écran.',
  })
  @ApiResponse({ status: 422, description: 'Période ou type inconnu.' })
  statistiques(@Query() filtres: StatistiquesAdminDto) {
    return this.statistiquesService.lire(filtres);
  }

  @Get('tableau-de-bord')
  @ApiOperation({
    summary: 'Vue d’ensemble de l’administration — activité, files à traiter, audience, classement',
    description:
      'Une seule requête pour tout l’écran. Fenêtre glissante de 30 jours, comparée aux 30 ' +
      'jours précédents.',
  })
  tableauDeBord() {
    return this.tableauDeBordService.lire();
  }

  @Get('etablissements')
  @ApiOperation({ summary: 'Liste des établissements, filtrable par statut et type' })
  lister(@Query('statut') statut?: EtablissementStatut, @Query('type') type?: EtablissementType) {
    return this.etablissements.lister({ statut, type });
  }

  @Get('etablissements/referentiel')
  @ApiOperation({
    summary: 'Villes, types et caractéristiques — alimente le formulaire de création',
    description: 'Une seule requête : le formulaire ne doit pas s’ouvrir vide puis se remplir.',
  })
  referentiel() {
    return this.etablissements.referentiel();
  }

  @Post('etablissements')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une fiche',
    description:
      'La fiche naît « en attente » (RG03) et sans propriétaire (RG04) : la publier reste une ' +
      'action distincte, subordonnée à l’abonnement (RG14).',
  })
  @ApiResponse({ status: 422, description: 'Ville inconnue, ou budgets incohérents.' })
  creerEtablissement(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Body() dto: CreerEtablissementDto,
  ) {
    return this.etablissements.creer(dto, utilisateur.userId);
  }

  @Get('etablissements/:id/photos')
  @ApiOperation({ summary: 'Galerie d’une fiche, dans l’ordre d’affichage' })
  photos(@Param('id', ParseIntPipe) id: number) {
    return this.photosService.lister(BigInt(id));
  }

  /**
   * TÉLÉVERSEMENT EN MÉMOIRE, pas sur disque.
   *
   * Sans `dest` ni `storage`, multer garde le fichier en mémoire — et c'est
   * ce qu'on veut : rien ne se pose sur le disque avant que le type et la
   * signature n'aient été vérifiés, et le plafond de 5 Mo borne le coût du
   * choix.
   *
   * Le préciser par `memoryStorage()` obligerait à importer `multer`
   * directement. Ce n'est PAS une dépendance déclarée de ce paquet — elle
   * n'arrive que par `@nestjs/platform-express` — et l'arborescence stricte de
   * pnpm ne la résoudrait pas à l'exécution, alors que le typage, lui,
   * passerait sans broncher.
   */
  @Post('etablissements/:id/photos')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('photos', PHOTOS_PAR_ENVOI, {
      limits: { fileSize: POIDS_MAX_OCTETS },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: FORMULAIRE_PHOTOS })
  @ApiOperation({ summary: 'Ajouter des photos à la galerie' })
  @ApiResponse({ status: 409, description: 'Plafond de photos atteint pour cette fiche.' })
  @ApiResponse({ status: 422, description: 'Format refusé ou fichier trop lourd.' })
  ajouterPhotos(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() fichiers: FichierTeleverse[] = [],
  ) {
    return this.photosService.ajouter(BigInt(id), fichiers, {
      userId: utilisateur.userId,
      role: RoleCode.superadmin,
    });
  }

  @Put('etablissements/:id/photos/ordre')
  @ApiOperation({
    summary: 'Réordonner la galerie',
    description: 'La liste envoyée doit contenir toutes les photos de la fiche.',
  })
  @ApiResponse({ status: 409, description: 'La galerie a changé depuis le chargement.' })
  reordonnerPhotos(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OrdrePhotosDto,
  ) {
    return this.photosService.reordonner(BigInt(id), dto.ids, {
      userId: utilisateur.userId,
      role: RoleCode.superadmin,
    });
  }

  @Put('etablissements/:id/photos/:photoId')
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: POIDS_MAX_OCTETS } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: FORMULAIRE_PHOTO })
  @ApiOperation({
    summary: 'Remplacer le fichier d’une photo',
    description: 'La place dans la galerie et la légende sont conservées.',
  })
  remplacerPhoto(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
    @UploadedFile() fichier?: FichierTeleverse,
  ) {
    if (!fichier) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ECHOUEE,
        'Aucun fichier reçu.',
      );
    }

    return this.photosService.remplacer(BigInt(id), BigInt(photoId), fichier, {
      userId: utilisateur.userId,
      role: RoleCode.superadmin,
    });
  }

  @Patch('etablissements/:id/photos/:photoId')
  @ApiOperation({ summary: 'Modifier la légende d’une photo' })
  legenderPhoto(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
    @Body() dto: LegendePhotoDto,
  ) {
    return this.photosService.legender(BigInt(id), BigInt(photoId), dto.alt, {
      userId: utilisateur.userId,
      role: RoleCode.superadmin,
    });
  }

  @Delete('etablissements/:id/photos/:photoId')
  @ApiOperation({
    summary: 'Retirer une photo',
    description: 'Le fichier quitte le volume ; son chemin reste au journal (RG15).',
  })
  supprimerPhoto(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
  ) {
    return this.photosService.supprimer(BigInt(id), BigInt(photoId), {
      userId: utilisateur.userId,
      role: RoleCode.superadmin,
    });
  }

  @Patch('etablissements/:id/statut')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Valider, suspendre ou réactiver un établissement (RG03)' })
  @ApiResponse({ status: 409, description: 'Abonnement non encaissé — voir RG14.' })
  changerStatut(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransitionStatutEtablissementDto,
  ) {
    return this.etablissements.changerStatut(BigInt(id), dto.statut, utilisateur.userId);
  }

  @Post('etablissements/:id/essai-gratuit')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Activer un essai gratuit',
    description: 'Sans tarif (RG13) — débloque la validation sans facture.',
  })
  activerEssai(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.etablissements.activerEssaiGratuit(BigInt(id), utilisateur.userId);
  }

  @Patch('etablissements/:id/badges')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Basculer sponsorisé / vérifié / premium (RG19, RG27)' })
  basculerBadges(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BadgesEtablissementDto,
  ) {
    return this.etablissements.basculerBadges(BigInt(id), dto, utilisateur.userId);
  }

  @Get('sponsorings')
  @ApiOperation({ summary: 'Campagnes de sponsoring — niveau, périmètre, période (RG19)' })
  sponsorings() {
    return this.sponsoringsService.lister();
  }

  @Post('sponsorings')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ouvrir une campagne',
    description: 'Le badge « Sponsorisé » de la fiche suit la campagne (RG19).',
  })
  @ApiResponse({ status: 422, description: 'Période incohérente.' })
  creerSponsoring(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Body() dto: CreerSponsoringDto,
  ) {
    return this.sponsoringsService.creer(dto, utilisateur.userId);
  }

  @Delete('sponsorings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Arrêter une campagne',
    description: 'La campagne est close, jamais supprimée — la facturation s’y adosse (RG18).',
  })
  arreterSponsoring(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sponsoringsService.arreter(BigInt(id), utilisateur.userId);
  }

  @Get('parametres-facturation')
  @ApiOperation({ summary: 'Constantes globales de facturation (TVA, essai, remise)' })
  parametres() {
    return this.parametresFacturation.lister();
  }

  @Put('parametres-facturation/:cle')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Modifier une constante de facturation — action journalisée (RG15)' })
  @ApiResponse({ status: 404, description: 'Clé inconnue.' })
  modifierParametre(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('cle') cle: string,
    @Body() dto: ParametreFacturationDto,
  ) {
    return this.parametresFacturation.mettreAJour(cle, dto.valeur, utilisateur.userId);
  }

  /**
   * LE JOURNAL EST EN LECTURE SEULE (RG26).
   *
   * Aucune route d'écriture n'existe et ne doit exister ici : un registre
   * qu'on peut retoucher ne prouve rien. Les écritures viennent uniquement
   * d'`AuditService`, appelé dans la transaction de l'action qu'il trace.
   */
  @Get('audit')
  @ApiOperation({
    summary: 'Journal d’audit, du plus récent au plus ancien',
    description: 'Filtrable par rôle acteur et par domaine (avis, article, etablissement…).',
  })
  journal(
    @Query('role') role?: string,
    @Query('domaine') domaine?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
  ) {
    return this.audit.lister({ role, domaine, page });
  }

  @Get('audit/domaines')
  @ApiOperation({ summary: 'Domaines présents dans le journal — pastilles de filtre' })
  domainesAudit() {
    return this.audit.domaines();
  }

  @Get('audit/statistiques')
  @ApiOperation({
    summary: 'Activité par profil (mois courant) et statistiques par établissement',
  })
  statistiquesAudit() {
    return this.audit.statistiques();
  }

  @Get('avis')
  @ApiOperation({
    summary: 'File de modération des avis (RG06)',
    description: 'Les plus anciens d’abord — un avis qui attend ne doit pas se faire doubler.',
  })
  avis(@Query('statut') statut?: AvisStatut) {
    return this.moderationAvis.lister(statut);
  }

  @Patch('avis/:id')
  @ApiOperation({
    summary: 'Publier ou rejeter un avis',
    description:
      'Le motif est obligatoire au rejet. La note de la fiche est recalculée dans la même ' +
      'transaction (RG08), et les signalements ouverts sont clos (RG07).',
  })
  @ApiResponse({ status: 409, description: 'L’avis porte déjà cette décision.' })
  deciderAvis(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DecisionAvisDto,
  ) {
    return this.moderationAvis.decider(BigInt(id), dto, utilisateur.userId);
  }

  @Patch('avis/:id/en-avant')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mettre un avis en avant sur l’accueil, ou l’en retirer (RG27)' })
  @ApiResponse({ status: 409, description: 'Avis non publié.' })
  mettreAvisEnAvant(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BasculeEnAvantDto,
  ) {
    return this.moderationAvis.basculerEnAvant(BigInt(id), dto.en_avant, utilisateur.userId);
  }

  @Get('articles')
  @ApiOperation({
    summary: 'Articles du blog, filtrables par statut',
    description: 'Sans filtre : tout le circuit, brouillons des établissements compris.',
  })
  articles(@Query('statut') statut?: ArticleStatut) {
    return this.articlesService.listerPourAdmin(statut);
  }

  @Post('articles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Rédiger un article de plateforme',
    description:
      'Publié directement : l’administrateur est l’autorité de validation, le faire passer ' +
      'par sa propre file n’ajouterait aucun relecteur.',
  })
  redigerArticle(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Body() dto: RedigerArticleDto,
  ) {
    return this.articlesService.creerPourPlateforme(dto, utilisateur.userId);
  }

  @Put('articles/:id')
  @ApiOperation({
    summary: 'Réécrire un article',
    description: 'Ne le fait pas redescendre en brouillon — l’auteur est ici le relecteur.',
  })
  modifierArticle(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RedigerArticleDto,
  ) {
    return this.articlesService.modifierParAdmin(BigInt(id), dto, utilisateur.userId);
  }

  @Delete('articles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un article — titre et slug restent au journal' })
  supprimerArticle(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.articlesService.supprimerParAdmin(BigInt(id), utilisateur.userId);
  }

  @Patch('articles/:id')
  @ApiOperation({
    summary: 'Approuver ou refuser un article soumis',
    description: 'Le motif est obligatoire au refus et rendu à l’auteur (livrable 11 §3.5).',
  })
  @ApiResponse({ status: 409, description: 'Article qui n’est pas en attente de validation.' })
  deciderArticle(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DecisionArticleDto,
  ) {
    return this.articlesService.decider(BigInt(id), dto, utilisateur.userId);
  }

  @Patch('articles/:id/a-la-une')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Mettre un article à la une, ou l’en retirer',
    description: 'Un seul à la fois : le précédent est retiré dans la même transaction.',
  })
  @ApiResponse({ status: 409, description: 'Article non publié.' })
  mettreALaUne(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BasculeUneDto,
  ) {
    return this.articlesService.basculerALaUne(BigInt(id), dto.a_la_une, utilisateur.userId);
  }

  @Get('faq')
  @ApiOperation({ summary: 'FAQ éditoriale — questions dépubliées comprises' })
  faq() {
    return this.faqService.listerPourAdmin();
  }

  @Post('faq')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ajouter une question, en fin de liste' })
  creerQuestion(@Utilisateur() utilisateur: UtilisateurAuthentifie, @Body() dto: FaqItemDto) {
    return this.faqService.creer(dto, utilisateur.userId);
  }

  /**
   * DÉCLARÉ AVANT `faq/:id` — l'ordre des méthodes fait l'ordre des routes chez
   * Nest, et `:id` avalerait le segment « ordre » puis échouerait sur
   * `ParseIntPipe`.
   */
  @Put('faq/ordre')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Réordonner la FAQ',
    description: 'La liste envoyée doit contenir toutes les questions existantes.',
  })
  @ApiResponse({ status: 409, description: 'La liste ne correspond plus à la base.' })
  reordonnerFaq(@Utilisateur() utilisateur: UtilisateurAuthentifie, @Body() dto: OrdreFaqDto) {
    return this.faqService.reordonner(dto.ids, utilisateur.userId);
  }

  @Put('faq/:id')
  @ApiOperation({ summary: 'Modifier une question — action journalisée (RG15)' })
  @ApiResponse({ status: 404, description: 'Question inconnue.' })
  modifierQuestion(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FaqItemDto,
  ) {
    return this.faqService.modifier(BigInt(id), dto, utilisateur.userId);
  }

  @Delete('faq/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Retirer une question du site — le texte reste au journal' })
  supprimerQuestion(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.faqService.supprimer(BigInt(id), utilisateur.userId);
  }

  @Put('pages/a-propos')
  @ApiOperation({
    summary: 'Publier la page « À propos » — action journalisée (RG15)',
    description:
      'La page entière : les blocs absents du corps disparaissent du site. ' +
      'La trace d’audit garde le contenu d’avant et d’après.',
  })
  @ApiResponse({ status: 422, description: 'Bloc manquant, trop long ou champ inconnu.' })
  modifierPageAPropos(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Body() dto: PageAProposDto,
  ) {
    return this.pagesCms.modifierAPropos(dto, utilisateur.userId);
  }

  @Get('propositions-fiche')
  @ApiOperation({ summary: 'File des modifications de fiche en attente (RG20)' })
  propositionsEnAttente() {
    return this.propositions.listerEnAttente();
  }

  @Patch('propositions-fiche/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Décider une proposition',
    description: 'Approuver publie le payload complet ; refuser exige un motif (RG20).',
  })
  decider(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DecisionPropositionDto,
  ) {
    return dto.decision === 'validee'
      ? this.propositions.approuver(BigInt(id), utilisateur.userId)
      : this.propositions.refuser(BigInt(id), utilisateur.userId, dto.motif!);
  }
}
