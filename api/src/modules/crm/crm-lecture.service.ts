import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CommissionStatut, ProspectStatut, RoleCode } from '../../generated/prisma';

/** Les six colonnes du pipeline, dans l'ordre où elles se parcourent (RG17). */
export const COLONNES_PIPELINE = [
  ProspectStatut.nouveau,
  ProspectStatut.a_contacter,
  ProspectStatut.chaud,
  ProspectStatut.relance,
  ProspectStatut.transforme,
  ProspectStatut.perdu,
] as const;

const SELECTION_PROSPECT = {
  id: true,
  etablissement_nom: true,
  ville: true,
  type_vise: true,
  contact_nom: true,
  contact_fonction: true,
  telephone: true,
  email: true,
  formule_visee: true,
  message: true,
  source: true,
  statut_pipeline: true,
  cree_le: true,
  etablissement: { select: { id: true, nom: true, slug: true, statut: true } },
  commercial: { select: { id: true, name: true } },
  relances: {
    orderBy: { id: 'desc' },
    take: 5,
    select: {
      id: true,
      note: true,
      prevue_le: true,
      effectuee_le: true,
      commercial: { select: { name: true } },
    },
  },
} as const;

/**
 * Lecture du CRM — écrans `isAdminCrm` et `isCrm`.
 *
 * SÉPARÉ DE `CrmService`, QUI ÉCRIT. Un écran de consultation ne doit pas
 * pouvoir, par un import malheureux, réassigner un prospect — donc déplacer
 * une commission.
 *
 * LA PORTÉE EST UN PARAMÈTRE, PAS UNE SUPPOSITION. Chaque méthode reçoit le
 * commercial dont on veut le portefeuille, ou `null` pour tout voir. Le
 * contrôleur le dérive du rôle ; le service ne devine jamais.
 */
@Injectable()
export class CrmLectureService {
  constructor(private readonly db: PrismaService) {}

  /** Le pipeline, colonne par colonne. */
  async pipeline(commercialId: bigint | null) {
    const where = commercialId === null ? {} : { commercial_id: commercialId };

    const prospects = await this.db.prospect.findMany({
      where,
      orderBy: { cree_le: 'desc' },
      select: SELECTION_PROSPECT,
    });

    return COLONNES_PIPELINE.map((statut) => ({
      statut,
      prospects: prospects.filter((p) => p.statut_pipeline === statut),
    }));
  }

  /**
   * Les indicateurs de l'en-tête.
   *
   * LE TAUX DE TRANSFORMATION SE CALCULE SUR LES DOSSIERS CLOS, pas sur tout
   * le portefeuille : compter les prospects encore en cours comme des échecs
   * ferait baisser le taux à mesure qu'on prospecte, ce qui punirait
   * exactement le comportement qu'on veut encourager.
   */
  async indicateurs(commercialId: bigint | null) {
    const where = commercialId === null ? {} : { commercial_id: commercialId };

    const [parStatut, relancesDues, commissions] = await Promise.all([
      this.db.prospect.groupBy({ by: ['statut_pipeline'], where, _count: true }),
      this.db.relance.count({
        where: {
          effectuee_le: null,
          prevue_le: { lte: new Date() },
          ...(commercialId === null ? {} : { commercial_id: commercialId }),
        },
      }),
      this.db.commission.groupBy({
        by: ['statut'],
        where: commercialId === null ? {} : { commercial_id: commercialId },
        _count: true,
        _sum: { montant_mad: true },
      }),
    ]);

    const compte = (statut: ProspectStatut) =>
      parStatut.find((ligne) => ligne.statut_pipeline === statut)?._count ?? 0;

    const transformes = compte(ProspectStatut.transforme);
    const perdus = compte(ProspectStatut.perdu);
    const clos = transformes + perdus;

    const montant = (statut: CommissionStatut) =>
      (commissions.find((ligne) => ligne.statut === statut)?._sum.montant_mad ?? 0).toString();

    return {
      total: parStatut.reduce((somme, ligne) => somme + ligne._count, 0),
      /**
       * CE QUI VIENT D'ARRIVER ET QUE PERSONNE N'A ENCORE VU.
       *
       * Le formulaire public dépose un prospect en `nouveau` (B-46), et aucun
       * courriel ne prévient qui que ce soit — il n'y a pas d'envoi d'e-mail
       * dans le projet. Ce compteur est, pour l'instant, le seul signal : il
       * s'affiche sur l'entrée « CRM Clients » de la navigation, de sorte
       * qu'une demande déposée un vendredi soir se voie sans ouvrir l'écran.
       */
      nouveaux: compte(ProspectStatut.nouveau),
      en_cours: COLONNES_PIPELINE.filter(
        (s) => s !== ProspectStatut.transforme && s !== ProspectStatut.perdu,
      ).reduce((somme, s) => somme + compte(s), 0),
      transformes,
      perdus,
      // `null` plutôt que 0 quand aucun dossier n'est clos : un taux de 0 %
      // affirmerait un échec là où il n'y a encore aucune mesure.
      taux_transformation: clos === 0 ? null : Math.round((transformes / clos) * 100),
      relances_dues: relancesDues,
      commissions_a_valider: montant(CommissionStatut.a_valider),
      commissions_validees: montant(CommissionStatut.validee),
      commissions_reglees: montant(CommissionStatut.reglee),
    };
  }

  /** Les relances à faire, les plus anciennes d'abord — l'agenda du commercial. */
  async relancesDues(commercialId: bigint | null) {
    return this.db.relance.findMany({
      where: {
        effectuee_le: null,
        prevue_le: { not: null },
        ...(commercialId === null ? {} : { commercial_id: commercialId }),
      },
      orderBy: { prevue_le: 'asc' },
      take: 100,
      select: {
        id: true,
        note: true,
        prevue_le: true,
        prospect: {
          select: {
            id: true,
            etablissement_nom: true,
            contact_nom: true,
            telephone: true,
            statut_pipeline: true,
          },
        },
        commercial: { select: { id: true, name: true } },
      },
    });
  }

  /** Les commissions d'un commercial, ou de tous — écran « Transferts & commissions ». */
  async commissions(commercialId: bigint | null) {
    return this.db.commission.findMany({
      where: commercialId === null ? {} : { commercial_id: commercialId },
      orderBy: { id: 'desc' },
      take: 200,
      select: {
        id: true,
        taux_pct: true,
        montant_mad: true,
        statut: true,
        validee_le: true,
        commercial: { select: { id: true, name: true } },
        facture: {
          select: {
            id: true,
            numero: true,
            total_ttc: true,
            statut_paiement: true,
            emise_le: true,
            etablissement: { select: { nom: true, slug: true } },
          },
        },
      },
    });
  }

  /**
   * Les commerciaux et leur portefeuille — écran `isAdminCommerciaux`.
   *
   * LES COMPTES SUSPENDUS Y FIGURENT. Un commercial suspendu garde ses
   * prospects et ses commissions : les masquer ferait disparaître des
   * dossiers du décompte, et de l'argent dû de la liste des choses à payer.
   */
  async commerciaux() {
    const comptes = await this.db.user.findMany({
      where: { role: { code: RoleCode.commercial } },
      orderBy: [{ statut: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        telephone: true,
        statut: true,
        cree_le: true,
      },
    });

    return Promise.all(
      comptes.map(async (compte) => {
        const [parStatut, commissions, relancesDues] = await Promise.all([
          this.db.prospect.groupBy({
            by: ['statut_pipeline'],
            where: { commercial_id: compte.id },
            _count: true,
          }),
          this.db.commission.aggregate({
            where: { commercial_id: compte.id },
            _sum: { montant_mad: true },
            _count: true,
          }),
          this.db.relance.count({
            where: { commercial_id: compte.id, effectuee_le: null, prevue_le: { lte: new Date() } },
          }),
        ]);

        const compteur = (statut: ProspectStatut) =>
          parStatut.find((l) => l.statut_pipeline === statut)?._count ?? 0;

        return {
          ...compte,
          prospects: parStatut.reduce((somme, l) => somme + l._count, 0),
          transformes: compteur(ProspectStatut.transforme),
          perdus: compteur(ProspectStatut.perdu),
          relances_dues: relancesDues,
          commissions: commissions._count,
          commissions_mad: (commissions._sum.montant_mad ?? 0).toString(),
        };
      }),
    );
  }
}
