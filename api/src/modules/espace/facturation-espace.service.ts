import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AbonnementFormule, AbonnementStatut } from '../../generated/prisma';

/**
 * « Abonnement & facturation » de l'espace établissement — maquette
 * `isEtabCredits`.
 *
 * LECTURE SEULE, ET CE N'EST PAS UNE ÉTAPE INTERMÉDIAIRE. Une école ne
 * souscrit pas, ne résilie pas et ne paie pas ici : le tarif se fixe avec un
 * conseiller, l'encaissement se fait hors plateforme, et c'est l'administration
 * qui ouvre un abonnement et émet la facture. Cet écran lui montre ce qui la
 * concerne — ce qu'elle a, jusqu'à quand, et ce qu'on lui a facturé.
 *
 * AUCUN MONTANT N'EST INVENTÉ : tout vient de ses propres factures. La
 * maquette affiche « 2 400 MAD » et « 25 920 MAD » ; ce sont des exemples, et
 * le tarif est une donnée de contrat, jamais une grille publique.
 */
@Injectable()
export class FacturationEspaceService {
  constructor(private readonly db: PrismaService) {}

  async pourEtablissement(etablissementId: bigint) {
    const [abonnements, factures] = await Promise.all([
      this.db.abonnement.findMany({
        where: { etablissement_id: etablissementId },
        orderBy: { debut: 'desc' },
        select: {
          id: true,
          formule: true,
          statut: true,
          tarif_mad: true,
          remise_pct: true,
          debut: true,
          echeance: true,
        },
      }),
      this.db.facture.findMany({
        where: { etablissement_id: etablissementId },
        orderBy: { emise_le: 'desc' },
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
        },
      }),
    ]);

    /**
     * L'ABONNEMENT COURANT EST CELUI QUI EST ACTIF OU EN ESSAI, pas le plus
     * récent. Une école dont l'abonnement a expiré et qui en a ouvert un
     * nouveau hors ligne verrait sinon s'afficher un contrat échu comme le
     * sien — et croirait être couverte.
     */
    const courant =
      abonnements.find(
        (abonnement) =>
          abonnement.statut === AbonnementStatut.actif ||
          abonnement.statut === AbonnementStatut.essai,
      ) ?? null;

    /**
     * L'ESSAI GRATUIT NE SE REPREND PAS (RG13). Savoir qu'il a été consommé
     * est ce que la maquette affiche en premier — « Terminé », avec ses dates.
     * Le chercher dans TOUT l'historique, et non dans le seul abonnement
     * courant : un essai suivi d'un abonnement payant reste un essai consommé.
     */
    const essai =
      abonnements.find((abonnement) => abonnement.formule === AbonnementFormule.essai_gratuit) ??
      null;

    return {
      abonnement: courant && {
        formule: courant.formule,
        statut: courant.statut,
        // Nul sur un essai gratuit — le schéma l'impose, et l'écran l'affiche
        // comme « offert » plutôt que comme un zéro.
        tarif_mad: courant.tarif_mad?.toString() ?? null,
        remise_pct: courant.remise_pct?.toString() ?? null,
        debut: courant.debut,
        echeance: courant.echeance,
      },
      essai: essai && {
        statut: essai.statut,
        debut: essai.debut,
        echeance: essai.echeance,
      },
      factures: factures.map((facture) => ({
        id: facture.id.toString(),
        numero: facture.numero,
        objet: facture.objet,
        montant_ht: facture.montant_ht.toString(),
        tva: facture.tva.toString(),
        total_ttc: facture.total_ttc.toString(),
        statut_paiement: facture.statut_paiement,
        emise_le: facture.emise_le,
        payee_le: facture.payee_le,
      })),
    };
  }
}
