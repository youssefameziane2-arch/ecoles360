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

/**
 * Espace connecté et back-office admin — livrable 11 §3.2 et §3.4.
 *
 * Ce qui est éprouvé ici, ce sont les FRONTIÈRES : qui peut entrer (RG05,
 * RG25), et ce qu'une écriture autorisée a le droit de toucher (RG20, RG07,
 * RG03). Un défaut sur l'un de ces points publierait du contenu non validé ou
 * ouvrirait la fiche d'un établissement à un compte tiers.
 */
describe('Espace connecté et administration (intégration)', () => {
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

  /** Ouvre une session et rend un agent qui porte le cookie et le jeton CSRF. */
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
      put: (url: string) => agent.put(`/api/v1${url}`).set('x-csrf-token', csrf),
      delete: (url: string) => agent.delete(`/api/v1${url}`).set('x-csrf-token', csrf),
    };
  }

  /** Repart d'une fiche sans proposition en attente — RG20 n'en tolère qu'une. */
  async function sansPropositionEnAttente() {
    const etablissement = await db.etablissement.findUniqueOrThrow({ where: { slug: SLUG } });

    await db.propositionFiche.deleteMany({
      where: { etablissement_id: etablissement.id, statut: 'en_attente' },
    });

    return etablissement;
  }

  // ---------------------------------------------------------------------------
  //  Frontières d'accès — RG05, RG25
  // ---------------------------------------------------------------------------

  describe('frontières d’accès', () => {
    it('refuse l’anonyme sur l’espace connecté', async () => {
      const reponse = await request(app.getHttpServer())
        .get('/api/v1/mon-espace/dashboard')
        .expect(401);

      expect(reponse.body.code).toBe(ERROR_CODES.NON_AUTHENTIFIE);
    });

    it('refuse un commercial sur l’espace établissement (RG25)', async () => {
      const commercial = await connecte('younes.c@ecoles360.com');
      const reponse = await commercial.get('/mon-espace/dashboard').expect(403);

      expect(reponse.body.code).toBe(ERROR_CODES.ACCES_REFUSE);
    });

    it('refuse un compte établissement sur le back-office admin (RG25)', async () => {
      const etablissement = await connecte('contact@almassira.ma');

      await etablissement.get('/admin/etablissements').expect(403);
    });

    it('refuse le secrétariat sur une portée qui ne lui a pas été accordée (RG05)', async () => {
      // Yassine porte `fiches` et `contacts`, jamais `avis`.
      const yassine = await connecte('yassine.b@ecoles360.com');

      await yassine.get('/mon-espace/fiche').expect(200);
      const refus = await yassine.get('/mon-espace/avis').expect(403);

      expect(refus.body.details.portees_manquantes).toEqual(['avis']);
    });

    it('laisse passer le secrétariat sur ses portées accordées (RG05)', async () => {
      const sara = await connecte('sara.s@ecoles360.com');

      await sara.get('/mon-espace/avis').expect(200);
      await sara.get('/mon-espace/demandes').expect(200);
    });

    it('n’exige aucune portée d’un compte établissement — périmètre fixe (RG25)', async () => {
      const etablissement = await connecte('contact@almassira.ma');

      await etablissement.get('/mon-espace/fiche').expect(200);
      await etablissement.get('/mon-espace/avis').expect(200);
      await etablissement.get('/mon-espace/demandes').expect(200);
    });

    /**
     * LA FACTURATION N'EST PAS UNE PORTÉE DÉLÉGUÉE. La RG05 n'en connaît que
     * trois — `fiches`, `contacts`, `avis` — et une secrétaire à qui l'on a
     * confié la boîte de contacts n'a pas à lire ce que son école paie.
     *
     * Ce n'est donc PAS un 403 de portée manquante : il n'existe aucune portée
     * à accorder. C'est le rôle qui tranche, et le `@Roles` de la méthode
     * surcharge celui de la classe. Sans cette surcharge, le contrôleur étant
     * déclaré `@Roles(etablissement, secretariat)`, la route serait ouverte aux
     * deux — et rien à l'écran ne l'aurait signalé.
     */
    it('refuse la facturation à un compte secrétariat, même largement doté (RG05)', async () => {
      const sara = await connecte('sara.s@ecoles360.com');

      await sara.get('/mon-espace/demandes').expect(200);
      await sara.get('/mon-espace/facturation').expect(403);
    });

    it('sert la facturation au compte établissement', async () => {
      const etablissement = await connecte('contact@almassira.ma');

      const reponse = await etablissement.get('/mon-espace/facturation').expect(200);

      expect(reponse.body.data).toHaveProperty('abonnement');
      expect(reponse.body.data).toHaveProperty('essai');
      expect(Array.isArray(reponse.body.data.factures)).toBe(true);
    });

    /**
     * LES MONTANTS SONT DES CHAÎNES, comme les identifiants. Un `Decimal(10,2)`
     * rendu en nombre JavaScript perd des centimes sur les grands montants, et
     * une facture est exactement l'endroit où cela se verrait.
     */
    it('rend les montants en chaînes, jamais en nombres', async () => {
      const etablissement = await connecte('contact@almassira.ma');
      const reponse = await etablissement.get('/mon-espace/facturation').expect(200);

      for (const facture of reponse.body.data.factures) {
        expect(typeof facture.total_ttc).toBe('string');
        expect(typeof facture.montant_ht).toBe('string');
        expect(typeof facture.id).toBe('string');
      }

      // `?.` NE SUFFIT PAS ICI : sans abonnement, `abonnement?.tarif_mad` vaut
      // `undefined`, qui est bien `!== null` — la condition passait et le test
      // déréférençait un nul. La base n'étant pas remise à zéro, une autre
      // suite peut très bien avoir expiré cet abonnement entre-temps.
      const tarif = reponse.body.data.abonnement?.tarif_mad;

      if (tarif !== null && tarif !== undefined) {
        expect(typeof tarif).toBe('string');
      }
    });

    /** Chaque école ne voit que SES factures — la portée vient de la session. */
    it('ne rend que les factures de l’établissement de la session', async () => {
      const etablissement = await connecte('contact@almassira.ma');
      const fiche = await db.etablissement.findUniqueOrThrow({ where: { slug: SLUG } });

      const reponse = await etablissement.get('/mon-espace/facturation').expect(200);
      const numeros = reponse.body.data.factures.map((f: { numero: string }) => f.numero);

      const siennes = await db.facture.findMany({
        where: { etablissement_id: fiche.id },
        select: { numero: true },
      });

      expect(new Set(numeros)).toEqual(new Set(siennes.map((f) => f.numero)));
    });
  });

  // ---------------------------------------------------------------------------
  //  Proposition de fiche — RG20, RG27
  // ---------------------------------------------------------------------------

  describe('proposition de modification de fiche', () => {
    it('N’ÉCRIT JAMAIS la fiche directement — elle crée une proposition (RG20)', async () => {
      const avant = await sansPropositionEnAttente();
      const etablissement = await connecte('contact@almassira.ma');

      await etablissement
        .post('/mon-espace/fiche/propositions')
        .send({ description: 'Une description entièrement réécrite par le client.' })
        .expect(201);

      const apres = await db.etablissement.findUniqueOrThrow({ where: { slug: SLUG } });

      // Le point entier de RG20 : la fiche publique n'a pas bougé.
      expect(apres.description).toBe(avant.description);

      const proposition = await db.propositionFiche.findFirstOrThrow({
        where: { etablissement_id: avant.id, statut: 'en_attente' },
      });
      expect(proposition.champs_modifies).toHaveProperty('description');
    });

    /**
     * L'ÉQUIPE PASSE PAR LA MÊME FILE QUE LE RESTE (RG20).
     *
     * Elle nomme des personnes réelles et leur attribue une fonction sur une
     * page publique : c'est exactement le genre d'affirmation que le circuit
     * de validation existe pour relire. Rien ne justifierait de l'en
     * dispenser, contrairement aux photos de la galerie.
     */
    it('fait passer l’équipe par la file de propositions (RG20)', async () => {
      const avant = await sansPropositionEnAttente();
      const etablissement = await connecte('contact@almassira.ma');

      const equipe = [
        { nom: 'Mme Karima Idrissi', role: 'Directrice adjointe' },
        { nom: 'M. Hamza Berrada', role: 'Conseiller d’orientation' },
      ];

      await etablissement.post('/mon-espace/fiche/propositions').send({ equipe }).expect(201);

      const proposition = await db.propositionFiche.findFirstOrThrow({
        where: { etablissement_id: avant.id, statut: 'en_attente' },
      });

      expect(proposition.champs_modifies).toHaveProperty('equipe');

      // La fiche PUBLIQUE ne bouge pas tant que l'administration n'a rien
      // validé — c'est tout l'objet de la règle.
      const inchangee = await db.etablissement.findUniqueOrThrow({ where: { id: avant.id } });
      expect(inchangee.equipe).toEqual(avant.equipe);
    });

    it('refuse un membre d’équipe sans rôle', async () => {
      await sansPropositionEnAttente();
      const etablissement = await connecte('contact@almassira.ma');

      const reponse = await etablissement
        .post('/mon-espace/fiche/propositions')
        .send({ equipe: [{ nom: 'Quelqu’un sans fonction' }] })
        .expect(422);

      expect(reponse.body.code).toBe(ERROR_CODES.VALIDATION_ECHOUEE);
    });

    it('refuse une seconde proposition tant que la première est en attente (RG27)', async () => {
      await sansPropositionEnAttente();
      const etablissement = await connecte('contact@almassira.ma');

      await etablissement
        .post('/mon-espace/fiche/propositions')
        .send({ quartier: 'Gauthier' })
        .expect(201);

      const conflit = await etablissement
        .post('/mon-espace/fiche/propositions')
        .send({ quartier: 'Anfa' })
        .expect(409);

      expect(conflit.body.code).toBe(ERROR_CODES.CONFLIT_METIER);
    });

    it('rejette une charge portant un attribut de plateforme (RG27)', async () => {
      await sansPropositionEnAttente();
      const etablissement = await connecte('contact@almassira.ma');

      // `sponsorise` n'est déclaré dans aucun DTO client : `forbidNonWhitelisted`
      // l'écarte par construction, sans qu'aucun service n'ait à y penser.
      const refus = await etablissement
        .post('/mon-espace/fiche/propositions')
        .send({ description: 'Texte valable', sponsorise: true })
        .expect(422);

      expect(refus.body.code).toBe(ERROR_CODES.VALIDATION_ECHOUEE);
    });

    it('refuse une proposition sans changement réel', async () => {
      const fiche = await sansPropositionEnAttente();
      const etablissement = await connecte('contact@almassira.ma');

      await etablissement
        .post('/mon-espace/fiche/propositions')
        .send({ nom: fiche.nom })
        .expect(422);
    });

    it('laisse l’auteur annuler sa proposition en attente', async () => {
      const fiche = await sansPropositionEnAttente();
      const etablissement = await connecte('contact@almassira.ma');

      const creee = await etablissement
        .post('/mon-espace/fiche/propositions')
        .send({ quartier: 'Bourgogne' })
        .expect(201);

      await etablissement
        .delete(`/mon-espace/fiche/propositions/${creee.body.data.id}`)
        .expect(204);

      const restantes = await db.propositionFiche.count({
        where: { etablissement_id: fiche.id, statut: 'en_attente' },
      });
      expect(restantes).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  //  Décision admin sur une proposition — RG20
  // ---------------------------------------------------------------------------

  describe('validation admin des propositions', () => {
    it('applique le payload à la fiche à l’approbation (RG20)', async () => {
      await sansPropositionEnAttente();
      const etablissement = await connecte('contact@almassira.ma');
      const admin = await connecte('direction@ecoles360.com');

      const creee = await etablissement
        .post('/mon-espace/fiche/propositions')
        .send({ quartier: 'Californie' })
        .expect(201);

      await admin
        .patch(`/admin/propositions-fiche/${creee.body.data.id}`)
        .send({ decision: 'validee' })
        .expect(204);

      const fiche = await db.etablissement.findUniqueOrThrow({ where: { slug: SLUG } });
      expect(fiche.quartier).toBe('Californie');
    });

    it('ne publie rien au refus, et exige un motif (RG20)', async () => {
      const avant = await sansPropositionEnAttente();
      const etablissement = await connecte('contact@almassira.ma');
      const admin = await connecte('direction@ecoles360.com');

      const creee = await etablissement
        .post('/mon-espace/fiche/propositions')
        .send({ quartier: 'Ain Diab' })
        .expect(201);

      await admin
        .patch(`/admin/propositions-fiche/${creee.body.data.id}`)
        .send({ decision: 'rejetee' })
        .expect(422);

      await admin
        .patch(`/admin/propositions-fiche/${creee.body.data.id}`)
        .send({ decision: 'rejetee', motif: 'Quartier non conforme à l’adresse déclarée.' })
        .expect(204);

      const apres = await db.etablissement.findUniqueOrThrow({ where: { slug: SLUG } });
      expect(apres.quartier).toBe(avant.quartier);
    });
  });

  // ---------------------------------------------------------------------------
  //  Réponse aux avis — RG07
  // ---------------------------------------------------------------------------

  describe('réponse aux avis', () => {
    it('refuse une seconde réponse sur le même avis (RG07)', async () => {
      const fiche = await db.etablissement.findUniqueOrThrow({ where: { slug: SLUG } });
      const avis = await db.avis.create({
        data: {
          etablissement_id: fiche.id,
          auteur_nom: 'Parent Test RG07',
          auteur_contact: 'test-rg07@example.ma',
          note: 4,
          commentaire: 'Avis créé par le test de la règle RG07.',
          statut: 'publie',
        },
      });

      const etablissement = await connecte('contact@almassira.ma');

      await etablissement
        .post(`/mon-espace/avis/${avis.id}/reponse`)
        .send({ reponse: 'Merci pour votre retour.' })
        .expect(204);

      const conflit = await etablissement
        .post(`/mon-espace/avis/${avis.id}/reponse`)
        .send({ reponse: 'Et une seconde réponse, qui ne doit pas passer.' })
        .expect(409);

      expect(conflit.body.code).toBe(ERROR_CODES.CONFLIT_METIER);
    });

    it('refuse de répondre à l’avis d’un autre établissement', async () => {
      const autre = await db.etablissement.findFirstOrThrow({
        where: { slug: { not: SLUG } },
      });
      const avisAutre = await db.avis.create({
        data: {
          etablissement_id: autre.id,
          auteur_nom: 'Parent Ailleurs',
          auteur_contact: 'ailleurs@example.ma',
          note: 3,
          commentaire: 'Avis déposé sur une autre fiche.',
          statut: 'publie',
        },
      });

      const etablissement = await connecte('contact@almassira.ma');

      await etablissement
        .post(`/mon-espace/avis/${avisAutre.id}/reponse`)
        .send({ reponse: 'Je réponds chez le voisin.' })
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  //  Validation d'établissement — RG03, RG14
  // ---------------------------------------------------------------------------

  describe('validation d’un établissement', () => {
    const fichesCreees: bigint[] = [];

    /** Fiche neuve, en attente, sans abonnement — l'état d'une inscription réelle. */
    async function ficheEnAttente(suffixe: string) {
      const ville = await db.ville.findUniqueOrThrow({ where: { slug: 'casablanca' } });

      const fiche = await db.etablissement.create({
        data: {
          ville_id: ville.id,
          slug: `fiche-test-${suffixe}-${Date.now()}`,
          nom: `Fiche de test ${suffixe}`,
          type: 'primaire',
          statut: 'en_attente',
        },
      });

      fichesCreees.push(fiche.id);

      return fiche;
    }

    /**
     * Les fiches créées ici sont EFFACÉES À LA FIN.
     *
     * Certaines finissent validées — c'est le propos du test. Or les suites
     * partagent une base et s'exécutent en série : une fiche validée oubliée
     * ici devient une quatrième fiche publique, et la suite du site public
     * échoue sur ses comptes sans rapport apparent avec ce fichier.
     */
    afterAll(async () => {
      if (fichesCreees.length > 0) {
        await db.abonnement.deleteMany({ where: { etablissement_id: { in: fichesCreees } } });
        await db.etablissement.deleteMany({ where: { id: { in: fichesCreees } } });
      }
    });

    it('REFUSE la validation tant que l’abonnement n’est pas encaissé (RG14)', async () => {
      const fiche = await ficheEnAttente('sans-abonnement');
      const admin = await connecte('direction@ecoles360.com');

      const conflit = await admin
        .patch(`/admin/etablissements/${fiche.id}/statut`)
        .send({ statut: 'validee' })
        .expect(409);

      expect(conflit.body.code).toBe(ERROR_CODES.CONFLIT_METIER);

      const inchangee = await db.etablissement.findUniqueOrThrow({ where: { id: fiche.id } });
      expect(inchangee.statut).toBe('en_attente');
    });

    it('valide une fois l’essai gratuit activé (RG13, RG03)', async () => {
      const fiche = await ficheEnAttente('avec-essai');
      const admin = await connecte('direction@ecoles360.com');

      await admin.post(`/admin/etablissements/${fiche.id}/essai-gratuit`).expect(204);

      await admin
        .patch(`/admin/etablissements/${fiche.id}/statut`)
        .send({ statut: 'validee' })
        .expect(204);

      const validee = await db.etablissement.findUniqueOrThrow({ where: { id: fiche.id } });
      expect(validee.statut).toBe('validee');
    });

    it('journalise la décision de validation (RG15)', async () => {
      const fiche = await ficheEnAttente('journalisee');
      const admin = await connecte('direction@ecoles360.com');

      await admin.post(`/admin/etablissements/${fiche.id}/essai-gratuit`).expect(204);
      await admin
        .patch(`/admin/etablissements/${fiche.id}/statut`)
        .send({ statut: 'validee' })
        .expect(204);

      const trace = await db.journalAudit.findFirst({
        where: {
          cible_type: 'etablissement',
          cible_id: fiche.id,
          action: 'etablissement.statut.validee',
        },
      });

      expect(trace).not.toBeNull();
      expect(trace?.role_acteur).toBe('superadmin');
    });

    it('suspend sans condition d’abonnement — seule la validation est verrouillée', async () => {
      const fiche = await ficheEnAttente('a-suspendre');
      const admin = await connecte('direction@ecoles360.com');

      await admin
        .patch(`/admin/etablissements/${fiche.id}/statut`)
        .send({ statut: 'suspendue' })
        .expect(204);

      const suspendue = await db.etablissement.findUniqueOrThrow({ where: { id: fiche.id } });
      expect(suspendue.statut).toBe('suspendue');
    });

    it('bascule les badges de plateforme sans toucher à la note (RG08, RG19)', async () => {
      const fiche = await db.etablissement.findUniqueOrThrow({ where: { slug: SLUG } });
      const admin = await connecte('direction@ecoles360.com');

      await admin
        .patch(`/admin/etablissements/${fiche.id}/badges`)
        .send({ sponsorise: false })
        .expect(204);

      const apres = await db.etablissement.findUniqueOrThrow({ where: { id: fiche.id } });
      expect(apres.sponsorise).toBe(false);
      // La note reste une dénormalisation calculée, jamais une saisie admin.
      expect(apres.note_moy.toString()).toBe(fiche.note_moy.toString());

      await admin
        .patch(`/admin/etablissements/${fiche.id}/badges`)
        .send({ sponsorise: true })
        .expect(204);
    });

    it('refuse une note envoyée dans la charge des badges (RG08)', async () => {
      const fiche = await db.etablissement.findUniqueOrThrow({ where: { slug: SLUG } });
      const admin = await connecte('direction@ecoles360.com');

      await admin
        .patch(`/admin/etablissements/${fiche.id}/badges`)
        .send({ note_moy: 5 })
        .expect(422);
    });
  });

  // ---------------------------------------------------------------------------
  //  Paramètres de facturation — livrable 11 §3.4, RG13
  // ---------------------------------------------------------------------------

  describe('paramètres de facturation', () => {
    /** Remet la valeur d'origine pour que les suites restent rejouables. */
    async function restaurer(cle: string, valeur: string) {
      await db.parametreFacturation.update({ where: { cle }, data: { valeur } });
    }

    it('refuse une clé inconnue', async () => {
      const admin = await connecte('direction@ecoles360.com');

      await admin
        .put('/admin/parametres-facturation/taux_invente')
        .send({ valeur: '42' })
        .expect(404);
    });

    it('refuse une valeur non numérique', async () => {
      const admin = await connecte('direction@ecoles360.com');

      await admin
        .put('/admin/parametres-facturation/tva_pct')
        .send({ valeur: 'vingt' })
        .expect(422);
    });

    it('journalise la modification avec l’ancienne et la nouvelle valeur (RG15)', async () => {
      const admin = await connecte('direction@ecoles360.com');
      const avant = await db.parametreFacturation.findUniqueOrThrow({ where: { cle: 'tva_pct' } });

      await admin.put('/admin/parametres-facturation/tva_pct').send({ valeur: '19' }).expect(204);

      const trace = await db.journalAudit.findFirst({
        where: { action: 'parametre_facturation.modifie' },
        orderBy: { cree_le: 'desc' },
      });

      expect(trace).not.toBeNull();
      expect(trace?.details).toMatchObject({ cle: 'tva_pct', apres: '19' });

      await restaurer('tva_pct', avant.valeur);
    });

    it('la durée de l’essai gratuit vient du paramètre, pas du code (RG13)', async () => {
      const admin = await connecte('direction@ecoles360.com');
      const avant = await db.parametreFacturation.findUniqueOrThrow({
        where: { cle: 'duree_essai_gratuit_jours' },
      });

      await admin
        .put('/admin/parametres-facturation/duree_essai_gratuit_jours')
        .send({ valeur: '45' })
        .expect(204);

      const ville = await db.ville.findUniqueOrThrow({ where: { slug: 'casablanca' } });
      const fiche = await db.etablissement.create({
        data: {
          ville_id: ville.id,
          slug: `fiche-essai-parametre-${Date.now()}`,
          nom: 'Fiche essai paramétré',
          type: 'primaire',
          statut: 'en_attente',
        },
      });

      await admin.post(`/admin/etablissements/${fiche.id}/essai-gratuit`).expect(204);

      const abonnement = await db.abonnement.findFirstOrThrow({
        where: { etablissement_id: fiche.id },
      });

      const jours = Math.round(
        (abonnement.echeance.getTime() - abonnement.debut.getTime()) / 86_400_000,
      );

      // 45 et non 30 : la constante du code ne gouverne plus rien.
      expect(jours).toBe(45);

      await restaurer('duree_essai_gratuit_jours', avant.valeur);
    });
  });

  // ---------------------------------------------------------------------------
  //  Journal d'audit — RG15, RG26
  // ---------------------------------------------------------------------------

  describe('journal d’audit', () => {
    it('est EN LECTURE SEULE — aucune route d’écriture n’existe (RG26)', async () => {
      const direction = await connecte('direction@ecoles360.com');

      // Un registre qu'on peut retoucher ne prouve rien. Ces méthodes ne
      // doivent exister sur aucune entrée, jamais : le jour où l'une d'elles
      // répond autre chose que 404/405, la valeur de preuve du journal tombe.
      const entree = await db.journalAudit.findFirstOrThrow({ select: { id: true } });

      for (const reponse of [
        await direction.patch(`/admin/audit/${entree.id}`).send({ action: 'falsifie' }),
        await direction.put(`/admin/audit/${entree.id}`).send({ action: 'falsifie' }),
        await direction.delete(`/admin/audit/${entree.id}`),
      ]) {
        expect([404, 405]).toContain(reponse.status);
      }

      // Et l'entrée n'a pas bougé.
      const toujoursLa = await db.journalAudit.findUnique({ where: { id: entree.id } });
      expect(toujoursLa).not.toBeNull();
    });

    it('rend les entrées de la plus récente à la plus ancienne', async () => {
      const direction = await connecte('direction@ecoles360.com');
      const reponse = await direction.get('/admin/audit').expect(200);

      const dates = (reponse.body.data as { cree_le: string }[]).map((e) =>
        new Date(e.cree_le).getTime(),
      );

      expect(dates).toEqual([...dates].sort((a, b) => b - a));
      expect(reponse.body.meta.total).toBeGreaterThan(0);
    });

    it('filtre par domaine métier', async () => {
      const direction = await connecte('direction@ecoles360.com');
      const reponse = await direction.get('/admin/audit?domaine=article').expect(200);

      for (const entree of reponse.body.data as { action: string }[]) {
        expect(entree.action.startsWith('article.')).toBe(true);
      }
    });

    it('agrège l’activité par profil et les chiffres par établissement', async () => {
      const direction = await connecte('direction@ecoles360.com');
      const reponse = await direction.get('/admin/audit/statistiques').expect(200);

      const { activite_par_profil, par_etablissement } = reponse.body.data as {
        activite_par_profil: { role: string; actions: number }[];
        par_etablissement: { nom: string; avis: number }[];
      };

      expect(Array.isArray(activite_par_profil)).toBe(true);
      expect(par_etablissement.length).toBeGreaterThan(0);
      // Les fiches de démonstration ne mentent plus sur leur nombre d'avis :
      // le semeur réaligne le compteur sur les avis réellement publiés (RG08).
      for (const fiche of par_etablissement) {
        expect(fiche.avis).toBeLessThan(50);
      }
    });

    it('n’expose le journal qu’à l’administration (RG25)', async () => {
      await request(app.getHttpServer()).get('/api/v1/admin/audit').expect(401);

      const etablissement = await connecte('contact@almassira.ma');
      await etablissement.get('/admin/audit').expect(403);
    });
  });
});
