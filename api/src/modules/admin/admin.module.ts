import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EspaceModule } from '../espace/espace.module';
import { ArticlesModule } from '../articles/articles.module';
import { AvisModule } from '../avis/avis.module';
import { ContenuModule } from '../contenu/contenu.module';
import { PhotosModule } from '../photos/photos.module';
import { SponsoringsModule } from '../sponsorings/sponsorings.module';
import { AdminController } from './admin.controller';
import { AdminEtablissementsService } from './admin-etablissements.service';
import { ParametresFacturationService } from './parametres-facturation.service';
import { AuditLectureService } from './audit-lecture.service';
import { ComptesService } from './comptes.service';
import { SecretariatService } from './secretariat.service';
import { FacturationModule } from '../facturation/facturation.module';
import { CrmModule } from '../crm/crm.module';
import { TableauDeBordAdminService } from './tableau-de-bord-admin.service';
import { StatistiquesAdminService } from './statistiques-admin.service';

/**
 * Back-office admin — établissements et validation de fiche.
 *
 * Importe `EspaceModule` pour réutiliser `FicheProposalService` et
 * `AuditService`, plutôt que de les recopier : la file de propositions et son
 * approbation sont EXACTEMENT la même logique, vue côté admin.
 */
@Module({
  imports: [
    // AuthModule pour `revoquerSessions` : suspendre un compte doit couper
    // ses sessions SUR LE CHAMP (RG25), pas à leur expiration.
    AuthModule,
    EspaceModule,
    SponsoringsModule,
    ContenuModule,
    ArticlesModule,
    AvisModule,
    PhotosModule,
    // Abonnements payants, factures et commissions (RG11, RG14, RG18).
    FacturationModule,
    // Prospects, relances et commissions (RG17, RG18).
    CrmModule,
  ],
  controllers: [AdminController],
  providers: [
    AdminEtablissementsService,
    ParametresFacturationService,
    AuditLectureService,
    TableauDeBordAdminService,
    StatistiquesAdminService,
    SecretariatService,
    ComptesService,
  ],
})
export class AdminModule {}
