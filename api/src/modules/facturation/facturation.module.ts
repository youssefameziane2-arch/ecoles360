import { Module } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { FacturationService } from './facturation.service';
import { FacturationLectureService } from './facturation-lecture.service';
import { ParametresFacturationService } from '../admin/parametres-facturation.service';

/**
 * Facturation — abonnements payants, factures, commissions (RG11, RG14, RG18).
 *
 * `ParametresFacturationService` est déclaré ici plutôt qu'importé depuis
 * `AdminModule` : ce dernier importe déjà ce module-ci, et le faire dans les
 * deux sens créerait une dépendance circulaire que Nest refuse au démarrage.
 */
@Module({
  // `AuditService` est déclaré ici, pas importé : il n'est exporté par aucun
  // module global, et chaque module qui journalise le fournit lui-même —
  // c'est la convention du projet (voir `SponsoringsModule`, `EspaceModule`).
  //
  // CE MANQUE NE SE VOIT PAS AU TYPAGE. `tsc` passait ; c'est Nest qui a
  // refusé de démarrer, et l'API est restée muette quinze minutes.
  providers: [
    FacturationService,
    FacturationLectureService,
    ParametresFacturationService,
    AuditService,
  ],
  exports: [FacturationService, FacturationLectureService],
})
export class FacturationModule {}
