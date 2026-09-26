import { Module } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { SponsoringsService } from './sponsorings.service';

/**
 * Sponsoring — RG19.
 *
 * Module à part, et non un repli de `admin` : le service est consommé par les
 * DEUX surfaces. Le back-office y crée les campagnes, et la recherche publique
 * l'interroge à chaque requête pour savoir qui mettre en tête. Le loger dans
 * `admin` obligerait le site public à importer tout le back-office.
 */
@Module({
  providers: [SponsoringsService, AuditService],
  exports: [SponsoringsService],
})
export class SponsoringsModule {}
