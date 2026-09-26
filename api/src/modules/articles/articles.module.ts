import { Module } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { ArticlesController } from './articles.controller';
import { ArticlesEspaceController } from './articles-espace.controller';
import { ArticlesService } from './articles.service';

/**
 * Blog — avenant 3, livrable 11 §3.5.
 *
 * Un module pour les TROIS surfaces du même circuit : le blog public, la
 * rédaction dans l'espace établissement, et la décision au back-office. Les
 * séparer ferait vivre la règle « rien ne se publie sans validation » à trois
 * endroits, donc finirait par la faire diverger.
 */
@Module({
  controllers: [ArticlesController, ArticlesEspaceController],
  providers: [ArticlesService, AuditService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
