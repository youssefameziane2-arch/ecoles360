// Sérialisation des identifiants BigInt — livrable 11 §1.
//
// Importé ICI, et non seulement dans main.ts : Prisma est ce qui INTRODUIT
// des BigInt dans l'application, et tout ce qui l'utilise en a donc besoin.
// Le placer au seul point de démarrage faisait échouer les tests, qui montent
// AppModule directement — le correctif ne tenait qu'au chemin d'exécution.
import '../common/serialisation/bigint';
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
