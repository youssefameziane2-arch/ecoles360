import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ParametresFacturationService } from '../admin/parametres-facturation.service';
import { montantsFacture } from './facturation.service';
import { AbonnementStatut, FactureStatut, type Prisma } from '../../generated/prisma';

/** TVA de repli si le paramètre a disparu — le Maroc applique 20 %. */
const TVA_DEFAUT_PCT = 20;

/** Un mois calendaire en UTC — même convention que les statistiques. */
function moisCourant(): { debut: Date; fin: Date } {
  const maintenant = new Date();
  const debut = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), 1));
  const fin = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth() + 1, 1));

  return { debut, fin };
}

/**
 * Lecture de la facturation — écran `isAdminFact`.
 *
 * SÉPARÉ DE `FacturationService`, qui écrit. Un écran de consultation ne doit
 * pas pouvoir, par un import malheureux, appeler l'émission d'une facture ou
 * l'encaissement : ce sont des actes comptables, et ils vivent ailleurs.
 *
 * LES MONTANTS SORTENT EN CHAÎNES. `Decimal` n'est pas un nombre JavaScript :
 * le sérialiser en `number` perdrait des centimes sur les grands montants, et
 * personne ne s'en apercevrait avant un écart de caisse.
 */
@Injectable()
export class FacturationLectureService {
  constructor(
    private readonly db: PrismaService,
    private readonly parametres: ParametresFacturationService,
  ) {}

  /**
   * Les indicateurs de l'en-tête.
   *
   * « ENCAISSÉ CE MOIS » SE COMPTE SUR `payee_le`, PAS `emise_le` : c'est la
   * date où l'argent est entré. Une facture de janvier réglée en mars appartient
   * à mars, sans quoi le chiffre du mois dépendrait de la date d'émission et ne
   * représenterait plus une recette.
   */
  async indicateurs() {
    const { debut, fin } = moisCourant();

    const [encaisseMois, enAttente, abonnementsActifs, echeancesProches] = await Promise.all([
      this.db.facture.aggregate({
        where: { statut_paiement: FactureStatut.payee, payee_le: { gte: debut, lt: fin } },
        _sum: { total_ttc: true },
        _count: true,
      }),
      this.db.facture.aggregate({
        where: { statut_paiement: FactureStatut.non_payee },
        _sum: { total_ttc: true },
        _count: true,
      }),
      this.db.abonnement.count({
        where: { statut: { in: [AbonnementStatut.actif, AbonnementStatut.essai] } },
      }),
      // Ce que le conteneur `scheduler` rappellera quand il existera (RG14,
      // paramètre `rappel_echeance_j`). En attendant, l'écran le montre.
      this.db.abonnement.count({
        where: {
          statut: { in: [AbonnementStatut.actif, AbonnementStatut.essai] },
          echeance: { lt: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
        },
      }),
    ]);

    return {
      encaisse_ce_mois: (encaisseMois._sum.total_ttc ?? 0).toString(),
      factures_encaissees_ce_mois: encaisseMois._count,
      en_attente: (enAttente._sum.total_ttc ?? 0).toString(),
      factures_en_attente: enAttente._count,
      abonnements_actifs: abonnementsActifs,
      echeances_sous_30_jours: echeancesProches,
    };
  }

  /** L'historique, filtrable par statut de paiement. */
  async factures(filtres: { statut?: FactureStatut; etablissementId?: bigint }) {
    return this.db.facture.findMany({
      where: {
        statut_paiement: filtres.statut,
        etablissement_id: filtres.etablissementId,
      },
      orderBy: { emise_le: 'desc' },
      take: 200,
      select: {
        id: true,
        numero: true,
        objet: true,
        montant_ht: true,
        tva: true,
        total_ttc: true,
        statut_paiement: true,
        emise_le: true,
        payee_le: true,
        etablissement: { select: { id: true, nom: true, slug: true } },
        abonnement: { select: { formule: true, debut: true, echeance: true } },
        commissions: {
          select: {
            id: true,
            taux_pct: true,
            montant_mad: true,
            statut: true,
            commercial: { select: { name: true } },
          },
        },
      },
    });
  }

  /** Une facture, telle que l'écran de détail l'affiche. */
  async facture(id: bigint) {
    return this.db.facture.findUnique({
      where: { id },
      select: {
        id: true,
        numero: true,
        objet: true,
        montant_ht: true,
        tva: true,
        total_ttc: true,
        statut_paiement: true,
        emise_le: true,
        payee_le: true,
        etablissement: {
          select: { id: true, nom: true, slug: true, adresse: true, email: true, tel: true },
        },
        abonnement: {
          select: { formule: true, tarif_mad: true, remise_pct: true, debut: true, echeance: true },
        },
        sponsoring: { select: { niveau: true, debut: true, fin: true } },
        commissions: {
          select: {
            id: true,
            taux_pct: true,
            montant_mad: true,
            statut: true,
            validee_le: true,
            commercial: { select: { name: true, email: true } },
          },
        },
      },
    });
  }

  /**
   * Les abonnements d'un établissement, du plus récent au plus ancien, chacun
   * accompagné du récapitulatif de ce qu'une facture porterait.
   *
   * L'APERÇU VOYAGE AVEC L'ABONNEMENT, sans route ni appel de plus : l'écran
   * charge déjà cette liste, et le bouton « Émettre une facture » est juste à
   * côté. Jusqu'ici il s'actionnait À L'AVEUGLE — on validait une pièce
   * comptable sans avoir vu son montant, et on ne le découvrait qu'une fois
   * émise, c'est-à-dire trop tard pour la corriger.
   *
   * LES MONTANTS VIENNENT DE `montantsFacture`, le calcul qu'emploie
   * l'émission elle-même. Les recalculer ici, ou pire dans le navigateur,
   * ferait diverger l'aperçu de la facture le jour où la remise ou la TVA
   * change — et c'est précisément le genre d'écart qu'on ne voit pas venir.
   */
  async abonnements(etablissementId: bigint) {
    const [abonnements, tvaPct] = await Promise.all([
      this.db.abonnement.findMany({
        where: { etablissement_id: etablissementId },
        orderBy: { debut: 'desc' },
        select: {
          id: true,
          formule: true,
          tarif_mad: true,
          remise_pct: true,
          debut: true,
          echeance: true,
          statut: true,
          factures: {
            select: { id: true, numero: true, total_ttc: true, statut_paiement: true },
            orderBy: { emise_le: 'desc' },
          },
        },
      }),
      this.parametres.entier('tva_pct', TVA_DEFAUT_PCT),
    ]);

    return abonnements.map((abonnement) => ({
      ...abonnement,
      // NUL SUR UN ESSAI GRATUIT, qui n'a pas de tarif et ne se facture pas
      // (RG13). Un récapitulatif à zéro laisserait croire à une facture de
      // zéro dirham, alors qu'il n'y en aura aucune.
      apercu: abonnement.tarif_mad === null ? null : this.apercu(abonnement, tvaPct),
    }));
  }

  /** Le récapitulatif d'un abonnement payant — montants en chaînes. */
  private apercu(
    abonnement: { tarif_mad: Prisma.Decimal | null; remise_pct: Prisma.Decimal | null },
    tvaPct: number,
  ) {
    const tarif = Number(abonnement.tarif_mad);
    const remisePct = Number(abonnement.remise_pct ?? 0);
    const { montantHt, tva, totalTtc } = montantsFacture({ tarif, remisePct, tvaPct });

    return {
      base_ht: tarif.toFixed(2),
      remise_pct: remisePct,
      // La remise en dirhams, et pas seulement en pourcentage : c'est le
      // montant retiré que l'on relit sur un devis, pas un taux à appliquer
      // de tête.
      remise_mad: (Math.round((tarif - montantHt) * 100) / 100).toFixed(2),
      montant_ht: montantHt.toFixed(2),
      tva_pct: tvaPct,
      tva: tva.toFixed(2),
      total_ttc: totalTtc.toFixed(2),
    };
  }
}
