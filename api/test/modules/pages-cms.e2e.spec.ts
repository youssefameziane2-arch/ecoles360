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

interface PageCms {
  cle: string;
  titre: string;
  blocs: Record<string, unknown>;
  modifiee_le: string | null;
}

/** Une page complète et valide — l'écran envoie toujours la page entière. */
const PAGE_MODIFIEE = {
  titre: 'À propos',
  blocs: {
    accroche: 'Accroche de test',
    mission: 'Mission de test',
    histoire: 'Premier paragraphe.\n\nSecond paragraphe.',
    valeurs: [{ titre: 'Confiance', texte: 'Texte de test.' }],
    engagements: [{ titre: 'Les avis', texte: 'Texte de test.' }],
    equipe: [{ nom: 'Membre de test', role: 'Conseiller' }],
    coordonnees: {
      email: 'test@ecoles360.com',
      telephone: '+212 5 22 00 00 01',
      adresse: 'Rabat, Maroc',
      whatsapp: '06 00 00 00 00',
    },
  },
};

/**
 * Pages CMS — lecture publique et publication par l'administration.
 *
 * LA PAGE EST PARTAGÉE avec les autres suites et la base n'est pas remise à
 * zéro : chaque écriture est défaite en fin de suite, en rétablissant la
 * ligne telle qu'elle était lue au départ.
 */
describe('Pages CMS (intégration)', () => {
  let app: INestApplication;
  let db: PrismaService;
  let redis: RedisService;
  let origine: Awaited<ReturnType<PrismaService['pageCms']['findUniqueOrThrow']>>;

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
    await referentiels.contenuSite();

    const demo = moduleRef.get(DemoSeeder);
    await demo.comptes();

    origine = await db.pageCms.findUniqueOrThrow({ where: { cle: 'a-propos' } });
  });

  beforeEach(async () => {
    await redis.instance.flushdb();
  });

  afterAll(async () => {
    await db.pageCms.update({
      where: { cle: 'a-propos' },
      data: {
        titre: origine.titre,
        blocs: origine.blocs as object,
        modifiee_par: origine.modifiee_par,
        modifiee_le: origine.modifiee_le,
      },
    });
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
      put: (url: string) => agent.put(`/api/v1${url}`).set('x-csrf-token', csrf),
    };
  }

  // ---------------------------------------------------------------------------
  //  Lecture publique
  // ---------------------------------------------------------------------------

  describe('lecture publique', () => {
    it('sert « a-propos » sans session, avec tous ses blocs', async () => {
      const reponse = await request(app.getHttpServer())
        .get('/api/v1/contenu/pages/a-propos')
        .expect(200);
      const page = reponse.body.data as PageCms;

      expect(Object.keys(reponse.body).sort()).toEqual(['data', 'links', 'meta']);
      expect(page.cle).toBe('a-propos');
      for (const bloc of [
        'accroche',
        'mission',
        'histoire',
        'valeurs',
        'engagements',
        'equipe',
        'coordonnees',
      ]) {
        expect(page.blocs).toHaveProperty(bloc);
      }
      expect(Array.isArray(page.blocs.equipe)).toBe(true);
    });

    it('ne livre pas l’auteur de la dernière modification', async () => {
      const reponse = await request(app.getHttpServer())
        .get('/api/v1/contenu/pages/a-propos')
        .expect(200);

      expect(reponse.body.data).not.toHaveProperty('modifiee_par');
    });

    it('répond 404 sur une clé inconnue', async () => {
      const reponse = await request(app.getHttpServer())
        .get('/api/v1/contenu/pages/page-qui-n-existe-pas')
        .expect(404);

      expect(reponse.body.code).toBe(ERROR_CODES.RESSOURCE_INTROUVABLE);
    });
  });

  // ---------------------------------------------------------------------------
  //  Publication — superadmin seul, journalisée (RG15, RG25, RG26)
  // ---------------------------------------------------------------------------

  describe('publication', () => {
    it('refuse l’anonyme', async () => {
      const reponse = await request(app.getHttpServer())
        .put('/api/v1/admin/pages/a-propos')
        .send(PAGE_MODIFIEE)
        .expect(401);

      expect(reponse.body.code).toBe(ERROR_CODES.NON_AUTHENTIFIE);
    });

    it.each([
      ['un compte établissement', 'contact@almassira.ma'],
      ['le secrétariat', 'sara.s@ecoles360.com'],
      ['un commercial', 'younes.c@ecoles360.com'],
    ])('refuse %s, sans rien écrire (RG25)', async (_libelle, email) => {
      const avant = await db.pageCms.findUniqueOrThrow({ where: { cle: 'a-propos' } });
      const compte = await connecte(email);
      const reponse = await compte.put('/admin/pages/a-propos').send(PAGE_MODIFIEE).expect(403);
      const apres = await db.pageCms.findUniqueOrThrow({ where: { cle: 'a-propos' } });

      expect(reponse.body.code).toBe(ERROR_CODES.ACCES_REFUSE);
      expect(apres.blocs).toEqual(avant.blocs);
    });

    it('refuse en 422 un champ non déclaré, même imbriqué', async () => {
      const admin = await connecte('direction@ecoles360.com');
      const corps = {
        ...PAGE_MODIFIEE,
        blocs: {
          ...PAGE_MODIFIEE.blocs,
          coordonnees: { ...PAGE_MODIFIEE.blocs.coordonnees, fax: '05 22 00 00 02' },
        },
      };

      await admin.put('/admin/pages/a-propos').send(corps).expect(422);
    });

    it('publie la page, signe la modification et la journalise', async () => {
      const admin = await connecte('direction@ecoles360.com');
      const compte = await db.user.findUniqueOrThrow({
        where: { email: 'direction@ecoles360.com' },
        select: { id: true },
      });
      const page = await db.pageCms.findUniqueOrThrow({ where: { cle: 'a-propos' } });
      const tracesAvant = await db.journalAudit.count({
        where: { action: 'page_cms.modifiee', cible_id: page.id },
      });
      const juste = new Date(Date.now() - 1000);

      await admin.put('/admin/pages/a-propos').send(PAGE_MODIFIEE).expect(200);

      // En base : le contenu, l'auteur et la date.
      const apres = await db.pageCms.findUniqueOrThrow({ where: { cle: 'a-propos' } });
      expect(apres.blocs).toEqual(PAGE_MODIFIEE.blocs);
      expect(apres.modifiee_par).toBe(compte.id);
      expect(apres.modifiee_le!.getTime()).toBeGreaterThanOrEqual(juste.getTime());

      // Au journal : une trace de plus, avec l'avant et l'après.
      const traces = await db.journalAudit.findMany({
        where: { action: 'page_cms.modifiee', cible_id: page.id },
        orderBy: { id: 'desc' },
      });
      expect(traces).toHaveLength(tracesAvant + 1);

      const trace = traces[0]!;
      const details = trace.details as { cle: string; avant: unknown; apres: { blocs: unknown } };
      expect(trace.user_id).toBe(compte.id);
      expect(trace.role_acteur).toBe('superadmin');
      expect(details.cle).toBe('a-propos');
      expect(details.avant).toBeDefined();
      expect(details.apres.blocs).toEqual(PAGE_MODIFIEE.blocs);

      // Côté public : ce qui vient d'être publié, équipe comprise.
      const publique = await request(app.getHttpServer())
        .get('/api/v1/contenu/pages/a-propos')
        .expect(200);
      expect(publique.body.data.blocs.equipe).toEqual(PAGE_MODIFIEE.blocs.equipe);
    });
  });

  // ---------------------------------------------------------------------------
  //  Pages légales — loi 09-08 (RG09)
  // ---------------------------------------------------------------------------

  /**
   * CE QUI COMPTE ICI EST LA BORNE SUR LA CLÉ. Elle vient de l'URL, où
   * `ValidationPipe` ne l'atteint pas : sans contrôle, `a-propos` passerait
   * par la route des pages légales et recevrait une forme de blocs que son
   * écran ne sait pas lire — la page publique se viderait, et la seule trace
   * serait une ligne d'audit que personne ne relit avant le signalement.
   */
  describe('pages légales', () => {
    const CLES = ['mentions-legales', 'confidentialite', 'cookies'] as const;

    let avant: { cle: string; titre: string; blocs: unknown }[];

    beforeAll(async () => {
      avant = await db.pageCms.findMany({
        where: { cle: { in: [...CLES] } },
        select: { cle: true, titre: true, blocs: true },
      });
    });

    afterAll(async () => {
      for (const page of avant) {
        await db.pageCms.update({
          where: { cle: page.cle },
          data: { titre: page.titre, blocs: page.blocs as object, modifiee_par: null },
        });
      }
    });

    it('sert les trois pages sans session', async () => {
      for (const cle of CLES) {
        const reponse = await request(app.getHttpServer())
          .get(`/api/v1/contenu/pages/${cle}`)
          .expect(200);

        expect(reponse.body.data.cle).toBe(cle);
        expect(reponse.body.data.blocs.sections.length).toBeGreaterThan(0);
      }
    });

    it('refuse l’anonyme et l’établissement', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/admin/pages/legales/cookies')
        .send({ titre: 'x', sections: [{ titre: 'x', corps: 'x' }] })
        .expect(401);

      const ecole = await connecte('contact@almassira.ma');
      await ecole
        .put('/admin/pages/legales/cookies')
        .send({ titre: 'x', sections: [{ titre: 'x', corps: 'x' }] })
        .expect(403);
    });

    it('refuse une clé inconnue', async () => {
      const admin = await connecte('direction@ecoles360.com');
      await admin
        .put('/admin/pages/legales/cgu')
        .send({ titre: 'x', sections: [{ titre: 'x', corps: 'x' }] })
        .expect(404);
    });

    it('n’atteint pas « À propos » par la route des pages légales', async () => {
      const admin = await connecte('direction@ecoles360.com');

      await admin
        .put('/admin/pages/legales/a-propos')
        .send({ titre: 'Détourné', sections: [{ titre: 'x', corps: 'x' }] })
        .expect(404);

      const intacte = await db.pageCms.findUniqueOrThrow({ where: { cle: 'a-propos' } });
      expect(intacte.titre).not.toBe('Détourné');
      expect(intacte.blocs).toHaveProperty('mission');
    });

    it('refuse une page sans section, et un champ non déclaré', async () => {
      const admin = await connecte('direction@ecoles360.com');

      await admin
        .put('/admin/pages/legales/cookies')
        .send({ titre: 'x', sections: [] })
        .expect(422);

      await admin
        .put('/admin/pages/legales/cookies')
        .send({ titre: 'x', sections: [{ titre: 'x', corps: 'x', auteur: 'moi' }] })
        .expect(422);
    });

    it('publie, journalise, et le site public le voit', async () => {
      const admin = await connecte('direction@ecoles360.com');

      const sections = [
        { titre: 'Ce qu’est un cookie', corps: 'Un petit fichier déposé par le navigateur.' },
        { titre: 'Comment les refuser', corps: 'Depuis les réglages de votre navigateur.' },
      ];

      await admin
        .put('/admin/pages/legales/cookies')
        .send({ titre: 'Gestion des cookies', sections })
        .expect(200);

      const publique = await request(app.getHttpServer())
        .get('/api/v1/contenu/pages/cookies')
        .expect(200);

      expect(publique.body.data.blocs.sections).toEqual(sections);

      // La page ENTIÈRE : les cinq rubriques du semis ont disparu, elles ne
      // survivent pas à une publication qui ne les porte pas.
      expect(publique.body.data.blocs.sections).toHaveLength(2);

      const trace = await db.journalAudit.findFirstOrThrow({
        where: { action: 'page_cms.modifiee' },
        orderBy: { id: 'desc' },
      });

      expect((trace.details as { cle: string }).cle).toBe('cookies');
      expect(trace.details).toHaveProperty('avant');
      expect(trace.details).toHaveProperty('apres');
    });
  });
});
