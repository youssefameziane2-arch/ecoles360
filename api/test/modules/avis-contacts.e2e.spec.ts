import { HttpStatus, type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { ERROR_CODES, ValidationException } from '@/common/errors';
import { DatabaseModule } from '@/database/database.module';
import { DemoSeeder } from '@/database/seeders/demo.seeder';
import { ReferentielsSeeder } from '@/database/seeders/referentiels.seeder';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { verifierBaseRedisDeTest } from '../helpers/env';

const SLUG = 'lycee-al-massira-casablanca';
const SLUG_NON_PUBLIEE = 'creche-les-petits-genies-casablanca';

/**
 * Avis, demandes de contact et traçage — livrable 11 §3.1.
 *
 * Ces trois surfaces sont les seules par lesquelles un visiteur ANONYME écrit
 * dans la base. Ce qui est éprouvé ici protège donc à la fois l'établissement
 * (RG06 — aucun avis publié sans décision) et le parent (RG09 — aucune donnée
 * personnelle collectée sans consentement).
 */
describe('Site public — avis et contacts (intégration)', () => {
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

  // Les plafonds sont serrés (5 dépôts par heure) : sans ce nettoyage, les
  // premiers tests consommeraient le quota de tous les suivants.
  beforeEach(async () => {
    await redis.instance.flushdb();
  });

  afterAll(async () => {
    await app.close();
  });

  const poster = (chemin: string) => request(app.getHttpServer()).post(`/api/v1${chemin}`);
  const avisValide = {
    auteur_nom: 'Test Parent',
    auteur_contact: 'test@example.ma',
    note: 4,
    commentaire: 'Un commentaire de test suffisamment circonstancié.',
  };

  // ---------------------------------------------------------------------------
  //  Avis — RG06, RG07, RG08
  // ---------------------------------------------------------------------------

  describe('dépôt d’avis (RG06)', () => {
    it('crée l’avis EN ATTENTE, jamais publié', async () => {
      // Aucun chemin ne doit permettre à un avis de naître visible : c'est ce
      // qui protège un établissement d'une campagne de dénigrement.
      const reponse = await poster(`/etablissements/${SLUG}/avis`).send(avisValide).expect(201);

      expect(reponse.body.data.statut).toBe('en_attente');
    });

    it('n’apparaît pas dans les avis publics tant qu’il n’est pas modéré', async () => {
      await poster(`/etablissements/${SLUG}/avis`)
        .send({ ...avisValide, auteur_nom: 'Invisible Parent' })
        .expect(201);

      const publies = await request(app.getHttpServer())
        .get(`/api/v1/etablissements/${SLUG}/avis`)
        .expect(200);

      expect(publies.body.data.map((a: { auteur_nom: string }) => a.auteur_nom)).not.toContain(
        'Invisible Parent',
      );
    });

    it('refuse une note hors 1–5', async () => {
      const reponse = await poster(`/etablissements/${SLUG}/avis`)
        .send({ ...avisValide, note: 6 })
        .expect(422);

      expect(reponse.body.code).toBe(ERROR_CODES.VALIDATION_ECHOUEE);
    });

    it('refuse le dépôt sur une fiche non publiée', async () => {
      await poster(`/etablissements/${SLUG_NON_PUBLIEE}/avis`).send(avisValide).expect(404);
    });
  });

  describe('avis publics', () => {
    it('n’expose JAMAIS le contact de l’auteur (loi 09-08)', async () => {
      const reponse = await request(app.getHttpServer())
        .get(`/api/v1/etablissements/${SLUG}/avis`)
        .expect(200);

      // Collecté pour vérifier l'authenticité de l'avis, pas pour l'afficher.
      for (const avis of reponse.body.data) {
        expect(avis).not.toHaveProperty('auteur_contact');
      }
    });

    it('rend la réponse de l’établissement avec l’avis (RG07)', async () => {
      const reponse = await request(app.getHttpServer())
        .get(`/api/v1/etablissements/${SLUG}/avis`)
        .expect(200);

      const avecReponse = reponse.body.data.find((a: { reponse: string | null }) => a.reponse);
      expect(avecReponse).toBeDefined();
    });
  });

  describe('avis mis en avant (RG27)', () => {
    it('ne rend que des avis publiés, et jamais le contact de l’auteur', async () => {
      const reponse = await request(app.getHttpServer()).get('/api/v1/avis/en-avant').expect(200);

      const avis = reponse.body.data as Record<string, unknown>[];

      expect(avis.length).toBeGreaterThan(0);
      expect(avis.length).toBeLessThanOrEqual(3);

      for (const a of avis) {
        // Loi 09-08 : l'adresse du parent ne sort jamais côté public, pas plus
        // sur l'accueil que sur une fiche.
        expect(a).not.toHaveProperty('auteur_contact');
        expect(a).toHaveProperty('etablissement');
      }

      // Tous sont bien publiés ET épinglés en base.
      const ids = avis.map((a) => BigInt(a.id as string));
      const nonConformes = await db.avis.count({
        where: { id: { in: ids }, OR: [{ statut: { not: 'publie' } }, { en_avant: false }] },
      });
      expect(nonConformes).toBe(0);
    });
  });

  describe('signalement (RG07, RG08)', () => {
    it('replace l’avis en file de modération et recalcule la note', async () => {
      const publies = await request(app.getHttpServer())
        .get(`/api/v1/etablissements/${SLUG}/avis`)
        .expect(200);

      const cible = publies.body.data[0];
      const avant = await db.etablissement.findUniqueOrThrow({ where: { slug: SLUG } });

      await poster(`/avis/${cible.id}/signalements`)
        .send({ motif: 'Propos jugés inexacts' })
        .expect(204);

      const apres = await db.avis.findUniqueOrThrow({ where: { id: BigInt(cible.id) } });
      expect(apres.statut).toBe('en_attente');

      // L'avis quitte l'affichage : la note doit suivre dans la même
      // transaction, sinon la fiche afficherait une moyenne qui ne correspond
      // à aucun avis visible.
      const fiche = await db.etablissement.findUniqueOrThrow({ where: { slug: SLUG } });
      expect(fiche.nb_avis).toBeLessThan(avant.nb_avis);
    });
  });

  // ---------------------------------------------------------------------------
  //  Demandes de contact — RG09, RG21
  // ---------------------------------------------------------------------------

  describe('demande de contact (RG09)', () => {
    const demandeValide = {
      parent_nom: 'Yasmine Test',
      parent_tel: '06 61 42 88 30',
      message: 'Je souhaite des informations sur les inscriptions en sixième.',
      canal: 'formulaire',
      consentement: true,
    };

    it('REFUSE la demande sans consentement', async () => {
      // Sans consentement explicite, la collecte est illégale (loi 09-08) :
      // la donnée ne doit pas être écrite, pas seulement marquée.
      const reponse = await poster(`/etablissements/${SLUG}/demandes-contact`)
        .send({ ...demandeValide, consentement: false })
        .expect(422);

      expect(reponse.body.details.champs[0].champ).toBe('consentement');
    });

    it('refuse un téléphone non marocain', async () => {
      await poster(`/etablissements/${SLUG}/demandes-contact`)
        .send({ ...demandeValide, parent_tel: '+33 6 12 34 56 78' })
        .expect(422);
    });

    it('enregistre la demande ET crée le lead dans la même transaction (RG21)', async () => {
      const reponse = await poster(`/etablissements/${SLUG}/demandes-contact`)
        .send({ ...demandeValide, parent_nom: 'Parent Avec Lead' })
        .expect(201);

      const demande = await db.demandeContact.findUniqueOrThrow({
        where: { id: BigInt(reponse.body.data.id) },
        include: { leads: true },
      });

      // Un lead perdu, c'est un parent que l'établissement ne rappellera jamais.
      expect(demande.leads.length).toBe(1);
      expect(demande.leads[0]?.candidat_nom).toBe('Parent Avec Lead');
      expect(demande.consentement).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  //  Traçage — RG10
  // ---------------------------------------------------------------------------

  describe('traçage des interactions (RG10)', () => {
    it('enregistre une vue de page profil', async () => {
      await poster(`/etablissements/${SLUG}/evenements`)
        .send({ type: 'vue', source: 'fiche' })
        .expect(204);

      const trace = await db.evenementTrace.findFirst({
        where: { type: 'vue', source: 'fiche' },
        orderBy: { id: 'desc' },
      });

      expect(trace).not.toBeNull();
    });

    it('refuse une source inconnue', async () => {
      await poster(`/etablissements/${SLUG}/evenements`)
        .send({ type: 'vue', source: 'ailleurs' })
        .expect(422);
    });

    it('refuse un type hors énumération', async () => {
      await poster(`/etablissements/${SLUG}/evenements`)
        .send({ type: 'teleportation' })
        .expect(422);
    });
  });

  // ---------------------------------------------------------------------------
  //  Anti-spam — livrable 11 §5
  // ---------------------------------------------------------------------------

  describe('limitation anti-spam', () => {
    it('bloque au-delà de 5 dépôts d’avis par heure', async () => {
      for (let i = 1; i <= 5; i += 1) {
        await poster(`/etablissements/${SLUG}/avis`)
          .send({ ...avisValide, auteur_nom: `Spam ${i}` })
          .expect(201);
      }

      const bloque = await poster(`/etablissements/${SLUG}/avis`)
        .send({ ...avisValide, auteur_nom: 'Spam 6' })
        .expect(429);

      expect(bloque.body.code).toBe(ERROR_CODES.TROP_DE_REQUETES);
    });
  });
});
