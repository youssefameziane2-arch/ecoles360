import { Module } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { PhotosModule } from '../photos/photos.module';
import { EspaceController } from './espace.controller';
import { EspaceService } from './espace.service';
import { FicheProposalService } from './fiche-proposal.service';

/** Espace connecté établissement / secrétariat — livrable 7 §3, avenant 3. */
@Module({
  imports: [PhotosModule],
  controllers: [EspaceController],
  providers: [EspaceService, FicheProposalService, AuditService],
  exports: [FicheProposalService, AuditService],
})
export class EspaceModule {}
