import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { AppException, ERROR_CODES } from '../../common/errors';
import { slugLibre } from '../../common/texte/slug';
import { PrismaService } from '../../prisma/prisma.service';
import { ArticleStatut, RoleCode, type Prisma } from '../../generated/prisma';
import { Page } from '../../common/interceptors';
import type { RedigerArticleDto } from './dto/rediger-article.dto';
import type { DecisionArticleDto } from './dto/decision-article.dto';

/** Carte d'article telle que l'affichent le blog et la page d'un article. */
const SELECTION_PUBLIQUE = {
  id: true,
  slug: true,
  titre: true,
  categorie: true,
  chapeau: true,
  image_chemin: true,
  a_la_une: true,
  publie_le: true,
  etablissement: { select: { nom: true, slug: true } },
} as const;

/** Vue de gestion — statut, motif et dates de circuit compris. */
const SELECTION_GESTION = {
  ...SELECTION_PUBLIQUE,
  contenu: true,
  statut: true,
  motif_refus: true,
  soumis_le: true,
  cree_le: true,
  auteur: { select: { name: true, email: true } },
} as const;

/**
 * Qui rédige — et donc ce qu'il a le droit de voir et de toucher.
 *
 * UN ÉTABLISSEMENT ÉCRIT SUR SA FICHE : ses articles portent son
 * `etablissement_id`, et c'est la fiche, pas le compte, qui les possède.
 *
 * UN COMMERCIAL N'A PAS DE FICHE : ses articles sont des articles de
 * plateforme (`etablissement_id` nul), signés de son nom. Mais contrairement
 * à ceux de l'administrateur, ils passent par la validation — le commercial
 * n'est pas une autorité éditoriale. Et il ne voit que les siens : sans
 * `auteur_id` dans la portée, il pourrait réécrire l'article d'un collègue ou
 * celui de l'administration, qui partagent le même `etablissement_id` nul.
 */
export type Redacteur =
  | { role: typeof RoleCode.etablissement; userId: bigint; etablissementId: bigint }
  | { role: typeof RoleCode.commercial; userId: bigint };

function portee(redacteur: Redacteur): Prisma.ArticleWhereInput {
  return redacteur.role === RoleCode.etablissement
    ? { etablissement_id: redacteur.etablissementId }
    : { auteur_id: redacteur.userId, etablissement_id: null };
}

/** Nombre d'articles par page du blog public — trois colonnes, deux rangées. */
const PAR_PAGE = 6;

/**
 * Blog — livrable 11 §3.5, avenant 3.
 *
 * LE CIRCUIT ÉDITORIAL EST LA RAISON D'ÊTRE DE CE SERVICE :
 * `brouillon → en_attente → approuve | refuse`. Un établissement ou un
 * commercial rédige et soumet ; seul l'administrateur publie. C'est la même
 * exigence que pour les fiches (RG03) et les avis (RG06) — rien n'apparaît sur
 * le site public sans qu'un humain de la plateforme l'ait regardé.
 *
 * UN REFUS PORTE TOUJOURS UN MOTIF, et ce motif est rendu à l'auteur. Sans
 * lui, l'article reviendrait à l'identique et serait refusé une seconde fois.
 *
 * REPASSER EN BROUILLON APRÈS DÉCISION EST VOLONTAIRE : un article approuvé
 * puis modifié redescend en `brouillon`, donc disparaît du site, et devra être
 * resoumis. Autrement, un auteur publierait n'importe quel texte en faisant
 * valider un texte anodin puis en le réécrivant.
 */
@Injectable()
export class ArticlesService {
  constructor(
    private readonly db: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------------------------------------------------------------------------
  //  Lecture publique
  // ---------------------------------------------------------------------------

  /**
   * Articles publiés, paginés, filtrables par catégorie.
   *
   * L'article « à la une » est EXCLU de la grille : il occupe déjà le bandeau
   * en tête de page, et l'y laisser le ferait apparaître deux fois.
   */
  async listerPublic(filtres: { categorie?: string; page?: number }): Promise<Page<unknown>> {
    const page = Math.max(1, filtres.page ?? 1);

    const where: Prisma.ArticleWhereInput = {
      statut: ArticleStatut.approuve,
      a_la_une: false,
      ...(filtres.categorie ? { categorie: filtres.categorie } : {}),
    };

    const [total, donnees] = await Promise.all([
      this.db.article.count({ where }),
      this.db.article.findMany({
        where,
        orderBy: [{ publie_le: 'desc' }, { id: 'desc' }],
        select: SELECTION_PUBLIQUE,
        skip: (page - 1) * PAR_PAGE,
        take: PAR_PAGE,
      }),
    ]);

    return new Page(donnees, total, page, PAR_PAGE);
  }

  /**
   * Articles publiés par un établissement — bloc « Articles & actualités ».
   *
   * VIDE PLUTÔT QUE FAUX : si l'établissement n'a rien publié, on rend un
   * tableau vide et le front se rabat sur les articles du site. La maquette
   * montre exactement ces deux cas côte à côte, et c'est la bonne règle — une
   * fiche sans actualité ne doit pas afficher un cadre vide.
   */
  articlesDeLEtablissement(slug: string) {
    return this.db.article.findMany({
      where: {
        statut: ArticleStatut.approuve,
        etablissement: { slug, statut: 'validee' },
      },
      orderBy: [{ publie_le: 'desc' }],
      take: 3,
      select: SELECTION_PUBLIQUE,
    });
  }

  /** L'article mis en avant, s'il y en a un. */
  aLaUne() {
    return this.db.article.findFirst({
      where: { statut: ArticleStatut.approuve, a_la_une: true },
      orderBy: { publie_le: 'desc' },
      select: { ...SELECTION_PUBLIQUE, chapeau: true },
    });
  }

  /** Catégories réellement portées par un article publié — pastilles du blog. */
  async categoriesPubliees(): Promise<string[]> {
    const lignes = await this.db.article.findMany({
      where: { statut: ArticleStatut.approuve },
      distinct: ['categorie'],
      orderBy: { categorie: 'asc' },
      select: { categorie: true },
    });

    return lignes.map((ligne) => ligne.categorie);
  }

  /**
   * Un article publié, avec trois lectures associées.
   *
   * Un article non approuvé répond 404 et non 403 : l'existence d'un brouillon
   * ne regarde pas un visiteur anonyme.
   */
  async parSlug(slug: string) {
    const article = await this.db.article.findFirst({
      where: { slug, statut: ArticleStatut.approuve },
      select: { ...SELECTION_PUBLIQUE, contenu: true, auteur: { select: { name: true } } },
    });

    if (!article) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cet article n'existe pas ou n'est pas publié.",
      );
    }

    return { ...article, a_lire_aussi: await this.aLireAussi(slug, article.categorie) };
  }

  // ---------------------------------------------------------------------------
  //  Espace de rédaction — établissement et commercial
  // ---------------------------------------------------------------------------

  /** Articles du rédacteur connecté — tous statuts. */
  listerPourRedacteur(redacteur: Redacteur) {
    return this.db.article.findMany({
      where: portee(redacteur),
      orderBy: [{ cree_le: 'desc' }],
      select: SELECTION_GESTION,
    });
  }

  /**
   * Le blog est-il ouvert à ce COMPTE ?
   *
   * Le drapeau vit sur l'utilisateur (`users.blog_actif`, RG27) et non sur
   * l'établissement : la maquette l'active par compte — un établissement
   * aujourd'hui, un commercial demain — et deux comptes rattachés au même
   * établissement n'ont aucune raison d'être ouverts ensemble.
   */
  async blogActif(userId: bigint): Promise<boolean> {
    const utilisateur = await this.db.user.findUnique({
      where: { id: userId },
      select: { blog_actif: true },
    });

    return utilisateur?.blog_actif ?? false;
  }

  /** Ouvre ou ferme son propre blog — action de l'utilisateur connecté. */
  async basculerBlog(redacteur: Redacteur, actif: boolean): Promise<void> {
    const userId = redacteur.userId;

    await this.db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { blog_actif: actif } });

      await this.audit.journaliser(tx, {
        userId,
        // Le rôle réel de l'acteur : un journal qui attribuerait au compte
        // établissement l'action d'un commercial ne départagerait plus rien.
        roleActeur: redacteur.role,
        action: actif ? 'blog.active' : 'blog.desactive',
        cibleType: 'user',
        cibleId: userId,
      });
    });
  }

  async creer(redacteur: Redacteur, dto: RedigerArticleDto) {
    await this.exigeBlogActif(redacteur.userId);

    return this.db.article.create({
      data: {
        ...this.champsRedaction(dto),
        slug: await this.slugLibre(dto.titre),
        statut: ArticleStatut.brouillon,
        auteur_id: redacteur.userId,
        etablissement_id:
          redacteur.role === RoleCode.etablissement ? redacteur.etablissementId : null,
      },
      select: SELECTION_GESTION,
    });
  }

  async modifier(redacteur: Redacteur, id: bigint, dto: RedigerArticleDto) {
    await this.exigeBlogActif(redacteur.userId);

    const article = await this.sien(redacteur, id);

    return this.db.article.update({
      where: { id: article.id },
      data: {
        ...this.champsRedaction(dto),
        // Toute retouche repart du brouillon : un texte approuvé puis réécrit
        // ne doit pas rester en ligne sans nouvelle lecture.
        statut: ArticleStatut.brouillon,
        motif_refus: null,
        publie_le: null,
        soumis_le: null,
        validee_par: null,
        a_la_une: false,
      },
      select: SELECTION_GESTION,
    });
  }

  /** Envoie l'article à la validation — livrable 11 §3.5. */
  async soumettre(redacteur: Redacteur, id: bigint) {
    await this.exigeBlogActif(redacteur.userId);

    const article = await this.sien(redacteur, id);

    if (article.statut === ArticleStatut.en_attente) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ERROR_CODES.CONFLIT_METIER,
        'Cet article est déjà en attente de validation.',
      );
    }

    if (!article.contenu?.trim()) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ECHOUEE,
        'Un article sans contenu ne peut pas être soumis à validation.',
      );
    }

    return this.db.article.update({
      where: { id: article.id },
      data: {
        statut: ArticleStatut.en_attente,
        soumis_le: new Date(),
        motif_refus: null,
      },
      select: SELECTION_GESTION,
    });
  }

  async supprimer(redacteur: Redacteur, id: bigint): Promise<void> {
    const article = await this.sien(redacteur, id);

    await this.db.article.delete({ where: { id: article.id } });
  }

  // ---------------------------------------------------------------------------
  //  Back-office
  // ---------------------------------------------------------------------------

  /**
   * Article de plateforme, rédigé et PUBLIÉ DIRECTEMENT par l'administrateur.
   *
   * Pas de passage par `en_attente` : l'administrateur EST l'autorité de
   * validation. Lui demander de se soumettre son propre texte serait un rituel
   * sans relecteur — c'est la même logique que la publication directe d'une
   * fiche par l'admin, face à la proposition d'un établissement (livrable 11
   * §3.4).
   *
   * `etablissement_id` reste nul : l'article appartient au site, pas à un
   * client, et ne porte donc aucune signature d'établissement.
   */
  async creerPourPlateforme(dto: RedigerArticleDto, adminId: bigint) {
    return this.db.$transaction(async (tx) => {
      const article = await tx.article.create({
        data: {
          ...this.champsRedaction(dto),
          slug: await this.slugLibre(dto.titre),
          statut: ArticleStatut.approuve,
          auteur_id: adminId,
          validee_par: adminId,
          publie_le: new Date(),
        },
        select: SELECTION_GESTION,
      });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'article.publie',
        cibleType: 'article',
        cibleId: article.id,
        details: { titre: article.titre },
      });

      return article;
    });
  }

  /**
   * Réécriture par l'administrateur.
   *
   * Contrairement à la réécriture par un établissement, elle NE FAIT PAS
   * redescendre l'article en brouillon : la règle existe pour empêcher de faire
   * valider un texte puis de le remplacer, et elle n'a pas de sens quand
   * l'auteur et le relecteur sont la même personne.
   */
  async modifierParAdmin(id: bigint, dto: RedigerArticleDto, adminId: bigint) {
    const existant = await this.db.article.findUnique({ where: { id }, select: { id: true } });

    if (!existant) {
      throw this.introuvable();
    }

    return this.db.$transaction(async (tx) => {
      const article = await tx.article.update({
        where: { id },
        data: this.champsRedaction(dto),
        select: SELECTION_GESTION,
      });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'article.modifie',
        cibleType: 'article',
        cibleId: id,
        details: { titre: article.titre },
      });

      return article;
    });
  }

  /** Suppression par l'administrateur — n'importe quel article, trace gardée. */
  async supprimerParAdmin(id: bigint, adminId: bigint): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const article = await tx.article.findUnique({
        where: { id },
        select: { id: true, titre: true, slug: true },
      });

      if (!article) {
        throw this.introuvable();
      }

      await tx.article.delete({ where: { id } });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'article.supprime',
        cibleType: 'article',
        cibleId: id,
        severite: 'avertissement',
        details: { titre: article.titre, slug: article.slug },
      });
    });
  }

  listerPourAdmin(statut?: ArticleStatut) {
    return this.db.article.findMany({
      where: statut ? { statut } : {},
      orderBy: [{ soumis_le: 'desc' }, { cree_le: 'desc' }],
      select: {
        ...SELECTION_GESTION,
        etablissement: { select: { nom: true, slug: true } },
      },
    });
  }

  /**
   * Approuve ou refuse un article soumis.
   *
   * Seul un article EN ATTENTE se décide : décider un brouillon publierait un
   * texte que son auteur n'a pas jugé prêt, et redécider un article déjà
   * tranché effacerait la première décision sans trace de la raison.
   */
  async decider(id: bigint, dto: DecisionArticleDto, adminId: bigint) {
    return this.db.$transaction(async (tx) => {
      const article = await tx.article.findUnique({
        where: { id },
        select: { id: true, titre: true, statut: true },
      });

      if (!article) {
        throw this.introuvable();
      }

      if (article.statut !== ArticleStatut.en_attente) {
        throw new AppException(
          HttpStatus.CONFLICT,
          ERROR_CODES.CONFLIT_METIER,
          'Seul un article en attente de validation peut être approuvé ou refusé.',
        );
      }

      const approuve = dto.decision === ArticleStatut.approuve;

      const mis = await tx.article.update({
        where: { id },
        data: {
          statut: dto.decision,
          validee_par: adminId,
          publie_le: approuve ? new Date() : null,
          motif_refus: approuve ? null : dto.motif,
        },
        select: SELECTION_GESTION,
      });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: approuve ? 'article.approuve' : 'article.refuse',
        cibleType: 'article',
        cibleId: id,
        severite: approuve ? undefined : 'avertissement',
        details: approuve ? { titre: article.titre } : { titre: article.titre, motif: dto.motif },
      });

      return mis;
    });
  }

  /**
   * Met un article à la une, ou l'en retire.
   *
   * UN SEUL ARTICLE À LA UNE : la maquette lui réserve un bandeau unique en
   * tête du blog. Mettre le nouveau en avant retire donc le précédent, dans la
   * même transaction — sinon deux articles se disputeraient le même emplacement
   * et l'affichage dépendrait de l'ordre de tri.
   */
  async basculerALaUne(id: bigint, aLaUne: boolean, adminId: bigint): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const article = await tx.article.findUnique({
        where: { id },
        select: { id: true, statut: true },
      });

      if (!article) {
        throw this.introuvable();
      }

      if (aLaUne && article.statut !== ArticleStatut.approuve) {
        throw new AppException(
          HttpStatus.CONFLICT,
          ERROR_CODES.CONFLIT_METIER,
          'Seul un article publié peut être mis à la une.',
        );
      }

      if (aLaUne) {
        await tx.article.updateMany({
          where: { a_la_une: true, id: { not: id } },
          data: { a_la_une: false },
        });
      }

      await tx.article.update({ where: { id }, data: { a_la_une: aLaUne } });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: aLaUne ? 'article.mis_a_la_une' : 'article.retire_de_la_une',
        cibleType: 'article',
        cibleId: id,
      });
    });
  }

  /**
   * Trois lectures à suggérer sous un article.
   *
   * MÊME CATÉGORIE D'ABORD, puis complément par les plus récents. Filtrer
   * strictement sur la catégorie laisserait la section vide dès qu'un article
   * est seul dans la sienne — ce qui arrive tout le temps sur un blog jeune, et
   * donne une page qui a l'air cassée. Mieux vaut une suggestion moins ciblée
   * qu'un blanc.
   */
  private async aLireAussi(slug: string, categorie: string) {
    const base = { statut: ArticleStatut.approuve, slug: { not: slug } } as const;

    const memeCategorie = await this.db.article.findMany({
      where: { ...base, categorie },
      orderBy: [{ publie_le: 'desc' }],
      take: 3,
      select: SELECTION_PUBLIQUE,
    });

    if (memeCategorie.length >= 3) {
      return memeCategorie;
    }

    const complement = await this.db.article.findMany({
      where: {
        ...base,
        categorie: { not: categorie },
        id: { notIn: memeCategorie.map((article) => article.id) },
      },
      orderBy: [{ publie_le: 'desc' }],
      take: 3 - memeCategorie.length,
      select: SELECTION_PUBLIQUE,
    });

    return [...memeCategorie, ...complement];
  }

  // ---------------------------------------------------------------------------
  //  Outils internes
  // ---------------------------------------------------------------------------

  private champsRedaction(dto: RedigerArticleDto) {
    return {
      titre: dto.titre,
      categorie: dto.categorie,
      chapeau: dto.chapeau ?? null,
      contenu: dto.contenu ?? null,
    };
  }

  /** Charge un article EN VÉRIFIANT qu'il appartient à l'établissement. */
  private async sien(redacteur: Redacteur, id: bigint) {
    const article = await this.db.article.findFirst({
      where: { id, ...portee(redacteur) },
      select: { id: true, statut: true, contenu: true },
    });

    // 404 et non 403 : répondre « interdit » confirmerait l'existence de
    // l'article d'un concurrent — ou d'un collègue.
    if (!article) {
      throw this.introuvable();
    }

    return article;
  }

  private async exigeBlogActif(userId: bigint): Promise<void> {
    if (!(await this.blogActif(userId))) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ERROR_CODES.CONFLIT_METIER,
        'Votre blog est désactivé. Activez-le depuis votre espace pour rédiger des articles.',
      );
    }
  }

  /**
   * Fabrique un identifiant d'URL libre à partir du titre.
   *
   * Le slug est unique en base ET il est l'adresse publique de l'article : on
   * suffixe plutôt que de laisser échouer l'insertion, pour que deux
   * établissements puissent intituler leur article « Journée portes ouvertes »
   * la même semaine.
   */
  private slugLibre(titre: string): Promise<string> {
    return slugLibre(
      titre,
      async (candidat) =>
        Boolean(
          await this.db.article.findUnique({ where: { slug: candidat }, select: { id: true } }),
        ),
      { repli: 'article' },
    );
  }

  private introuvable(): AppException {
    return new AppException(
      HttpStatus.NOT_FOUND,
      ERROR_CODES.RESSOURCE_INTROUVABLE,
      "Cet article n'existe pas.",
    );
  }
}
