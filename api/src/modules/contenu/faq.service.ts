import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { AppException, ERROR_CODES } from '../../common/errors';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleCode } from '../../generated/prisma';
import type { FaqItemDto } from './dto/faq-item.dto';

/** Une question telle que la voit un visiteur — sans les champs de gestion. */
interface QuestionPublique {
  id: string;
  question: string;
  reponse: string;
}

/** Une rubrique de la page « Questions fréquentes ». */
export interface RubriqueFaq {
  groupe: string;
  items: QuestionPublique[];
}

const SELECTION_ADMIN = {
  id: true,
  question: true,
  reponse: true,
  groupe: true,
  ordre: true,
  publiee: true,
  modifiee_le: true,
} as const;

/**
 * FAQ éditoriale — livrable 11 §3.7, maquette « Centre d'aide ».
 *
 * LA FAQ EST DU CONTENU, PAS DU CODE. La maquette la montre pilotée depuis le
 * back-office : les questions, leurs réponses, leur rubrique et leur ordre se
 * changent sans livraison logicielle. C'est aussi ce qui permet de répondre
 * vite à une question que les parents posent souvent au téléphone.
 *
 * TOUTE ÉCRITURE EST JOURNALISÉE (RG15, RG26) : une FAQ est publique et
 * engageante — « le service est gratuit », « votre fiche est publiée sous
 * 48 h » — il faut pouvoir dire qui a écrit quoi, et quand.
 */
@Injectable()
export class FaqService {
  constructor(
    private readonly db: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Rubriques publiées, prêtes à afficher.
   *
   * Les rubriques sortent dans l'ordre d'apparition de leur PREMIÈRE question :
   * l'administrateur ne range donc qu'une seule liste, et l'ordre des
   * rubriques en découle. Un second champ « ordre de rubrique » serait une
   * donnée de plus à tenir cohérente pour un résultat identique.
   */
  async publique(): Promise<RubriqueFaq[]> {
    const items = await this.db.faqItem.findMany({
      where: { publiee: true },
      orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
      select: { id: true, question: true, reponse: true, groupe: true },
    });

    const rubriques: RubriqueFaq[] = [];

    for (const item of items) {
      const question = {
        id: item.id.toString(),
        question: item.question,
        reponse: item.reponse,
      };
      const rubrique = rubriques.find((r) => r.groupe === item.groupe);

      if (rubrique) {
        rubrique.items.push(question);
      } else {
        rubriques.push({ groupe: item.groupe, items: [question] });
      }
    }

    return rubriques;
  }

  /** Liste de gestion — questions dépubliées comprises. */
  listerPourAdmin() {
    return this.db.faqItem.findMany({
      orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
      select: SELECTION_ADMIN,
    });
  }

  /**
   * Ajoute une question EN FIN DE LISTE.
   *
   * Placer une nouveauté en tête déplacerait sans le dire des questions déjà
   * publiées ; l'administrateur la remonte ensuite s'il le souhaite.
   */
  async creer(dto: FaqItemDto, adminId: bigint) {
    return this.db.$transaction(async (tx) => {
      const dernier = await tx.faqItem.aggregate({ _max: { ordre: true } });

      const item = await tx.faqItem.create({
        data: {
          question: dto.question,
          reponse: dto.reponse,
          groupe: dto.groupe,
          publiee: dto.publiee ?? true,
          ordre: (dernier._max.ordre ?? 0) + 1,
          modifiee_par: adminId,
          modifiee_le: new Date(),
        },
        select: SELECTION_ADMIN,
      });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'faq.creee',
        cibleType: 'faq_item',
        cibleId: item.id,
        details: { question: item.question, groupe: item.groupe },
      });

      return item;
    });
  }

  async modifier(id: bigint, dto: FaqItemDto, adminId: bigint) {
    return this.db.$transaction(async (tx) => {
      const avant = await tx.faqItem.findUnique({ where: { id }, select: SELECTION_ADMIN });

      if (!avant) {
        throw this.introuvable();
      }

      const item = await tx.faqItem.update({
        where: { id },
        data: {
          question: dto.question,
          reponse: dto.reponse,
          groupe: dto.groupe,
          publiee: dto.publiee ?? true,
          modifiee_par: adminId,
          modifiee_le: new Date(),
        },
        select: SELECTION_ADMIN,
      });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'faq.modifiee',
        cibleType: 'faq_item',
        cibleId: id,
        details: {
          avant: { question: avant.question, groupe: avant.groupe, publiee: avant.publiee },
          apres: { question: item.question, groupe: item.groupe, publiee: item.publiee },
        },
      });

      return item;
    });
  }

  /**
   * Supprime une question.
   *
   * La trace garde le TEXTE, pas seulement l'identifiant : après suppression,
   * la ligne n'existe plus et un journal qui ne dirait que « faq_item 7 » ne
   * permettrait plus de savoir ce qui a disparu du site.
   */
  async supprimer(id: bigint, adminId: bigint): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const item = await tx.faqItem.findUnique({
        where: { id },
        select: { id: true, question: true, reponse: true, groupe: true },
      });

      if (!item) {
        throw this.introuvable();
      }

      await tx.faqItem.delete({ where: { id } });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'faq.supprimee',
        cibleType: 'faq_item',
        cibleId: id,
        details: { question: item.question, reponse: item.reponse, groupe: item.groupe },
      });
    });
  }

  /**
   * Réordonne la FAQ à partir de la liste complète des identifiants.
   *
   * Le rang part de 1 et se renumérote intégralement : pas de trous, pas
   * d'ex æquo, et donc pas de dépendance à l'ordre d'insertion pour départager.
   */
  async reordonner(ids: number[], adminId: bigint): Promise<void> {
    const uniques = new Set(ids);

    if (uniques.size !== ids.length) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ECHOUEE,
        'La même question apparaît deux fois dans la liste.',
      );
    }

    await this.db.$transaction(async (tx) => {
      const existants = await tx.faqItem.findMany({ select: { id: true } });
      const attendus = new Set(existants.map((item) => item.id.toString()));

      const complete =
        attendus.size === uniques.size && ids.every((id) => attendus.has(id.toString()));

      if (!complete) {
        throw new AppException(
          HttpStatus.CONFLICT,
          ERROR_CODES.CONFLIT_METIER,
          'La liste des questions a changé depuis son chargement. Rechargez la page avant de réordonner.',
        );
      }

      for (const [rang, id] of ids.entries()) {
        await tx.faqItem.update({
          where: { id: BigInt(id) },
          data: { ordre: rang + 1, modifiee_par: adminId, modifiee_le: new Date() },
        });
      }

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'faq.reordonnee',
        cibleType: 'faq_item',
        // Le réordonnancement porte sur la liste entière, pas sur une ligne :
        // la cible est la première question, l'ordre complet part en détail.
        cibleId: BigInt(ids[0] as number),
        details: { ordre: ids },
      });
    });
  }

  private introuvable(): AppException {
    return new AppException(
      HttpStatus.NOT_FOUND,
      ERROR_CODES.RESSOURCE_INTROUVABLE,
      "Cette question de FAQ n'existe pas.",
    );
  }
}
