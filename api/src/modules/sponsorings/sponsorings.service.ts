import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException, ERROR_CODES } from '../../common/errors';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleCode, SponsoringNiveau } from '../../generated/prisma';
import type { CreerSponsoringDto } from './dto/creer-sponsoring.dto';

/** Premium passe devant Gold, qui passe devant Silver (RG19). */
const RANG_NIVEAU: Record<SponsoringNiveau, number> = {
  [SponsoringNiveau.premium]: 0,
  [SponsoringNiveau.gold]: 1,
  [SponsoringNiveau.silver]: 2,
};

/** Portée d'une recherche, pour savoir quelles campagnes la concernent. */
export interface PorteeRecherche {
  villeSlug?: string;
  /** Types cochés — une campagne ciblée sur l'un d'eux s'applique. */
  types?: string[];
  q?: string;
}

/** Une fiche mise en avant pour une recherche donnée. */
export interface MiseEnAvant {
  etablissementId: bigint;
  niveau: SponsoringNiveau;
}

/**
 * Campagnes de sponsoring — livrable 11 §3.4, RG19.
 *
 * UNE CAMPAGNE, PAS UN INTERRUPTEUR. Le sponsoring se vend à un niveau
 * (Premium / Gold / Silver), sur un périmètre (une ville, un type, un mot-clé)
 * et pour une période. Un simple booléen « mis en avant » ne saurait exprimer
 * aucune de ces trois dimensions — et surtout pas la quatrième :
 *
 * LA ROTATION ÉQUITABLE À NIVEAU ÉGAL. Si dix écoles achètent Premium à
 * Casablanca, l'une d'elles serait toujours première et les neuf autres
 * toujours derrière — elles paieraient le même prix pour une visibilité très
 * différente. L'ordre est donc brassé de façon déterministe, avec une graine
 * qui change chaque jour : sur la durée, chacune passe en tête à son tour, et
 * l'ordre reste stable pendant une journée pour qu'une pagination ne fasse pas
 * réapparaître ou disparaître une fiche entre deux pages.
 */
@Injectable()
export class SponsoringsService {
  constructor(
    private readonly db: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Toutes les campagnes, la plus récente d'abord — écran admin. */
  lister() {
    return this.db.sponsoring.findMany({
      orderBy: [{ debut: 'desc' }, { id: 'desc' }],
      include: {
        etablissement: { select: { id: true, nom: true, slug: true } },
        ville: { select: { nom: true, slug: true } },
      },
    });
  }

  /**
   * Fiches à mettre en avant pour une recherche, déjà ordonnées (RG19).
   *
   * Une campagne s'applique si sa période court ET si chacune de ses trois
   * restrictions est soit absente, soit satisfaite : une campagne sans ville
   * vaut partout, une campagne « Casablanca » ne vaut qu'à Casablanca.
   */
  async miseEnAvantPour(portee: PorteeRecherche): Promise<MiseEnAvant[]> {
    const aujourdhui = new Date();

    const campagnes = await this.db.sponsoring.findMany({
      where: {
        debut: { lte: aujourdhui },
        fin: { gte: aujourdhui },
        // La fiche doit rester publiable : une campagne ne ressuscite pas une
        // fiche suspendue (RG03).
        etablissement: { statut: 'validee' },
        ...(portee.villeSlug
          ? { OR: [{ ville_id: null }, { ville: { slug: portee.villeSlug } }] }
          : {}),
      },
      select: {
        etablissement_id: true,
        niveau: true,
        categorie: true,
        mot_cle: true,
      },
    });

    const retenues = campagnes.filter(
      (campagne) =>
        // Une campagne ciblée sur un type s'applique dès que ce type est
        // coché, même parmi d'autres : le parent regarde bien cette catégorie.
        (!campagne.categorie ||
          !portee.types?.length ||
          portee.types.includes(campagne.categorie)) &&
        (!campagne.mot_cle ||
          !portee.q ||
          portee.q.toLowerCase().includes(campagne.mot_cle.toLowerCase())),
    );

    // Une fiche peut porter plusieurs campagnes : on garde la meilleure.
    const meilleure = new Map<string, MiseEnAvant>();

    for (const campagne of retenues) {
      const cle = campagne.etablissement_id.toString();
      const actuelle = meilleure.get(cle);

      if (!actuelle || RANG_NIVEAU[campagne.niveau] < RANG_NIVEAU[actuelle.niveau]) {
        meilleure.set(cle, {
          etablissementId: campagne.etablissement_id,
          niveau: campagne.niveau,
        });
      }
    }

    const graine = grainDuJour();

    return [...meilleure.values()].sort(
      (a, b) =>
        RANG_NIVEAU[a.niveau] - RANG_NIVEAU[b.niveau] ||
        empreinte(a.etablissementId, graine) - empreinte(b.etablissementId, graine),
    );
  }

  async creer(dto: CreerSponsoringDto, adminId: bigint) {
    const debut = new Date(dto.debut);
    const fin = new Date(dto.fin);

    if (fin < debut) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ECHOUEE,
        'La date de fin ne peut pas précéder la date de début.',
      );
    }

    const etablissement = await this.db.etablissement.findUnique({
      where: { id: BigInt(dto.etablissement_id) },
      select: { id: true, nom: true },
    });

    if (!etablissement) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cet établissement n'existe pas.",
      );
    }

    return this.db.$transaction(async (tx) => {
      const campagne = await tx.sponsoring.create({
        data: {
          etablissement_id: etablissement.id,
          niveau: dto.niveau,
          ville_id: dto.ville_id ? BigInt(dto.ville_id) : null,
          categorie: dto.categorie,
          mot_cle: dto.mot_cle,
          debut,
          fin,
          tarif_mad: dto.tarif_mad,
        },
      });

      // Le badge « Sponsorisé » du site public suit la campagne : c'est lui que
      // le parent voit, et l'engagement de transparence du livrable 1 exige
      // qu'il corresponde à une mise en avant réelle.
      await tx.etablissement.update({
        where: { id: etablissement.id },
        data: { sponsorise: true },
      });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'sponsoring.cree',
        cibleType: 'etablissement',
        cibleId: etablissement.id,
        details: {
          sponsoring_id: campagne.id.toString(),
          niveau: dto.niveau,
          debut: dto.debut,
          fin: dto.fin,
        },
      });

      return campagne;
    });
  }

  /** Arrête une campagne — la fin est ramenée à hier, l'historique est conservé. */
  async arreter(sponsoringId: bigint, adminId: bigint): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const campagne = await tx.sponsoring.findUnique({
        where: { id: sponsoringId },
        select: { id: true, etablissement_id: true },
      });

      if (!campagne) {
        throw new AppException(
          HttpStatus.NOT_FOUND,
          ERROR_CODES.RESSOURCE_INTROUVABLE,
          "Cette campagne n'existe pas.",
        );
      }

      const hier = new Date();
      hier.setDate(hier.getDate() - 1);

      // On ne supprime pas : une campagne facturée doit rester traçable
      // (RG18 — les commissions s'y adossent).
      await tx.sponsoring.update({ where: { id: sponsoringId }, data: { fin: hier } });

      const encoreActive = await tx.sponsoring.count({
        where: {
          etablissement_id: campagne.etablissement_id,
          debut: { lte: new Date() },
          fin: { gte: new Date() },
        },
      });

      if (encoreActive === 0) {
        await tx.etablissement.update({
          where: { id: campagne.etablissement_id },
          data: { sponsorise: false },
        });
      }

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'sponsoring.arrete',
        cibleType: 'etablissement',
        cibleId: campagne.etablissement_id,
        details: { sponsoring_id: sponsoringId.toString() },
      });
    });
  }
}

/** Numéro de jour — la rotation change chaque jour, et seulement chaque jour. */
function grainDuJour(): number {
  return Math.floor(Date.now() / 86_400_000);
}

/**
 * Empreinte déterministe d'une fiche pour un jour donné.
 *
 * Multiplication par un grand nombre premier puis modulo : deux identifiants
 * voisins obtiennent des empreintes très éloignées, donc l'ordre n'a rien à
 * voir avec l'ordre des identifiants — sans quoi la fiche n° 1 serait
 * éternellement première.
 */
function empreinte(id: bigint, graine: number): number {
  return Number((id * 2_654_435_761n + BigInt(graine) * 40_503n) % 1_000_003n);
}
