import { HttpStatus, type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { ERROR_CODES, ValidationException } from '@/common/errors';
import { DatabaseModule } from '@/database/database.module';
import { DemoSeeder } from '@/database/seeders/demo.seeder';
import { ReferentielsSeeder } from '@/database/seeders/referentiels.seeder';
import { verifierBaseRedisDeTest } from '../helpers/env';

/**
 * Site public — livrable 11 §3.1.
 *
 * Deux familles de garanties sont éprouvées ici.
 *
 * L'ENVELOPPE `{data, meta, links}` est une INTERFACE : le client HTTP du
 * livrable 12 §4 et les fixtures MSW du livrable 13 §1 sont écrits contre cette
 * forme exacte. Un écart ne produit aucune erreur serveur — il casse le front
 * silencieusement.
 *
 * LA VISIBILITÉ DES FICHES (RG03) et LA PLACE DES SPONSORISÉES (RG19) sont des
 * engagements commerciaux : publier une fiche non validée trahit un
 * établissement qui n'a rien demandé, et évincer un résultat pertinent au
 * profit d'un annonceur trahit le parent.
 */
describe('Site public — établissements (intégration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    verifierBaseRedisDeTest(process.env.REDIS_URL ?? '');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
    }).compile();

    app = moduleRef.createNestApplication();
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
    await demo.donnees(comptes);
  });

  afterAll(async () => {
    await app.close();
  });

  const get = (chemin: string) => request(app.getHttpServer()).get(`/api/v1${chemin}`);

  // ---------------------------------------------------------------------------
  //  L'enveloppe est une interface
  // ---------------------------------------------------------------------------

  describe('enveloppe de réponse', () => {
    it('rend exactement data, meta et links — rien de plus', async () => {
      const reponse = await get('/etablissements').expect(200);

      expect(Object.keys(reponse.body).sort()).toEqual(['data', 'links', 'meta']);
    });

    it('pagine à 18 fiches par page (RG05)', async () => {
      const reponse = await get('/etablissements').expect(200);

      expect(reponse.body.meta.per_page).toBe(18);
      expect(reponse.body.meta).toHaveProperty('total_pages');
    });

    it('conserve les filtres dans les liens de pagination', async () => {
      // Sans cela, « page suivante » ramènerait les ~8 000 fiches au lieu des
      // résultats de la recherche en cours.
      const reponse = await get('/etablissements?per_page=1&tri=nom').expect(200);

      expect(reponse.body.links.next).toContain('per_page=1');
      expect(reponse.body.links.next).toContain('tri=nom');
      expect(reponse.body.links.next).toContain('page=2');
    });

    it('met next à null sur la dernière page', async () => {
      const reponse = await get('/etablissements?per_page=2&page=2').expect(200);

      expect(reponse.body.links.next).toBeNull();
    });

    it('laisse la sonde de santé hors enveloppe', async () => {
      // Docker et UptimeRobot lisent une charge plate ; les envelopper casserait
      // leur configuration (livrable 14 §5).
      const reponse = await get('/health').expect(200);

      expect(reponse.body).not.toHaveProperty('data');
      expect(reponse.body.statut).toBe('ok');
    });
  });

  // ---------------------------------------------------------------------------
  //  Visibilité — RG03
  // ---------------------------------------------------------------------------

  describe('visibilité des fiches (RG03)', () => {
    it('ne sert que les fiches validées', async () => {
      const reponse = await get('/etablissements').expect(200);
      const noms = reponse.body.data.map((fiche: { nom: string }) => fiche.nom);

      // La crèche de démonstration est en_attente : elle n'a rien demandé à
      // personne et ne doit pas apparaître publiquement.
      expect(noms).not.toContain('Crèche Les Petits Génies');
      expect(reponse.body.meta.total).toBe(3);
    });

    it('rend 404 — et non 403 — sur une fiche non validée', async () => {
      // Un 403 confirmerait l'existence du dossier : on saurait qu'un
      // établissement a déposé une demande ou s'est fait suspendre.
      const reponse = await get('/etablissements/creche-les-petits-genies-casablanca').expect(404);

      expect(reponse.body.code).toBe(ERROR_CODES.RESSOURCE_INTROUVABLE);
      expect(Object.keys(reponse.body).sort()).toEqual(['code', 'details', 'message']);
    });
  });

  // ---------------------------------------------------------------------------
  //  Sponsoring — RG19
  // ---------------------------------------------------------------------------

  describe('fiches sponsorisées (RG19)', () => {
    it('les sert en tête', async () => {
      const reponse = await get('/etablissements').expect(200);

      expect(reponse.body.data[0].nom).toBe('Lycée Al Massira');
      expect(reponse.body.data[0].sponsorise).toBe(true);
    });

    it('les garde en tête quel que soit le tri demandé', async () => {
      // C'est ce que l'établissement paie : la mise en avant ne dépend pas du
      // tri choisi par le visiteur.
      const parNom = await get('/etablissements?tri=nom').expect(200);

      expect(parNom.body.data[0].nom).toBe('Lycée Al Massira');
    });

    it('ne les rend JAMAIS exclusives', async () => {
      // Une mise en avant n'est pas une éviction : tous les résultats
      // pertinents restent servis, les sponsorisés d'abord.
      const reponse = await get('/etablissements').expect(200);

      expect(reponse.body.data.length).toBe(3);
      expect(reponse.body.data.filter((f: { sponsorise: boolean }) => !f.sponsorise).length).toBe(
        2,
      );
    });
  });

  // ---------------------------------------------------------------------------
  //  Filtres
  // ---------------------------------------------------------------------------

  describe('filtres de recherche', () => {
    it('filtre par ville (RG01)', async () => {
      const reponse = await get('/etablissements?ville=casablanca').expect(200);

      expect(
        reponse.body.data.every((f: { ville: { slug: string } }) => f.ville.slug === 'casablanca'),
      ).toBe(true);
    });

    it('filtre par type (RG02)', async () => {
      const reponse = await get('/etablissements?type=lycee').expect(200);

      expect(reponse.body.data.every((f: { type: string }) => f.type === 'lycee')).toBe(true);
    });

    it('trouve sur un fragment de nom', async () => {
      // « massir » doit trouver « Al Massira » : un parent tape rarement le nom
      // exact, et le mode booléen de MySQL ne le ferait pas sans joker.
      const reponse = await get('/etablissements?q=massir').expect(200);

      expect(reponse.body.data.map((f: { nom: string }) => f.nom)).toEqual(['Lycée Al Massira']);
    });

    it('refuse un type hors énumération', async () => {
      const reponse = await get('/etablissements?type=chateau').expect(422);

      expect(reponse.body.code).toBe(ERROR_CODES.VALIDATION_ECHOUEE);
    });

    it('plafonne per_page', async () => {
      // Sans borne, `?per_page=100000` chargerait les ~8 000 fiches en une
      // requête — un déni de service offert à qui lit l'URL.
      await get('/etablissements?per_page=100000').expect(422);
    });
  });

  // ---------------------------------------------------------------------------
  //  Projection — livrable 11 §1
  // ---------------------------------------------------------------------------

  describe('champs servis', () => {
    it('n’expose aucune coordonnée de contact dans une liste', async () => {
      // Les exposer sur ~8 000 fiches en ferait un annuaire téléphonique
      // aspirable en une requête, alors que la mise en relation doit passer
      // par le formulaire — qui trace l'événement et recueille le consentement.
      const reponse = await get('/etablissements').expect(200);
      const fiche = reponse.body.data[0];

      expect(fiche).not.toHaveProperty('tel');
      expect(fiche).not.toHaveProperty('whatsapp');
      expect(fiche).not.toHaveProperty('email');
    });

    it('sérialise les décimaux et les identifiants en chaîne', async () => {
      const reponse = await get('/etablissements/lycee-al-massira-casablanca').expect(200);

      // Une note rendue en nombre l'exposerait aux approximations du binaire
      // flottant ; anecdotique pour « ★ 4,8 », pas pour les montants à venir.
      expect(reponse.body.data.note_moy).toBe('4.8');
      expect(typeof reponse.body.data.id).toBe('string');
    });

    it('rend les blocs de la page profil et les niveaux rattachés', async () => {
      const reponse = await get('/etablissements/lycee-al-massira-casablanca').expect(200);

      expect(Array.isArray(reponse.body.data.chiffres)).toBe(true);
      expect(reponse.body.data.niveaux.length).toBeGreaterThan(0);
      expect(reponse.body.data.tel).toBeTruthy(); // présent sur la fiche, absent des listes
    });
  });

  // ---------------------------------------------------------------------------
  //  Référentiels
  // ---------------------------------------------------------------------------

  describe('référentiels', () => {
    it('rend les 12 villes du lancement (RG01)', async () => {
      const reponse = await get('/villes').expect(200);

      expect(reponse.body.data.length).toBe(12);
    });

    it('rend les niveaux et filières (RG02)', async () => {
      const reponse = await get('/niveau-filieres').expect(200);

      expect(reponse.body.data.length).toBe(20);
    });
  });
});
