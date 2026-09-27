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

interface TableauDeBord {
  fenetre_jours: number;
  activite: unknown[];
  a_traiter: { file: string; en_attente: number; plus_ancienne: string | null }[];
  visites: {
    vues_fiches: { courant: number; precedent: number };
    demandes: { courant: number; precedent: number };
    vues_par_jour: { jour: string; vues: number }[];
  };
  top_etablissements: { slug: string; vues: number }[];
}

/**
 * Tableau de bord de l'administration — maquette `isAdminDash`.
 *
 * LA BASE N'EST PAS REMISE À ZÉRO entre deux exécutions : aucun test n'attend
 * un compte exact. Chacun mesure, crée sa propre donnée, mesure encore, et
 * vérifie l'ÉCART — puis retire ce qu'il a créé. Les autres assertions sont
 * des invariants : ce que la pastille annonce est ce que la file affiche, la
 * somme des barres est le total.
 */
describe('Tableau de bord de l’administration (intégration)', () => {
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

  async function lireTableau(): Promise<TableauDeBord> {
    const admin = await connecte('direction@ecoles360.com');
    const reponse = await admin.get('/admin/tableau-de-bord').expect(200);

    return reponse.body.data as TableauDeBord;
  }

  const enAttente = (tableau: TableauDeBord, file: string) =>
    tableau.a_traiter.find((ligne) => ligne.file === file)?.en_attente ?? -1;

  const ilYA = (jours: number) => new Date(Date.now() - jours * 24 * 3600 * 1000);

  // ---------------------------------------------------------------------------
  //  Frontière d'accès — RG25
  // ---------------------------------------------------------------------------

  describe('frontière d’accès', () => {
    it('refuse l’anonyme', async () => {
      const reponse = await request(app.getHttpServer())
        .get('/api/v1/admin/tableau-de-bord')
        .expect(401);

      expect(reponse.body.code).toBe(ERROR_CODES.NON_AUTHENTIFIE);
    });

    it.each([
      ['un compte établissement', 'contact@almassira.ma'],
      ['le secrétariat', 'sara.s@ecoles360.com'],
      ['un commercial', 'younes.c@ecoles360.com'],
    ])('refuse %s (RG25)', async (_libelle, email) => {
      const compte = await connecte(email);
      const reponse = await compte.get('/admin/tableau-de-bord').expect(403);

      expect(reponse.body.code).toBe(ERROR_CODES.ACCES_REFUSE);
    });

    it('sert le Super Admin, dans l’enveloppe du contrat', async () => {
      const admin = await connecte('direction@ecoles360.com');
      const reponse = await admin.get('/admin/tableau-de-bord').expect(200);

      expect(Object.keys(reponse.body).sort()).toEqual(['data', 'links', 'meta']);
      expect(reponse.body.data.fenetre_jours).toBe(30);
    });
  });

  // ---------------------------------------------------------------------------
  //  « À traiter » — RG06, RG20, circuit éditorial
  // ---------------------------------------------------------------------------

  describe('files à traiter', () => {
    it('annonce exactement ce que chaque file affiche', async () => {
      const admin = await connecte('direction@ecoles360.com');
      const tableau = (await admin.get('/admin/tableau-de-bord').expect(200)).body
        .data as TableauDeBord;

      const [propositions, avis, articles] = await Promise.all([
        admin.get('/admin/propositions-fiche').expect(200),
        admin.get('/admin/avis?statut=en_attente').expect(200),
        admin.get('/admin/articles?statut=en_attente').expect(200),
      ]);

      expect(enAttente(tableau, 'propositions')).toBe(propositions.body.data.length);
      expect(enAttente(tableau, 'avis')).toBe(avis.body.data.length);
      expect(enAttente(tableau, 'articles')).toBe(articles.body.data.length);
    });

    it('compte ce qui attend, et cesse de le compter une fois décidé', async () => {
      const etablissement = await db.etablissement.findUniqueOrThrow({ where: { slug: SLUG } });
      const auteur = await db.user.findUniqueOrThrow({ where: { email: 'contact@almassira.ma' } });

      // RG20 n'admet qu'une proposition en attente par fiche : on repart d'une
      // fiche qui n'en a pas pour pouvoir en poser une.
      await db.propositionFiche.deleteMany({
        where: { etablissement_id: etablissement.id, statut: 'en_attente' },
      });

      const avant = await lireTableau();

      const [proposition, avis, article] = await Promise.all([
        db.propositionFiche.create({
          data: {
            etablissement_id: etablissement.id,
            proposee_par: auteur.id,
            champs_modifies: ['description'],
          },
        }),
        db.avis.create({
          data: {
            etablissement_id: etablissement.id,
            auteur_nom: 'Parent du tableau de bord',
            auteur_contact: 'tableau@exemple.ma',
            note: 4,
            commentaire: 'Avis créé par la suite du tableau de bord admin.',
          },
        }),
        db.article.create({
          data: {
            titre: 'Article en attente du tableau de bord',
            slug: `tableau-de-bord-${Date.now()}`,
            categorie: 'Conseils',
            statut: 'en_attente',
            soumis_le: new Date(),
          },
        }),
      ]);

      try {
        const pendant = await lireTableau();

        expect(enAttente(pendant, 'propositions')).toBe(enAttente(avant, 'propositions') + 1);
        expect(enAttente(pendant, 'avis')).toBe(enAttente(avant, 'avis') + 1);
        expect(enAttente(pendant, 'articles')).toBe(enAttente(avant, 'articles') + 1);

        for (const ligne of pendant.a_traiter) {
          expect(ligne.plus_ancienne).not.toBeNull();
        }

        // Décidé, l'avis quitte la file : la pastille ne doit pas le retenir.
        // Rejeté plutôt que publié : un avis en attente ne compte pas dans la
        // note, le rejeter laisse donc la fiche telle qu'on l'a trouvée (RG08).
        const admin = await connecte('direction@ecoles360.com');
        await admin
          .patch(`/admin/avis/${avis.id}`)
          .send({
            decision: 'rejete',
            motif: 'Avis de test retiré par la suite du tableau de bord.',
          })
          .expect(200);

        const apres = await lireTableau();
        expect(enAttente(apres, 'avis')).toBe(enAttente(avant, 'avis'));
      } finally {
        await Promise.all([
          db.propositionFiche.delete({ where: { id: proposition.id } }),
          db.avis.delete({ where: { id: avis.id } }),
          db.article.delete({ where: { id: article.id } }),
        ]);
      }
    });
  });

  // ---------------------------------------------------------------------------
  //  « Visites du site » — fenêtre glissante de 30 jours
  // ---------------------------------------------------------------------------

  describe('fenêtre de 30 jours', () => {
    it('range ce qui est plus ancien dans la période précédente, et ignore le reste', async () => {
      const etablissement = await db.etablissement.findUniqueOrThrow({ where: { slug: SLUG } });

      const avant = await lireTableau();

      const traces = await Promise.all(
        [5, 45, 75].map((jours) =>
          db.evenementTrace.create({
            data: {
              etablissement_id: etablissement.id,
              type: 'vue',
              source: 'fiche',
              survenu_le: ilYA(jours),
            },
          }),
        ),
      );
      const demandes = await Promise.all(
        [3, 40].map((jours) =>
          db.demandeContact.create({
            data: {
              etablissement_id: etablissement.id,
              parent_nom: 'Parent du tableau de bord',
              parent_tel: '0612345678',
              canal: 'formulaire',
              consentement: true,
              recue_le: ilYA(jours),
            },
          }),
        ),
      );

      try {
        const apres = await lireTableau();

        // J-5 compte dans les 30 jours, J-45 dans les 30 précédents, J-75 nulle part.
        expect(apres.visites.vues_fiches.courant).toBe(avant.visites.vues_fiches.courant + 1);
        expect(apres.visites.vues_fiches.precedent).toBe(avant.visites.vues_fiches.precedent + 1);

        expect(apres.visites.demandes.courant).toBe(avant.visites.demandes.courant + 1);
        expect(apres.visites.demandes.precedent).toBe(avant.visites.demandes.precedent + 1);
      } finally {
        await db.evenementTrace.deleteMany({ where: { id: { in: traces.map((t) => t.id) } } });
        await db.demandeContact.deleteMany({ where: { id: { in: demandes.map((d) => d.id) } } });
      }
    });

    it('rend une barre par jour, jours creux compris, dont la somme est le total', async () => {
      const tableau = await lireTableau();
      const serie = tableau.visites.vues_par_jour;

      // 30 jours glissants couvrent 31 dates civiles : la première est entamée.
      expect(serie.length).toBeGreaterThanOrEqual(30);
      expect(serie.length).toBeLessThanOrEqual(31);
      expect(new Set(serie.map((point) => point.jour)).size).toBe(serie.length);
      expect(serie.reduce((total, point) => total + point.vues, 0)).toBe(
        tableau.visites.vues_fiches.courant,
      );
    });

    it('classe les établissements par vues décroissantes, sur la fenêtre', async () => {
      const tableau = await lireTableau();
      const vues = tableau.top_etablissements.map((ligne) => ligne.vues);

      expect(vues.length).toBeLessThanOrEqual(5);
      expect([...vues].sort((a, b) => b - a)).toEqual(vues);
      for (const ligne of tableau.top_etablissements) {
        expect(ligne.vues).toBeGreaterThan(0);
        expect(ligne.vues).toBeLessThanOrEqual(tableau.visites.vues_fiches.courant);
      }
    });
  });

  it('montre l’activité récente du journal, la plus récente d’abord', async () => {
    const tableau = await lireTableau();
    const dates = (tableau.activite as { cree_le: string }[]).map((entree) =>
      new Date(entree.cree_le).getTime(),
    );

    expect(dates.length).toBeLessThanOrEqual(6);
    expect([...dates].sort((a, b) => b - a)).toEqual(dates);
  });
});
