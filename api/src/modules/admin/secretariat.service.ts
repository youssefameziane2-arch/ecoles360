import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { AppException, ERROR_CODES } from '../../common/errors';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { PermissionPortee, RoleCode, UserStatut } from '../../generated/prisma';

/**
 * Comptes du secrétariat et portées déléguées — écran `isAdminUsers`.
 *
 * CE SERVICE N'INVENTE AUCUNE RÈGLE : il expose celles qui existaient déjà
 * sans écran pour les piloter. La RG05 délègue trois portées — `fiches`,
 * `contacts`, `avis` — et le modèle `Permission` prévoit depuis le début
 * `accordee_par`, `accordee_le` et `revoquee_le`. Jusqu'ici, seul le seeder
 * savait les poser.
 *
 * UNE PORTÉE SE RÉVOQUE, ELLE NE S'EFFACE PAS. `revoquee_le` est renseigné et
 * la ligne reste : qui a accordé quoi, quand, et quand on le lui a retiré. Un
 * `DELETE` rendrait cette question sans réponse le jour où elle se pose — et
 * elle se pose toujours après coup, quand on cherche qui a vu quoi.
 */
@Injectable()
export class SecretariatService {
  constructor(
    private readonly db: PrismaService,
    private readonly audit: AuditService,
    private readonly auth: AuthService,
  ) {}

  /** Les comptes secrétariat, leur rattachement et leurs portées en cours. */
  async lister() {
    const comptes = await this.db.user.findMany({
      where: { role: { code: RoleCode.secretariat } },
      orderBy: [{ statut: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        statut: true,
        cree_le: true,
        etablissementRattache: { select: { id: true, nom: true, slug: true } },
        permissions: {
          where: { revoquee_le: null },
          select: { portee: true, accordee_le: true, accordeur: { select: { name: true } } },
        },
      },
    });

    return comptes.map((compte) => ({
      ...compte,
      portees: compte.permissions.map((p) => p.portee),
      permissions: undefined,
      accordees: compte.permissions,
    }));
  }

  /**
   * Accorde ou révoque une portée.
   *
   * L'UNICITÉ EST SUR (user, portée), révocation comprise : on ne peut donc
   * pas empiler deux lignes pour la même paire. Ré-accorder une portée
   * révoquée efface son `revoquee_le` et réinscrit qui l'a rendue, plutôt que
   * de créer un doublon que la contrainte refuserait.
   */
  async basculerPortee(
    userId: bigint,
    portee: PermissionPortee,
    accordee: boolean,
    adminId: bigint,
  ) {
    const compte = await this.compteSecretariat(userId);

    await this.db.$transaction(async (tx) => {
      if (accordee) {
        await tx.permission.upsert({
          where: { user_id_portee: { user_id: userId, portee } },
          create: { user_id: userId, portee, accordee_par: adminId },
          update: { revoquee_le: null, accordee_par: adminId, accordee_le: new Date() },
        });
      } else {
        await tx.permission.updateMany({
          where: { user_id: userId, portee, revoquee_le: null },
          data: { revoquee_le: new Date() },
        });
      }

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: accordee ? 'secretariat.portee.accordee' : 'secretariat.portee.revoquee',
        cibleType: 'user',
        cibleId: userId,
        details: { compte: compte.email, portee },
      });
    });

    return this.lister();
  }

  /**
   * Suspend ou réactive un compte — RG25.
   *
   * LA SUSPENSION COUPE L'ACCÈS TOUT DE SUITE, elle n'attend pas l'expiration
   * de la session en cours. C'est la raison d'être des sessions en Redis :
   * `revoquerSessions` balaie le préfixe du compte et détruit ce qui traîne.
   * Sans cet appel, un secrétariat suspendu garderait douze heures d'accès à
   * des fiches, des contacts et des avis.
   */
  async basculerStatut(userId: bigint, suspendu: boolean, adminId: bigint) {
    const compte = await this.compteSecretariat(userId);

    await this.db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { statut: suspendu ? UserStatut.suspendu : UserStatut.actif },
      });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: suspendu ? 'secretariat.compte.suspendu' : 'secretariat.compte.reactive',
        cibleType: 'user',
        cibleId: userId,
        details: { compte: compte.email },
      });
    });

    if (suspendu) {
      await this.auth.revoquerSessions(userId);
    }

    return this.lister();
  }

  /**
   * Vérifie que la cible est bien un compte secrétariat.
   *
   * Sans ce contrôle, l'identifiant d'un administrateur passerait par ces
   * routes : on pourrait suspendre la direction depuis un écran intitulé
   * « Secrétariat ». La garde de rôle protège l'ACCÈS à l'écran, pas la CIBLE
   * de l'action.
   */
  private async compteSecretariat(userId: bigint) {
    const compte = await this.db.user.findFirst({
      where: { id: userId, role: { code: RoleCode.secretariat } },
      select: { id: true, email: true },
    });

    if (!compte) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Ce compte de secrétariat n'existe pas.",
      );
    }

    return compte;
  }
}
