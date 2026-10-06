import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { AppException, ERROR_CODES } from '../../common/errors';
import { PrismaService } from '../../prisma/prisma.service';
import { ProspectStatut, RoleCode } from '../../generated/prisma';

/**
 * Pipeline commercial d'écoles360 — prospects, relances, transformation (RG17).
 *
 * NE PAS CONFONDRE AVEC `Lead`. Un `Prospect` est une ÉCOLE qu'un commercial
 * d'écoles360 démarche pour qu'elle s'abonne. Un `Lead` est un PARENT
 * intéressé par une école donnée : il appartient à cette école, et la RG23
 * réserve son accès à son titulaire — l'administration n'en voit que des
 * agrégats. Les deux portent le mot « CRM » dans la maquette et vivent dans
 * des tables distinctes ; les mêler exposerait des données personnelles de
 * parents à qui n'y a pas droit.
 *
 * LE PROPRIÉTAIRE D'UN PROSPECT EST `commercial_id`, ET IL COMMANDE TOUT :
 * c'est lui qui donne droit à la commission à la facturation (RG18), et c'est
 * lui qui borne ce qu'un commercial voit de son portefeuille.
 */
@Injectable()
export class CrmService {
  constructor(
    private readonly db: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Fait avancer un prospect dans le pipeline.
   *
   * `transforme` N'EST PAS POSÉ ICI. Ce statut signifie qu'une fiche
   * d'établissement existe désormais — c'est un fait, pas une intention. Le
   * poser à la main laisserait un prospect « transformé » sans établissement
   * en face, et la commission de la RG18 n'aurait rien à quoi se rattacher.
   * Il est posé par `transformer()`, et seulement par elle.
   */
  async changerStatut(
    prospectId: bigint,
    cible: ProspectStatut,
    acteur: { userId: bigint; role: RoleCode },
  ) {
    if (cible === ProspectStatut.transforme) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ECHOUEE,
        'Un prospect devient « transformé » en créant sa fiche d’établissement, pas en changeant son statut.',
      );
    }

    const prospect = await this.sien(prospectId, acteur);

    if (prospect.statut_pipeline === ProspectStatut.transforme) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ERROR_CODES.CONFLIT_METIER,
        'Ce prospect est déjà transformé : sa fiche existe.',
      );
    }

    await this.db.$transaction(async (tx) => {
      await tx.prospect.update({
        where: { id: prospectId },
        data: { statut_pipeline: cible },
      });

      await this.audit.journaliser(tx, {
        userId: acteur.userId,
        roleActeur: acteur.role,
        action: 'prospect.statut',
        cibleType: 'prospect',
        cibleId: prospectId,
        details: {
          etablissement: prospect.etablissement_nom,
          depuis: prospect.statut_pipeline,
          vers: cible,
        },
      });
    });
  }

  /**
   * Confie un prospect à un commercial — ou le lui retire.
   *
   * RÉSERVÉ À L'ADMINISTRATION. Laisser un commercial s'attribuer un prospect
   * reviendrait à le laisser s'attribuer la commission qui en découlera
   * (RG18) : c'est une décision de la Direction, pas du vendeur.
   */
  async assigner(prospectId: bigint, commercialId: bigint | null, adminId: bigint) {
    const prospect = await this.db.prospect.findUnique({
      where: { id: prospectId },
      select: { id: true, etablissement_nom: true },
    });

    if (!prospect) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Ce prospect n'existe pas.",
      );
    }

    if (commercialId !== null) {
      const commercial = await this.db.user.findFirst({
        where: { id: commercialId, role: { code: RoleCode.commercial } },
        select: { id: true, name: true },
      });

      if (!commercial) {
        throw new AppException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ERROR_CODES.VALIDATION_ECHOUEE,
          "Ce compte n'est pas un commercial.",
        );
      }
    }

    await this.db.$transaction(async (tx) => {
      await tx.prospect.update({
        where: { id: prospectId },
        data: { commercial_id: commercialId },
      });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: commercialId ? 'prospect.assigne' : 'prospect.desassigne',
        cibleType: 'prospect',
        cibleId: prospectId,
        details: {
          etablissement: prospect.etablissement_nom,
          commercial_id: commercialId?.toString() ?? null,
        },
      });
    });
  }

  /**
   * Programme ou enregistre une relance — RG17.
   *
   * `prevue_le` SANS `effectuee_le` est une relance À FAIRE ; les deux
   * remplies, une relance faite. C'est ce qui alimente « les relances du
   * jour » de l'agenda, et c'est pourquoi les deux dates sont distinctes
   * plutôt qu'un seul champ avec un drapeau.
   */
  async ajouterRelance(
    prospectId: bigint,
    dto: { note?: string; prevue_le?: string; effectuee?: boolean },
    acteur: { userId: bigint; role: RoleCode },
  ) {
    const prospect = await this.sien(prospectId, acteur);

    const relance = await this.db.relance.create({
      data: {
        prospect_id: prospectId,
        commercial_id: acteur.userId,
        note: dto.note ?? null,
        prevue_le: dto.prevue_le ? new Date(dto.prevue_le) : null,
        effectuee_le: dto.effectuee ? new Date() : null,
      },
    });

    // SORTIR DE « nouveau » DÈS LA PREMIÈRE RELANCE : un prospect qu'on vient
    // d'appeler n'est plus nouveau, et le laisser dans cette colonne ferait
    // mentir le pipeline sur ce qui reste à traiter.
    if (prospect.statut_pipeline === ProspectStatut.nouveau) {
      await this.db.prospect.update({
        where: { id: prospectId },
        data: { statut_pipeline: ProspectStatut.a_contacter },
      });
    }

    return relance;
  }

  /** Marque une relance programmée comme faite. */
  async effectuerRelance(relanceId: bigint, acteur: { userId: bigint; role: RoleCode }) {
    const relance = await this.db.relance.findUnique({
      where: { id: relanceId },
      select: { id: true, prospect_id: true, effectuee_le: true },
    });

    if (!relance) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cette relance n'existe pas.",
      );
    }

    await this.sien(relance.prospect_id, acteur);

    if (relance.effectuee_le) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ERROR_CODES.CONFLIT_METIER,
        'Cette relance est déjà marquée faite.',
      );
    }

    await this.db.relance.update({
      where: { id: relanceId },
      data: { effectuee_le: new Date() },
    });
  }

  /**
   * Charge un prospect en vérifiant que l'acteur a le droit de le toucher.
   *
   * UN COMMERCIAL NE VOIT QUE SON PORTEFEUILLE. Sans ce contrôle, il
   * relancerait le prospect d'un collègue — et, le jour de la facture, la
   * commission irait à celui dont le nom figure sur la fiche, pas à celui qui
   * a passé l'appel. Le conflit se découvrirait au moment de payer.
   */
  private async sien(prospectId: bigint, acteur: { userId: bigint; role: RoleCode }) {
    const prospect = await this.db.prospect.findUnique({
      where: { id: prospectId },
      select: {
        id: true,
        etablissement_nom: true,
        statut_pipeline: true,
        commercial_id: true,
      },
    });

    if (!prospect) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Ce prospect n'existe pas.",
      );
    }

    const sien = prospect.commercial_id === acteur.userId;

    if (acteur.role !== RoleCode.superadmin && !sien) {
      // 404, PAS 403 : confirmer l'existence d'un prospect qu'on n'a pas le
      // droit de voir révélerait déjà le portefeuille d'un collègue.
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Ce prospect n'existe pas.",
      );
    }

    return prospect;
  }
}
