import { Module } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { StockageService } from '../../common/stockage/stockage.service';
import { PhotosService } from './photos.service';

/**
 * Galerie des fiches — téléversement et ordre.
 *
 * SANS CONTRÔLEUR PROPRE, et c'est délibéré : les routes vivent là où vit
 * l'autorisation. L'admin agit sur n'importe quelle fiche (`/admin/…`),
 * l'établissement seulement sur la sienne (`/espace/…`, RG05). Un contrôleur
 * `/photos/:id` commun devrait rejouer cette distinction à la main, et c'est
 * exactement le genre de garde qu'on oublie.
 */
@Module({
  providers: [PhotosService, StockageService, AuditService],
  exports: [PhotosService, StockageService],
})
export class PhotosModule {}
