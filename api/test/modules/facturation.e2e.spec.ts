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

/**
 * Facturation — abonnements payants, factures, encaissement (RG11, RG14, RG18).
 *
 * CE QUI EST ÉPROUVÉ ICI EST LE CŒUR ÉCONOMIQUE DU PRODUIT. Jusqu'à cette
 * passe, une fiche ne pouvait devenir publique que par l'essai gratuit : le
 * chemin payant n'existait pas. Trois choses doivent tenir — le calcul des
 * montants, l'unicité du numéro de facture, et le fait que l'encaissement, et
 * lui seul, lève la condition de la RG14.
 */
describe('Facturation (intégration)', () => {
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
    await referentiels.parametresFacturation();

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
      post: (url: string) => agent.post(`/api/v1${url}`).set('x-csrf-token', csrf),
      patch: (url: string) => agent.patch(`/api/v1${url}`).set('x-csrf-token', csrf),
    };
  }

  /** Fiche neuve, sans abonnement — la base n'est pas remise à zéro. */
  async function ficheNeuve(admin: Awaited<ReturnType<typeof connecte>>) {
    const ville = await db.ville.findFirstOrThrow();
    const reponse = await admin
      .post('/admin/etablissements')
      .send({
        nom: `École Facturation ${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        ville_id: Number(ville.id),
        type: 'primaire',
      })
      .expect(201);

    return reponse.body.data as { id: string; slug: string };
  }

  // ---------------------------------------------------------------------------
  //  Abonnement — RG11
  // ---------------------------------------------------------------------------

  it('applique la remise annuelle, et elle seule (RG11)', async () => {
    const admin = await connecte(ADMIN);

    const annuelle = await ficheNeuve(admin);
    const abonnementAnnuel = await admin
      .post(`/admin/etablissements/${annuelle.id}/abonnement`)
      .send({ formule: 'annuel', tarif_mad: 12000 })
      .expect(201);

    expect(Number(abonnementAnnuel.body.data.remise_pct)).toBe(10);

    // SUR UN MENSUEL, AUCUNE REMISE. L'accepter ferait un rabais que personne
    // n'a négocié, et que rien à l'écran ne signalerait.
    const mensuelle = await ficheNeuve(admin);
    const abonnementMensuel = await admin
      .post(`/admin/etablissements/${mensuelle.id}/abonnement`)
      .send({ formule: 'mensuel', tarif_mad: 1200, remise_pct: 50 })
      .expect(201);

    expect(abonnementMensuel.body.data.remise_pct).toBeNull();
  });

  it('refuse un second abonnement tant que le premier est en cours', async () => {
    const admin = await connecte(ADMIN);
    const fiche = await ficheNeuve(admin);

    await admin
      .post(`/admin/etablissements/${fiche.id}/abonnement`)
      .send({ formule: 'mensuel', tarif_mad: 1200 })
      .expect(201);

    const refus = await admin
      .post(`/admin/etablissements/${fiche.id}/abonnement`)
      .send({ formule: 'mensuel', tarif_mad: 1200 })
      .expect(409);

    expect(refus.body.code).toBe(ERROR_CODES.CONFLIT_METIER);
  });

  it('renvoie l’essai gratuit vers son action dédiée (RG13)', async () => {
    const admin = await connecte(ADMIN);
    const fiche = await ficheNeuve(admin);

    await admin
      .post(`/admin/etablissements/${fiche.id}/abonnement`)
      .send({ formule: 'essai_gratuit', tarif_mad: 1 })
      .expect(422);
  });

  // ---------------------------------------------------------------------------
  //  Facture — numérotation et montants
  // ---------------------------------------------------------------------------

  it('calcule remise, TVA et total, et numérote en séquence', async () => {
    const admin = await connecte(ADMIN);
    const fiche = await ficheNeuve(admin);

    const abonnement = await admin
      .post(`/admin/etablissements/${fiche.id}/abonnement`)
      .send({ formule: 'annuel', tarif_mad: 12000 })
      .expect(201);

    const facture = await admin
      .post(`/admin/abonnements/${abonnement.body.data.id}/facture`)
      .send({})
      .expect(201);

    // 12 000 − 10 % = 10 800 ; TVA 20 % = 2 160 ; TTC = 12 960.
    expect(Number(facture.body.data.montant_ht)).toBe(10800);
    expect(Number(facture.body.data.tva)).toBe(2160);
    expect(Number(facture.body.data.total_ttc)).toBe(12960);
    expect(facture.body.data.numero).toMatch(/^F\d{4}-\d{6}$/);
  });

  /**
   * LE NUMÉRO EST UNE OBLIGATION COMPTABLE : séquence continue, sans doublon.
   * Deux émissions successives doivent donner deux numéros, et le second doit
   * suivre le premier — c'est ce que le verrou garantit.
   */
  it('ne produit jamais deux fois le même numéro', async () => {
    const admin = await connecte(ADMIN);

    const numeros: string[] = [];

    for (let i = 0; i < 3; i += 1) {
      const fiche = await ficheNeuve(admin);
      const abonnement = await admin
        .post(`/admin/etablissements/${fiche.id}/abonnement`)
        .send({ formule: 'mensuel', tarif_mad: 1000 })
        .expect(201);

      const facture = await admin
        .post(`/admin/abonnements/${abonnement.body.data.id}/facture`)
        .send({})
        .expect(201);

      numeros.push(facture.body.data.numero as string);
    }

    expect(new Set(numeros).size).toBe(3);
    expect([...numeros].sort()).toEqual(numeros);
  });

  it('refuse de facturer un essai gratuit (RG13)', async () => {
    const admin = await connecte(ADMIN);
    const fiche = await ficheNeuve(admin);

    await admin.post(`/admin/etablissements/${fiche.id}/essai-gratuit`).expect(204);

    const essai = await db.abonnement.findFirstOrThrow({
      where: { etablissement_id: BigInt(fiche.id) },
    });

    const refus = await admin.post(`/admin/abonnements/${essai.id}/facture`).send({}).expect(409);

    expect(refus.body.message).toContain('essai gratuit');
  });

  // ---------------------------------------------------------------------------
  //  Encaissement — c'est lui qui lève la RG14
  // ---------------------------------------------------------------------------

  /**
   * LE TEST QUI COMPTE. Avant cette passe, seul l'essai gratuit permettait de
   * publier une fiche : le chemin payant n'existait pas. Ce parcours prouve
   * que la vente, et elle seule, ouvre la publication.
   */
  it('l’encaissement, et lui seul, ouvre la publication (RG14)', async () => {
    const admin = await connecte(ADMIN);
    const fiche = await ficheNeuve(admin);

    const abonnement = await admin
      .post(`/admin/etablissements/${fiche.id}/abonnement`)
      .send({ formule: 'mensuel', tarif_mad: 1500 })
      .expect(201);

    const facture = await admin
      .post(`/admin/abonnements/${abonnement.body.data.id}/facture`)
      .send({})
      .expect(201);

    // Abonnement actif mais facture impayée : la fiche reste invisible.
    await admin
      .patch(`/admin/etablissements/${fiche.id}/statut`)
      .send({ statut: 'validee' })
      .expect(409);

    await admin.patch(`/admin/factures/${facture.body.data.id}/encaissement`).expect(204);

    await admin
      .patch(`/admin/etablissements/${fiche.id}/statut`)
      .send({ statut: 'validee' })
      .expect(204);

    await request(app.getHttpServer()).get(`/api/v1/etablissements/${fiche.slug}`).expect(200);
  });

  it('refuse d’encaisser deux fois', async () => {
    const admin = await connecte(ADMIN);
    const fiche = await ficheNeuve(admin);

    const abonnement = await admin
      .post(`/admin/etablissements/${fiche.id}/abonnement`)
      .send({ formule: 'mensuel', tarif_mad: 900 })
      .expect(201);

    const facture = await admin
      .post(`/admin/abonnements/${abonnement.body.data.id}/facture`)
      .send({})
      .expect(201);

    await admin.patch(`/admin/factures/${facture.body.data.id}/encaissement`).expect(204);
    await admin.patch(`/admin/factures/${facture.body.data.id}/encaissement`).expect(409);
  });

  /**
   * « Encaissé ce mois » se compte sur la date de PAIEMENT, pas d'émission :
   * une facture de janvier réglée en mars appartient à mars. Sinon le chiffre
   * ne représenterait pas une recette.
   */
  it('compte l’encaissé du mois, et le journalise (RG15)', async () => {
    const admin = await connecte(ADMIN);
    const fiche = await ficheNeuve(admin);

    const avant = await admin.get('/admin/facturation').expect(200);

    const abonnement = await admin
      .post(`/admin/etablissements/${fiche.id}/abonnement`)
      .send({ formule: 'mensuel', tarif_mad: 1000 })
      .expect(201);

    const facture = await admin
      .post(`/admin/abonnements/${abonnement.body.data.id}/facture`)
      .send({})
      .expect(201);

    await admin.patch(`/admin/factures/${facture.body.data.id}/encaissement`).expect(204);

    const apres = await admin.get('/admin/facturation').expect(200);

    // 1 000 HT + 20 % = 1 200 TTC.
    expect(
      Number(apres.body.data.encaisse_ce_mois) - Number(avant.body.data.encaisse_ce_mois),
    ).toBe(1200);

    const trace = await db.journalAudit.findFirstOrThrow({
      where: { action: 'facture.encaissee', cible_id: BigInt(facture.body.data.id) },
    });

    expect((trace.details as { numero: string }).numero).toBe(facture.body.data.numero);
  });

  // ---------------------------------------------------------------------------
  //  Frontières
  // ---------------------------------------------------------------------------

  it('refuse un compte non administrateur (RG25)', async () => {
    const ecole = await connecte('contact@almassira.ma');

    await ecole.get('/admin/facturation').expect(403);
    await ecole
      .post('/admin/etablissements/1/abonnement')
      .send({ formule: 'mensuel', tarif_mad: 1000 })
      .expect(403);
  });

  it('refuse un tarif absent, nul ou négatif', async () => {
    const admin = await connecte(ADMIN);
    const fiche = await ficheNeuve(admin);

    await admin
      .post(`/admin/etablissements/${fiche.id}/abonnement`)
      .send({ formule: 'mensuel' })
      .expect(422);

    await admin
      .post(`/admin/etablissements/${fiche.id}/abonnement`)
      .send({ formule: 'mensuel', tarif_mad: -500 })
      .expect(422);
  });

  // ---------------------------------------------------------------------------
  //  Commission du commercial apporteur — RG18
  // ---------------------------------------------------------------------------

  /**
   * LE TAUX VIENT DU PARAMÈTRE, JAMAIS DU CODE. Il a valu zéro tant qu'aucun
   * livrable ne le fixait ; le client l'a porté à 8 % le 7 octobre 2026, et il
   * reste modifiable depuis l'écran « Paramètres ».
   *
   * CE TEST NE FIGE PAS LE 8. Il lit le paramètre, puis vérifie que la
   * commission en découle — une valeur en dur ici tomberait le jour où la
   * Direction change le taux, et ferait croire à une régression là où il n'y
   * aurait qu'une décision de gestion.
   */
  it('crée la commission au taux du paramètre, en « à valider » (RG18)', async () => {
    const admin = await connecte(ADMIN);
    const fiche = await ficheNeuve(admin);

    const commercial = await db.user.findFirstOrThrow({
      where: { role: { code: 'commercial' } },
      select: { id: true },
    });

    // SANS PROSPECT APPORTÉ, PAS DE COMMISSION : c'est le prospect transformé
    // qui dit qui a vendu. On le fabrique donc explicitement.
    const prospect = await db.prospect.create({
      data: {
        etablissement_nom: 'Apport commercial',
        contact_nom: 'Contact',
        telephone: '06 00 00 00 00',
        commercial_id: commercial.id,
        etablissement_id: BigInt(fiche.id),
      },
    });

    const taux = Number(
      (
        await db.parametreFacturation.findUniqueOrThrow({ where: { cle: 'commission_pct' } })
      ).valeur,
    );

    expect(taux).toBeGreaterThan(0);

    const abonnement = await admin
      .post(`/admin/etablissements/${fiche.id}/abonnement`)
      .send({ formule: 'mensuel', tarif_mad: 2000 })
      .expect(201);

    const facture = await admin
      .post(`/admin/abonnements/${abonnement.body.data.id}/facture`)
      .send({})
      .expect(201);

    const commission = await db.commission.findFirstOrThrow({
      where: { facture_id: BigInt(facture.body.data.id) },
    });

    expect(Number(commission.taux_pct)).toBe(taux);
    expect(commission.commercial_id).toBe(commercial.id);
    expect(Number(commission.montant_mad)).toBeCloseTo(2000 * (taux / 100), 2);

    // « À VALIDER », PAS « RÉGLÉE » : la commission naît à l'émission de la
    // facture, pas à son encaissement, et la Direction la valide ensuite.
    expect(commission.statut).toBe('a_valider');

    await db.commission.deleteMany({ where: { facture_id: BigInt(facture.body.data.id) } });
    await db.prospect.delete({ where: { id: prospect.id } });
  });
});
