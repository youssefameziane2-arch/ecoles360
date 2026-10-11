import { Module } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { InscriptionsController } from './inscriptions.controller';
import { InscriptionsService } from './inscriptions.service';

/**
 * Formulaire public d'inscription.
 *
 * MODULE À PART, ET NON UNE ROUTE DE PLUS DANS `CrmModule` : tout
 * `CrmController` est derrière la session, et y greffer la seule route ouverte
 * à internet reviendrait à poser une exception au milieu de ce qui protège le
 * reste. Un jour quelqu'un déplacerait le `@Public()` d'une méthode à la
 * classe, et le pipeline commercial entier deviendrait lisible.
 *
 * `AuditService` EST DÉCLARÉ ICI. Nest ne le résout pas depuis un autre
 * module ; sans cette ligne, `tsc` passe, le lint passe, et l'API refuse de
 * démarrer — c'est arrivé deux fois sur ce projet.
 */
@Module({
  controllers: [InscriptionsController],
  providers: [InscriptionsService, AuditService],
})
export class InscriptionsModule {}
