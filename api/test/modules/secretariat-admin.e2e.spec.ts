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
/** Secrétaire qui porte `fiches` et `contacts`, jamais `avis`. */
const YASSINE = 'yassine.b@ecoles360.com';

/**
 * Secrétariat — comptes et portées déléguées (RG05, RG25).
 *
 * CE QUI COMPTE ICI, C'EST QUE L'ÉCRAN ET LA GARDE DISENT LA MÊME CHOSE.
 * Accorder une portée doit réellement ouvrir la route correspondante, et la
 * révoquer doit la refermer — sinon l'administrateur croit déléguer un accès
 * qui reste fermé, ou pire, en fermer un qui reste ouvert.
 */
describe('Secrétariat — portées déléguées (intégration)', () => {
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
    // L'état d'origine de Yassine : `fiches` et `contacts`, actif.
    const yassine = await db.user.findUniqueOrThrow({ where: { email: YASSINE } });
    await db.user.update({ where: { id: yassine.id }, data: { statut: 'actif' } });
    await db.permission.updateMany({
      where: { user_id: yassine.id, portee: { in: ['fiches', 'contacts'] } },
      data: { revoquee_le: null },
    });
    await db.permission.updateMany({
      where: { user_id: yassine.id, portee: 'avis' },
      data: { revoquee_le: new Date() },
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
      get: (url: string) => agent.get(`/api/v1${url}`),
      patch: (url: string) => agent.patch(`/api/v1${url}`).set('x-csrf-token', csrf),
      // Le jeton CSRF vaut pour toute écriture, `POST` compris : la création
      // de compte passe par là.
      post: (url: string) => agent.post(`/api/v1${url}`).set('x-csrf-token', csrf),
    };
  }

  const idDe = async (email: string) =>
    (await db.user.findUniqueOrThrow({ where: { email }, select: { id: true } })).id;

  // ---------------------------------------------------------------------------
  //  Frontières
  // ---------------------------------------------------------------------------

  it('refuse l’anonyme, l’établissement et le secrétariat lui-même', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/secretariat').expect(401);

    const ecole = await connecte('contact@almassira.ma');
    await ecole.get('/admin/secretariat').expect(403);

    const secretaire = await connecte(YASSINE);
    await secretaire.get('/admin/secretariat').expect(403);
  });

  /**
   * La garde de rôle protège l'ACCÈS à l'écran, pas la CIBLE de l'action.
   * Sans contrôle sur la cible, l'identifiant d'un administrateur passerait
   * par ces routes — on suspendrait la direction depuis « Secrétariat ».
   */
  it('refuse d’agir sur un compte qui n’est pas du secrétariat', async () => {
    const admin = await connecte(ADMIN);
    const directionId = await idDe(ADMIN);

    const reponse = await admin
      .patch(`/admin/secretariat/${directionId}/statut`)
      .send({ suspendu: true })
      .expect(404);

    expect(reponse.body.code).toBe(ERROR_CODES.RESSOURCE_INTROUVABLE);

    const intacte = await db.user.findUniqueOrThrow({ where: { id: directionId } });
    expect(intacte.statut).toBe('actif');
  });

  // ---------------------------------------------------------------------------
  //  Portées — RG05
  // ---------------------------------------------------------------------------

  it('rend les comptes avec leur rattachement et leurs portées en cours', async () => {
    const admin = await connecte(ADMIN);
    const reponse = await admin.get('/admin/secretariat').expect(200);

    const yassine = reponse.body.data.find((c: { email: string }) => c.email === YASSINE);

    expect(yassine.portees).toEqual(expect.arrayContaining(['fiches', 'contacts']));
    expect(yassine.portees).not.toContain('avis');
    expect(yassine.etablissementRattache).not.toBeNull();
  });

  /**
   * L'ÉCRAN ET LA GARDE DOIVENT S'ACCORDER. Accorder `avis` doit réellement
   * ouvrir `/mon-espace/avis`, que Yassine reçoit en 403 aujourd'hui.
   */
  it('une portée accordée ouvre la route, révoquée la referme', async () => {
    const admin = await connecte(ADMIN);
    const yassineId = await idDe(YASSINE);

    const avant = await connecte(YASSINE);
    await avant.get('/mon-espace/avis').expect(403);

    await admin
      .patch(`/admin/secretariat/${yassineId}/portee`)
      .send({ portee: 'avis', accordee: true })
      .expect(200);

    const pendant = await connecte(YASSINE);
    await pendant.get('/mon-espace/avis').expect(200);

    await admin
      .patch(`/admin/secretariat/${yassineId}/portee`)
      .send({ portee: 'avis', accordee: false })
      .expect(200);

    const apres = await connecte(YASSINE);
    await apres.get('/mon-espace/avis').expect(403);
  });

  /**
   * `revoquee_le` est renseigné, la ligne demeure : qui a accordé quoi, quand,
   * et quand on le lui a repris. Un `DELETE` rendrait la question sans
   * réponse — et elle ne se pose jamais qu'après coup.
   */
  it('révoque une portée sans effacer sa trace', async () => {
    const admin = await connecte(ADMIN);
    const yassineId = await idDe(YASSINE);

    await admin
      .patch(`/admin/secretariat/${yassineId}/portee`)
      .send({ portee: 'contacts', accordee: false })
      .expect(200);

    const ligne = await db.permission.findFirstOrThrow({
      where: { user_id: yassineId, portee: 'contacts' },
    });

    expect(ligne.revoquee_le).not.toBeNull();
    expect(ligne.accordee_par).toBeDefined();

    // Ré-accorder réutilise la ligne : la contrainte d'unicité est sur le
    // couple (user, portée), révocation comprise.
    await admin
      .patch(`/admin/secretariat/${yassineId}/portee`)
      .send({ portee: 'contacts', accordee: true })
      .expect(200);

    const lignes = await db.permission.findMany({
      where: { user_id: yassineId, portee: 'contacts' },
    });

    expect(lignes).toHaveLength(1);
    expect(lignes[0]!.revoquee_le).toBeNull();
  });

  it('refuse une portée qui n’existe pas', async () => {
    const admin = await connecte(ADMIN);
    const yassineId = await idDe(YASSINE);

    await admin
      .patch(`/admin/secretariat/${yassineId}/portee`)
      .send({ portee: 'facturation', accordee: true })
      .expect(422);
  });

  // ---------------------------------------------------------------------------
  //  Suspension — RG25
  // ---------------------------------------------------------------------------

  /**
   * LA SUSPENSION COUPE L'ACCÈS SUR LE CHAMP, pas à l'expiration de la
   * session. C'est la raison d'être des sessions en Redis : sans la
   * révocation, un compte suspendu garderait douze heures d'accès aux fiches,
   * aux contacts et aux avis de son établissement.
   */
  it('suspendre détruit la session en cours (RG25)', async () => {
    const admin = await connecte(ADMIN);
    const yassineId = await idDe(YASSINE);

    const secretaire = await connecte(YASSINE);
    await secretaire.get('/mon-espace/dashboard').expect(200);

    await admin
      .patch(`/admin/secretariat/${yassineId}/statut`)
      .send({ suspendu: true })
      .expect(200);

    // Le MÊME agent, avec le MÊME cookie : la session n'existe plus.
    await secretaire.get('/mon-espace/dashboard').expect(401);

    await admin
      .patch(`/admin/secretariat/${yassineId}/statut`)
      .send({ suspendu: false })
      .expect(200);

    const reactive = await connecte(YASSINE);
    await reactive.get('/mon-espace/dashboard').expect(200);
  });

  it('journalise l’accord, la révocation et la suspension (RG15)', async () => {
    const admin = await connecte(ADMIN);
    const yassineId = await idDe(YASSINE);

    const avant = await db.journalAudit.count({
      where: { cible_type: 'user', cible_id: yassineId },
    });

    await admin
      .patch(`/admin/secretariat/${yassineId}/portee`)
      .send({ portee: 'avis', accordee: true })
      .expect(200);
    await admin
      .patch(`/admin/secretariat/${yassineId}/portee`)
      .send({ portee: 'avis', accordee: false })
      .expect(200);

    const apres = await db.journalAudit.count({
      where: { cible_type: 'user', cible_id: yassineId },
    });

    expect(apres).toBe(avant + 2);

    const derniere = await db.journalAudit.findFirstOrThrow({
      where: { cible_type: 'user', cible_id: yassineId },
      orderBy: { id: 'desc' },
    });

    expect(derniere.action).toBe('secretariat.portee.revoquee');
    expect(derniere.role_acteur).toBe('superadmin');
  });

  // ---------------------------------------------------------------------------
  //  Création de compte — RG25
  // ---------------------------------------------------------------------------

  /**
   * CE QUI SE JOUE ICI, c'est un compte qui ouvre un accès au back-office. Les
   * tests portent donc sur ce que la route REFUSE et sur ce qu'elle ne laisse
   * pas filtrer, davantage que sur le fait qu'elle crée.
   */
  describe('création de compte', () => {
    const jetable = () => `compte.test.${Date.now()}${Math.random().toString(36).slice(2, 6)}@ecoles360.com`;

    async function supprimer(email: string) {
      const compte = await db.user.findUnique({ where: { email }, select: { id: true } });

      if (compte) {
        await db.journalAudit.deleteMany({ where: { cible_type: 'user', cible_id: compte.id } });
        await db.user.delete({ where: { id: compte.id } });
      }
    }

    it('crée un secrétariat SANS AUCUNE PORTÉE, et rend le mot de passe une fois', async () => {
      const admin = await connecte(ADMIN);
      const email = jetable();

      const reponse = await admin
        .post('/admin/comptes')
        .send({ email, nom: 'Secrétaire de test', role: 'secretariat' })
        .expect(201);

      const motDePasse = reponse.body.data.mot_de_passe as string;
      expect(typeof motDePasse).toBe('string');
      expect(motDePasse.length).toBeGreaterThanOrEqual(20);

      const compte = await db.user.findUniqueOrThrow({
        where: { email },
        select: { id: true, statut: true, passwordHash: true, permissions: true },
      });

      expect(compte.statut).toBe('actif');

      // AUCUNE PORTÉE À LA NAISSANCE (RG05) : lui en accorder d'office
      // déciderait à la place de l'administrateur ce qu'il délègue.
      expect(compte.permissions).toHaveLength(0);

      // Le mot de passe N'EST PAS stocké en clair.
      expect(compte.passwordHash).not.toContain(motDePasse);
      expect(compte.passwordHash.startsWith('$argon2')).toBe(true);

      // …ET N'EST PAS JOURNALISÉ. Le journal garde qui a créé quel compte, pas
      // le secret — c'est la seule trace qui survivrait à sa transmission.
      const trace = await db.journalAudit.findFirstOrThrow({
        where: { action: 'compte.cree', cible_id: compte.id },
      });

      expect(JSON.stringify(trace.details)).not.toContain(motDePasse);

      // Le compte créé ouvre réellement l'accès : sans quoi l'écran aurait
      // affiché un mot de passe qui ne sert à rien.
      const nouveau = request.agent(app.getHttpServer());
      await nouveau
        .post('/api/v1/auth/login')
        .send({ email, mot_de_passe: motDePasse })
        .expect(200);

      await supprimer(email);
    });

    it('refuse une adresse déjà prise', async () => {
      const admin = await connecte(ADMIN);

      await admin
        .post('/admin/comptes')
        .send({ email: YASSINE, nom: 'Doublon', role: 'secretariat' })
        .expect(409);
    });

    /**
     * `superadmin` NE SE CRÉE PAS PAR CETTE PORTE. Le compte de recours doit
     * se poser depuis le serveur, pas depuis un écran joignable par internet.
     */
    it.each(['superadmin', 'etablissement'])('refuse le rôle « %s »', async (role) => {
      const admin = await connecte(ADMIN);

      await admin
        .post('/admin/comptes')
        .send({ email: jetable(), nom: 'Rôle interdit', role })
        .expect(422);
    });

    it('refuse de rattacher un commercial à un établissement', async () => {
      const admin = await connecte(ADMIN);
      const fiche = await db.etablissement.findFirstOrThrow({ select: { id: true } });

      await admin
        .post('/admin/comptes')
        .send({
          email: jetable(),
          nom: 'Commercial rattaché',
          role: 'commercial',
          etablissement_id: fiche.id.toString(),
        })
        .expect(422);
    });

    it('refuse un téléphone qui n’est pas marocain', async () => {
      const admin = await connecte(ADMIN);

      await admin
        .post('/admin/comptes')
        .send({
          email: jetable(),
          nom: 'Mauvais numéro',
          role: 'commercial',
          telephone: '+33 6 12 34 56 78',
        })
        .expect(422);
    });

    it('n’est pas ouvert à un compte non administrateur (RG25)', async () => {
      const secretaire = await connecte(YASSINE);

      await secretaire
        .post('/admin/comptes')
        .send({ email: jetable(), nom: 'Escalade', role: 'secretariat' })
        .expect(403);
    });
  });

  // ---------------------------------------------------------------------------
  //  Réinitialisation de mot de passe — RG25
  // ---------------------------------------------------------------------------

  describe('réinitialisation du mot de passe', () => {
    /**
     * LA SESSION EN COURS TOMBE. Réinitialiser parce qu'un mot de passe a
     * fuité, puis laisser vivre la session ouverte avec lui, ne protégerait de
     * rien — c'est la même exigence que la suspension.
     */
    it('change le mot de passe et détruit les sessions en cours', async () => {
      const admin = await connecte(ADMIN);
      const email = `reinit.${Date.now()}@ecoles360.com`;

      const creation = await admin
        .post('/admin/comptes')
        .send({ email, nom: 'À réinitialiser', role: 'commercial' })
        .expect(201);

      const compte = await db.user.findUniqueOrThrow({ where: { email }, select: { id: true } });

      const session = request.agent(app.getHttpServer());
      await session
        .post('/api/v1/auth/login')
        .send({ email, mot_de_passe: creation.body.data.mot_de_passe })
        .expect(200);
      await session.get('/api/v1/auth/me').expect(200);

      const reinit = await admin.post(`/admin/comptes/${compte.id}/mot-de-passe`).expect(201);

      const nouveau = reinit.body.data.mot_de_passe as string;
      expect(nouveau).not.toBe(creation.body.data.mot_de_passe);

      // La session ouverte est morte, et l'ancien mot de passe ne vaut plus.
      await session.get('/api/v1/auth/me').expect(401);
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, mot_de_passe: creation.body.data.mot_de_passe })
        .expect(401);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, mot_de_passe: nouveau })
        .expect(200);

      await db.journalAudit.deleteMany({ where: { cible_type: 'user', cible_id: compte.id } });
      await db.user.delete({ where: { id: compte.id } });
    });

    /**
     * PAS SUR UN ADMINISTRATEUR. Un administrateur qui pourrait réinitialiser
     * le mot de passe d'un autre prendrait son compte.
     */
    it('refuse de réinitialiser un compte administrateur', async () => {
      const admin = await connecte(ADMIN);
      const direction = await db.user.findUniqueOrThrow({
        where: { email: ADMIN },
        select: { id: true },
      });

      await admin.post(`/admin/comptes/${direction.id}/mot-de-passe`).expect(403);
    });

    it('répond 404 sur un compte inconnu', async () => {
      const admin = await connecte(ADMIN);

      await admin.post('/admin/comptes/9999999/mot-de-passe').expect(404);
    });
  });
});
