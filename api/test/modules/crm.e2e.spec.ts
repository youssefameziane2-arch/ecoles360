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
const ADMIN = 'direction@ecoles360.com';
const COMMERCIAL = 'younes.c@ecoles360.com';

/**
 * CRM — pipeline commercial d'écoles360 (RG17, RG18).
 *
 * CE QUI EST ÉPROUVÉ ICI, C'EST LA PROPRIÉTÉ D'UN DOSSIER. Un prospect
 * appartient à un commercial, et cette appartenance commande la commission
 * (RG18) : si un vendeur pouvait voir ou toucher le portefeuille d'un
 * collègue, le conflit ne se découvrirait qu'au moment de payer.
 *
 * À NE PAS CONFONDRE AVEC `Lead`, qui est le prospect d'une ÉCOLE — un parent
 * — et dont la RG23 réserve l'accès à son titulaire.
 */
describe('CRM commercial (intégration)', () => {
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
    const comptes = await demo.comptes();
    const { almassira } = await demo.donnees(comptes);
    await demo.leads(almassira, comptes.etablissement);
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
      post: (url: string) => agent.post(`/api/v1${url}`).set('x-csrf-token', csrf),
      patch: (url: string) => agent.patch(`/api/v1${url}`).set('x-csrf-token', csrf),
    };
  }

  /** Un prospect jetable, confié au commercial de démonstration. */
  async function prospectJetable(commercialId: bigint | null) {
    return db.prospect.create({
      data: {
        etablissement_nom: `Prospect Test ${Date.now()}${Math.random().toString(36).slice(2, 5)}`,
        contact_nom: 'Contact de test',
        telephone: '06 00 00 00 00',
        commercial_id: commercialId,
      },
    });
  }

  const commercialDemo = () =>
    db.user.findUniqueOrThrow({ where: { email: COMMERCIAL }, select: { id: true } });

  // ---------------------------------------------------------------------------
  //  Portée — RG18 commande la commission, donc la propriété commande tout
  // ---------------------------------------------------------------------------

  it('un commercial ne voit que son portefeuille, l’administration voit tout', async () => {
    const { id } = await commercialDemo();
    await prospectJetable(id);
    await prospectJetable(null); // sans propriétaire : personne ne le voit côté commercial

    const admin = await connecte(ADMIN);
    const commercial = await connecte(COMMERCIAL);

    const compter = (corps: { data: { prospects: unknown[] }[] }) =>
      corps.data.reduce((total, colonne) => total + colonne.prospects.length, 0);

    const vuAdmin = compter((await admin.get('/crm/pipeline').expect(200)).body);
    const vuCommercial = compter((await commercial.get('/crm/pipeline').expect(200)).body);

    expect(vuAdmin).toBeGreaterThan(vuCommercial);

    // Chaque prospect rendu au commercial porte bien son nom.
    const colonnes = (await commercial.get('/crm/pipeline').expect(200)).body.data as {
      prospects: { commercial: { id: string } | null }[];
    }[];

    for (const colonne of colonnes) {
      for (const prospect of colonne.prospects) {
        expect(prospect.commercial?.id).toBe(id.toString());
      }
    }
  });

  /**
   * 404 ET NON 403 : confirmer l'existence d'un prospect qu'on n'a pas le
   * droit de voir révélerait déjà le portefeuille d'un collègue.
   */
  it('refuse en 404 le prospect d’un autre, sans rien écrire', async () => {
    const autre = await prospectJetable(null);
    const commercial = await connecte(COMMERCIAL);

    const refus = await commercial
      .patch(`/crm/prospects/${autre.id}/statut`)
      .send({ statut: 'perdu' })
      .expect(404);

    expect(refus.body.code).toBe(ERROR_CODES.RESSOURCE_INTROUVABLE);

    const intact = await db.prospect.findUniqueOrThrow({ where: { id: autre.id } });
    expect(intact.statut_pipeline).toBe('nouveau');
  });

  it('refuse l’établissement et le secrétariat (RG25)', async () => {
    const ecole = await connecte('contact@almassira.ma');
    await ecole.get('/crm/pipeline').expect(403);

    const secretaire = await connecte('sara.s@ecoles360.com');
    await secretaire.get('/crm/pipeline').expect(403);
  });

  // ---------------------------------------------------------------------------
  //  Pipeline — RG17
  // ---------------------------------------------------------------------------

  it('rend les six colonnes, même vides', async () => {
    const admin = await connecte(ADMIN);
    const reponse = await admin.get('/crm/pipeline').expect(200);

    expect(reponse.body.data.map((c: { statut: string }) => c.statut)).toEqual([
      'nouveau',
      'a_contacter',
      'chaud',
      'relance',
      'transforme',
      'perdu',
    ]);
  });

  /**
   * « transformé » SIGNIFIE QU'UNE FICHE EXISTE. Le poser à la main laisserait
   * un prospect transformé sans établissement en face, et la commission de la
   * RG18 n'aurait rien à quoi se rattacher.
   */
  it('refuse de poser « transformé » à la main', async () => {
    const { id } = await commercialDemo();
    const prospect = await prospectJetable(id);
    const commercial = await connecte(COMMERCIAL);

    const refus = await commercial
      .patch(`/crm/prospects/${prospect.id}/statut`)
      .send({ statut: 'transforme' })
      .expect(422);

    expect(refus.body.message).toContain('fiche');
  });

  it('fait avancer un prospect et le journalise (RG15)', async () => {
    const { id } = await commercialDemo();
    const prospect = await prospectJetable(id);
    const commercial = await connecte(COMMERCIAL);

    await commercial
      .patch(`/crm/prospects/${prospect.id}/statut`)
      .send({ statut: 'chaud' })
      .expect(204);

    const apres = await db.prospect.findUniqueOrThrow({ where: { id: prospect.id } });
    expect(apres.statut_pipeline).toBe('chaud');

    const trace = await db.journalAudit.findFirstOrThrow({
      where: { action: 'prospect.statut', cible_id: prospect.id },
    });
    expect((trace.details as { vers: string }).vers).toBe('chaud');
  });

  // ---------------------------------------------------------------------------
  //  Relances — RG17
  // ---------------------------------------------------------------------------

  /**
   * Un prospect qu'on vient d'appeler n'est plus « nouveau » : le laisser dans
   * cette colonne ferait mentir le pipeline sur ce qui reste à traiter.
   */
  it('sort de « nouveau » dès la première relance', async () => {
    const { id } = await commercialDemo();
    const prospect = await prospectJetable(id);
    const commercial = await connecte(COMMERCIAL);

    expect(prospect.statut_pipeline).toBe('nouveau');

    await commercial
      .post(`/crm/prospects/${prospect.id}/relances`)
      .send({ note: 'Premier appel', effectuee: true })
      .expect(201);

    const apres = await db.prospect.findUniqueOrThrow({ where: { id: prospect.id } });
    expect(apres.statut_pipeline).toBe('a_contacter');
  });

  /**
   * Une relance « due » est programmée, pas encore faite, et sa date est
   * passée. C'est ce triplet qui fait l'agenda — pas un simple drapeau.
   */
  it('compte les relances dues, et les retire une fois faites', async () => {
    const { id } = await commercialDemo();
    const prospect = await prospectJetable(id);
    const commercial = await connecte(COMMERCIAL);

    const avant = (await commercial.get('/crm/indicateurs').expect(200)).body.data
      .relances_dues as number;

    const relance = await commercial
      .post(`/crm/prospects/${prospect.id}/relances`)
      .send({ note: 'Rappeler', prevue_le: new Date(Date.now() - 86_400_000).toISOString() })
      .expect(201);

    const pendant = (await commercial.get('/crm/indicateurs').expect(200)).body.data
      .relances_dues as number;
    expect(pendant).toBe(avant + 1);

    await commercial.patch(`/crm/relances/${relance.body.data.id}/effectuee`).expect(204);

    const apres = (await commercial.get('/crm/indicateurs').expect(200)).body.data
      .relances_dues as number;
    expect(apres).toBe(avant);

    // Deux fois, non : la seconde ne doit rien changer.
    await commercial.patch(`/crm/relances/${relance.body.data.id}/effectuee`).expect(409);
  });

  /** Une relance programmée dans le futur n'est pas encore due. */
  it('ne compte pas une relance programmée plus tard', async () => {
    const { id } = await commercialDemo();
    const prospect = await prospectJetable(id);
    const commercial = await connecte(COMMERCIAL);

    const avant = (await commercial.get('/crm/indicateurs').expect(200)).body.data
      .relances_dues as number;

    await commercial
      .post(`/crm/prospects/${prospect.id}/relances`)
      .send({ prevue_le: new Date(Date.now() + 7 * 86_400_000).toISOString() })
      .expect(201);

    const apres = (await commercial.get('/crm/indicateurs').expect(200)).body.data
      .relances_dues as number;
    expect(apres).toBe(avant);
  });

  // ---------------------------------------------------------------------------
  //  Indicateurs
  // ---------------------------------------------------------------------------

  /**
   * UN TAUX DE 0 % AFFIRMERAIT UN ÉCHEC là où il n'y a encore aucune mesure.
   * `null` dit « pas de dossier clos », ce qui est la vérité.
   */
  it('ne rend pas de taux de transformation sans dossier clos', async () => {
    const jalal = await db.user.create({
      data: {
        email: `commercial.neuf.${Date.now()}@ecoles360.com`,
        name: 'Commercial Neuf',
        passwordHash: 'x'.repeat(60),
        role_id: (await db.role.findUniqueOrThrow({ where: { code: 'commercial' } })).id,
      },
    });

    await prospectJetable(jalal.id);

    const admin = await connecte(ADMIN);
    const commerciaux = (await admin.get('/admin/commerciaux').expect(200)).body.data as {
      id: string;
      prospects: number;
      transformes: number;
    }[];

    const ligne = commerciaux.find((c) => c.id === jalal.id.toString());
    expect(ligne?.prospects).toBe(1);
    expect(ligne?.transformes).toBe(0);
  });

  // ---------------------------------------------------------------------------
  //  Assignation — réservée à la Direction (RG18)
  // ---------------------------------------------------------------------------

  /**
   * Laisser un vendeur s'attribuer un prospect reviendrait à le laisser
   * s'attribuer la commission qui en découlera.
   */
  it('seule l’administration confie un prospect', async () => {
    const prospect = await prospectJetable(null);
    const { id } = await commercialDemo();

    const commercial = await connecte(COMMERCIAL);
    await commercial
      .patch(`/admin/crm/prospects/${prospect.id}/commercial`)
      .send({ commercial_id: Number(id) })
      .expect(403);

    const admin = await connecte(ADMIN);
    await admin
      .patch(`/admin/crm/prospects/${prospect.id}/commercial`)
      .send({ commercial_id: Number(id) })
      .expect(204);

    const apres = await db.prospect.findUniqueOrThrow({ where: { id: prospect.id } });
    expect(apres.commercial_id).toBe(id);

    // `null` rend le dossier au pot commun — un départ, par exemple.
    await admin
      .patch(`/admin/crm/prospects/${prospect.id}/commercial`)
      .send({ commercial_id: null })
      .expect(204);

    const rendu = await db.prospect.findUniqueOrThrow({ where: { id: prospect.id } });
    expect(rendu.commercial_id).toBeNull();
  });

  it('refuse d’assigner un compte qui n’est pas commercial', async () => {
    const prospect = await prospectJetable(null);
    const admin = await connecte(ADMIN);

    const ecole = await db.user.findUniqueOrThrow({ where: { email: 'contact@almassira.ma' } });

    await admin
      .patch(`/admin/crm/prospects/${prospect.id}/commercial`)
      .send({ commercial_id: Number(ecole.id) })
      .expect(422);
  });
});
