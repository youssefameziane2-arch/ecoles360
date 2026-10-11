import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { AppException, ERROR_CODES } from '../../common/errors';
import { PrismaService } from '../../prisma/prisma.service';
import { ParametresFacturationService } from '../admin/parametres-facturation.service';
import {
  AbonnementFormule,
  AbonnementStatut,
  CommissionStatut,
  FactureStatut,
  RoleCode,
  type Prisma,
} from '../../generated/prisma';

/** TVA de repli si le paramètre a disparu — le Maroc applique 20 %. */
const TVA_DEFAUT_PCT = 20;

/** Remise de repli sur l'annuel réglé en une fois (RG11). */
const REMISE_ANNUELLE_DEFAUT_PCT = 10;

/**
 * Abonnements payants, factures et commissions — RG11, RG14, RG18.
 *
 * AUCUNE GRILLE DE TARIFS ICI, ET C'EST VOULU. Le schéma le dit : « le tarif
 * est propre à chaque client et n'est jamais public ». L'administrateur saisit
 * le montant négocié par contrat ; inventer un barème reviendrait à fixer
 * l'offre commerciale à la place du client.
 *
 * LE NUMÉRO DE FACTURE EST UNE OBLIGATION COMPTABLE, pas un identifiant
 * technique : séquence continue par année, sans trou ni doublon. Il est donc
 * attribué sous VERROU DE TABLE, pas par un `MAX(numero) + 1` lu puis écrit —
 * deux émissions simultanées liraient le même maximum et produiraient deux
 * fois le même numéro, ce que la contrainte d'unicité transformerait en erreur
 * 500 au pire moment, et en facture manquante au mieux.
 */
@Injectable()
export class FacturationService {
  constructor(
    private readonly db: PrismaService,
    private readonly audit: AuditService,
    private readonly parametres: ParametresFacturationService,
  ) {}

  /**
   * Ouvre un abonnement payant — mensuel ou annuel.
   *
   * REFUSE SI UN ABONNEMENT EST DÉJÀ EN COURS. Le schéma ne porte pas cette
   * unicité (plusieurs lignes expirées coexistent légitimement) : c'est une
   * garantie de service. Sans elle, un établissement cumulerait deux
   * abonnements actifs et l'on ne saurait plus lequel facturer.
   */
  async ouvrirAbonnement(
    etablissementId: bigint,
    dto: {
      formule: AbonnementFormule;
      tarif_mad: number;
      remise_pct?: number;
      debut?: string;
    },
    adminId: bigint,
  ) {
    if (dto.formule === AbonnementFormule.essai_gratuit) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ECHOUEE,
        'L’essai gratuit s’active par son action dédiée, qui applique la durée du paramétrage (RG13).',
      );
    }

    const etablissement = await this.db.etablissement.findUnique({
      where: { id: etablissementId },
      select: { id: true, nom: true },
    });

    if (!etablissement) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cet établissement n'existe pas.",
      );
    }

    const enCours = await this.db.abonnement.findFirst({
      where: {
        etablissement_id: etablissementId,
        statut: { in: [AbonnementStatut.essai, AbonnementStatut.actif] },
      },
      select: { id: true },
    });

    if (enCours) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ERROR_CODES.CONFLIT_METIER,
        'Un abonnement est déjà en cours pour cet établissement : résiliez-le avant d’en ouvrir un autre.',
      );
    }

    const debut = dto.debut ? new Date(dto.debut) : new Date();
    const echeance = new Date(debut);

    if (dto.formule === AbonnementFormule.annuel) {
      echeance.setFullYear(echeance.getFullYear() + 1);
    } else {
      echeance.setMonth(echeance.getMonth() + 1);
    }

    // LA REMISE NE VAUT QUE POUR L'ANNUEL (RG11). L'accepter sur un mensuel
    // ferait un rabais silencieux que personne n'a négocié.
    const remise =
      dto.formule === AbonnementFormule.annuel
        ? (dto.remise_pct ??
          (await this.parametres.entier('remise_annuelle_pct', REMISE_ANNUELLE_DEFAUT_PCT)))
        : null;

    return this.db.$transaction(async (tx) => {
      const abonnement = await tx.abonnement.create({
        data: {
          etablissement_id: etablissementId,
          formule: dto.formule,
          tarif_mad: dto.tarif_mad,
          remise_pct: remise,
          debut,
          echeance,
          statut: AbonnementStatut.actif,
        },
      });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'abonnement.ouvert',
        cibleType: 'etablissement',
        cibleId: etablissementId,
        details: {
          etablissement: etablissement.nom,
          formule: dto.formule,
          tarif_mad: dto.tarif_mad,
          remise_pct: remise,
        },
      });

      return abonnement;
    });
  }

  /**
   * Émet la facture d'un abonnement — RG14, RG18.
   *
   * LE MONTANT VIENT DE L'ABONNEMENT, PAS DE LA REQUÊTE. Laisser l'écran
   * envoyer un montant permettrait de facturer autre chose que ce qui a été
   * contractualisé, sans que la facture et l'abonnement ne se contredisent
   * visiblement.
   *
   * LA COMMISSION NAÎT ICI, EN `a_valider` (RG18). Elle n'est due que si un
   * commercial a apporté l'affaire — c'est le `Prospect` transformé qui le
   * dit. Sans prospect ni commercial, pas de commission : personne à payer.
   */
  async emettreFacture(abonnementId: bigint, adminId: bigint, tauxCommissionPct?: number) {
    const abonnement = await this.db.abonnement.findUnique({
      where: { id: abonnementId },
      include: { etablissement: { select: { id: true, nom: true } } },
    });

    if (!abonnement) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cet abonnement n'existe pas.",
      );
    }

    if (abonnement.tarif_mad === null) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ERROR_CODES.CONFLIT_METIER,
        'Un essai gratuit ne se facture pas : il n’a pas de tarif (RG13).',
      );
    }

    const tvaPct = await this.parametres.entier('tva_pct', TVA_DEFAUT_PCT);

    const { montantHt, tva, totalTtc } = montantsFacture({
      tarif: Number(abonnement.tarif_mad),
      remisePct: Number(abonnement.remise_pct ?? 0),
      tvaPct,
    });

    // Le commercial qui a apporté l'affaire, s'il y en a un.
    const prospect = await this.db.prospect.findFirst({
      where: { etablissement_id: abonnement.etablissement_id, commercial_id: { not: null } },
      select: { commercial_id: true },
    });

    return this.db.$transaction(async (tx) => {
      const numero = await this.numeroSuivant(tx);

      const facture = await tx.facture.create({
        data: {
          etablissement_id: abonnement.etablissement_id,
          numero,
          objet: `Abonnement ${abonnement.formule} — ${abonnement.etablissement.nom}`,
          abonnement_id: abonnement.id,
          montant_ht: montantHt,
          tva,
          total_ttc: totalTtc,
          statut_paiement: FactureStatut.non_payee,
        },
      });

      if (prospect?.commercial_id) {
        const taux = tauxCommissionPct ?? (await this.parametres.entier('commission_pct', 0));

        if (taux > 0) {
          await tx.commission.create({
            data: {
              facture_id: facture.id,
              commercial_id: prospect.commercial_id,
              taux_pct: taux,
              montant_mad: arrondi(montantHt * (taux / 100)),
              statut: CommissionStatut.a_valider,
            },
          });
        }
      }

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'facture.emise',
        cibleType: 'facture',
        cibleId: facture.id,
        details: {
          numero,
          etablissement: abonnement.etablissement.nom,
          montant_ht: montantHt,
          total_ttc: totalTtc,
        },
      });

      return facture;
    });
  }

  /**
   * Marque une facture encaissée — c'est elle qui lève la condition RG14.
   *
   * IRRÉVERSIBLE PAR CETTE ROUTE. Dé-encaisser une facture déjà payée est un
   * acte comptable qui demande un avoir, pas un retour en arrière silencieux.
   * Mieux vaut refuser que d'ouvrir un chemin dont personne ne garderait trace
   * autrement que dans le journal.
   */
  async encaisser(factureId: bigint, adminId: bigint) {
    const facture = await this.db.facture.findUnique({
      where: { id: factureId },
      select: { id: true, numero: true, statut_paiement: true, total_ttc: true },
    });

    if (!facture) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cette facture n'existe pas.",
      );
    }

    if (facture.statut_paiement === FactureStatut.payee) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ERROR_CODES.CONFLIT_METIER,
        'Cette facture est déjà encaissée.',
      );
    }

    await this.db.$transaction(async (tx) => {
      await tx.facture.update({
        where: { id: factureId },
        data: { statut_paiement: FactureStatut.payee, payee_le: new Date() },
      });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'facture.encaissee',
        cibleType: 'facture',
        cibleId: factureId,
        details: { numero: facture.numero, total_ttc: facture.total_ttc.toString() },
      });
    });
  }

  /**
   * Numéro suivant de la séquence annuelle — `F2026-000641`.
   *
   * LE VERROU EST LA RAISON D'ÊTRE DE CETTE MÉTHODE. `SELECT … FOR UPDATE`
   * sur les factures de l'année en cours sérialise les émissions concurrentes :
   * la seconde attend que la première ait écrit la sienne. Sans lui, deux
   * requêtes simultanées liraient le même maximum, et la contrainte d'unicité
   * ferait échouer l'une des deux — une facture perdue, et une erreur 500 que
   * rien n'explique.
   *
   * La séquence repart à 1 chaque année, ce que `F<année>-` rend explicite.
   */
  private async numeroSuivant(tx: Prisma.TransactionClient): Promise<string> {
    const annee = new Date().getFullYear();
    const prefixe = `F${annee}-`;

    const lignes = await tx.$queryRaw<{ numero: string }[]>`
      SELECT numero FROM factures
      WHERE numero LIKE ${`${prefixe}%`}
      ORDER BY numero DESC
      LIMIT 1
      FOR UPDATE
    `;

    const dernier = lignes[0]?.numero;
    const rang = dernier ? Number.parseInt(dernier.slice(prefixe.length), 10) + 1 : 1;

    return `${prefixe}${String(rang).padStart(6, '0')}`;
  }
}

/** Deux décimales — les montants sont des `Decimal(10,2)` en base. */
const arrondi = (valeur: number): number => Math.round(valeur * 100) / 100;

/**
 * Les trois montants d'une facture d'abonnement, à partir du tarif négocié.
 *
 * EXPORTÉE, ET C'EST LE POINT. L'écran d'administration montre ces montants
 * AVANT d'émettre, pour qu'on sache ce qu'on signe ; s'il les recalculait de
 * son côté, l'aperçu et la pièce comptable dériveraient le jour où la remise
 * ou la TVA change de règle, et personne ne le verrait avant un écart de
 * caisse. Un seul calcul, deux usages.
 *
 * LA REMISE S'APPLIQUE AVANT LA TVA (RG11) : la taxe porte sur ce qui est
 * réellement dû, pas sur un prix que le client ne paie pas.
 */
export function montantsFacture({
  tarif,
  remisePct,
  tvaPct,
}: {
  tarif: number;
  remisePct: number;
  tvaPct: number;
}): { montantHt: number; tva: number; totalTtc: number } {
  const montantHt = arrondi(tarif * (1 - remisePct / 100));
  const tva = arrondi(montantHt * (tvaPct / 100));

  return { montantHt, tva, totalTtc: arrondi(montantHt + tva) };
}
