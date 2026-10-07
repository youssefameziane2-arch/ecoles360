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

/**
 * FAQ éditoriale — livrable 11 §3.7.
 *
 * DEUX PROMESSES SONT ÉPROUVÉES ICI. D'abord qu'une question dépubliée
 * DISPARAÎT du site : c'est le seul moyen de retirer vite une réponse devenue
 * fausse — un tarif, un délai de publication — sans supprimer le travail
 * éditorial. Ensuite que le réordonnancement refuse une liste périmée : deux
 * administrateurs sur le même écran ne doivent pas pouvoir ranger la FAQ l'un
 * par-dessus l'autre en perdant une question au passage.
 */
describe('FAQ éditoriale (intégration)', () => {
  let app: INestApplication;
  let db: PrismaService;
  let redis: RedisService;
  let referentiels: ReferentielsSeeder;

  /** Questions créées par les tests — retirées en fin de suite. */
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

    referentiels = moduleRef.get(ReferentielsSeeder);
    await referentiels.roles();
    await referentiels.villes();
    await referentiels.niveauxFilieres();
    await referentiels.contenuSite();

    const demo = moduleRef.get(DemoSeeder);
    await demo.comptes();
  });

  beforeEach(async () => {
    await redis.instance.flushdb();
  });

  afterAll(async () => {
    // LA BASE EST PARTAGÉE PAR TOUTES LES SUITES (jest `maxWorkers: 1`). Les
    // questions ajoutées ici sont retirées, puis le référentiel est resemé :
    // il remet aussi l'ORDRE d'origine, que les tests de réordonnancement ont
    // déliberément bousculé.
    if (creees.length > 0) {
      await db.faqItem.deleteMany({ where: { id: { in: creees } } });
    }

    await referentiels.contenuSite();
    await app.close();
  });

  /** Ouvre une session et rend un agent qui porte le cookie et le jeton CSRF. */
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
      put: (url: string) => agent.put(`/api/v1${url}`).set('x-csrf-token', csrf),
      delete: (url: string) => agent.delete(`/api/v1${url}`).set('x-csrf-token', csrf),
    };
  }

  /** Crée une question par l'API et retient son identifiant pour le ménage. */
  async function creerQuestion(
    admin: Awaited<ReturnType<typeof connecte>>,
    corps: Record<string, unknown>,
  ) {
    const reponse = await admin.post('/admin/faq').send(corps).expect(201);
    const id = reponse.body.data.id as string;

    creees.push(BigInt(id));

    return id;
  }

  // ---------------------------------------------------------------------------
  //  Lecture publique
  // ---------------------------------------------------------------------------

  describe('lecture publique', () => {
    it('rend les questions groupées par rubrique, sans session', async () => {
      const reponse = await request(app.getHttpServer()).get('/api/v1/faq').expect(200);

      const rubriques = reponse.body.data as { groupe: string; items: unknown[] }[];

      expect(rubriques.map((r) => r.groupe)).toEqual([
        'Pour les parents',
        'Pour les établissements',
      ]);
      expect(rubriques[0]?.items.length).toBeGreaterThan(0);
    });

    it('n’expose ni le rang ni l’état de publication', async () => {
      const reponse = await request(app.getHttpServer()).get('/api/v1/faq').expect(200);

      const question = reponse.body.data[0].items[0];

      expect(Object.keys(question).sort()).toEqual(['id', 'question', 'reponse']);
    });

    it('retire du site une question dépubliée, sans la supprimer', async () => {
      const admin = await connecte('direction@ecoles360.com');
      const id = await creerQuestion(admin, {
        question: 'Question temporairement dépubliée ?',
        reponse: 'Réponse en cours de relecture.',
        groupe: 'Pour les parents',
        publiee: false,
      });

      const publique = await request(app.getHttpServer()).get('/api/v1/faq').expect(200);
      const questions = (publique.body.data as { items: { id: string }[] }[]).flatMap(
        (rubrique) => rubrique.items,
      );

      expect(questions.some((q) => q.id === id)).toBe(false);

      // …mais elle reste en base, visible du back-office.
      const cote = await admin.get('/admin/faq').expect(200);
      expect((cote.body.data as { id: string }[]).some((q) => q.id === id)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  //  Frontières d'accès — RG25
  // ---------------------------------------------------------------------------

  describe('frontières d’accès', () => {
    it('refuse l’anonyme sur la gestion', async () => {
      const reponse = await request(app.getHttpServer()).get('/api/v1/admin/faq').expect(401);

      expect(reponse.body.code).toBe(ERROR_CODES.NON_AUTHENTIFIE);
    });

    it('refuse un compte établissement sur la gestion (RG25)', async () => {
      const etablissement = await connecte('contact@almassira.ma');

      await etablissement.get('/admin/faq').expect(403);
      await etablissement
        .post('/admin/faq')
        .send({ question: 'Puis-je écrire la FAQ ?', reponse: 'Non.', groupe: 'Test' })
        .expect(403);
    });
  });

  // ---------------------------------------------------------------------------
  //  Écriture — livrable 11 §3.7, RG15
  // ---------------------------------------------------------------------------

  describe('écriture', () => {
    it('ajoute une question en fin de liste et la journalise (RG15)', async () => {
      const admin = await connecte('direction@ecoles360.com');

      const avant = await admin.get('/admin/faq').expect(200);
      const rangMax = Math.max(
        ...(avant.body.data as { ordre: number }[]).map((item) => item.ordre),
      );

      const id = await creerQuestion(admin, {
        question: 'Proposez-vous un accompagnement téléphonique ?',
        reponse: 'Oui, du lundi au samedi.',
        groupe: 'Pour les parents',
      });

      const cree = (await admin.get('/admin/faq').expect(200)).body.data.find(
        (item: { id: string }) => item.id === id,
      );

      expect(cree.ordre).toBe(rangMax + 1);
      expect(cree.publiee).toBe(true);

      const trace = await db.journalAudit.findFirst({
        where: { action: 'faq.creee', cible_id: BigInt(id) },
      });

      expect(trace).not.toBeNull();
    });

    it('garde le texte d’une question supprimée dans le journal', async () => {
      const admin = await connecte('direction@ecoles360.com');
      const id = await creerQuestion(admin, {
        question: 'Question vouée à disparaître ?',
        reponse: 'Texte qui doit survivre à la suppression.',
        groupe: 'Pour les parents',
      });

      await admin.delete(`/admin/faq/${id}`).expect(204);

      expect(await db.faqItem.findUnique({ where: { id: BigInt(id) } })).toBeNull();

      const trace = await db.journalAudit.findFirst({
        where: { action: 'faq.supprimee', cible_id: BigInt(id) },
      });

      expect(trace?.details).toMatchObject({
        reponse: 'Texte qui doit survivre à la suppression.',
      });
    });

    it('refuse une question sans rubrique', async () => {
      const admin = await connecte('direction@ecoles360.com');

      const reponse = await admin
        .post('/admin/faq')
        .send({ question: 'Sans rubrique ?', reponse: 'Impossible.' })
        .expect(422);

      expect(reponse.body.code).toBe(ERROR_CODES.VALIDATION_ECHOUEE);
    });

    it('répond 404 sur une question inconnue', async () => {
      const admin = await connecte('direction@ecoles360.com');

      await admin
        .put('/admin/faq/999999')
        .send({ question: 'Inexistante ?', reponse: 'Oui.', groupe: 'Pour les parents' })
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  //  Réordonnancement
  // ---------------------------------------------------------------------------

  describe('réordonnancement', () => {
    it('renumérote la liste entière et change l’ordre public', async () => {
      const admin = await connecte('direction@ecoles360.com');

      const ids = (await admin.get('/admin/faq').expect(200)).body.data.map(
        (item: { id: string }) => Number(item.id),
      ) as number[];

      // La dernière passe en tête : c'est le déplacement le plus visible.
      const inverse = [ids[ids.length - 1] as number, ...ids.slice(0, -1)];

      await admin.put('/admin/faq/ordre').send({ ids: inverse }).expect(204);

      const apres = (await admin.get('/admin/faq').expect(200)).body.data as {
        id: string;
        ordre: number;
      }[];

      expect(apres.map((item) => Number(item.id))).toEqual(inverse);
      // Rangs consécutifs à partir de 1 — ni trou, ni ex æquo.
      expect(apres.map((item) => item.ordre)).toEqual(inverse.map((_, rang) => rang + 1));
    });

    it('refuse une liste incomplète — elle trahit un écran périmé', async () => {
      const admin = await connecte('direction@ecoles360.com');

      const ids = (await admin.get('/admin/faq').expect(200)).body.data.map(
        (item: { id: string }) => Number(item.id),
      ) as number[];

      const reponse = await admin
        .put('/admin/faq/ordre')
        .send({ ids: ids.slice(1) })
        .expect(409);

      expect(reponse.body.code).toBe(ERROR_CODES.CONFLIT_METIER);
    });

    it('refuse un identifiant répété', async () => {
      const admin = await connecte('direction@ecoles360.com');

      const ids = (await admin.get('/admin/faq').expect(200)).body.data.map(
        (item: { id: string }) => Number(item.id),
      ) as number[];

      await admin
        .put('/admin/faq/ordre')
        .send({ ids: [ids[0] as number, ...ids] })
        .expect(422);
    });

    it('n’est pas confondu avec la modification d’une question (route `ordre`)', async () => {
      const admin = await connecte('direction@ecoles360.com');

      // Sans déclaration préalable de `faq/ordre`, `faq/:id` capterait l'appel
      // et `ParseIntPipe` refuserait « ordre » en 422 au lieu de réordonner.
      const ids = (await admin.get('/admin/faq').expect(200)).body.data.map(
        (item: { id: string }) => Number(item.id),
      ) as number[];

      await admin.put('/admin/faq/ordre').send({ ids }).expect(204);
    });
  });

  // ---------------------------------------------------------------------------
  //  Catégories d'articles — onglet « Catégories » de « Contenu du site »
  // ---------------------------------------------------------------------------

  /**
   * UN RÉFÉRENTIEL, PAS UNE CONTRAINTE. `Article.categorie` reste une chaîne
   * libre : cette liste dit ce que la rédaction se voit PROPOSER. Les tests
   * portent donc sur ce que la liste garantit — unicité, place en fin de
   * liste, et le fait qu'un retrait ne touche aucun article — plutôt que sur
   * une validation qu'elle n'exerce pas.
   */
  describe('catégories d’articles', () => {
    const jetable = () =>
      `Catégorie Test ${Date.now()}${Math.random().toString(36).slice(2, 5)}`;

    const nettoyerJournal = () =>
      db.journalAudit.deleteMany({ where: { cible_type: 'categorie_article' } });

    it('est lisible sans être connecté — la rédaction en a besoin', async () => {
      const reponse = await request(app.getHttpServer())
        .get('/api/v1/categories-articles')
        .expect(200);

      expect(Array.isArray(reponse.body.data)).toBe(true);
    });

    it('ajoute une catégorie en fin de liste, et la journalise', async () => {
      const admin = await connecte('direction@ecoles360.com');
      const libelle = jetable();

      const creee = await admin.post('/admin/categories-articles').send({ libelle }).expect(201);

      const liste = (await request(app.getHttpServer()).get('/api/v1/categories-articles')).body
        .data as { id: string; libelle: string; ordre: number }[];

      // EN FIN DE LISTE : une nouvelle catégorie ne doit pas s'insérer devant
      // celles que l'administration a déjà ordonnées.
      expect(liste[liste.length - 1]?.libelle).toBe(libelle);

      const trace = await db.journalAudit.findFirstOrThrow({
        where: { action: 'categorie_article.creee', cible_id: BigInt(creee.body.data.id) },
      });
      expect(trace.role_acteur).toBe('superadmin');

      await admin.delete(`/admin/categories-articles/${creee.body.data.id}`).expect(200);
      await nettoyerJournal();
    });

    it('refuse un doublon', async () => {
      const admin = await connecte('direction@ecoles360.com');
      const libelle = jetable();

      const creee = await admin.post('/admin/categories-articles').send({ libelle }).expect(201);
      await admin.post('/admin/categories-articles').send({ libelle }).expect(409);

      await admin.delete(`/admin/categories-articles/${creee.body.data.id}`).expect(200);
      await nettoyerJournal();
    });

    it('refuse un libellé vide ou trop long', async () => {
      const admin = await connecte('direction@ecoles360.com');

      await admin.post('/admin/categories-articles').send({ libelle: '   ' }).expect(422);
      await admin.post('/admin/categories-articles').send({ libelle: 'x'.repeat(61) }).expect(422);
    });

    /**
     * RETIRER NE DÉCLASSE RIEN, et c'est le point qui mérite d'être éprouvé :
     * un administrateur qui renomme une rubrique retire l'ancienne, et les
     * articles déjà écrits doivent garder leur libellé.
     */
    it('retire sans toucher aux articles, et dit combien en portent le libellé', async () => {
      const admin = await connecte('direction@ecoles360.com');

      const article = await db.article.findFirstOrThrow({
        where: { categorie: { not: '' } },
        select: { id: true, categorie: true },
      });

      // La migration a repris les catégories portées par les articles : si
      // celle-ci manque, c'est la reprise qui a échoué.
      const existante = await db.categorieArticle.findFirstOrThrow({
        where: { libelle: article.categorie },
        select: { id: true, libelle: true },
      });

      const retrait = await admin
        .delete(`/admin/categories-articles/${existante.id}`)
        .expect(200);

      expect(retrait.body.data.articles_concernes).toBeGreaterThan(0);

      const apres = await db.article.findUniqueOrThrow({ where: { id: article.id } });
      expect(apres.categorie).toBe(article.categorie);

      // Reposée : la base n'est pas remise à zéro, et l'appauvrir ferait
      // échouer ce même test à l'exécution suivante.
      await admin
        .post('/admin/categories-articles')
        .send({ libelle: existante.libelle })
        .expect(201);
      await nettoyerJournal();
    });

    it('répond 404 sur une catégorie inconnue', async () => {
      const admin = await connecte('direction@ecoles360.com');

      await admin.delete('/admin/categories-articles/9999999').expect(404);
    });

    it('n’ouvre l’écriture qu’à l’administration (RG25)', async () => {
      const ecole = await connecte('contact@almassira.ma');

      await ecole.post('/admin/categories-articles').send({ libelle: jetable() }).expect(403);
    });
  });
});
