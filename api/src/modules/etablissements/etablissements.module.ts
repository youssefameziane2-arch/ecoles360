import { Module } from '@nestjs/common';
import { SponsoringsModule } from '../sponsorings/sponsorings.module';
import { EtablissementsController } from './etablissements.controller';
import { EtablissementsService } from './etablissements.service';
import { TracesRechercheService } from './traces-recherche.service';

/**
 * Domaine « établissements » — livrable 7 §3.
 *
 * Le service est exporté : les modules `avis` et `contacts` doivent vérifier
 * qu'une fiche est publiée avant d'accepter un dépôt, et cette règle (RG03)
 * n'a qu'une implémentation.
 */
@Module({
  imports: [SponsoringsModule],
  controllers: [EtablissementsController],
  providers: [EtablissementsService, TracesRechercheService],
  exports: [EtablissementsService],
})
export class EtablissementsModule {}
