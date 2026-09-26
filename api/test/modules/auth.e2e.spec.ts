import { HttpStatus, type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import passport from 'passport';
import request from 'supertest';
import { Algorithm, hash } from '@node-rs/argon2';
import { createHash, randomBytes } from 'node:crypto';
import { AppModule } from '@/app.module';
import { ERROR_CODES, ValidationException } from '@/common/errors';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { DatabaseModule } from '@/database/database.module';
import { ReferentielsSeeder } from '@/database/seeders/referentiels.seeder';
import { DemoSeeder } from '@/database/seeders/demo.seeder';
import { prefixeSession } from '@/modules/auth/session.constants';
import { verifierBaseRedisDeTest } from '../helpers/env';

const MOT_DE_PASSE_DEMO = 'motdepasse-de-demonstration';

/**
 * Authentification — livrable 11 §2 et §3.1.
 *
 * Contre MySQL 8 et Redis 7 réels (livrable 13 §1). Les cas éprouvés ici sont
 * ceux dont l'échec serait une FAILLE, pas un défaut de confort : fermeture par
 * défaut, indiscernabilité des échecs de connexion, révocation immédiate.
 */
describe('Authentification (intégration)', () => {
  let app: INestApplication;
  let db: PrismaService;
  let redisService: RedisService;

  beforeAll(async () => {
    verifierBaseRedisDeTest(process.env.REDIS_URL ?? '');

    // DatabaseModule est importé EN PLUS d'AppModule : les seeders vivent
    // dans le module CLI, pas dans celui qui sert les requêtes HTTP. Le test
    // a besoin des deux — le contrat d'API d'un côté, son jeu d'essai de l'autre.
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
    }).compile();

    app = moduleRef.createNestApplication();
    db = moduleRef.get(PrismaService);

    // Le bootstrap de `main.ts` est rejoué : sans session ni Passport, on
    // testerait une application qui n'est pas celle qui tourne en production.
    const redis = moduleRef.get(RedisService);
    redisService = redis;
    app.use(
      session({
        // MÊME préfixe que la révocation, dérivé de la même source : un
        // préfixe de test différent ferait passer ce test alors que la
        // révocation ne trouverait rien à détruire en production.
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

    // Les comptes de démonstration servent de jeu d'essai (livrable 13 §2.2).
    await moduleRef.get(ReferentielsSeeder).roles();
    await moduleRef.get(ReferentielsSeeder).villes();
    await moduleRef.get(ReferentielsSeeder).niveauxFilieres();
    await moduleRef.get(DemoSeeder).comptes();
  });

  /**
   * Redis est vidée avant CHAQUE test — livrable 13 §2.2.
   *
   * La base 15 porte à la fois les sessions et les compteurs du throttler.
   * Sans ce nettoyage, les cinq connexions/minute du livrable 11 §5 seraient
   * consommées par les premiers tests et tous les suivants recevraient 429 :
   * la protection ferait échouer la suite qui la vérifie.
   */
  beforeEach(async () => {
    await redisService.instance.flushdb();
  });

  afterAll(async () => {
    await app.close();
  });

  const connexion = (email: string, motDePasse = MOT_DE_PASSE_DEMO) =>
    request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, mot_de_passe: motDePasse });

  // ---------------------------------------------------------------------------
  //  Fermé par défaut
  // ---------------------------------------------------------------------------

  describe('fermeture par défaut', () => {
    it('refuse l’anonyme sur une route protégée', async () => {
      const reponse = await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);

      expect(reponse.body.code).toBe(ERROR_CODES.NON_AUTHENTIFIE);
      expect(Object.keys(reponse.body).sort()).toEqual(['code', 'details', 'message']);
    });

    it('laisse passer la sonde de santé, marquée @Public()', async () => {
      // Un HEALTHCHECK Docker ne peut pas ouvrir de session : la sonde doit
      // rester joignable malgré le guard global (livrable 14 §2.2).
      await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    });
  });

  // ---------------------------------------------------------------------------
  //  Anti-énumération de comptes
  // ---------------------------------------------------------------------------

  describe('échecs de connexion indiscernables', () => {
    it('répond exactement la même chose pour un e-mail inconnu et un mot de passe faux', async () => {
      const inconnu = await connexion('personne@nulle-part.ma', 'peu-importe').expect(401);
      const mauvais = await connexion('direction@ecoles360.com', 'mauvais-mot-de-passe').expect(
        401,
      );

      // Toute différence — code, message, détail — ferait du formulaire de
      // connexion un annuaire : il suffirait d'essayer des adresses.
      expect(inconnu.body).toEqual(mauvais.body);
    });

    it('refuse un compte suspendu malgré le bon mot de passe (RG25)', async () => {
      const reponse = await connexion('khalid.a@ecoles360.com').expect(401);

      // Même réponse encore : l'état d'un compte n'est pas déductible de l'extérieur.
      expect(reponse.body.code).toBe(ERROR_CODES.NON_AUTHENTIFIE);
    });
  });

  // ---------------------------------------------------------------------------
  //  Session et identité
  // ---------------------------------------------------------------------------

  describe('session établie', () => {
    it('ouvre une session et retourne rôle, portées et jeton CSRF', async () => {
      const reponse = await connexion('direction@ecoles360.com').expect(200);

      expect(reponse.body.data.utilisateur.role).toBe('superadmin');
      expect(typeof reponse.body.data.csrf).toBe('string');
      const cookies = reponse.headers['set-cookie'] as unknown as string[] | undefined;
      expect((cookies ?? []).join(';')).toContain('ecoles360_csrf');
      // Les identifiants sortent en CHAÎNE, jamais en nombre (livrable 11 §1) :
      // au-delà de 2^53 un entier JavaScript perd en précision, et une valeur
      // tronquée désignerait silencieusement une autre ligne.
      expect(typeof reponse.body.data.utilisateur.userId).toBe('string');
    });

    it('expose les portées déléguées du secrétariat (RG05)', async () => {
      const reponse = await connexion('sara.s@ecoles360.com').expect(200);

      expect(reponse.body.data.utilisateur.role).toBe('secretariat');
      expect(reponse.body.data.utilisateur.permissions.sort()).toEqual([
        'avis',
        'contacts',
        'fiches',
      ]);
    });

    it('rend le profil courant sur /auth/me', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/api/v1/auth/login')
        .send({ email: 'direction@ecoles360.com', mot_de_passe: MOT_DE_PASSE_DEMO })
        .expect(200);

      const moi = await agent.get('/api/v1/auth/me').expect(200);
      expect(moi.body.data.email).toBe('direction@ecoles360.com');
    });

    it('accepte une reconnexion SANS jeton CSRF, session déjà ouverte (livrable 11 §5)', async () => {
      // Le cas réel : le visiteur a gardé son cookie de session mais perdu le
      // cookie CSRF — vidé par le navigateur, expiré, ou simplement absent
      // d'un autre onglet. Sans l'exemption sur `/auth/login`, il reçoit 403 à
      // chaque tentative et n'a aucun moyen de s'en sortir depuis l'interface.
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/v1/auth/login')
        .send({ email: 'sara.s@ecoles360.com', mot_de_passe: MOT_DE_PASSE_DEMO })
        .expect(200);

      // Deuxième connexion, aucun en-tête `x-csrf-token` : elle doit passer.
      const reconnexion = await agent
        .post('/api/v1/auth/login')
        .send({ email: 'direction@ecoles360.com', mot_de_passe: MOT_DE_PASSE_DEMO })
        .expect(200);

      expect(reconnexion.body.data.utilisateur.role).toBe('superadmin');
    });

    it('refuse en revanche une AUTRE mutation sans jeton CSRF', async () => {
      // Le pendant du test précédent : l'exemption vaut pour l'ouverture de
      // session, et pour elle seule.
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/v1/auth/login')
        .send({ email: 'direction@ecoles360.com', mot_de_passe: MOT_DE_PASSE_DEMO })
        .expect(200);

      const refus = await agent.post('/api/v1/auth/logout').expect(403);

      expect(refus.body.code).toBe(ERROR_CODES.ACCES_REFUSE);
    });
  });

  // ---------------------------------------------------------------------------
  //  Révocation — la raison d'être des sessions en Redis (RG25)
  // ---------------------------------------------------------------------------

  describe('révocation des sessions', () => {
    it('détruit TOUTES les sessions actives à la réinitialisation du mot de passe', async () => {
      // Compte DÉDIÉ, créé par le test lui-même : celui-ci change un mot de
      // passe, et réutiliser un compte semé rendrait la suite non rejouable —
      // le seeder ne réécrit pas les mots de passe existants, si bien que le
      // second passage échouerait à se connecter.
      const email = `revocation-${randomBytes(6).toString('hex')}@ecoles360.test`;
      const secretariat = await db.role.findUniqueOrThrow({ where: { code: 'secretariat' } });
      const compte = await db.user.create({
        data: {
          name: 'Compte de révocation',
          email,
          passwordHash: await hash(MOT_DE_PASSE_DEMO, { algorithm: Algorithm.Argon2id }),
          role_id: secretariat.id,
        },
      });

      // Deux sessions, comme depuis deux postes.
      const poste1 = request.agent(app.getHttpServer());
      const poste2 = request.agent(app.getHttpServer());
      const identifiants = { email: compte.email, mot_de_passe: MOT_DE_PASSE_DEMO };

      await poste1.post('/api/v1/auth/login').send(identifiants).expect(200);
      await poste2.post('/api/v1/auth/login').send(identifiants).expect(200);
      await poste1.get('/api/v1/auth/me').expect(200);
      await poste2.get('/api/v1/auth/me').expect(200);

      // Jeton forgé : seul son haché est stocké, le service ne le restitue jamais.
      const jeton = randomBytes(32).toString('hex');
      await db.passwordResetToken.create({
        data: {
          user_id: compte.id,
          token_hash: createHash('sha256').update(jeton).digest('hex'),
          expire_le: new Date(Date.now() + 3_600_000),
        },
      });

      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-mot-de-passe')
        .send({ jeton, nouveau_mot_de_passe: 'NouveauMotDePasse2026' })
        .expect(204);

      // C'est ici que tout se joue : un cookie signé resterait valide jusqu'à
      // son expiration, quoi qu'il arrive côté serveur.
      await poste1.get('/api/v1/auth/me').expect(401);
      await poste2.get('/api/v1/auth/me').expect(401);

      // Jeton à usage unique : un rejeu ne doit rien pouvoir changer.
      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-mot-de-passe')
        .send({ jeton, nouveau_mot_de_passe: 'EncoreUnAutre2026' })
        .expect(422);
    });
  });

  // ---------------------------------------------------------------------------
  //  Mot de passe oublié
  // ---------------------------------------------------------------------------

  describe('mot de passe oublié', () => {
    it('répond identiquement, que l’adresse existe ou non', async () => {
      const connue = await request(app.getHttpServer())
        .post('/api/v1/auth/mot-de-passe-oublie')
        .send({ email: 'direction@ecoles360.com' })
        .expect(202);

      const inconnue = await request(app.getHttpServer())
        .post('/api/v1/auth/mot-de-passe-oublie')
        .send({ email: 'personne@nulle-part.ma' })
        .expect(202);

      expect(connue.body).toEqual(inconnue.body);
    });

    it('ne renvoie jamais le jeton au client', async () => {
      const reponse = await request(app.getHttpServer())
        .post('/api/v1/auth/mot-de-passe-oublie')
        .send({ email: 'direction@ecoles360.com' })
        .expect(202);

      // Le connaître suffirait à changer le mot de passe du compte.
      expect(JSON.stringify(reponse.body)).not.toMatch(/[0-9a-f]{64}/);
    });
  });

  // ---------------------------------------------------------------------------
  //  Validation des charges utiles
  // ---------------------------------------------------------------------------

  describe('validation', () => {
    it('rend un 422 avec le détail champ par champ', async () => {
      const reponse = await connexion('pas-un-email', '').expect(422);

      expect(reponse.body.code).toBe(ERROR_CODES.VALIDATION_ECHOUEE);
      expect(reponse.body.details.champs.map((c: { champ: string }) => c.champ).sort()).toEqual([
        'email',
        'mot_de_passe',
      ]);
    });

    it('rejette un champ non déclaré dans le DTO', async () => {
      // `forbidNonWhitelisted` écarte par construction les champs de plateforme
      // d'une charge utile cliente (RG27) — ici, une tentative d'élévation.
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'a@b.ma', mot_de_passe: 'x', role: 'superadmin' })
        .expect(422);
    });
  });

  // ---------------------------------------------------------------------------
  //  Limitation de débit (livrable 11 §5)
  // ---------------------------------------------------------------------------

  describe('limitation de débit', () => {
    it('refuse la 6e tentative de connexion en une minute', async () => {
      // Cinq essais autorisés : de quoi se tromper deux ou trois fois sans
      // gêne, mais assez peu pour rendre une attaque par force brute vaine —
      // chaque tentative coûte en outre une vérification Argon2 au serveur.
      for (let tentative = 1; tentative <= 5; tentative += 1) {
        await connexion('inconnu@nulle-part.ma', 'mauvais').expect(401);
      }

      const bloquee = await connexion('inconnu@nulle-part.ma', 'mauvais').expect(429);
      expect(bloquee.body.code).toBe(ERROR_CODES.TROP_DE_REQUETES);
    });

    it('laisse la sonde de santé joignable pendant le blocage', async () => {
      for (let tentative = 1; tentative <= 6; tentative += 1) {
        await connexion('inconnu@nulle-part.ma', 'mauvais');
      }

      // Le plafond serré ne vise que les routes sensibles : un HEALTHCHECK
      // bloqué ferait redémarrer un conteneur pourtant en bonne santé.
      await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    });
  });
});
