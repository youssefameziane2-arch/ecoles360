import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DemandeStatut } from '../../generated/prisma';

/** Douze mois, en millisecondes — le seuil déclaré à la CNDP. */
const DOUZE_MOIS_MS = 365 * 24 * 3600 * 1000;

/** Trois ans — durée de conservation du journal d'audit (RG26). */
const TROIS_ANS_MS = 3 * 365 * 24 * 3600 * 1000;

/** Nom sous lequel une demande anonymisée apparaît — livrable 10 §6.3. */
const NOM_ANONYME = 'Anonymisé';

/**
 * Purges et minimisation — loi 09-08, livrable 10 §6.3.
 *
 * CE N'EST PAS DU MÉNAGE, C'EST UNE OBLIGATION LÉGALE. Les durées de
 * conservation sont celles déclarées à la CNDP : les dépasser est un
 * manquement, pas une négligence d'exploitation. C'est aussi la seule partie
 * du projet dont l'absence ne se voit nulle part — rien ne casse, rien ne
 * s'affiche, et la faute grandit en silence.
 *
 * CHAQUE EXÉCUTION EST JOURNALISÉE, avec le nombre de lignes traitées. Le jour
 * où la CNDP demande la preuve que les purges tournent, c'est le journal
 * d'audit qui répond — et un compteur à zéro est une réponse aussi valable
 * qu'un compteur à mille.
 *
 * ÉCART ASSUMÉ AVEC LE LIVRABLE : il confie ces traitements à la file BullMQ
 * `maintenance`, exécutée par un conteneur `worker`, pour les reprises et
 * l'observabilité. Ces purges sont idempotentes, tournent une fois par jour et
 * durent quelques secondes : une file ajouterait un conteneur, un état de job
 * dans Redis et une mécanique de reprise pour un bénéfice nul à cette échelle.
 * Elles s'exécutent donc directement dans le conteneur `scheduler`. Les
 * déplacer dans une file plus tard ne change pas une ligne de ce service.
 */
@Injectable()
export class PurgesService {
  private readonly logger = new Logger('Purges');

  constructor(
    private readonly db: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Anonymise les demandes traitées depuis plus de douze mois.
   *
   * ANONYMISER, PAS SUPPRIMER. La demande reste — c'est elle qui alimente les
   * statistiques de contact d'un établissement, et la détruire fausserait
   * l'audience qu'il paie pour consulter. Ce qui part, ce sont les seules
   * données qui désignent une personne : le nom, le téléphone et le message.
   *
   * SUR `traitee_le`, PAS `recue_le` : une demande jamais traitée n'a pas
   * commencé à courir. Compter depuis la réception anonymiserait des dossiers
   * encore ouverts, et le secrétariat perdrait de quoi rappeler le parent.
   */
  async demandes(): Promise<number> {
    const seuil = new Date(Date.now() - DOUZE_MOIS_MS);

    const resultat = await this.db.demandeContact.updateMany({
      where: {
        statut: DemandeStatut.traitee,
        traitee_le: { lt: seuil },
        // Sans ce filtre, la purge réécrirait chaque nuit les mêmes lignes
        // déjà anonymisées, et son compteur mentirait sur ce qu'elle a fait.
        parent_nom: { not: NOM_ANONYME },
      },
      data: { parent_nom: NOM_ANONYME, parent_tel: '', message: null },
    });

    await this.journaliser('purge.demandes', resultat.count, {
      seuil: seuil.toISOString().slice(0, 10),
    });

    return resultat.count;
  }

  /**
   * Agrège les traces d'audience puis supprime les lignes brutes de plus de
   * douze mois — RG10.
   *
   * AGRÉGER AVANT DE SUPPRIMER, ET DANS CET ORDRE. Supprimer d'abord
   * effacerait l'historique d'audience d'un établissement, c'est-à-dire
   * exactement ce qu'il paie pour voir. L'agrégat garde le compte par fiche,
   * par type et par jour, sans aucune donnée individuelle — la minimisation
   * est satisfaite, l'information de gestion est conservée.
   *
   * REJOUABLE SANS DOUBLER LES TOTAUX : l'agrégat est écrit en `upsert` sur
   * (fiche, type, jour), et les lignes brutes ne sont supprimées qu'ensuite.
   * Une exécution interrompue entre les deux laisse des traces déjà agrégées ;
   * la suivante les réécrira à l'identique plutôt que de les additionner.
   */
  async traces(): Promise<{ agregees: number; supprimees: number }> {
    const seuil = new Date(Date.now() - DOUZE_MOIS_MS);

    const groupes = await this.db.$queryRaw<
      { etablissement_id: bigint; type: string; jour: Date; total: bigint }[]
    >`
      SELECT etablissement_id, type, DATE(survenu_le) AS jour, COUNT(*) AS total
      FROM evenement_traces
      WHERE survenu_le < ${seuil}
      GROUP BY etablissement_id, type, DATE(survenu_le)
    `;

    for (const groupe of groupes) {
      const jour = new Date(groupe.jour);
      const total = Number(groupe.total);

      await this.db.statistiqueJournaliere.upsert({
        where: {
          etablissement_id_type_jour: {
            etablissement_id: groupe.etablissement_id,
            type: groupe.type as never,
            jour,
          },
        },
        create: {
          etablissement_id: groupe.etablissement_id,
          type: groupe.type as never,
          jour,
          total,
        },
        // `set`, PAS `increment` : la purge doit pouvoir être rejouée sans que
        // le total enfle à chaque passage.
        update: { total },
      });
    }

    const supprimees = await this.db.evenementTrace.deleteMany({
      where: { survenu_le: { lt: seuil } },
    });

    await this.journaliser('purge.traces', supprimees.count, {
      seuil: seuil.toISOString().slice(0, 10),
      journees_agregees: groupes.length,
    });

    return { agregees: groupes.length, supprimees: supprimees.count };
  }

  /**
   * Supprime les entrées du journal d'audit de plus de trois ans — RG26.
   *
   * LE JOURNAL EST EN LECTURE SEULE PARTOUT AILLEURS, et cette purge est la
   * seule chose au monde qui ait le droit d'y supprimer une ligne. C'est
   * pourquoi elle vit ici, dans un service qu'aucun contrôleur n'expose, et
   * qu'elle journalise sa propre exécution — la seule trace qui survivra à ce
   * qu'elle efface.
   */
  async purgerAudit(): Promise<number> {
    const seuil = new Date(Date.now() - TROIS_ANS_MS);

    const resultat = await this.db.journalAudit.deleteMany({
      where: { cree_le: { lt: seuil } },
    });

    await this.journaliser('purge.audit', resultat.count, {
      seuil: seuil.toISOString().slice(0, 10),
    });

    return resultat.count;
  }

  /**
   * Inscrit l'exécution au journal — acteur « système ».
   *
   * `userId: null` PARCE QU'AUCUN HUMAIN N'A CLIQUÉ. Attribuer la purge à un
   * administrateur ferait croire à un acte volontaire, et brouillerait la
   * lecture du journal le jour où l'on cherche qui a fait quoi.
   */
  private async journaliser(
    action: string,
    lignes: number,
    details: Record<string, unknown>,
  ): Promise<void> {
    this.logger.log(`${action} — ${lignes} ligne(s)`);

    await this.audit.journaliser(this.db, {
      userId: null,
      roleActeur: 'systeme',
      action,
      cibleType: 'systeme',
      cibleId: null,
      details: { lignes, ...details },
    });
  }
}
