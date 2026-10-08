import { HttpStatus, type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { ERROR_CODES, ValidationException } from '@/common/errors';
import { DatabaseModule } from '@/database/database.module';
import { DemoSeeder } from '@/database/seeders/demo.seeder';
import { ReferentielsSeeder } from '@/database/seeders/referentiels.seeder';
import { PrismaService } from '@/prisma/prisma.service';
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
  let db: PrismaService;

  beforeAll(async () => {
    verifierBaseRedisDeTest(process.env.REDIS_URL ?? '');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
    }).compile();

    app = moduleRef.createNestApplication();
    db = moduleRef.get(PrismaService);
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
  const patienter = (ms: number) => new Promise((suite) => setTimeout(suite, ms));

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
      // LA DERNIÈRE PAGE SE CALCULE, elle ne se devine pas. Ce test visait la
      // page 2 en supposant trois fiches ; le jeu de démonstration en compte
      // désormais davantage, et la page 2 n'était plus la dernière. On demande
      // la page que l'API elle-même annonce comme la dernière.
      const premiere = await get('/etablissements?per_page=2').expect(200);
      const derniere = premiere.body.meta.total_pages as number;

      const reponse = await get(`/etablissements?per_page=2&page=${derniere}`).expect(200);

      expect(reponse.body.links.next).toBeNull();
      expect(reponse.body.meta.page).toBe(derniere);
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

      // ON COMPTE CE QUE LA BASE CONTIENT, PAS UN NOMBRE ÉCRIT EN DUR. Ce test
      // figeait « 3 » : ajouter les cycles d'un groupe scolaire le faisait
      // échouer alors que RG03 était parfaitement respectée. La règle porte sur
      // le STATUT, pas sur le volume.
      const validees = await db.etablissement.count({ where: { statut: 'validee' } });
      expect(reponse.body.meta.total).toBe(validees);
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

      const fiches = reponse.body.data as { sponsorise: boolean }[];
      const sponsorisees = fiches.filter((f) => f.sponsorise);
      const ordinaires = fiches.filter((f) => !f.sponsorise);

      // CE QUI COMPTE, C'EST QUE LES AUTRES SOIENT LÀ — pas qu'elles soient
      // deux. Le décompte figé cassait dès qu'une fiche rejoignait le jeu de
      // démonstration, sans que RG19 soit en cause une seconde.
      expect(sponsorisees.length).toBeGreaterThan(0);
      expect(ordinaires.length).toBeGreaterThan(0);

      // Et qu'elles viennent APRÈS : la mise en avant ordonne, elle n'exclut pas.
      const premierOrdinaire = fiches.findIndex((f) => !f.sponsorise);
      const dernierSponsorise = fiches.map((f) => f.sponsorise).lastIndexOf(true);
      expect(dernierSponsorise).toBeLessThan(premierOrdinaire);
    });

    it('n’applique pas une campagne hors de son périmètre de ville', async () => {
      // La campagne semée porte sur Casablanca. Une recherche à Marrakech ne
      // doit pas remonter la fiche casablancaise — ce serait vendre une
      // visibilité que l'établissement n'a pas achetée.
      const marrakech = await get('/etablissements?ville=marrakech').expect(200);

      expect(marrakech.body.data.every((f: { nom: string }) => f.nom !== 'Lycée Al Massira')).toBe(
        true,
      );
    });

    it('sert toutes les fiches d’un même niveau, sans en perdre en pagination', async () => {
      // Deux campagnes Premium sur la même ville : la rotation change leur
      // ordre d'un jour à l'autre, mais les DEUX doivent toujours sortir, et
      // une seule fois chacune.
      const casablanca = await db.ville.findUniqueOrThrow({ where: { slug: 'casablanca' } });
      const seconde = await db.etablissement.create({
        data: {
          ville_id: casablanca.id,
          slug: `rotation-test-${Date.now()}`,
          nom: 'Établissement de rotation',
          type: 'lycee',
          statut: 'validee',
        },
      });

      const debut = new Date();
      debut.setDate(debut.getDate() - 1);
      const fin = new Date();
      fin.setDate(fin.getDate() + 30);

      await db.sponsoring.create({
        data: {
          etablissement_id: seconde.id,
          niveau: 'premium',
          ville_id: casablanca.id,
          debut,
          fin,
          tarif_mad: 1000,
        },
      });

      const reponse = await get('/etablissements?ville=casablanca').expect(200);
      const noms = reponse.body.data.map((f: { nom: string }) => f.nom);

      expect(noms).toContain('Lycée Al Massira');
      expect(noms).toContain('Établissement de rotation');
      expect(new Set(noms).size).toBe(noms.length);

      // Les deux Premium occupent bien les deux premières places.
      expect(noms.slice(0, 2).sort()).toEqual(
        ['Lycée Al Massira', 'Établissement de rotation'].sort(),
      );

      await db.sponsoring.deleteMany({ where: { etablissement_id: seconde.id } });
      await db.etablissement.delete({ where: { id: seconde.id } });
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

      const noms = reponse.body.data.map((f: { nom: string }) => f.nom) as string[];

      expect(noms.length).toBeGreaterThan(0);
      // Le groupe scolaire porte le nom sur chacun de ses cycles : le fragment
      // les ramène tous, et c'est ce qu'un parent attend en tapant « massira ».
      for (const nom of noms) {
        expect(nom.toLowerCase()).toContain('massira');
      }
      expect(noms).toContain('Lycée Al Massira');
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
  //  Traces de recherche — B-40
  // ---------------------------------------------------------------------------

  describe('traces de recherche', () => {
    /**
     * Tout test de ce fichier qui passe un filtre écrit maintenant une trace,
     * et sans l'attendre : les écritures des tests précédents peuvent atterrir
     * pendant celui-ci. CHAQUE TEST PART DONC D'UNE TABLE VIDE — on laisse
     * d'abord passer les écritures en vol, puis on efface. Sans cela, un test
     * qui compte « exactement une trace » serait vrai ou faux selon la charge
     * de la machine.
     */
    beforeEach(async () => {
      await patienter(400);
      await db.traceRecherche.deleteMany({});
    });

    afterAll(async () => {
      await patienter(400);
      await db.traceRecherche.deleteMany({});
    });

    /**
     * Attend qu'au moins `attendu` traces soient écrites, puis les rend.
     *
     * LA RECHERCHE NE LES ATTEND PAS : la trace part sans `await`, pour que le
     * parent voie ses résultats sans dépendre d'une statistique
     * d'administration. Le test, lui, doit donc attendre.
     */
    async function tracesEcrites(attendu: number) {
      for (let essai = 0; essai < 40 && (await db.traceRecherche.count()) < attendu; essai += 1) {
        await patienter(25);
      }

      return db.traceRecherche.findMany({ include: { ville: { select: { slug: true } } } });
    }

    it('enregistre la ville cherchée et le nombre réel de résultats', async () => {
      const reponse = await get('/etablissements?ville=casablanca&type=lycee').expect(200);
      const traces = await tracesEcrites(1);

      expect(traces).toHaveLength(1);
      expect(traces[0]!.ville?.slug).toBe('casablanca');
      expect(traces[0]!.type).toBe('lycee');
      // LE NOMBRE DE RÉSULTATS VIENT DE LA BASE, PAS DU CLIENT : c'est tout
      // l'intérêt de tracer côté serveur plutôt que de laisser le navigateur
      // déclarer un chiffre qui finirait dans un écran d'administration.
      expect(traces[0]!.nb_resultats).toBe(reponse.body.meta.total);
    });

    it('n’enregistre ni un affichage sans critère, ni une page suivante', async () => {
      // Le catalogue au premier affichage : on le parcourt, on ne cherche pas.
      await get('/etablissements').expect(200);
      // La page 2 d'une recherche : la même recherche, pas une seconde.
      await get('/etablissements?ville=casablanca&page=2').expect(200);

      // Laisse passer le délai d'une écriture éventuelle avant de conclure à
      // son absence — sinon le test ne prouverait que sa propre hâte.
      await patienter(400);

      expect(await db.traceRecherche.count()).toBe(0);
    });

    it('trace une recherche par nom sans conserver le nom tapé', async () => {
      await get('/etablissements?q=massira').expect(200);
      const traces = await tracesEcrites(1);

      expect(traces).toHaveLength(1);
      expect(traces[0]!.ville_id).toBeNull();
      expect(traces[0]!.type).toBeNull();
      // Le terme n'est stocké nulle part. Le vérifier sur la ligne entière, et
      // pas seulement sur les colonnes du schéma, interdit de le glisser un
      // jour dans une colonne existante.
      expect(JSON.stringify(traces[0])).not.toContain('massira');
    });
  });

  // ---------------------------------------------------------------------------
  //  Projection — livrable 11 §1
  // ---------------------------------------------------------------------------

  describe('champs servis', () => {
    it('expose le téléphone et WhatsApp dans une liste, jamais l’e-mail', async () => {
      // REVIREMENT ASSUMÉ. Ce test exigeait qu'aucune coordonnée ne sorte en
      // liste, au motif qu'on en ferait un annuaire aspirable. Le motif ne
      // tenait pas : le standard d'une école est un numéro d'entreprise,
      // publié POUR être appelé, et déjà visible sur chaque fiche. L'interdire
      // en liste n'empêchait rien — il suffisait d'aspirer les fiches — et
      // privait le parent du seul geste qui compte : appeler sans ouvrir.
      //
      // La maquette pose d'ailleurs « appeler » et « WhatsApp » sur la carte.
      //
      // L'E-MAIL, LUI, RESTE DEHORS : c'est l'adresse qu'aspirent les robots à
      // pourriel, et aucun écran ne la demande en liste.
      const reponse = await get('/etablissements').expect(200);
      const fiche = reponse.body.data[0];

      expect(fiche).toHaveProperty('tel');
      expect(fiche).toHaveProperty('whatsapp');
      expect(fiche).not.toHaveProperty('email');
    });

    it('rend l’étendue du groupe scolaire sur les cartes de résultats', async () => {
      const reponse = await get('/etablissements?type=creche,primaire').expect(200);

      const fiches = reponse.body.data as {
        groupe: { nom: string; premier: string; dernier: string } | null;
      }[];

      expect(fiches.length).toBeGreaterThan(0);

      for (const fiche of fiches) {
        // « Crèche → Lycée » : sans cette étiquette, deux fiches du même
        // groupe ressemblent à un doublon dans la liste.
        expect(fiche.groupe).not.toBeNull();
        expect(fiche.groupe?.premier).toBe('creche');
        expect(fiche.groupe?.dernier).toBe('lycee');
      }
    });

    it('ne pose pas d’étendue sur une fiche hors groupe', async () => {
      const reponse = await get('/etablissements?type=universite').expect(200);

      for (const fiche of reponse.body.data as { groupe: unknown }[]) {
        expect(fiche.groupe).toBeNull();
      }
    });

    it('sérialise les décimaux et les identifiants en chaîne', async () => {
      const reponse = await get('/etablissements/lycee-al-massira-casablanca').expect(200);

      // Une note rendue en nombre l'exposerait aux approximations du binaire
      // flottant ; anecdotique pour « ★ 4,8 », pas pour les montants à venir.
      //
      // On vérifie le TYPE et la forme, pas la valeur : la note est recalculée
      // dès qu'un avis est modéré ou signalé (RG08), et une autre suite peut
      // légitimement l'avoir fait bouger. Figer « 4.8 » testerait la donnée de
      // démonstration, pas le contrat de sérialisation.
      expect(typeof reponse.body.data.note_moy).toBe('string');
      expect(reponse.body.data.note_moy).toMatch(/^\d+(\.\d)?$/);
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

    it('compte les établissements validés par ville, pas les autres statuts (RG01, RG03)', async () => {
      const reponse = await get('/villes').expect(200);
      const casablanca = reponse.body.data.find((v: { slug: string }) => v.slug === 'casablanca');

      expect(typeof casablanca.nb_etablissements).toBe('number');
      // Le jeu de données de test place les fiches non-validées ailleurs :
      // ce total ne doit donc jamais les compter en trop.
      expect(casablanca.nb_etablissements).toBeGreaterThanOrEqual(0);
    });

    it('rend les agrégats d’une ville — compte, note, types, quartiers (RG03)', async () => {
      const reponse = await get('/villes/casablanca').expect(200);
      const ville = reponse.body.data;

      expect(ville.nom).toBe('Casablanca');
      expect(typeof ville.nb_etablissements).toBe('number');
      expect(Array.isArray(ville.par_type)).toBe(true);
      expect(Array.isArray(ville.quartiers)).toBe(true);

      // Le total par type ne peut pas dépasser le total de la ville : les deux
      // agrégats sortent du même filtre RG03, une divergence signalerait que
      // l'un d'eux a cessé de l'appliquer.
      const sommeTypes = ville.par_type.reduce(
        (somme: number, ligne: { total: number }) => somme + ligne.total,
        0,
      );
      expect(sommeTypes).toBe(ville.nb_etablissements);

      // Décimal sérialisé en chaîne, comme partout (livrable 11 §1).
      if (ville.note_moyenne !== null) {
        expect(typeof ville.note_moyenne).toBe('string');
      }
    });

    it('répond 404 sur une ville inexistante', async () => {
      const reponse = await get('/villes/ville-qui-nexiste-pas').expect(404);

      expect(reponse.body.code).toBe(ERROR_CODES.RESSOURCE_INTROUVABLE);
    });

    it('un seul cycle coché rend toutes les fiches de ce cycle', async () => {
      const reponse = await get('/etablissements?type=lycee').expect(200);

      expect(reponse.body.meta.total).toBeGreaterThan(0);

      for (const fiche of reponse.body.data as { type: string }[]) {
        expect(fiche.type).toBe('lycee');
      }
    });

    it('PLUSIEURS CYCLES EXIGENT UN GROUPE QUI LES COUVRE TOUS', async () => {
      // Un parent qui coche « Crèche » et « Collège » a deux enfants d'âges
      // différents : il cherche UNE enseigne pour les deux, pas la liste de
      // toutes les crèches plus celle de tous les collèges.
      const reponse = await get('/etablissements?type=creche,college').expect(200);

      const fiches = reponse.body.data as { slug: string; type: string }[];
      expect(fiches.length).toBeGreaterThan(0);

      // Toutes appartiennent au même groupe, et ce groupe a bien les deux cycles.
      const groupes = await db.etablissement.findMany({
        where: { slug: { in: fiches.map((f) => f.slug) } },
        select: { groupe_id: true, type: true },
      });

      for (const fiche of groupes) {
        expect(fiche.groupe_id).not.toBeNull();
      }

      const cycles = new Set(groupes.map((g) => g.type));
      expect(cycles.has('creche')).toBe(true);
      expect(cycles.has('college')).toBe(true);
    });

    it('ne rend rien quand aucun groupe ne couvre la combinaison', async () => {
      // Aucune enseigne n'offre à la fois une crèche et une université.
      const reponse = await get('/etablissements?type=creche,universite').expect(200);

      expect(reponse.body.meta.total).toBe(0);
      expect(reponse.body.data).toEqual([]);
    });

    it('refuse un type inconnu, même noyé parmi des types valides', async () => {
      const reponse = await get('/etablissements?type=lycee,licorne').expect(422);

      expect(reponse.body.code).toBe(ERROR_CODES.VALIDATION_ECHOUEE);
    });

    it('rend les cycles frères d’un groupe, dans l’ordre de la scolarité', async () => {
      const reponse = await get('/etablissements/lycee-al-massira-casablanca').expect(200);

      const { groupe, cycles } = reponse.body.data as {
        groupe: { nom: string } | null;
        cycles: { type: string; actif: boolean; slug: string }[];
      };

      expect(groupe?.nom).toBe('Groupe scolaire Al Massira');

      // L'ordre est celui d'un parcours scolaire, pas l'alphabétique : trié
      // par nom, le lycée passerait avant le primaire.
      expect(cycles.map((c) => c.type)).toEqual(['creche', 'primaire', 'college', 'lycee']);

      // Une seule fiche est marquée active : celle qu'on regarde.
      expect(cycles.filter((c) => c.actif).map((c) => c.slug)).toEqual([
        'lycee-al-massira-casablanca',
      ]);
    });

    it('ne rend aucun cycle pour une fiche hors groupe', async () => {
      const reponse = await get('/etablissements/institut-lumiere-rabat').expect(200);

      // Tableau vide et non nul : le front n'a pas à tester deux formes pour
      // décider s'il affiche le bandeau.
      expect(reponse.body.data.groupe).toBeNull();
      expect(reponse.body.data.cycles).toEqual([]);
    });

    it('rend la galerie complète, ordonnée, SANS PLAFOND', async () => {
      const reponse = await get('/etablissements/lycee-al-massira-casablanca').expect(200);

      const photos = reponse.body.data.photos as { chemin: string; alt: string | null }[];

      // Sept vues sur la fiche vitrine. Aucun `take` ne doit les tronquer :
      // un établissement qui en téléverse quinze doit pouvoir les montrer
      // toutes, sinon c'est l'API qui choisit à sa place.
      expect(photos.length).toBe(7);
      expect(photos[0]?.alt).toBe('Façade');
      expect(photos.map((p) => p.alt)).toContain('Cantine');
    });

    it('ne rend qu’une vignette dans la LISTE — pas la galerie entière', async () => {
      // La liste sert des cartes : y joindre sept photos par fiche
      // multiplierait le poids de la réponse par sept pour n'en afficher
      // qu'une.
      const reponse = await get('/etablissements').expect(200);

      for (const fiche of reponse.body.data as { photo: unknown; photos?: unknown }[]) {
        expect(fiche).not.toHaveProperty('photos');
      }
    });

    it('propose des établissements comparables — même type', async () => {
      const reponse = await get('/etablissements/lycee-al-massira-casablanca/similaires').expect(
        200,
      );

      const similaires = reponse.body.data as { slug: string; type: string }[];

      expect(similaires.length).toBeGreaterThan(0);
      expect(similaires.length).toBeLessThanOrEqual(3);

      for (const autre of similaires) {
        expect(autre.type).toBe('lycee');
        expect(autre.slug).not.toBe('lycee-al-massira-casablanca');
      }
    });

    it('EXCLUT LES CYCLES FRÈRES du même groupe', async () => {
      // Ils ont déjà leur bandeau en haut de page ; les reproposer plus bas
      // donnerait l'impression d'un annuaire qui se répète.
      const reponse = await get('/etablissements/college-al-massira-casablanca/similaires').expect(
        200,
      );

      const slugs = (reponse.body.data as { slug: string }[]).map((e) => e.slug);

      expect(slugs).not.toContain('lycee-al-massira-casablanca');
      expect(slugs).not.toContain('creche-al-massira-casablanca');
    });

    it('n’écarte pas les fiches SANS groupe — le piège du NULL', async () => {
      // `NOT (groupe_id = 5)` vaut INDÉTERMINÉ pour une fiche dont le groupe
      // est nul : la condition écartait alors toutes les fiches hors groupe,
      // c'est-à-dire la majorité, et le bloc restait vide.
      const reponse = await get('/etablissements/college-al-massira-casablanca/similaires').expect(
        200,
      );

      const slugs = (reponse.body.data as { slug: string }[]).map((e) => e.slug);

      expect(slugs).toContain('institut-lumiere-rabat');
    });

    it('répond 404 sur les similaires d’une fiche inconnue', async () => {
      await get('/etablissements/ecole-qui-nexiste-pas/similaires').expect(404);
    });

    it('rend les huit familles de caractéristiques (RG02)', async () => {
      const reponse = await get('/niveau-filieres').expect(200);

      const caracteristiques = reponse.body.data as { libelle: string; categorie: string }[];

      // ON ÉPROUVE LA STRUCTURE, PAS LE DÉCOMPTE. Ce test attendait exactement
      // vingt entrées : ajouter une langue au référentiel le faisait échouer
      // alors que rien n'était cassé. Un référentiel est fait pour s'enrichir,
      // le figer par un nombre revient à interdire qu'il serve.
      const familles = new Set(caracteristiques.map((c) => c.categorie));

      expect([...familles].sort()).toEqual([
        'activite',
        'cursus',
        'domaine',
        'filiere',
        'format',
        'langue',
        'matiere',
        'niveau',
      ]);

      for (const famille of familles) {
        expect(caracteristiques.filter((c) => c.categorie === famille).length).toBeGreaterThan(0);
      }
    });

    it('distingue deux caractéristiques qui partagent un libellé', async () => {
      const reponse = await get('/niveau-filieres').expect(200);

      const caracteristiques = reponse.body.data as {
        id: string;
        libelle: string;
        categorie: string;
      }[];

      // « Sport » est une filière, une activité parascolaire ET une matière :
      // trois lignes distinctes, d'où l'unicité sur le couple
      // (libellé, catégorie). Une unicité sur le seul libellé les confondrait,
      // et cocher l'activité remonterait les lycées à section sportive.
      const sports = caracteristiques.filter((c) => c.libelle === 'Sport');

      expect(sports.map((s) => s.categorie).sort()).toEqual(['activite', 'filiere', 'matiere']);
      expect(new Set(sports.map((s) => s.id)).size).toBe(sports.length);

      // Même chose pour « Informatique », filière et domaine de formation.
      const informatique = caracteristiques.filter((c) => c.libelle === 'Informatique');
      expect(informatique.map((c) => c.categorie).sort()).toEqual(['domaine', 'filiere']);
    });
  });
});
