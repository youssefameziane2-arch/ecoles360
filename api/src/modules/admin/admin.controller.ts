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
  FactureStatut,
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
import { CreerCompteDto } from './dto/creer-compte.dto';
import { StatistiquesAdminDto } from './dto/statistiques-admin.dto';
import { SponsoringsService } from '../sponsorings/sponsorings.service';
import { ArticlesService } from '../articles/articles.service';
import { DecisionArticleDto } from '../articles/dto/decision-article.dto';
import { BasculeUneDto } from '../articles/dto/bascule-une.dto';
import { RedigerArticleDto } from '../articles/dto/rediger-article.dto';
import { RedigerArticleAdminDto } from '../articles/dto/rediger-article-admin.dto';
import { ModerationAvisService } from '../avis/moderation.service';
import { DecisionAvisDto } from '../avis/dto/decision-avis.dto';
import { BasculeEnAvantDto } from '../avis/dto/bascule-en-avant.dto';
import { FaqService } from '../contenu/faq.service';
import { FaqItemDto } from '../contenu/dto/faq-item.dto';
import { OrdreFaqDto } from '../contenu/dto/ordre-faq.dto';
import { PageAProposDto } from '../contenu/dto/page-a-propos.dto';
import { CLES_LEGALES, PagesCmsService, type CleLegale } from '../contenu/pages-cms.service';
import { PageLegaleDto } from '../contenu/dto/page-legale.dto';
import { ProposerFicheDto } from '../espace/dto/proposer-fiche.dto';
import { CreerSponsoringDto } from '../sponsorings/dto/creer-sponsoring.dto';
import { PhotosService } from '../photos/photos.service';
import { LegendePhotoDto } from '../photos/dto/legende-photo.dto';
import { OrdrePhotosDto } from '../photos/dto/ordre-photos.dto';
import { FORMULAIRE_PHOTO, FORMULAIRE_PHOTOS, PHOTOS_PAR_ENVOI } from '../photos/televersement';
import { BadgesEtablissementDto } from './dto/badges-etablissement.dto';
import { CreerEtablissementDto } from './dto/creer-etablissement.dto';
import { PorteeSecretariatDto } from './dto/portee-secretariat.dto';
import { StatutCompteDto } from './dto/statut-compte.dto';
import { ComptesService } from './comptes.service';
import { SecretariatService } from './secretariat.service';
import { CrmService } from '../crm/crm.service';
import { CrmLectureService } from '../crm/crm-lecture.service';
import { AssignerProspectDto } from '../crm/dto/assigner-prospect.dto';
import { FacturationService } from '../facturation/facturation.service';
import { FacturationLectureService } from '../facturation/facturation-lecture.service';
import { OuvrirAbonnementDto } from '../facturation/dto/ouvrir-abonnement.dto';
import { EmettreFactureDto } from '../facturation/dto/emettre-facture.dto';
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
    private readonly secretariat: SecretariatService,
    private readonly comptes: ComptesService,
    private readonly crm: CrmService,
    private readonly crmLecture: CrmLectureService,
    private readonly facturation: FacturationService,
    private readonly facturationLecture: FacturationLectureService,
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

  @Get('etablissements/:id/profil')
  @ApiOperation({ summary: 'Profil complet d’une fiche, pour l’écran d’édition' })
  profilEtablissement(@Param('id', ParseIntPipe) id: number) {
    return this.etablissements.profil(BigInt(id));
  }

  /**
   * MÊME DTO QUE LA PROPOSITION DE L'ÉTABLISSEMENT, écriture directe.
   *
   * La RG20 borne l'établissement — il propose, l'administration publie. Elle
   * ne dit pas que l'administration doive se proposer des modifications à
   * elle-même : elle EST l'autorité de validation, et c'est déjà ainsi
   * qu'elle crée une fiche.
   */
  @Put('etablissements/:id/profil')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Écrire le profil complet d’une fiche — action journalisée (RG15)',
    description:
      'Équipements, équipe, horaires, chiffres, FAQ, projet pédagogique, autres projets, ' +
      'réseaux sociaux et vidéo — les blocs que le formulaire de création ne couvre pas, et ' +
      'dont dépend l’affichage des onglets de la fiche publique.',
  })
  @ApiResponse({ status: 204, description: 'Profil écrit.' })
  @ApiResponse({ status: 422, description: 'Champ inconnu, trop long ou mal formé.' })
  ecrireProfilEtablissement(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProposerFicheDto,
  ) {
    return this.etablissements.ecrireProfil(BigInt(id), dto, utilisateur.userId);
  }

  @Delete('etablissements/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer une fiche créée par erreur',
    description:
      'Refusée en 409 dès que la fiche a été publiée, ou porte un avis, une demande ou un ' +
      'abonnement : la cascade emporterait des factures que la loi impose de garder (RG14). ' +
      'Pour retirer une école du site sans rien perdre, utiliser « Suspendre ».',
  })
  @ApiResponse({ status: 204, description: 'Fiche supprimée — nom et slug restent au journal.' })
  @ApiResponse({ status: 409, description: 'La fiche porte un historique.' })
  supprimerEtablissement(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.etablissements.supprimer(BigInt(id), utilisateur.userId);
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

  // ---------------------------------------------------------------------------
  //  CRM — les deux actes réservés à la Direction (RG18)
  // ---------------------------------------------------------------------------

  /**
   * ASSIGNER N'EST PAS UNE ACTION DE COMMERCIAL, et c'est pourquoi cette route
   * vit ici plutôt que sur `CrmController`. Laisser un vendeur s'attribuer un
   * prospect reviendrait à le laisser s'attribuer la commission qui en
   * découlera : c'est une décision de la Direction.
   */
  @Patch('crm/prospects/:id/commercial')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Confier un prospect à un commercial, ou le lui retirer',
    description: '`commercial_id: null` rend le dossier au pot commun — un départ, par exemple.',
  })
  @ApiResponse({ status: 422, description: 'Le compte visé n’est pas un commercial.' })
  assignerProspect(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignerProspectDto,
  ) {
    return this.crm.assigner(
      BigInt(id),
      dto.commercial_id === null ? null : BigInt(dto.commercial_id),
      utilisateur.userId,
    );
  }

  @Get('commerciaux')
  @ApiOperation({
    summary: 'Les commerciaux, leur portefeuille et leurs commissions',
    description:
      'Les comptes suspendus y figurent : ils gardent leurs dossiers et leurs commissions, et ' +
      'les masquer ferait disparaître de l’argent dû de la liste des choses à payer.',
  })
  commerciaux() {
    return this.crmLecture.commerciaux();
  }

  // ---------------------------------------------------------------------------
  //  Facturation — RG11, RG14, RG18
  // ---------------------------------------------------------------------------

  @Get('facturation')
  @ApiOperation({
    summary: 'Indicateurs de facturation — encaissé du mois, en attente, échéances',
    description: 'L’encaissé se compte sur la date de PAIEMENT, pas d’émission.',
  })
  indicateursFacturation() {
    return this.facturationLecture.indicateurs();
  }

  @Get('factures')
  @ApiOperation({ summary: 'Historique des factures, filtrable par statut de paiement' })
  factures(@Query('statut') statut?: FactureStatut) {
    return this.facturationLecture.factures({ statut });
  }

  @Get('factures/:id')
  @ApiOperation({ summary: 'Une facture et sa commission éventuelle' })
  facture(@Param('id', ParseIntPipe) id: number) {
    return this.facturationLecture.facture(BigInt(id));
  }

  @Get('etablissements/:id/abonnements')
  @ApiOperation({ summary: 'Abonnements d’un établissement et leurs factures' })
  abonnements(@Param('id', ParseIntPipe) id: number) {
    return this.facturationLecture.abonnements(BigInt(id));
  }

  @Post('etablissements/:id/abonnement')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ouvrir un abonnement payant',
    description:
      'Le tarif est propre à chaque client et vient de l’écran : aucun barème ne le fournit. ' +
      'La remise ne vaut que pour l’annuel (RG11).',
  })
  @ApiResponse({ status: 409, description: 'Un abonnement est déjà en cours.' })
  ouvrirAbonnement(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OuvrirAbonnementDto,
  ) {
    return this.facturation.ouvrirAbonnement(BigInt(id), dto, utilisateur.userId);
  }

  @Post('abonnements/:id/facture')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Émettre la facture d’un abonnement — numérotation légale sous verrou',
    description:
      'Le montant vient de l’abonnement, jamais de la requête. Une commission naît en ' +
      '« à valider » si un commercial a apporté l’affaire et qu’un taux est fixé (RG18).',
  })
  @ApiResponse({ status: 409, description: 'Un essai gratuit ne se facture pas (RG13).' })
  emettreFacture(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EmettreFactureDto,
  ) {
    return this.facturation.emettreFacture(BigInt(id), utilisateur.userId, dto.commission_pct);
  }

  @Patch('factures/:id/encaissement')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Marquer une facture encaissée — c’est elle qui lève la condition RG14',
    description: 'Irréversible : dé-encaisser demande un avoir, pas un retour en arrière.',
  })
  @ApiResponse({ status: 409, description: 'Facture déjà encaissée.' })
  encaisser(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.facturation.encaisser(BigInt(id), utilisateur.userId);
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

  @Get('secretariat')
  @ApiOperation({
    summary: 'Comptes du secrétariat, leur rattachement et leurs portées (RG05)',
  })
  comptesSecretariat() {
    return this.secretariat.lister();
  }

  /**
   * LA RÉPONSE PORTE LE MOT DE PASSE, UNE SEULE FOIS. Il est tiré au sort par
   * le serveur et n'est stocké nulle part en clair — la base n'en garde qu'un
   * hachage Argon2id, et le journal d'audit n'en garde rien du tout. C'est
   * l'administrateur qui le transmet.
   *
   * CE N'EST PAS LA MEILLEURE RÉPONSE POSSIBLE : un lien de première connexion
   * envoyé par courriel vaudrait mieux. Il n'y a aucun envoi d'e-mail dans ce
   * projet (B-46), et cette convention est celle déjà posée par `compte:creer`
   * en ligne de commande.
   */
  @Post('comptes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un compte de secrétariat ou de commercial (RG25)',
    description:
      'Le mot de passe est tiré au sort et rendu UNE SEULE FOIS. ' +
      'Un secrétariat naît sans aucune portée déléguée : elles s’accordent ensuite, une par une (RG05).',
  })
  @ApiResponse({ status: 201, description: 'Compte créé, mot de passe à transmettre.' })
  @ApiResponse({ status: 409, description: 'Un compte existe déjà avec cette adresse.' })
  creerCompte(@Utilisateur() utilisateur: UtilisateurAuthentifie, @Body() dto: CreerCompteDto) {
    return this.comptes.creer(dto, utilisateur.userId);
  }

  @Post('comptes/:id/mot-de-passe')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Réinitialiser le mot de passe d’un compte de personnel',
    description:
      'Les sessions en cours sont détruites : laisser vivre une session ouverte ' +
      'avec un mot de passe que l’on réinitialise ne protégerait de rien (RG25).',
  })
  @ApiResponse({ status: 403, description: 'Compte administrateur — passer par « compte:creer ».' })
  reinitialiserMotDePasse(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.comptes.reinitialiser(BigInt(id), utilisateur.userId);
  }

  @Patch('secretariat/:id/portee')
  @ApiOperation({
    summary: 'Accorder ou révoquer une portée déléguée (RG05)',
    description: 'La ligne est conservée et datée — une portée se révoque, elle ne s’efface pas.',
  })
  @ApiResponse({ status: 404, description: 'Compte de secrétariat inconnu.' })
  basculerPortee(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PorteeSecretariatDto,
  ) {
    return this.secretariat.basculerPortee(
      BigInt(id),
      dto.portee,
      dto.accordee,
      utilisateur.userId,
    );
  }

  @Patch('secretariat/:id/statut')
  @ApiOperation({
    summary: 'Suspendre ou réactiver un compte (RG25)',
    description: 'La suspension DÉTRUIT les sessions en cours — elle n’attend pas leur expiration.',
  })
  basculerStatutCompte(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: StatutCompteDto,
  ) {
    return this.secretariat.basculerStatut(BigInt(id), dto.suspendu, utilisateur.userId);
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
    @Body() dto: RedigerArticleAdminDto,
  ) {
    return this.articlesService.creerPourPlateforme(
      dto,
      utilisateur.userId,
      dto.etablissement_id === undefined ? undefined : BigInt(dto.etablissement_id),
    );
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

  /**
   * LA CLÉ EST VALIDÉE ICI, PAS DANS UN DTO : elle vient de l'URL, où
   * `ValidationPipe` ne l'atteint pas. Sans ce contrôle, `a-propos` passerait
   * par cette route et recevrait des blocs que son écran ne sait pas lire.
   */
  @Put('pages/legales/:cle')
  @ApiOperation({
    summary: 'Publier une page légale — action journalisée (RG09, RG15)',
    description:
      'Clés acceptées : mentions-legales, confidentialite, cookies. ' +
      'La page entière : les sections absentes du corps disparaissent du site.',
  })
  @ApiResponse({ status: 404, description: 'Clé inconnue ou page non semée.' })
  @ApiResponse({ status: 422, description: 'Section manquante, trop longue ou champ inconnu.' })
  modifierPageLegale(
    @Utilisateur() utilisateur: UtilisateurAuthentifie,
    @Param('cle') cle: string,
    @Body() dto: PageLegaleDto,
  ) {
    if (!(CLES_LEGALES as readonly string[]).includes(cle)) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        'Cette page légale n’existe pas.',
      );
    }

    return this.pagesCms.modifierPageLegale(cle as CleLegale, dto, utilisateur.userId);
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
