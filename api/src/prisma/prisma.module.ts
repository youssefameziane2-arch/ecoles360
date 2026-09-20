import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Module Prisma — global : chaque module métier injecte `PrismaService` sans
 * avoir à réimporter ce module (livrable 11 §1, « un dossier par domaine »).
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
