import { HttpStatus, type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { ERROR_CODES, ValidationException } from '@/common/errors';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { StatutDependance, StatutSante } from '@/modules/health/dto/health-response.dto';
import { verifierBaseRedisDeTest } from '../helpers/env';

/**
 * Intégration HTTP de la sonde — lot 1 §6, livrable 13 §2.2.
 *
 * L'application Nest COMPLÈTE est instanciée (pipe de validation, filtre
 * d'exception global, controller) : c'est le contrat réel qui est éprouvé, pas
 * une réimplantation. Le cas nominal s'exécute contre une MySQL 8 et une
 * Redis 7 réelles, jamais SQLite (livrable 13 §1).
 *
 * Le cas « dépendance en échec » remplace le fournisseur concerné par un double
 * qui rejette. On n'éteint pas la base du poste voisin au milieu d'une suite,
 * et ce qui est testé ici est la RÉACTION de la sonde — statut 503, code
 * d'erreur, rapport par dépendance — pas la panne elle-même.
 */
describe('GET /api/v1/health (intégration)', () => {
  beforeAll(() => {
    verifierBaseRedisDeTest(process.env.REDIS_URL ?? '');
  });

  /** Monte l'application avec la configuration globale exacte de `main.ts`. */
  async function creerApplication(
    personnaliser?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
  ): Promise<INestApplication> {
    const base = Test.createTestingModule({ imports: [AppModule] });
    const moduleRef = await (personnaliser ? personnaliser(base) : base).compile();

    const app = moduleRef.createNestApplication();
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
    return app;
  }

  // ---------------------------------------------------------------------------
  //  Cas nominal — MySQL 8 et Redis 7 réelles
  // ---------------------------------------------------------------------------

  describe('cas nominal', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await creerApplication();
    });

    afterAll(async () => {
      await app.close();
    });

    it('répond 200 avec le détail par dépendance', async () => {
      const reponse = await request(app.getHttpServer()).get('/api/v1/health').expect(200);

      expect(reponse.body).toMatchObject({
        statut: StatutSante.Ok,
        dependances: {
          mysql: { statut: StatutDependance.Ok },
          redis: { statut: StatutDependance.Ok },
        },
      });

      expect(typeof reponse.body.version).toBe('string');
      expect(typeof reponse.body.duree_ms).toBe('number');
      expect(new Date(reponse.body.horodatage as string).toString()).not.toBe('Invalid Date');
    });

    it("n'expose aucune cause d'échec quand tout répond", async () => {
      const reponse = await request(app.getHttpServer()).get('/api/v1/health').expect(200);

      expect(reponse.body.dependances.mysql.erreur).toBeUndefined();
      expect(reponse.body.dependances.redis.erreur).toBeUndefined();
    });

    it('interdit la mise en cache de la réponse', async () => {
      // Une sonde mise en cache rapporterait indéfiniment l'état du premier appel.
      const reponse = await request(app.getHttpServer()).get('/api/v1/health').expect(200);

      expect(reponse.headers['cache-control']).toContain('no-store');
    });
  });

  // ---------------------------------------------------------------------------
  //  Cas dépendance en échec — lot 1 §6
  // ---------------------------------------------------------------------------

  describe('MySQL en échec', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await creerApplication((builder) =>
        builder.overrideProvider(PrismaService).useValue({
          onModuleInit: () => Promise.resolve(),
          onModuleDestroy: () => Promise.resolve(),
          verifierConnexion: () => Promise.reject(new Error('connect ECONNREFUSED 127.0.0.1:3306')),
        }),
      );
    });

    afterAll(async () => {
      await app.close();
    });

    it("répond 503 au format d'erreur du livrable 11 §1", async () => {
      const reponse = await request(app.getHttpServer()).get('/api/v1/health').expect(503);

      // Exactement trois clés : le contrat n'admet aucune enveloppe supplémentaire.
      expect(Object.keys(reponse.body).sort()).toEqual(['code', 'details', 'message']);
      expect(reponse.body.code).toBe(ERROR_CODES.SERVICE_INDISPONIBLE);
      expect(typeof reponse.body.message).toBe('string');
    });

    it('nomme la dépendance fautive et épargne les autres', async () => {
      const reponse = await request(app.getHttpServer()).get('/api/v1/health').expect(503);

      expect(reponse.body.details).toMatchObject({
        statut: StatutSante.Degrade,
        dependances: {
          mysql: { statut: StatutDependance.Erreur },
          // Un diagnostic partiel fait rouvrir l'incident : Redis est vérifiée
          // malgré l'échec de MySQL, et son état figure au rapport.
          redis: { statut: StatutDependance.Ok },
        },
      });

      expect(reponse.body.details.dependances.mysql.erreur).toContain('ECONNREFUSED');
    });
  });

  describe('Redis en échec', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await creerApplication((builder) =>
        // La connexion appartient à `RedisModule`, pas au service : la
        // remplacer ici ne laisse aucune socket ouverte derrière la suite.
        builder.overrideProvider(RedisService).useValue({
          verifierConnexion: () => Promise.reject(new Error('connect ECONNREFUSED 127.0.0.1:6379')),
        }),
      );
    });

    afterAll(async () => {
      await app.close();
    });

    it('répond 503 et rapporte MySQL comme disponible', async () => {
      const reponse = await request(app.getHttpServer()).get('/api/v1/health').expect(503);

      expect(reponse.body.code).toBe(ERROR_CODES.SERVICE_INDISPONIBLE);
      expect(reponse.body.details.dependances).toMatchObject({
        mysql: { statut: StatutDependance.Ok },
        redis: { statut: StatutDependance.Erreur },
      });
    });
  });

  // ---------------------------------------------------------------------------
  //  Socle — préfixe global et erreurs françaises
  // ---------------------------------------------------------------------------

  describe('socle applicatif', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await creerApplication();
    });

    afterAll(async () => {
      await app.close();
    });

    it('sert la sonde sous le préfixe /api/v1 et nulle part ailleurs', async () => {
      await request(app.getHttpServer()).get('/health').expect(404);
      await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    });

    it('rend les 404 au format normalisé, en français', async () => {
      const reponse = await request(app.getHttpServer())
        .get('/api/v1/route-inexistante')
        .expect(404);

      expect(reponse.body).toEqual({
        code: ERROR_CODES.RESSOURCE_INTROUVABLE,
        message: expect.any(String),
        details: {},
      });

      // Le « Cannot GET /… » d'Express décrit la surface de l'API : il ne sort pas.
      expect(reponse.body.message).not.toContain('Cannot GET');
    });
  });
});
