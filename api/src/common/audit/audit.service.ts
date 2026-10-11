import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { AuditSeverite, RoleCode, type Prisma } from '../../generated/prisma';

interface EcritureAudit {
  userId: bigint | null;
  /**
   * `systeme` EST UNE VALEUR LÉGITIME, et elle n'est pas dans `RoleCode` :
   * la colonne est une chaîne, pas l'énumération des rôles. Les purges de la
   * loi 09-08 s'inscrivent sous ce nom — les attribuer à un administrateur
   * ferait croire à un acte volontaire.
   */
  roleActeur: RoleCode | 'systeme';
  action: string;
  cibleType: string;
  /** Nul pour une tâche système, qui ne vise aucune ligne en particulier. */
  cibleId: bigint | null;
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
