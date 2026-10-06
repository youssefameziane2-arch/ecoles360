import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException, ERROR_CODES } from '../../common/errors';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleCode } from '../../generated/prisma';

/** Durée d'essai retenue si le paramètre a disparu de la table — RG13. */
export const DUREE_ESSAI_DEFAUT_JOURS = 30;

/** Clés attendues — toute autre clé est refusée à l'écriture. */
const CLES_CONNUES = [
  'tva_pct',
  'duree_essai_gratuit_jours',
  'remise_annuelle_pct',
  'rappel_echeance_j',
  'conservation_facture_ans',
  // SEMÉ À ZÉRO, ET CE N'EST PAS UN OUBLI. Le taux de commission relève de la
  // politique commerciale, qu'aucun livrable ne fixe : l'inventer reviendrait
  // à décider ce que touche un commercial. À zéro, aucune commission n'est
  // créée à l'émission d'une facture — la Direction pose le taux depuis son
  // écran le jour où elle l'a arrêté (RG18).
  'commission_pct',
] as const;

type CleParametre = (typeof CLES_CONNUES)[number];

/**
 * Constantes globales de facturation — livrable 11 §3.4, livrable 10 §5.
 *
 * CE SONT DES CONSTANTES DE L'ENTREPRISE, PAS DU CODE. La durée de l'essai
 * gratuit, le taux de TVA ou la remise annuelle changent par décision de
 * gestion, pas par livraison logicielle. Tant qu'elles vivaient en dur dans un
 * service, les modifier demandait un développeur et un déploiement.
 *
 * AUCUN TARIF D'ÉTABLISSEMENT ICI (RG14) : ceux-là sont propres à chaque
 * client et vivent sur `abonnements` et `paiements_vue`.
 */
@Injectable()
export class ParametresFacturationService {
  constructor(
    private readonly db: PrismaService,
    private readonly audit: AuditService,
  ) {}

  lister() {
    return this.db.parametreFacturation.findMany({
      orderBy: { cle: 'asc' },
      select: { cle: true, valeur: true, libelle: true, maj_le: true },
    });
  }

  /**
   * Valeur entière d'un paramètre, avec repli.
   *
   * Le repli n'est pas une négligence : une clé absente ou une valeur illisible
   * ne doit pas empêcher d'activer un essai gratuit. Mieux vaut une durée par
   * défaut qu'une erreur 500 devant un administrateur qui valide une fiche.
   */
  async entier(cle: CleParametre, defaut: number): Promise<number> {
    const parametre = await this.db.parametreFacturation.findUnique({
      where: { cle },
      select: { valeur: true },
    });

    const valeur = Number.parseInt(parametre?.valeur ?? '', 10);

    return Number.isFinite(valeur) && valeur > 0 ? valeur : defaut;
  }

  async mettreAJour(cle: string, valeur: string, adminId: bigint): Promise<void> {
    if (!CLES_CONNUES.includes(cle as CleParametre)) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        `Le paramètre « ${cle} » n'existe pas.`,
      );
    }

    await this.db.$transaction(async (tx) => {
      const existant = await tx.parametreFacturation.findUnique({
        where: { cle },
        select: { id: true, valeur: true },
      });

      if (!existant) {
        throw new AppException(
          HttpStatus.NOT_FOUND,
          ERROR_CODES.RESSOURCE_INTROUVABLE,
          `Le paramètre « ${cle} » n'existe pas.`,
        );
      }

      await tx.parametreFacturation.update({
        where: { cle },
        data: { valeur, modifie_par: adminId, maj_le: new Date() },
      });

      // Journalisé avec l'ancienne ET la nouvelle valeur : une constante de
      // facturation modifiée doit pouvoir s'expliquer après coup (RG15, RG26).
      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'parametre_facturation.modifie',
        cibleType: 'parametre_facturation',
        cibleId: existant.id,
        details: { cle, avant: existant.valeur, apres: valeur },
      });
    });
  }
}
