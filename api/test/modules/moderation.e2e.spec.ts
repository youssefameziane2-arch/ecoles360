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

const SLUG = 'lycee-al-massira-casablanca';

/**
 * Modération des avis — livrable 11 §3.3, RG06 à RG08.
 *
 * SUITE À PART DE « site public — avis et contacts » : celle-là éprouve le
 * dépôt anonyme et ne monte ni session ni passport. La modération est une
 * action du back-office, avec cookie, jeton CSRF et rôle — elle a besoin de
 * l'application complète.
 *
 * CE QUI EST ÉPROUVÉ ICI : qu'aucun avis ne paraisse sans décision humaine,
 * qu'un rejet s'explique, et que la note affichée corresponde toujours aux
 * avis publiés. Un annuaire payé par les établissements se juge là-dessus.
 */
describe('Modération des avis (intégration)', () => {
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

  // Les plafonds de dépôt sont serrés (5 par heure) : sans ce vidage, les
  // premiers tests consommeraient le quota de tous les suivants.
  beforeEach(async () => {
    await redis.instance.flushdb();
  });

  afterAll(async () => {
    await app.close();
  });

  const poster = (chemin: string) => request(app.getHttpServer()).post(`/api/v1${chemin}`);
  const avisValide = {
    auteur_nom: 'Test Modération',
    auteur_contact: 'moderation@example.ma',
    note: 4,
    commentaire: 'Un commentaire de test suffisamment circonstancié pour passer la validation.',
  };

  describe('modération des avis', () => {
    /** Ouvre une session admin et rend un agent porteur du jeton CSRF. */
    async function admin() {
      const agent = request.agent(app.getHttpServer());
      const reponse = await agent
        .post('/api/v1/auth/login')
        .send({ email: 'direction@ecoles360.com', mot_de_passe: 'motdepasse-de-demonstration' })
        .expect(200);

      const csrf = reponse.body.data.csrf as string;

      return {
        get: (url: string) => agent.get(`/api/v1${url}`),
        patch: (url: string) => agent.patch(`/api/v1${url}`).set('x-csrf-token', csrf),
      };
    }

    /** Dépose un avis par la voie publique et rend son identifiant. */
    async function deposer(note = 5) {
      const reponse = await poster(`/etablissements/${SLUG}/avis`)
        .send({ ...avisValide, note })
        .expect(201);

      return reponse.body.data.id as string;
    }

    it('REFUSE UN REJET SANS MOTIF (RG06)', async () => {
      const direction = await admin();
      const id = await deposer();

      const reponse = await direction
        .patch(`/admin/avis/${id}`)
        .send({ decision: 'rejete' })
        .expect(422);

      expect(reponse.body.code).toBe(ERROR_CODES.VALIDATION_ECHOUEE);

      // L'avis n'a pas bougé : une décision invalide ne décide rien.
      const inchange = await db.avis.findUniqueOrThrow({
        where: { id: BigInt(id) },
        select: { statut: true },
      });
      expect(inchange.statut).toBe('en_attente');
    });

    it('publie l’avis ET recalcule la note dans la même transaction (RG08)', async () => {
      const direction = await admin();

      const fiche = await db.etablissement.findFirstOrThrow({
        where: { slug: SLUG },
        select: { id: true, nb_avis: true },
      });

      const id = await deposer(5);

      // Un avis en attente ne compte pas : le compteur n'a pas bougé au dépôt.
      const pendant = await db.etablissement.findUniqueOrThrow({
        where: { id: fiche.id },
        select: { nb_avis: true },
      });
      expect(pendant.nb_avis).toBe(fiche.nb_avis);

      await direction.patch(`/admin/avis/${id}`).send({ decision: 'publie' }).expect(200);

      const apres = await db.etablissement.findUniqueOrThrow({
        where: { id: fiche.id },
        select: { nb_avis: true, note_moy: true },
      });

      // L'INVARIANT DE RG08 : après décision, le compteur et la moyenne affichés
      // correspondent EXACTEMENT aux avis publiés. On les recompte plutôt que de
      // vérifier « +1 » — la base est partagée entre les suites, et une valeur
      // absolue héritée d'une suite voisine ferait échouer un code correct.
      const reel = await db.avis.aggregate({
        where: { etablissement_id: fiche.id, statut: 'publie' },
        _avg: { note: true },
        _count: { _all: true },
      });

      expect(apres.nb_avis).toBe(reel._count._all);
      expect(Number(apres.note_moy)).toBeCloseTo(Math.round((reel._avg.note ?? 0) * 10) / 10, 1);

      // Ménage : on retire l'avis et on laisse le compteur cohérent.
      await db.avis.delete({ where: { id: BigInt(id) } });
      const restants = await db.avis.aggregate({
        where: { etablissement_id: fiche.id, statut: 'publie' },
        _avg: { note: true },
        _count: { _all: true },
      });
      await db.etablissement.update({
        where: { id: fiche.id },
        data: {
          nb_avis: restants._count._all,
          note_moy: restants._avg.note ? Math.round(restants._avg.note * 10) / 10 : 0,
        },
      });
    });

    it('clôt les signalements de l’avis décidé (RG07)', async () => {
      const direction = await admin();
      const id = await deposer();

      // On ne signale que ce qu'on a vu : la route publique refuse un avis non
      // publié. Il faut donc le publier avant de le dénoncer.
      await direction.patch(`/admin/avis/${id}`).send({ decision: 'publie' }).expect(200);

      await poster(`/avis/${id}/signalements`)
        .send({ motif: 'Propos déplacés visant nommément un enseignant.' })
        .expect(204);

      const ouverts = await db.signalement.count({
        where: { avis_id: BigInt(id), statut: 'nouveau' },
      });
      expect(ouverts).toBe(1);

      await direction
        .patch(`/admin/avis/${id}`)
        .send({ decision: 'rejete', motif: 'Propos injurieux visant un enseignant.' })
        .expect(200);

      // Sans cette clôture, l'avis reparaîtrait dans la file « signalés » à
      // chaque rechargement, alors qu'il vient d'être tranché.
      const restants = await db.signalement.count({
        where: { avis_id: BigInt(id), statut: 'nouveau' },
      });
      expect(restants).toBe(0);

      await db.signalement.deleteMany({ where: { avis_id: BigInt(id) } });
      await db.avis.delete({ where: { id: BigInt(id) } });
    });

    it('refuse de mettre en avant un avis non publié (RG27)', async () => {
      const direction = await admin();
      const id = await deposer();

      const reponse = await direction
        .patch(`/admin/avis/${id}/en-avant`)
        .send({ en_avant: true })
        .expect(409);

      expect(reponse.body.code).toBe(ERROR_CODES.CONFLIT_METIER);

      await db.avis.delete({ where: { id: BigInt(id) } });
    });

    it('n’expose la file de modération qu’à l’administration (RG25)', async () => {
      await request(app.getHttpServer()).get('/api/v1/admin/avis').expect(401);

      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/api/v1/auth/login')
        .send({ email: 'contact@almassira.ma', mot_de_passe: 'motdepasse-de-demonstration' })
        .expect(200);

      await agent.get('/api/v1/admin/avis').expect(403);
    });

    it('expose le contact de l’auteur au modérateur — et à lui seul', async () => {
      const direction = await admin();

      const file = await direction.get('/admin/avis').expect(200);
      const premier = file.body.data[0] as { auteur_contact?: string };

      // Le modérateur en a besoin pour vérifier un avis douteux ; la route
      // publique, elle, ne doit jamais le rendre (loi 09-08).
      expect(premier.auteur_contact).toBeDefined();

      const publique = await request(app.getHttpServer())
        .get(`/api/v1/etablissements/${SLUG}/avis`)
        .expect(200);

      for (const avis of publique.body.data as Record<string, unknown>[]) {
        expect(avis).not.toHaveProperty('auteur_contact');
      }
    });
  });
});
