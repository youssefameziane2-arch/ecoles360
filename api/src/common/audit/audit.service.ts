import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { AuditSeverite, RoleCode, type Prisma } from '../../generated/prisma';

interface EcritureAudit {
  userId: bigint | null;
  roleActeur: RoleCode;
  action: string;
  cibleType: string;
  cibleId: bigint;
  severite?: AuditSeverite;
  details?: Record<string, unknown>;
}

/**
 * Journal d'audit — livrable 11 §3.6, RG15, RG26.
 *
 * INSERTION SEULE, JAMAIS DE LECTURE ICI. `journaliser()` est le seul point
 * d'écriture du journal — aucune route `PATCH`/`DELETE` ne doit jamais exister
 * dessus (RG26). La lecture (`GET /admin/audit`, statistiques) est un écran à
 * part entière, hors du périmètre construit dans cette passe : ce service
 * n'expose donc que ce qu'il faut pour que les actions admin restent
 * traçables dès aujourd'hui, sans attendre l'écran qui les affichera.
 *
 * PREND UN CLIENT DE TRANSACTION (`tx`), pas `PrismaService` directement : une
 * décision admin (valider une fiche, approuver une proposition) et sa trace
 * doivent s'écrire ensemble ou pas du tout, sinon une panne entre les deux
 * laisserait une action sans preuve.
 */
@Injectable()
export class AuditService {
  async journaliser(
    tx: Pick<PrismaService, 'journalAudit'>,
    ecriture: EcritureAudit,
  ): Promise<void> {
    await tx.journalAudit.create({
      data: {
        user_id: ecriture.userId,
        role_acteur: ecriture.roleActeur,
        action: ecriture.action,
        cible_type: ecriture.cibleType,
        cible_id: ecriture.cibleId,
        severite: ecriture.severite ?? AuditSeverite.info,
        details: ecriture.details as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
