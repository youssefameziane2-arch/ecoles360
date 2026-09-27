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
const SLUG = 'lycee-al-massira-casablanca';

type Periode = '7j' | '30j' | '90j' | '12m';

interface Statistiques {
  periode: Periode;
  granularite: 'jour' | 'semaine' | 'mois';
  indicateurs: { vues_fiches: number; demandes: number; nouveaux_avis: number };
  courbe: { debut: string; vues: number }[];
  vues_par_type: { type: string; vues: number }[];
  top_etablissements: {
    slug: string;
    type: string;
    vues: number;
    contacts: number;
    ville: { slug: string };
  }[];
  options: { villes: { slug: string; nom: string }[] };
}

/**
 * Statistiques de l'administration — maquette `isAdminStats`.
 *
 * LA BASE N'EST PAS REMISE À ZÉRO entre deux exécutions : aucun test n'attend
 * un compte exact. Les filtres sont éprouvés par des INVARIANTS (chaque ligne
 * du classement respecte le filtre, la somme des points est le total) et par
 * des ÉCARTS (une trace posée compte là où elle doit, et nulle part ailleurs).
 */
describe('Statistiques de l’administration (intégration)', () => {
  let app: INestApplication;
  let db: PrismaService;
  let redis: RedisService;

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

    const demo = moduleRef.get(DemoSeeder);
    await demo.donnees(await demo.comptes());
  });

  beforeEach(async () => {
    await redis.instance.flushdb();
  });

  afterAll(async () => {
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
      patch: (url: string) => agent.patch(`/api/v1${url}`).set('x-csrf-token', csrf),
    };
  }

  /**
   * UNE SESSION ADMIN PAR TEST, ouverte après le vidage de Redis. Se connecter
   * à chaque lecture dépasserait le plafond de tentatives de connexion (5 par
   * fenêtre) dès le test des périodes, qui lit huit fois : 429, et un échec
   * qui ne dirait rien des statistiques.
   */
  let admin: Awaited<ReturnType<typeof connecte>>;

  beforeEach(async () => {
    admin = await connecte('direction@ecoles360.com');
  });

  async function lire(parametres = ''): Promise<Statistiques> {
    const reponse = await admin.get(`/admin/statistiques${parametres}`).expect(200);

    return reponse.body.data as Statistiques;
  }

  const ilYA = (jours: number) => new Date(Date.now() - jours * 24 * 3600 * 1000);

  /** Pose une vue sur la fiche de démonstration, et la retire en fin de test. */
  async function avecVue<T>(jours: number, corps: () => Promise<T>): Promise<T> {
    const etablissement = await db.etablissement.findUniqueOrThrow({ where: { slug: SLUG } });
    const trace = await db.evenementTrace.create({
      data: {
        etablissement_id: etablissement.id,
        type: 'vue',
        source: 'fiche',
        survenu_le: ilYA(jours),
      },
    });

    try {
      return await corps();
    } finally {
      await db.evenementTrace.delete({ where: { id: trace.id } });
    }
  }

  // ---------------------------------------------------------------------------
  //  Frontière d'accès — RG25
  // ---------------------------------------------------------------------------

  describe('frontière d’accès', () => {
    it('refuse l’anonyme', async () => {
      const reponse = await request(app.getHttpServer())
        .get('/api/v1/admin/statistiques')
        .expect(401);

      expect(reponse.body.code).toBe(ERROR_CODES.NON_AUTHENTIFIE);
    });

    it.each([
      ['un compte établissement', 'contact@almassira.ma'],
      ['le secrétariat', 'sara.s@ecoles360.com'],
      ['un commercial', 'younes.c@ecoles360.com'],
    ])('refuse %s (RG25)', async (_libelle, email) => {
      const compte = await connecte(email);
      const reponse = await compte.get('/admin/statistiques').expect(403);

      expect(reponse.body.code).toBe(ERROR_CODES.ACCES_REFUSE);
    });

    it('refuse une période inconnue en 422', async () => {
      await admin.get('/admin/statistiques?periode=3j').expect(422);
    });

    it('sert 30 jours par défaut, dans l’enveloppe du contrat', async () => {
      const reponse = await admin.get('/admin/statistiques').expect(200);

      expect(Object.keys(reponse.body).sort()).toEqual(['data', 'links', 'meta']);
      expect(reponse.body.data.periode).toBe('30j');
    });
  });

  // ---------------------------------------------------------------------------
  //  Filtres ville et type
  // ---------------------------------------------------------------------------

  describe('filtres', () => {
    it('n’inclut que les fiches de la ville demandée', async () => {
      const etablissement = await db.etablissement.findUniqueOrThrow({
        where: { slug: SLUG },
        select: { ville: { select: { slug: true } } },
      });
      const sienne = etablissement.ville.slug;
      const { options } = await lire();
      const autre = options.villes.find((ville) => ville.slug !== sienne)!.slug;

      const [avantSienne, avantAutre] = await Promise.all([
        lire(`?ville=${sienne}`),
        lire(`?ville=${autre}`),
      ]);

      await avecVue(1, async () => {
        const [apresSienne, apresAutre] = await Promise.all([
          lire(`?ville=${sienne}`),
          lire(`?ville=${autre}`),
        ]);

        // La vue compte dans sa ville, et nulle part ailleurs.
        expect(apresSienne.indicateurs.vues_fiches).toBe(avantSienne.indicateurs.vues_fiches + 1);
        expect(apresAutre.indicateurs.vues_fiches).toBe(avantAutre.indicateurs.vues_fiches);

        for (const ligne of apresAutre.top_etablissements) {
          expect(ligne.ville.slug).toBe(autre);
        }
        expect(apresAutre.top_etablissements.map((l) => l.slug)).not.toContain(SLUG);
      });
    });

    it('n’inclut que les fiches du type demandé', async () => {
      const { type } = await db.etablissement.findUniqueOrThrow({ where: { slug: SLUG } });
      const stats = await lire(`?type=${type}`);

      for (const ligne of stats.top_etablissements) {
        expect(ligne.type).toBe(type);
      }
      for (const ligne of stats.vues_par_type) {
        expect(ligne.type).toBe(type);
      }
    });

    it('refuse un type inconnu en 422', async () => {
      await admin.get('/admin/statistiques?type=maternelle').expect(422);
    });
  });

  // ---------------------------------------------------------------------------
  //  Périodes
  // ---------------------------------------------------------------------------

  describe('périodes', () => {
    it('exclut ce qui précède la période', async () => {
      const [avant7, avant30, avant90, avant12m] = await Promise.all([
        lire('?periode=7j'),
        lire('?periode=30j'),
        lire('?periode=90j'),
        lire('?periode=12m'),
      ]);

      await avecVue(10, async () => {
        const [apres7, apres30] = await Promise.all([lire('?periode=7j'), lire('?periode=30j')]);

        // J-10 : hors des 7 jours, dans les 30.
        expect(apres7.indicateurs.vues_fiches).toBe(avant7.indicateurs.vues_fiches);
        expect(apres30.indicateurs.vues_fiches).toBe(avant30.indicateurs.vues_fiches + 1);
      });

      await avecVue(100, async () => {
        const [apres90, apres12m] = await Promise.all([lire('?periode=90j'), lire('?periode=12m')]);

        // J-100 : hors des 90 jours, dans les 12 mois.
        expect(apres90.indicateurs.vues_fiches).toBe(avant90.indicateurs.vues_fiches);
        expect(apres12m.indicateurs.vues_fiches).toBe(avant12m.indicateurs.vues_fiches + 1);
      });
    });

    it.each([
      ['7j', 'jour'],
      ['30j', 'jour'],
      ['90j', 'semaine'],
      ['12m', 'mois'],
    ])('rend une courbe dont la somme est le total — %s', async (periode, granularite) => {
      const stats = await lire(`?periode=${periode}`);
      const somme = (valeurs: number[]) => valeurs.reduce((total, v) => total + v, 0);

      expect(stats.granularite).toBe(granularite);
      expect(somme(stats.courbe.map((point) => point.vues))).toBe(stats.indicateurs.vues_fiches);
      expect(somme(stats.vues_par_type.map((ligne) => ligne.vues))).toBe(
        stats.indicateurs.vues_fiches,
      );

      // Points dans l'ordre chronologique, sans doublon.
      const debuts = stats.courbe.map((point) => point.debut);
      expect([...debuts].sort()).toEqual(debuts);
      expect(new Set(debuts).size).toBe(debuts.length);
    });
  });

  it('classe par vues décroissantes, contacts de la période compris', async () => {
    const stats = await lire();
    const vues = stats.top_etablissements.map((ligne) => ligne.vues);

    expect([...vues].sort((a, b) => b - a)).toEqual(vues);
    for (const ligne of stats.top_etablissements) {
      expect(ligne.vues).toBeGreaterThan(0);
      expect(ligne.contacts).toBeLessThanOrEqual(stats.indicateurs.demandes);
    }
  });
});
