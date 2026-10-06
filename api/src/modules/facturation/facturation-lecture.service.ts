import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AbonnementStatut, FactureStatut } from '../../generated/prisma';

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
  constructor(private readonly db: PrismaService) {}

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

  /** Les abonnements d'un établissement, du plus récent au plus ancien. */
  async abonnements(etablissementId: bigint) {
    return this.db.abonnement.findMany({
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
    });
  }
}
