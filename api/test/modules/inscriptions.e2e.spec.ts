import { HttpStatus, type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { ERROR_CODES, ValidationException } from '@/common/errors';
import { DatabaseModule } from '@/database/database.module';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { verifierBaseRedisDeTest } from '../helpers/env';

const DEMANDE_VALIDE = {
  etablissement_nom: 'Groupe Scolaire de Test',
  ville: 'Casablanca',
  type_vise: 'primaire',
  contact_nom: 'Directeur de Test',
  contact_fonction: 'Directeur',
  telephone: '06 61 07 27 77',
  email: 'direction@test.ma',
  formule_visee: 'Abonnement mensuel',
  message: 'Nous souhaitons référencer notre école.',
  consentement: true,
};

/**
 * Formulaire public d'inscription — maquette `isInscription`, RG09 et RG17.
 *
 * C'EST LA SEULE ROUTE D'ÉCRITURE OUVERTE À TOUT INTERNET avec celles des
 * parents. Ce qui est éprouvé ici n'est donc pas « est-ce que ça enregistre »
 * mais « qu'est-ce que ça refuse » : un consentement absent, un numéro
 * inventé, et surtout une charge utile qui tenterait de s'attribuer le
 * prospect ou de le déclarer transformé.
 */
describe('Inscription d’un établissement (intégration)', () => {
  let app: INestApplication;
  let db: PrismaService;
  let redis: RedisService;

  beforeAll(async () => {
    verifierBaseRedisDeTest(process.env.REDIS_URL ?? '');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    // Le MÊME tuyau que `main.ts`, à la lettre : un test qui validerait plus
    // souplement que la production prouverait une sécurité qui n'existe pas.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        exceptionFactory: (erreurs) => ValidationException.fromValidationErrors(erreurs),
      }),
    );

    db = moduleRef.get(PrismaService);
    redis = moduleRef.get(RedisService);

    await app.init();
  });

  // Le plafond est de trois par heure, et le garde s'exécute AVANT la
  // validation : un 422 consomme le quota comme un 201. Sans ce nettoyage, le
  // quatrième test de cette suite recevrait 429 quoi qu'il envoie.
  beforeEach(async () => {
    await redis.instance.flushdb();
  });

  afterAll(async () => {
    await app.close();
  });

  const deposer = () => request(app.getHttpServer()).post('/api/v1/inscriptions');

  // ---------------------------------------------------------------------------
  //  Le chemin nominal
  // ---------------------------------------------------------------------------

  it('crée un prospect « nouveau », sans commercial et sans fiche', async () => {
    const avant = await db.prospect.count();

    const reponse = await deposer().send(DEMANDE_VALIDE).expect(201);

    expect(await db.prospect.count()).toBe(avant + 1);

    const prospect = await db.prospect.findFirstOrThrow({ orderBy: { id: 'desc' } });

    expect(prospect.etablissement_nom).toBe(DEMANDE_VALIDE.etablissement_nom);
    expect(prospect.statut_pipeline).toBe('nouveau');
    expect(prospect.source).toBe('formulaire');
    expect(prospect.consentement).toBe(true);

    // SANS COMMERCIAL : l'attribution est un acte d'administration (RG17).
    // L'attribuer ici ferait naître une commission du hasard (RG18).
    expect(prospect.commercial_id).toBeNull();

    // SANS FICHE : une demande n'est pas un établissement. En créer une ferait
    // apparaître le nom de toute école qu'un plaisantin aurait saisie.
    expect(prospect.etablissement_id).toBeNull();

    // La réponse ne rend pas l'identifiant : il n'ouvre aucun écran côté
    // visiteur, et le publier donnerait le compte des demandes reçues.
    expect(reponse.body.data).not.toHaveProperty('id');
    expect(reponse.body.data.message).toContain('48 heures');

    await db.journalAudit.deleteMany({ where: { cible_id: prospect.id, cible_type: 'prospect' } });
    await db.prospect.delete({ where: { id: prospect.id } });
  });

  /**
   * C'ÉTAIT LE SEUL ÉVÉNEMENT COMMERCIAL QUE RIEN NE SIGNALAIT (B-46). Une
   * école demandait à être référencée et l'information attendait qu'un humain
   * pense à ouvrir le CRM. Pour un annuaire dont le modèle est que les
   * établissements paient, c'est l'alerte qui rapporte le plus.
   */
  it('prévient l’administration, et elle seule (RG17)', async () => {
    const superadmins = await db.user.findMany({
      where: { statut: 'actif', role: { code: 'superadmin' } },
      select: { id: true },
    });
    const avant = await db.notification.count({ where: { type: 'inscription' } });

    await deposer().send(DEMANDE_VALIDE).expect(201);

    const prospect = await db.prospect.findFirstOrThrow({ orderBy: { id: 'desc' } });
    const notifications = await db.notification.findMany({
      where: { type: 'inscription' },
      orderBy: { id: 'desc' },
      take: superadmins.length,
      select: { user_id: true, contenu: true, canal: true },
    });

    expect(await db.notification.count({ where: { type: 'inscription' } })).toBe(
      avant + superadmins.length,
    );

    // Chaque administrateur, et personne d'autre : un prospect naît sans
    // commercial, et leur écran ne montre que leur portefeuille.
    expect(new Set(notifications.map((n) => n.user_id.toString()))).toEqual(
      new Set(superadmins.map((compte) => compte.id.toString())),
    );

    // NI LE NOM DU CONTACT, NI SON TÉLÉPHONE : ce texte part aussi par e-mail
    // et dort ensuite dans une boîte, hors de toute purge. L'alerte dit où
    // regarder ; les coordonnées restent dans le CRM.
    for (const notification of notifications) {
      expect(notification.contenu).toContain(DEMANDE_VALIDE.etablissement_nom);
      expect(notification.contenu).not.toContain(DEMANDE_VALIDE.contact_nom);
      expect(notification.contenu).not.toContain(DEMANDE_VALIDE.telephone);
    }

    await db.notification.deleteMany({ where: { type: 'inscription' } });
    await db.journalAudit.deleteMany({ where: { cible_id: prospect.id, cible_type: 'prospect' } });
    await db.prospect.delete({ where: { id: prospect.id } });
  });

  it('accepte une demande réduite au strict nécessaire', async () => {
    await deposer()
      .send({
        etablissement_nom: 'École Minimale',
        contact_nom: 'Contact Minimal',
        telephone: '0661072777',
        consentement: true,
      })
      .expect(201);

    const prospect = await db.prospect.findFirstOrThrow({ orderBy: { id: 'desc' } });

    expect(prospect.ville).toBeNull();
    expect(prospect.formule_visee).toBeNull();

    await db.journalAudit.deleteMany({ where: { cible_id: prospect.id, cible_type: 'prospect' } });
    await db.prospect.delete({ where: { id: prospect.id } });
  });

  it('journalise le dépôt sous l’acteur « systeme »', async () => {
    await deposer().send(DEMANDE_VALIDE).expect(201);

    const prospect = await db.prospect.findFirstOrThrow({ orderBy: { id: 'desc' } });
    const trace = await db.journalAudit.findFirstOrThrow({
      where: { action: 'inscription.deposee', cible_id: prospect.id },
    });

    expect(trace.user_id).toBeNull();
    expect(trace.role_acteur).toBe('systeme');
    // L'adresse IP n'est PAS conservée : minimisation 09-08, et la limitation
    // de débit suffit à freiner les envois automatisés.
    expect(trace.adresse_ip).toBeNull();

    await db.journalAudit.deleteMany({ where: { cible_id: prospect.id, cible_type: 'prospect' } });
    await db.prospect.delete({ where: { id: prospect.id } });
  });

  // ---------------------------------------------------------------------------
  //  Ce que la route refuse
  // ---------------------------------------------------------------------------

  it('refuse une demande sans consentement (RG09)', async () => {
    const avant = await db.prospect.count();

    const reponse = await deposer()
      .send({ ...DEMANDE_VALIDE, consentement: false })
      .expect(422);

    expect(reponse.body.code).toBe(ERROR_CODES.VALIDATION_ECHOUEE);
    // RIEN N'EST ÉCRIT. Sans consentement, la collecte est illégale : la
    // refuser tout en gardant la ligne serait le pire des deux mondes.
    expect(await db.prospect.count()).toBe(avant);
  });

  it('refuse une demande dont le consentement est absent', async () => {
    const sansConsentement = { ...DEMANDE_VALIDE } as Record<string, unknown>;
    delete sansConsentement.consentement;

    await deposer().send(sansConsentement).expect(422);
  });

  it('refuse un numéro qui n’est pas marocain', async () => {
    await deposer()
      .send({ ...DEMANDE_VALIDE, telephone: '+33 6 12 34 56 78' })
      .expect(422);
  });

  it('refuse une formule qui n’existe pas', async () => {
    await deposer()
      .send({ ...DEMANDE_VALIDE, formule_visee: 'Abonnement platine' })
      .expect(422);
  });

  it('refuse un type d’établissement hors des sept (RG02)', async () => {
    await deposer()
      .send({ ...DEMANDE_VALIDE, type_vise: 'conservatoire' })
      .expect(422);
  });

  // ---------------------------------------------------------------------------
  //  RG27 — les attributs de plateforme ne se posent pas depuis internet
  // ---------------------------------------------------------------------------

  /**
   * LE PIÈGE QUE CETTE ROUTE OUVRIRAIT SI ELLE ÉTAIT PERMISSIVE. Un champ
   * accepté en trop, et n'importe qui s'attribue un dossier, le déclare
   * transformé, ou le rattache à la fiche d'une école qui n'est pas la sienne.
   * C'est `forbidNonWhitelisted` qui l'empêche, pas une vérification écrite à
   * la main — et c'est précisément pour cela qu'il faut l'éprouver.
   */
  it.each(['commercial_id', 'statut_pipeline', 'etablissement_id', 'source'])(
    'refuse une charge utile portant « %s »',
    async (champ) => {
      const avant = await db.prospect.count();

      await deposer()
        .send({ ...DEMANDE_VALIDE, [champ]: champ === 'statut_pipeline' ? 'transforme' : '1' })
        .expect(422);

      expect(await db.prospect.count()).toBe(avant);
    },
  );

  // ---------------------------------------------------------------------------
  //  Anti-spam
  // ---------------------------------------------------------------------------

  it('bloque au-delà de trois demandes par heure', async () => {
    for (let rang = 1; rang <= 3; rang += 1) {
      await deposer()
        .send({ ...DEMANDE_VALIDE, etablissement_nom: `École Spam ${rang}` })
        .expect(201);
    }

    const bloque = await deposer()
      .send({ ...DEMANDE_VALIDE, etablissement_nom: 'École Spam 4' })
      .expect(429);

    expect(bloque.body.code).toBe(ERROR_CODES.TROP_DE_REQUETES);

    const spams = await db.prospect.findMany({
      where: { etablissement_nom: { startsWith: 'École Spam ' } },
      select: { id: true },
    });

    await db.journalAudit.deleteMany({
      where: { cible_type: 'prospect', cible_id: { in: spams.map((s) => s.id) } },
    });
    await db.prospect.deleteMany({ where: { id: { in: spams.map((s) => s.id) } } });
  });
});
