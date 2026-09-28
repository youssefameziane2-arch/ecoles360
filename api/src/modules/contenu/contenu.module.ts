import { Module } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { ContenuController } from './contenu.controller';
import { FaqService } from './faq.service';
import { ConseillersService } from './conseillers.service';
import { PagesCmsService } from './pages-cms.service';

/**
 * Contenu éditorial du site — FAQ et pages CMS (« À propos »).
 *
 * MODULE À PART, ET NON UNE ANNEXE DU BACK-OFFICE : la FAQ se lit sans
 * session, sur une route publique. La ranger dans `AdminModule` obligerait le
 * site public à dépendre de tout le back-office pour afficher une page d'aide.
 * `AdminModule` importe celui-ci, jamais l'inverse.
 */
@Module({
  controllers: [ContenuController],
  providers: [FaqService, ConseillersService, PagesCmsService, AuditService],
  exports: [FaqService, ConseillersService, PagesCmsService],
})
export class ContenuModule {}
