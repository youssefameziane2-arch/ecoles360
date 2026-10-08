import { HttpStatus, type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import passport from 'passport';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { ERROR_CODES, ValidationException } from '@/common/errors';
import { DatabaseModule } from '@/database/database.module';
import { DemoSeeder } from '@/database/seeders/demo.seeder';
import { ReferentielsSeeder } from '@/database/seeders/referentiels.seeder';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { prefixeSession } from '@/modules/auth/session.constants';
import { verifierBaseRedisDeTest } from '../helpers/env';

const MOT_DE_PASSE_DEMO = 'motdepasse-de-demonstration';
const MOTIF = 'Merci de préciser les horaires d’ouverture aux élèves avant publication.';

/**
 * Blog — livrable 11 §3.5, avenant 3.
 *
 * CE QUI EST ÉPROUVÉ ICI, C'EST LA BARRIÈRE DE PUBLICATION. Un annuaire payé
 * par les établissements ne peut pas laisser ses clients publier directement
 * sur le site public : ce serait la même faille que des fiches non validées
 * (RG03) ou des avis non modérés (RG06). Chaque test ci-dessous ferme une porte
 * par laquelle un texte pourrait atteindre le site sans relecture.
 */
describe('Blog et circuit éditorial (intégration)', () => {
  let app: INestApplication;
  let db: PrismaService;
  let redis: RedisService;
  let demo: DemoSeeder;

  /** Articles créés par les tests — retirés en fin de suite. */
  const creees: bigint[] = [];

  beforeAll(async () => {
    verifierBaseRedisDeTest(process.env.REDIS_URL ?? '');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
    }).compile();

    app = moduleRef.createNestApplication();
    db = moduleRef.get(PrismaService);
    redis = moduleRef.get(RedisService);

    app.use(
      session({
        store: new RedisStore({
          client: redis.instance,
          prefix: prefixeSession(moduleRef.get(ConfigService)),
        }),
        secret: 'secret-de-test-au-moins-trente-deux-caracteres',
        resave: false,
        saveUninitialized: false,
      }),
    );
    app.use(passport.initialize());
    app.use(passport.session());

    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        exceptionFactory: (erreurs) => ValidationException.fromValidationErrors(erreurs),
      }),
    );

    await app.init();

    const referentiels = moduleRef.get(ReferentielsSeeder);
    await referentiels.roles();
    await referentiels.villes();
    await referentiels.niveauxFilieres();

    demo = moduleRef.get(DemoSeeder);
    await semer();
  });

  /**
   * Amorce comptes, fiches ET articles.
   *
   * `donnees()` ne sème pas le blog — c'est `cms()`, que la commande
   * d'amorçage appelle séparément. Une suite qui l'oublie travaille sur une
   * table `articles` vide et échoue sur des symptômes trompeurs.
   */
  async function semer() {
    const comptes = await demo.comptes();
    const { almassira } = await demo.donnees(comptes);
    await demo.cms(almassira, comptes);
  }

  beforeEach(async () => {
    await redis.instance.flushdb();
  });

  afterAll(async () => {
    // LA BASE EST PARTAGÉE (jest `maxWorkers: 1`). On retire ce que la suite a
    // créé, puis on resème : le semeur remet l'article à la une et les statuts
    // du circuit, que les tests ont déplacés exprès.
    if (creees.length > 0) {
      await db.article.deleteMany({ where: { id: { in: creees } } });
    }

    await semer();
    await app.close();
  });

  async function connecte(email: string) {
    const agent = request.agent(app.getHttpServer());
    const reponse = await agent
      .post('/api/v1/auth/login')
      .send({ email, mot_de_passe: MOT_DE_PASSE_DEMO })
      .expect(200);

    const csrf = reponse.body.data.csrf as string;

    return {
      get: (url: string) => agent.get(`/api/v1${url}`),
      post: (url: string) => agent.post(`/api/v1${url}`).set('x-csrf-token', csrf),
      patch: (url: string) => agent.patch(`/api/v1${url}`).set('x-csrf-token', csrf),
      put: (url: string) => agent.put(`/api/v1${url}`).set('x-csrf-token', csrf),
      delete: (url: string) => agent.delete(`/api/v1${url}`).set('x-csrf-token', csrf),
    };
  }

  /** Crée un brouillon par l'API et retient son identifiant pour le ménage. */
  async function brouillon(
    etablissement: Awaited<ReturnType<typeof connecte>>,
    titre = 'Notre nouvelle salle de sciences',
  ) {
    const reponse = await etablissement
      .post('/mon-espace/articles')
      .send({
        titre,
        categorie: 'Vie des établissements',
        chapeau: 'Un laboratoire équipé pour les classes de lycée.',
        contenu: 'Le laboratoire ouvre en janvier, avec douze postes de travail.',
      })
      .expect(201);

    creees.push(BigInt(reponse.body.data.id as string));

    return reponse.body.data as { id: string; slug: string; statut: string };
  }

  // ---------------------------------------------------------------------------
  //  Barrière de publication
  // ---------------------------------------------------------------------------

  describe('barrière de publication', () => {
    it('n’expose publiquement que les articles approuvés', async () => {
      const reponse = await request(app.getHttpServer()).get('/api/v1/articles').expect(200);

      const slugs = (reponse.body.data as { slug: string }[]).map((article) => article.slug);

      expect(slugs).not.toContain('rentree-2026-ce-qui-change'); // brouillon
      expect(slugs).not.toContain('classement-ecoles-casablanca'); // refusé
      expect(slugs).not.toContain('journee-portes-ouvertes-al-massira-2026'); // en attente
    });

    it('répond 404 — et non 403 — sur un brouillon', async () => {
      // 403 confirmerait l'existence du texte à un visiteur anonyme.
      const reponse = await request(app.getHttpServer())
        .get('/api/v1/articles/rentree-2026-ce-qui-change')
        .expect(404);

      expect(reponse.body.code).toBe(ERROR_CODES.RESSOURCE_INTROUVABLE);
    });

    it('exclut l’article à la une de la grille — il occupe déjà le bandeau', async () => {
      const [grille, une] = await Promise.all([
        request(app.getHttpServer()).get('/api/v1/articles').expect(200),
        request(app.getHttpServer()).get('/api/v1/articles/a-la-une').expect(200),
      ]);

      const slugs = (grille.body.data as { slug: string }[]).map((article) => article.slug);

      expect(une.body.data.slug).toBeDefined();
      expect(slugs).not.toContain(une.body.data.slug);
    });

    it('ne propose en filtre que les catégories réellement publiées', async () => {
      const reponse = await request(app.getHttpServer())
        .get('/api/v1/articles/categories')
        .expect(200);

      // « Vie des établissements » n'appartient qu'à des articles non publiés.
      expect(reponse.body.data).not.toContain('Vie des établissements');
      expect(reponse.body.data).toContain('Budget');
    });
  });

  // ---------------------------------------------------------------------------
  //  Circuit éditorial
  // ---------------------------------------------------------------------------

  describe('circuit éditorial', () => {
    it('mène un article de la création à la publication', async () => {
      const etablissement = await connecte('contact@almassira.ma');
      const admin = await connecte('direction@ecoles360.com');

      const article = await brouillon(etablissement);
      expect(article.statut).toBe('brouillon');

      await request(app.getHttpServer()).get(`/api/v1/articles/${article.slug}`).expect(404);

      const soumis = await etablissement
        .post(`/mon-espace/articles/${article.id}/soumettre`)
        .expect(201);
      expect(soumis.body.data.statut).toBe('en_attente');

      const approuve = await admin
        .patch(`/admin/articles/${article.id}`)
        .send({ decision: 'approuve' })
        .expect(200);

      expect(approuve.body.data.statut).toBe('approuve');
      expect(approuve.body.data.publie_le).not.toBeNull();

      await request(app.getHttpServer()).get(`/api/v1/articles/${article.slug}`).expect(200);
    });

    /**
     * APPROUVER ADOPTE LA CATÉGORIE — règle du client du 7 octobre 2026 :
     * n'importe qui peut en demander une, et c'est la relecture du blog, avant
     * publication, qui la valide ou non. Il n'y a donc pas de file de demandes
     * à part : la catégorie voyage avec l'article qui l'emploie.
     */
    it('adopte au référentiel la catégorie inédite d’un article approuvé', async () => {
      const etablissement = await connecte('contact@almassira.ma');
      const admin = await connecte('direction@ecoles360.com');
      const categorie = `Rubrique Inédite ${Date.now()}`;

      const reponse = await etablissement
        .post('/mon-espace/articles')
        .send({
          titre: `Article à catégorie inédite ${Date.now()}`,
          categorie,
          contenu: 'Un contenu quelconque, assez long pour passer la validation.',
        })
        .expect(201);

      const id = reponse.body.data.id as string;
      creees.push(BigInt(id));

      // Inconnue du référentiel AVANT la décision : sans cette vérification,
      // le test passerait même si la catégorie y était déjà.
      expect(await db.categorieArticle.findFirst({ where: { libelle: categorie } })).toBeNull();

      await etablissement.post(`/mon-espace/articles/${id}/soumettre`).expect(201);
      await admin.patch(`/admin/articles/${id}`).send({ decision: 'approuve' }).expect(200);

      const adoptee = await db.categorieArticle.findFirstOrThrow({
        where: { libelle: categorie },
      });
      expect(adoptee.libelle).toBe(categorie);

      // L'ADOPTION EST DITE AU JOURNAL : sinon une catégorie apparaîtrait un
      // jour dans la liste sans qu'on sache qui l'a introduite.
      const trace = await db.journalAudit.findFirstOrThrow({
        where: { action: 'article.approuve', cible_id: BigInt(id) },
      });
      expect(trace.details).toMatchObject({ categorie_adoptee: categorie });

      await db.categorieArticle.delete({ where: { id: adoptee.id } });
    });

    /** Refuser n'adopte rien : la catégorie reste hors de la liste proposée. */
    it('n’adopte pas la catégorie d’un article refusé', async () => {
      const etablissement = await connecte('contact@almassira.ma');
      const admin = await connecte('direction@ecoles360.com');
      const categorie = `Rubrique Refusée ${Date.now()}`;

      const reponse = await etablissement
        .post('/mon-espace/articles')
        .send({
          titre: `Article refusé ${Date.now()}`,
          categorie,
          contenu: 'Un contenu quelconque, assez long pour passer la validation.',
        })
        .expect(201);

      const id = reponse.body.data.id as string;
      creees.push(BigInt(id));

      await etablissement.post(`/mon-espace/articles/${id}/soumettre`).expect(201);
      await admin
        .patch(`/admin/articles/${id}`)
        .send({ decision: 'refuse', motif: 'Hors sujet pour le blog.' })
        .expect(200);

      expect(await db.categorieArticle.findFirst({ where: { libelle: categorie } })).toBeNull();
    });

    it('REFUSE UNE DÉCISION DE REFUS SANS MOTIF (livrable 11 §3.5)', async () => {
      const etablissement = await connecte('contact@almassira.ma');
      const admin = await connecte('direction@ecoles360.com');

      const article = await brouillon(etablissement, 'Article à refuser sans motif');
      await etablissement.post(`/mon-espace/articles/${article.id}/soumettre`).expect(201);

      const reponse = await admin
        .patch(`/admin/articles/${article.id}`)
        .send({ decision: 'refuse' })
        .expect(422);

      expect(reponse.body.code).toBe(ERROR_CODES.VALIDATION_ECHOUEE);

      // L'article n'a pas bougé : une décision invalide ne décide rien.
      const inchange = await db.article.findUniqueOrThrow({
        where: { id: BigInt(article.id) },
        select: { statut: true },
      });
      expect(inchange.statut).toBe('en_attente');
    });

    it('rend le motif du refus à l’auteur', async () => {
      const etablissement = await connecte('contact@almassira.ma');
      const admin = await connecte('direction@ecoles360.com');

      const article = await brouillon(etablissement, 'Article refusé avec motif');
      await etablissement.post(`/mon-espace/articles/${article.id}/soumettre`).expect(201);

      await admin
        .patch(`/admin/articles/${article.id}`)
        .send({ decision: 'refuse', motif: MOTIF })
        .expect(200);

      const vuDeLauteur = await etablissement.get('/mon-espace/blog').expect(200);
      const sien = (vuDeLauteur.body.data.articles as { id: string; motif_refus: string }[]).find(
        (a) => a.id === article.id,
      );

      expect(sien?.motif_refus).toBe(MOTIF);
    });

    it('fait redescendre en brouillon un article approuvé puis réécrit', async () => {
      const etablissement = await connecte('contact@almassira.ma');
      const admin = await connecte('direction@ecoles360.com');

      const article = await brouillon(etablissement, 'Article approuvé puis réécrit');
      await etablissement.post(`/mon-espace/articles/${article.id}/soumettre`).expect(201);
      await admin.patch(`/admin/articles/${article.id}`).send({ decision: 'approuve' }).expect(200);

      await request(app.getHttpServer()).get(`/api/v1/articles/${article.slug}`).expect(200);

      // Sans cette règle, on ferait valider un texte anodin puis on le
      // réécrirait : le site publierait n'importe quoi sans seconde lecture.
      const reecrit = await etablissement
        .put(`/mon-espace/articles/${article.id}`)
        .send({
          titre: 'Article approuvé puis réécrit',
          categorie: 'Vie des établissements',
          contenu: 'Texte entièrement remplacé après approbation.',
        })
        .expect(200);

      expect(reecrit.body.data.statut).toBe('brouillon');
      await request(app.getHttpServer()).get(`/api/v1/articles/${article.slug}`).expect(404);
    });

    it('refuse de décider un article qui n’est pas en attente', async () => {
      const etablissement = await connecte('contact@almassira.ma');
      const admin = await connecte('direction@ecoles360.com');

      const article = await brouillon(etablissement, 'Brouillon jamais soumis');

      const reponse = await admin
        .patch(`/admin/articles/${article.id}`)
        .send({ decision: 'approuve' })
        .expect(409);

      expect(reponse.body.code).toBe(ERROR_CODES.CONFLIT_METIER);
    });

    it('refuse de soumettre un article vide', async () => {
      const etablissement = await connecte('contact@almassira.ma');

      const reponse = await etablissement
        .post('/mon-espace/articles')
        .send({ titre: 'Sans contenu', categorie: 'Actualités' })
        .expect(201);

      creees.push(BigInt(reponse.body.data.id as string));

      await etablissement
        .post(`/mon-espace/articles/${reponse.body.data.id}/soumettre`)
        .expect(422);
    });
  });

  // ---------------------------------------------------------------------------
  //  Rédaction par l'administrateur
  // ---------------------------------------------------------------------------

  describe('rédaction par l’administrateur', () => {
    it('publie directement — il est sa propre autorité de validation', async () => {
      const admin = await connecte('direction@ecoles360.com');

      const reponse = await admin
        .post('/admin/articles')
        .send({
          titre: 'Note de la rédaction écoles360',
          categorie: 'Actualités',
          chapeau: 'Une mise au point de la plateforme.',
          contenu: 'Texte publié directement par la direction.',
        })
        .expect(201);

      creees.push(BigInt(reponse.body.data.id as string));

      expect(reponse.body.data.statut).toBe('approuve');
      expect(reponse.body.data.publie_le).not.toBeNull();
      // Article de plateforme : aucune signature d'établissement.
      expect(reponse.body.data.etablissement).toBeNull();

      await request(app.getHttpServer())
        .get(`/api/v1/articles/${reponse.body.data.slug}`)
        .expect(200);
    });

    it('ne fait pas redescendre en brouillon quand l’administrateur réécrit', async () => {
      const admin = await connecte('direction@ecoles360.com');

      const cree = await admin
        .post('/admin/articles')
        .send({
          titre: 'Article réécrit par l’admin',
          categorie: 'Actualités',
          contenu: 'Version 1.',
        })
        .expect(201);

      creees.push(BigInt(cree.body.data.id as string));

      const reecrit = await admin
        .put(`/admin/articles/${cree.body.data.id}`)
        .send({
          titre: 'Article réécrit par l’admin',
          categorie: 'Actualités',
          contenu: 'Version 2.',
        })
        .expect(200);

      // La règle de démotion protège contre l'auteur qui contourne le
      // relecteur ; elle n'a pas de sens quand les deux sont la même personne.
      expect(reecrit.body.data.statut).toBe('approuve');
      expect(reecrit.body.data.contenu).toBe('Version 2.');
    });

    it('refuse la rédaction de plateforme à un établissement (RG25)', async () => {
      const etablissement = await connecte('contact@almassira.ma');

      await etablissement
        .post('/admin/articles')
        .send({ titre: 'Tentative', categorie: 'Actualités', contenu: 'Texte.' })
        .expect(403);
    });
  });

  // ---------------------------------------------------------------------------
  //  Mise à la une
  // ---------------------------------------------------------------------------

  describe('mise à la une', () => {
    it('retire la précédente — un seul emplacement dans la maquette', async () => {
      const etablissement = await connecte('contact@almassira.ma');
      const admin = await connecte('direction@ecoles360.com');

      const avant = await request(app.getHttpServer()).get('/api/v1/articles/a-la-une').expect(200);
      const ancienne = avant.body.data.id as string;

      const article = await brouillon(etablissement, 'Article promu à la une');
      await etablissement.post(`/mon-espace/articles/${article.id}/soumettre`).expect(201);
      await admin.patch(`/admin/articles/${article.id}`).send({ decision: 'approuve' }).expect(200);
      await admin
        .patch(`/admin/articles/${article.id}/a-la-une`)
        .send({ a_la_une: true })
        .expect(204);

      const apres = await request(app.getHttpServer()).get('/api/v1/articles/a-la-une').expect(200);
      expect(apres.body.data.id).toBe(article.id);

      const depossedee = await db.article.findUniqueOrThrow({
        where: { id: BigInt(ancienne) },
        select: { a_la_une: true },
      });
      expect(depossedee.a_la_une).toBe(false);
    });

    it('refuse de mettre à la une un article non publié', async () => {
      const etablissement = await connecte('contact@almassira.ma');
      const admin = await connecte('direction@ecoles360.com');

      const article = await brouillon(etablissement, 'Brouillon qu’on voudrait à la une');

      await admin
        .patch(`/admin/articles/${article.id}/a-la-une`)
        .send({ a_la_une: true })
        .expect(409);
    });
  });

  // ---------------------------------------------------------------------------
  //  Frontières d'accès — RG25
  // ---------------------------------------------------------------------------

  describe('frontières d’accès', () => {
    it('refuse l’anonyme sur la rédaction et sur la décision', async () => {
      await request(app.getHttpServer()).get('/api/v1/mon-espace/blog').expect(401);
      await request(app.getHttpServer()).get('/api/v1/admin/articles').expect(401);
    });

    it('refuse un compte établissement sur la décision (RG25)', async () => {
      const etablissement = await connecte('contact@almassira.ma');

      await etablissement.get('/admin/articles').expect(403);
    });

    it('refuse au secrétariat la rédaction — la portée n’existe pas encore', async () => {
      // Sara porte `avis` et `contacts` ; aucune portée ne couvre le blog, et
      // publier au nom de l'établissement sans délégation explicite serait un
      // contournement de RG05.
      const sara = await connecte('sara.s@ecoles360.com');

      await sara.get('/mon-espace/blog').expect(403);
    });

    it('ne laisse pas un établissement toucher l’article d’un autre', async () => {
      const etablissement = await connecte('contact@almassira.ma');

      // L'article de plateforme n'appartient à aucun établissement : il doit
      // être invisible depuis l'espace, et intouchable.
      const plateforme = await db.article.findFirstOrThrow({
        where: { etablissement_id: null },
        select: { id: true },
      });

      // 404 et non 403 : « interdit » confirmerait l'existence de la cible.
      await etablissement.delete(`/mon-espace/articles/${plateforme.id}`).expect(404);
    });

    it('n’expose pas les articles d’un autre établissement dans l’espace', async () => {
      const etablissement = await connecte('contact@almassira.ma');

      const reponse = await etablissement.get('/mon-espace/blog').expect(200);
      const ids = (reponse.body.data.articles as { id: string }[]).map((a) => BigInt(a.id));

      const etrangers = await db.article.count({
        where: { id: { in: ids }, etablissement: { slug: { not: 'lycee-al-massira-casablanca' } } },
      });

      expect(etrangers).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  //  Rédaction par un commercial — maquette `commercial/blog`
  // ---------------------------------------------------------------------------

  describe('rédaction par un commercial', () => {
    /**
     * Le semeur laisse le blog des commerciaux fermé. Chaque test l'ouvre, et
     * le referme en sortant : la base est partagée, et un blog resté ouvert
     * fausserait le test de fermeture d'une exécution suivante.
     */
    async function commercialBlogOuvert(email: string) {
      const commercial = await connecte(email);
      await commercial.put('/mon-espace/blog').send({ actif: true }).expect(204);
      return commercial;
    }

    afterEach(async () => {
      await db.user.updateMany({
        where: { email: { in: ['younes.c@ecoles360.com', 'karim.o@ecoles360.com'] } },
        data: { blog_actif: false },
      });
    });

    it('mène un article de plateforme, signé du commercial, par la validation', async () => {
      const younes = await commercialBlogOuvert('younes.c@ecoles360.com');
      const admin = await connecte('direction@ecoles360.com');

      const article = await brouillon(younes, 'Bien choisir son lycée à Casablanca');

      const enBase = await db.article.findUniqueOrThrow({
        where: { id: BigInt(article.id) },
        select: { etablissement_id: true, auteur: { select: { email: true } } },
      });
      // Article de plateforme : aucune fiche ne le signe, mais son auteur reste
      // traçable — c'est ce qui distingue le commercial de l'administrateur.
      expect(enBase.etablissement_id).toBeNull();
      expect(enBase.auteur?.email).toBe('younes.c@ecoles360.com');

      // Contrairement à l'administrateur, il ne publie pas directement.
      expect(article.statut).toBe('brouillon');
      await request(app.getHttpServer()).get(`/api/v1/articles/${article.slug}`).expect(404);

      await younes.post(`/mon-espace/articles/${article.id}/soumettre`).expect(201);
      await admin.patch(`/admin/articles/${article.id}`).send({ decision: 'approuve' }).expect(200);

      await request(app.getHttpServer()).get(`/api/v1/articles/${article.slug}`).expect(200);
    });

    it('ne voit et ne touche que ses propres articles', async () => {
      const younes = await commercialBlogOuvert('younes.c@ecoles360.com');
      const karim = await commercialBlogOuvert('karim.o@ecoles360.com');

      const sien = await brouillon(younes, 'Les internats au Maroc');

      // Ni l'article d'un collègue, ni celui de l'administration, ni celui
      // d'un établissement — tous partagent pourtant, sauf le dernier, le
      // même `etablissement_id` nul. 404 et non 403 : rien n'est confirmé.
      await karim.delete(`/mon-espace/articles/${sien.id}`).expect(404);
      await karim
        .put(`/mon-espace/articles/${sien.id}`)
        .send({ titre: 'Détourné', categorie: 'Actualités', contenu: 'Texte.' })
        .expect(404);

      const [plateforme, etablissement] = await Promise.all([
        db.article.findFirstOrThrow({
          // Article de plateforme qui n'est pas celui d'un commercial — auteur
          // nul compris : `NOT` le garde, une égalité sur la relation l'exclurait.
          where: {
            etablissement_id: null,
            NOT: { auteur: { email: { in: ['younes.c@ecoles360.com', 'karim.o@ecoles360.com'] } } },
          },
          select: { id: true },
        }),
        db.article.findFirstOrThrow({
          where: { etablissement_id: { not: null } },
          select: { id: true },
        }),
      ]);
      await younes.delete(`/mon-espace/articles/${plateforme.id}`).expect(404);
      await younes.delete(`/mon-espace/articles/${etablissement.id}`).expect(404);

      // Et sa liste ne contient que ce qu'il a écrit.
      const liste = await karim.get('/mon-espace/blog').expect(200);
      const ids = (liste.body.data.articles as { id: string }[]).map((a) => BigInt(a.id));
      const etrangers = await db.article.count({
        where: {
          id: { in: ids },
          OR: [
            { etablissement_id: { not: null } },
            { NOT: { auteur: { email: 'karim.o@ecoles360.com' } } },
          ],
        },
      });

      expect(etrangers).toBe(0);
      expect(ids).not.toContain(BigInt(sien.id));
    });

    it('journalise l’ouverture du blog sous le rôle commercial', async () => {
      await commercialBlogOuvert('younes.c@ecoles360.com');

      const younes = await db.user.findUniqueOrThrow({
        where: { email: 'younes.c@ecoles360.com' },
        select: { id: true },
      });
      const trace = await db.journalAudit.findFirstOrThrow({
        where: { user_id: younes.id, action: 'blog.active' },
        // Par identifiant : `cree_le` est à la seconde, deux ouvertures dans
        // la même seconde ne se départageraient pas.
        orderBy: { id: 'desc' },
        select: { role_acteur: true },
      });

      // Un journal qui attribuerait l'action au rôle établissement ne
      // départagerait plus rien (RG15).
      expect(trace.role_acteur).toBe('commercial');
    });

    it('reste fermé au secrétariat', async () => {
      const sara = await connecte('sara.s@ecoles360.com');

      await sara.get('/mon-espace/blog').expect(403);
    });
  });

  // ---------------------------------------------------------------------------
  //  Activation du blog — RG27
  // ---------------------------------------------------------------------------

  describe('activation du blog', () => {
    it('ferme la rédaction quand le blog est désactivé', async () => {
      const etablissement = await connecte('contact@almassira.ma');

      await etablissement.put('/mon-espace/blog').send({ actif: false }).expect(204);

      const refus = await etablissement
        .post('/mon-espace/articles')
        .send({ titre: 'Bloqué', categorie: 'Actualités', contenu: 'Texte.' })
        .expect(409);

      expect(refus.body.code).toBe(ERROR_CODES.CONFLIT_METIER);

      // Remis en état pour les tests suivants — la base est partagée.
      await etablissement.put('/mon-espace/blog').send({ actif: true }).expect(204);
    });

    it('laisse lire ses articles même blog fermé — ils ne disparaissent pas', async () => {
      const etablissement = await connecte('contact@almassira.ma');

      await etablissement.put('/mon-espace/blog').send({ actif: false }).expect(204);

      const reponse = await etablissement.get('/mon-espace/blog').expect(200);
      expect(reponse.body.data.actif).toBe(false);
      expect(reponse.body.data.articles.length).toBeGreaterThan(0);

      await etablissement.put('/mon-espace/blog').send({ actif: true }).expect(204);
    });
  });
});
