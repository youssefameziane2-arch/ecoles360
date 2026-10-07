import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { AppException, ERROR_CODES } from '../../common/errors';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleCode } from '../../generated/prisma';

/**
 * Catégories d'articles — onglet « Catégories » de l'écran `isAdminContent`.
 *
 * UN RÉFÉRENTIEL, PAS UNE CONTRAINTE. `Article.categorie` reste une chaîne
 * libre : cette liste dit ce que la rédaction se voit PROPOSER, pas ce qui est
 * permis. La conséquence compte et elle est assumée — retirer une catégorie ne
 * déclasse aucun article déjà écrit, il cesse simplement d'y avoir un moyen
 * d'en classer de nouveaux dessous.
 *
 * LA LISTE A ÉTÉ PEUPLÉE DEPUIS LES ARTICLES EXISTANTS (voir la migration), et
 * non depuis les cinq catégories de la maquette : la base en portait six
 * autres, et un écran de gestion qui ignore les catégories réellement en usage
 * ne gère rien.
 */
@Injectable()
export class CategoriesArticlesService {
  constructor(
    private readonly db: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Dans l'ordre posé par l'administration, puis alphabétique à égalité. */
  lister() {
    return this.db.categorieArticle.findMany({
      orderBy: [{ ordre: 'asc' }, { libelle: 'asc' }],
      select: { id: true, libelle: true, ordre: true },
    });
  }

  async creer(libelle: string, adminId: bigint) {
    const propre = libelle.trim();

    /**
     * COMPARAISON INSENSIBLE À LA CASSE. La contrainte d'unicité de MySQL
     * l'est déjà avec `utf8mb4_unicode_ci`, mais s'en remettre à elle rendrait
     * une erreur de contrainte au lieu d'un message lisible — et l'écran
     * afficherait du jargon à qui tape « conseils » alors que « Conseils »
     * existe.
     */
    const existante = await this.db.categorieArticle.findFirst({
      where: { libelle: propre },
      select: { id: true },
    });

    if (existante) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ERROR_CODES.CONFLIT_METIER,
        'Cette catégorie existe déjà.',
      );
    }

    const dernier = await this.db.categorieArticle.findFirst({
      orderBy: { ordre: 'desc' },
      select: { ordre: true },
    });

    return this.db.$transaction(async (tx) => {
      const categorie = await tx.categorieArticle.create({
        data: { libelle: propre, ordre: (dernier?.ordre ?? 0) + 1 },
        select: { id: true, libelle: true, ordre: true },
      });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'categorie_article.creee',
        cibleType: 'categorie_article',
        cibleId: categorie.id,
        details: { libelle: propre },
      });

      return categorie;
    });
  }

  /**
   * Retire une catégorie de la liste proposée.
   *
   * LE NOMBRE D'ARTICLES CONCERNÉS EST RENDU, pas opposé. Un administrateur a
   * le droit de retirer une catégorie encore portée par des articles — c'est
   * même le cas courant, quand on renomme une rubrique. Mais il doit savoir ce
   * qu'il fait : la réponse dit combien d'articles gardent ce libellé et ne
   * seront plus reclassables dessous.
   */
  async supprimer(id: bigint, adminId: bigint) {
    const categorie = await this.db.categorieArticle.findUnique({
      where: { id },
      select: { id: true, libelle: true },
    });

    if (!categorie) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cette catégorie n'existe pas.",
      );
    }

    const articles = await this.db.article.count({ where: { categorie: categorie.libelle } });

    await this.db.$transaction(async (tx) => {
      await tx.categorieArticle.delete({ where: { id } });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'categorie_article.supprimee',
        cibleType: 'categorie_article',
        cibleId: categorie.id,
        // Le nombre au moment du retrait : deux ans plus tard, personne ne
        // saura plus combien d'articles portaient ce libellé ce jour-là.
        details: { libelle: categorie.libelle, articles_concernes: articles },
      });
    });

    return { articles_concernes: articles };
  }
}
