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

interface Comparaison {
  courant: number;
  precedent: number;
}

interface Statistiques {
  mois_courant: string;
  indicateurs: { vues: Comparaison; appels: Comparaison; whatsapp: Comparaison };
  vues_par_mois: { debut: string; vues: number }[];
  total_vues: number;
  origine_contacts: { source: string | null; contacts: number }[];
  total_contacts: number;
}

/**
 * Statistiques de l'espace établissement — maquette `isEtabStats`.
 *
 * LA BASE N'EST PAS REMISE À ZÉRO entre deux exécutions : aucun test n'attend
 * un compte exact. La portée est éprouvée par des ÉCARTS (une trace posée sur
 * sa fiche compte, une trace posée sur une autre ne compte pas) et le calcul
 * par des INVARIANTS (la somme des barres est le total affiché).
 */
describe('Statistiques de l’espace établissement (intégration)', () => {
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

  async function lire(compte: Awaited<ReturnType<typeof connecte>>): Promise<Statistiques> {
    const reponse = await compte.get('/mon-espace/statistiques').expect(200);

    return reponse.body.data as Statistiques;
  }

  const somme = (valeurs: number[]) => valeurs.reduce((total, v) => total + v, 0);

  /** Pose une trace — datée de maintenant par défaut — et la retire en fin de test. */
  async function avecTrace<T>(
    slug: string,
    trace: {
      type: 'vue' | 'vue_sponsorisee' | 'appel' | 'whatsapp';
      source?: string;
      survenu_le?: Date;
    },
    corps: () => Promise<T>,
  ): Promise<T> {
    const etablissement = await db.etablissement.findUniqueOrThrow({ where: { slug } });
    const posee = await db.evenementTrace.create({
      data: {
        etablissement_id: etablissement.id,
        type: trace.type,
        source: trace.source ?? null,
        ...(trace.survenu_le ? { survenu_le: trace.survenu_le } : {}),
      },
    });

    try {
      return await corps();
    } finally {
      await db.evenementTrace.delete({ where: { id: posee.id } });
    }
  }

  // ---------------------------------------------------------------------------
  //  Frontière d'accès — RG05, RG25
  // ---------------------------------------------------------------------------

  describe('frontière d’accès', () => {
    it('refuse l’anonyme', async () => {
      const reponse = await request(app.getHttpServer())
        .get('/api/v1/mon-espace/statistiques')
        .expect(401);

      expect(reponse.body.code).toBe(ERROR_CODES.NON_AUTHENTIFIE);
    });

    it.each([
      ['un commercial', 'younes.c@ecoles360.com'],
      ['l’administration', 'direction@ecoles360.com'],
    ])('refuse %s (RG25)', async (_libelle, email) => {
      const compte = await connecte(email);
      const reponse = await compte.get('/mon-espace/statistiques').expect(403);

      expect(reponse.body.code).toBe(ERROR_CODES.ACCES_REFUSE);
    });

    it('sert un secrétariat rattaché, sans portée requise — les chiffres de son établissement', async () => {
      // Yassine n'a pas la portée `avis` : la route n'en exige aucune, comme
      // le tableau de bord qui rend déjà ces chiffres au secrétariat.
      const [etablissement, sara, yassine] = await Promise.all([
        connecte('contact@almassira.ma'),
        connecte('sara.s@ecoles360.com'),
        connecte('yassine.b@ecoles360.com'),
      ]);

      const [siens, deSara, deYassine] = await Promise.all([
        lire(etablissement),
        lire(sara),
        lire(yassine),
      ]);

      expect(deSara.total_vues).toBe(siens.total_vues);
      expect(deYassine.total_vues).toBe(siens.total_vues);
      expect(deSara.total_contacts).toBe(siens.total_contacts);
    });

    it('répond dans l’enveloppe du contrat', async () => {
      const etablissement = await connecte('contact@almassira.ma');
      const reponse = await etablissement.get('/mon-espace/statistiques').expect(200);

      expect(Object.keys(reponse.body).sort()).toEqual(['data', 'links', 'meta']);
    });
  });

  // ---------------------------------------------------------------------------
  //  Portée — un établissement ne voit que sa fiche
  // ---------------------------------------------------------------------------

  describe('portée', () => {
    it('compte les traces de sa fiche, jamais celles d’une autre', async () => {
      const etablissement = await connecte('contact@almassira.ma');
      const autre = await db.etablissement.findFirstOrThrow({
        where: { slug: { not: SLUG } },
        select: { slug: true },
      });

      const avant = await lire(etablissement);

      await avecTrace(autre.slug, { type: 'vue', source: 'fiche' }, async () => {
        await avecTrace(autre.slug, { type: 'appel', source: 'fiche' }, async () => {
          const apres = await lire(etablissement);

          expect(apres.indicateurs.vues.courant).toBe(avant.indicateurs.vues.courant);
          expect(apres.total_vues).toBe(avant.total_vues);
          expect(apres.total_contacts).toBe(avant.total_contacts);
        });
      });

      await avecTrace(SLUG, { type: 'vue', source: 'fiche' }, async () => {
        const apres = await lire(etablissement);

        expect(apres.indicateurs.vues.courant).toBe(avant.indicateurs.vues.courant + 1);
        expect(apres.total_vues).toBe(avant.total_vues + 1);
      });
    });

    it('range un clic sous sa source, et le compte comme contact', async () => {
      const etablissement = await connecte('contact@almassira.ma');
      const avant = await lire(etablissement);
      const deResultats = (stats: Statistiques) =>
        stats.origine_contacts.find((ligne) => ligne.source === 'resultats')?.contacts ?? 0;

      await avecTrace(SLUG, { type: 'whatsapp', source: 'resultats' }, async () => {
        const apres = await lire(etablissement);

        expect(apres.indicateurs.whatsapp.courant).toBe(avant.indicateurs.whatsapp.courant + 1);
        expect(deResultats(apres)).toBe(deResultats(avant) + 1);
        expect(apres.total_contacts).toBe(avant.total_contacts + 1);
      });
    });
  });

  // ---------------------------------------------------------------------------
  //  Invariants du calcul
  // ---------------------------------------------------------------------------

  describe('invariants', () => {
    it('rend six mois dont la somme est le total, et dont le dernier est le mois en cours', async () => {
      const etablissement = await connecte('contact@almassira.ma');

      // Au moins une vue : sans elle, les égalités tiendraient à vide.
      await avecTrace(SLUG, { type: 'vue', source: 'fiche' }, async () => {
        const stats = await lire(etablissement);
        const derniere = stats.vues_par_mois[stats.vues_par_mois.length - 1]!;

        expect(stats.vues_par_mois).toHaveLength(6);
        expect(somme(stats.vues_par_mois.map((point) => point.vues))).toBe(stats.total_vues);
        expect(derniere.debut.slice(0, 7)).toBe(stats.mois_courant);
        expect(derniere.vues).toBe(stats.indicateurs.vues.courant);

        const debuts = stats.vues_par_mois.map((point) => point.debut);
        expect([...debuts].sort()).toEqual(debuts);
        expect(new Set(debuts).size).toBe(debuts.length);
      });
    });

    it('rend des origines dont la somme est le total des contacts', async () => {
      const etablissement = await connecte('contact@almassira.ma');

      await avecTrace(SLUG, { type: 'appel', source: 'fiche' }, async () => {
        const stats = await lire(etablissement);

        expect(stats.total_contacts).toBeGreaterThan(0);
        expect(somme(stats.origine_contacts.map((ligne) => ligne.contacts))).toBe(
          stats.total_contacts,
        );
      });
    });
  });

  // ---------------------------------------------------------------------------
  //  Tableau de bord — même définition que les statistiques (B-43)
  // ---------------------------------------------------------------------------

  describe('« Vues ce mois » du tableau de bord', () => {
    interface TableauDeBord {
      vues_ce_mois: number;
      vues_par_mois: { mois: string; vues: number }[];
    }

    async function lireTableauDeBord(
      compte: Awaited<ReturnType<typeof connecte>>,
    ): Promise<TableauDeBord> {
      const reponse = await compte.get('/mon-espace/dashboard').expect(200);

      return reponse.body.data as TableauDeBord;
    }

    it('compte une vue sponsorisée', async () => {
      const etablissement = await connecte('contact@almassira.ma');
      const avant = await lireTableauDeBord(etablissement);

      await avecTrace(SLUG, { type: 'vue_sponsorisee', source: 'resultats' }, async () => {
        const apres = await lireTableauDeBord(etablissement);

        expect(apres.vues_ce_mois).toBe(avant.vues_ce_mois + 1);
      });
    });

    it('ne compte pas une vue du mois précédent, même de moins de trente jours', async () => {
      const etablissement = await connecte('contact@almassira.ma');
      const maintenant = new Date();
      // Une minute avant le premier du mois, en UTC : toujours dans les trente
      // derniers jours, jamais dans le mois — c'est précisément l'écart corrigé.
      const veilleDuMois = new Date(
        Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), 1) - 60_000,
      );
      const avant = await lireTableauDeBord(etablissement);

      await avecTrace(
        SLUG,
        { type: 'vue', source: 'fiche', survenu_le: veilleDuMois },
        async () => {
          const apres = await lireTableauDeBord(etablissement);

          expect(apres.vues_ce_mois).toBe(avant.vues_ce_mois);
        },
      );
    });

    it('affiche le même nombre que les statistiques, et que sa dernière barre', async () => {
      const etablissement = await connecte('contact@almassira.ma');

      // Une vue au moins, pour que l'égalité ne tienne pas à vide.
      await avecTrace(SLUG, { type: 'vue', source: 'fiche' }, async () => {
        const [tableau, stats] = await Promise.all([
          lireTableauDeBord(etablissement),
          lire(etablissement),
        ]);
        const derniere = tableau.vues_par_mois[tableau.vues_par_mois.length - 1]!;

        expect(tableau.vues_ce_mois).toBe(stats.indicateurs.vues.courant);
        expect(derniere.mois).toBe(stats.mois_courant);
        expect(derniere.vues).toBe(tableau.vues_ce_mois);
        expect(tableau.vues_par_mois.map((point) => point.vues)).toEqual(
          stats.vues_par_mois.map((point) => point.vues),
        );
      });
    });
  });
});
