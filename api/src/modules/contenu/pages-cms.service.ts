import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { AppException, ERROR_CODES } from '../../common/errors';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, RoleCode } from '../../generated/prisma';
import type { PageAProposDto } from './dto/page-a-propos.dto';

/** La seule page CMS que le site affiche aujourd'hui. */
export const CLE_A_PROPOS = 'a-propos';

/**
 * Pages éditoriales pilotées depuis le back-office — livrable 11 §3.7.
 *
 * LE TEXTE D'UNE PAGE VIT EN BASE, PAS DANS LE COMPOSANT. Écrit en dur dans
 * le front, il y avait deux vérités pour la même page, dont une seule
 * modifiable par le client ; c'est celle du code qui s'affichait.
 */
@Injectable()
export class PagesCmsService {
  constructor(
    private readonly db: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Lecture publique.
   *
   * SANS `modifiee_par` : c'est l'identifiant d'un compte d'administration,
   * rien qu'un visiteur ait à connaître. La date suffit à dire que la page
   * vit.
   */
  async lire(cle: string) {
    const page = await this.db.pageCms.findUnique({
      where: { cle },
      select: { cle: true, titre: true, blocs: true, modifiee_le: true },
    });

    if (!page) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cette page n'existe pas.",
      );
    }

    return page;
  }

  /**
   * Remplace le contenu de la page « À propos » — RG15, RG26.
   *
   * LA PAGE ENTIÈRE, PAS UN FRAGMENT : l'écran envoie tous les blocs. Une
   * fusion côté serveur laisserait survivre un bloc que l'administrateur
   * vient de vider, et ce qui s'afficherait ne serait plus ce qu'il a relu.
   *
   * La trace garde l'avant ET l'après : c'est un texte public qui engage la
   * plateforme — « les avis sont relus », « nous ne revendons pas vos
   * données » — et il faut pouvoir dire ce qu'il disait avant.
   */
  async modifierAPropos(dto: PageAProposDto, adminId: bigint) {
    return this.db.$transaction(async (tx) => {
      const avant = await tx.pageCms.findUnique({
        where: { cle: CLE_A_PROPOS },
        select: { id: true, titre: true, blocs: true },
      });

      if (!avant) {
        throw new AppException(
          HttpStatus.NOT_FOUND,
          ERROR_CODES.RESSOURCE_INTROUVABLE,
          'La page « À propos » n’existe pas encore : relancez le semis des référentiels.',
        );
      }

      const blocs = versBlocs(dto);

      const page = await tx.pageCms.update({
        where: { cle: CLE_A_PROPOS },
        data: {
          titre: dto.titre,
          blocs,
          modifiee_par: adminId,
          modifiee_le: new Date(),
        },
        select: { cle: true, titre: true, blocs: true, modifiee_le: true },
      });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'page_cms.modifiee',
        cibleType: 'page_cms',
        cibleId: avant.id,
        details: {
          cle: CLE_A_PROPOS,
          avant: { titre: avant.titre, blocs: avant.blocs },
          apres: { titre: page.titre, blocs: page.blocs },
        },
      });

      return page;
    });
  }
}

/**
 * Recopie champ à champ, plutôt que de passer le DTO tel quel.
 *
 * Le DTO validé est une instance de classe : la recopie garantit que ce qui
 * part en base est exactement ce que les classes déclarent, et qu'un champ
 * facultatif vide n'y laisse pas une clé à `undefined`.
 */
function versBlocs({ blocs }: PageAProposDto): Prisma.InputJsonObject {
  const { coordonnees } = blocs;

  return {
    accroche: blocs.accroche,
    mission: blocs.mission,
    histoire: blocs.histoire,
    valeurs: blocs.valeurs.map(({ titre, texte }) => ({ titre, texte })),
    engagements: blocs.engagements.map(({ titre, texte }) => ({ titre, texte })),
    equipe: blocs.equipe.map(({ nom, role }) => ({ nom, role })),
    coordonnees: {
      email: coordonnees.email,
      telephone: coordonnees.telephone,
      adresse: coordonnees.adresse,
      ...(coordonnees.whatsapp ? { whatsapp: coordonnees.whatsapp } : {}),
      ...(coordonnees.horaires ? { horaires: coordonnees.horaires } : {}),
    },
  };
}
