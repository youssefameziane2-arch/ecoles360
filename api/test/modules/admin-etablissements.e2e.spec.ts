import { promises as fs } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
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
import { monterMedias } from '@/common/stockage/monter-medias';
import { versSlug } from '@/common/texte/slug';
import { prefixeSession } from '@/modules/auth/session.constants';
import { verifierBaseRedisDeTest } from '../helpers/env';

const MOT_DE_PASSE_DEMO = 'motdepasse-de-demonstration';
const ADMIN = 'direction@ecoles360.com';
/** Fiche du compte établissement de démonstration. */
const SLUG = 'lycee-al-massira-casablanca';

/**
 * LE VOLUME DE MÉDIAS EST DÉTOURNÉ VERS UN DOSSIER TEMPORAIRE.
 *
 * Écrit AVANT l'import du module applicatif — `ConfigModule` lit
 * `process.env` à la construction, et une affectation dans `beforeAll`
 * arriverait trop tard. Sans cela, la suite sèmerait des JPEG dans le vrai
 * volume `storage/` du poste de développement.
 */
const RACINE_MEDIAS = mkdtempSync(join(tmpdir(), 'ecoles360-medias-'));
process.env.STOCKAGE_RACINE = RACINE_MEDIAS;

/**
 * Création de fiche et galerie photo — back-office admin (livrable 11 §3.4).
 *
 * CE QUI EST ÉPROUVÉ ICI, C'EST LE COUPLE FICHIER / LIGNE. Une galerie a ceci
 * de particulier qu'elle vit à deux endroits : une ligne en base et un octet
 * sur un disque. Les tests qui comptent sont donc ceux qui vérifient que les
 * deux bougent ensemble — et que ce qu'on refuse n'atteint jamais le disque.
 */
describe('Back-office admin — fiches et galerie (intégration)', () => {
  let app: NestExpressApplication;
  let db: PrismaService;
  let redis: RedisService;

  beforeAll(async () => {
    verifierBaseRedisDeTest(process.env.REDIS_URL ?? '');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
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

    // Le même montage que `main.ts` — c'est le lien entre le chemin persisté
    // et l'emplacement réel du fichier qui est éprouvé plus bas.
    monterMedias(app);

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
    await fs.rm(RACINE_MEDIAS, { recursive: true, force: true });
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

  /** Identifiant de la ville de Casablanca, du référentiel. */
  async function casablanca(): Promise<number> {
    const ville = await db.ville.findUniqueOrThrow({ where: { slug: 'casablanca' } });

    return Number(ville.id);
  }

  /** Fiche jetable, pour ne pas abîmer celles de la démonstration. */
  async function ficheJetable(nom: string) {
    const admin = await connecte(ADMIN);
    const reponse = await admin
      .post('/admin/etablissements')
      .send({ nom, ville_id: await casablanca(), type: 'primaire' })
      .expect(201);

    return { admin, fiche: reponse.body.data as { id: string; slug: string; nom: string } };
  }

  /** `/media/etablissements/3/ab…jpg` → chemin réel dans le volume temporaire. */
  function surLeDisque(cheminPublic: string): string {
    return join(RACINE_MEDIAS, cheminPublic.replace('/media/', ''));
  }

  // ---------------------------------------------------------------------------
  //  Création d'une fiche
  // ---------------------------------------------------------------------------

  describe('création d’une fiche', () => {
    it('refuse un compte établissement (RG25)', async () => {
      const ecole = await connecte('contact@almassira.ma');

      await ecole
        .post('/admin/etablissements')
        .send({ nom: 'Fiche interdite', ville_id: await casablanca(), type: 'primaire' })
        .expect(403);
    });

    it('crée la fiche « en attente », sans propriétaire (RG03, RG04)', async () => {
      const { fiche } = await ficheJetable('École Test Statut');

      const cree = await db.etablissement.findUniqueOrThrow({ where: { id: BigInt(fiche.id) } });

      expect(cree.statut).toBe('en_attente');
      expect(cree.proprietaire_user_id).toBeNull();
      // Elle ne doit PAS apparaître au public tant qu'elle n'est pas validée.
      await request(app.getHttpServer()).get(`/api/v1/etablissements/${fiche.slug}`).expect(404);
    });

    /**
     * Le nom porte un horodatage parce que LA SUITE TOURNE SUR UNE BASE QUI
     * N'EST PAS REMISE À ZÉRO : un libellé fixe collisionnerait avec les
     * exécutions précédentes, et le test mesurerait alors l'historique du
     * poste plutôt que la règle. La collision qui l'intéresse, il la
     * provoque lui-même, dans la même exécution.
     */
    it('fabrique un slug qui porte la ville, et le rend unique', async () => {
      const nom = `Groupe Homonyme ${Date.now()}`;
      const attendu = `${versSlug(nom)}-casablanca`;

      const premiere = await ficheJetable(nom);
      const seconde = await premiere.admin
        .post('/admin/etablissements')
        .send({ nom, ville_id: await casablanca(), type: 'college' })
        .expect(201);

      expect(premiere.fiche.slug).toBe(attendu);
      expect(seconde.body.data.slug).toBe(`${attendu}-2`);
    });

    it('journalise la création (RG15)', async () => {
      const { fiche } = await ficheJetable('École Test Journal');

      const trace = await db.journalAudit.findFirst({
        where: { action: 'etablissement.creation', cible_id: BigInt(fiche.id) },
      });

      expect(trace).not.toBeNull();
      expect(trace!.role_acteur).toBe('superadmin');
    });

    it('refuse une ville inconnue', async () => {
      const admin = await connecte(ADMIN);
      const reponse = await admin
        .post('/admin/etablissements')
        .send({ nom: 'École Sans Ville', ville_id: 999_999, type: 'primaire' })
        .expect(422);

      expect(reponse.body.code).toBe(ERROR_CODES.VALIDATION_ECHOUEE);
    });

    it('refuse un budget minimum supérieur au maximum', async () => {
      const admin = await connecte(ADMIN);

      await admin
        .post('/admin/etablissements')
        .send({
          nom: 'École Budget Absurde',
          ville_id: await casablanca(),
          type: 'primaire',
          budget_min: 50_000,
          budget_max: 20_000,
        })
        .expect(422);
    });

    /**
     * RG27 — les attributs de plateforme ne se demandent pas.
     *
     * Le `ValidationPipe` en `forbidNonWhitelisted` est la garde : elle tient
     * parce que le DTO ne déclare pas ces champs, et ce test est là pour
     * qu'on le remarque si quelqu'un les y ajoute par commodité.
     */
    it('refuse « sponsorise » dans la charge utile (RG27)', async () => {
      const admin = await connecte(ADMIN);

      await admin
        .post('/admin/etablissements')
        .send({
          nom: 'École Auto-Sponsorisée',
          ville_id: await casablanca(),
          type: 'primaire',
          sponsorise: true,
        })
        .expect(422);
    });

    it('rattache au groupe scolaire nommé, en le créant au besoin', async () => {
      const admin = await connecte(ADMIN);
      const ville_id = await casablanca();

      const maternelle = await admin
        .post('/admin/etablissements')
        .send({ nom: 'Al Fajr Maternelle', ville_id, type: 'creche', groupe: 'Groupe Al Fajr' })
        .expect(201);

      const primaire = await admin
        .post('/admin/etablissements')
        .send({ nom: 'Al Fajr Primaire', ville_id, type: 'primaire', groupe: 'Groupe Al Fajr' })
        .expect(201);

      const fiches = await db.etablissement.findMany({
        where: { id: { in: [BigInt(maternelle.body.data.id), BigInt(primaire.body.data.id)] } },
        select: { groupe_id: true },
      });

      expect(fiches[0]!.groupe_id).not.toBeNull();
      expect(fiches[0]!.groupe_id).toBe(fiches[1]!.groupe_id);
    });

    it('vide en NULL un champ facultatif laissé blanc', async () => {
      const admin = await connecte(ADMIN);
      const reponse = await admin
        .post('/admin/etablissements')
        .send({
          nom: 'École Champs Vides',
          ville_id: await casablanca(),
          type: 'primaire',
          tel: '   ',
          email: '',
        })
        .expect(201);

      const cree = await db.etablissement.findUniqueOrThrow({
        where: { id: BigInt(reponse.body.data.id) },
      });

      expect(cree.tel).toBeNull();
      expect(cree.email).toBeNull();
    });

    it('ignore une caractéristique inconnue plutôt que de perdre la saisie', async () => {
      const admin = await connecte(ADMIN);
      const reelle = await db.niveauFiliere.findFirstOrThrow({ where: { categorie: 'langue' } });

      const reponse = await admin
        .post('/admin/etablissements')
        .send({
          nom: 'École Caractéristiques',
          ville_id: await casablanca(),
          type: 'primaire',
          caracteristiques: [Number(reelle.id), 999_999],
        })
        .expect(201);

      const niveaux = await db.etablissementNiveau.findMany({
        where: { etablissement_id: BigInt(reponse.body.data.id) },
      });

      expect(niveaux).toHaveLength(1);
      expect(niveaux[0]!.niveau_id).toBe(reelle.id);
    });
  });

  // ---------------------------------------------------------------------------
  //  Galerie photo
  // ---------------------------------------------------------------------------

  describe('galerie photo', () => {
    it('téléverse, écrit le fichier sur le volume et le sert', async () => {
      const { admin, fiche } = await ficheJetable('École Galerie Ajout');

      const reponse = await admin
        .post(`/admin/etablissements/${fiche.id}/photos`)
        .attach('photos', png(), 'cour-de-recreation.png')
        .expect(201);

      const [photo] = reponse.body.data as { chemin: string; alt: string; ordre: number }[];

      expect(photo!.chemin).toMatch(/^\/media\/etablissements\/\d+\/[0-9a-f]{32}\.png$/);
      expect(photo!.ordre).toBe(0);
      // La légende est devinée du nom du fichier : un champ pré-rempli se corrige.
      expect(photo!.alt).toBe('Cour de recreation');

      await expect(fs.stat(surLeDisque(photo!.chemin))).resolves.toBeDefined();
      await request(app.getHttpServer()).get(photo!.chemin).expect(200);
    });

    it('ne devine pas de légende à partir d’un nom d’appareil photo', async () => {
      const { admin, fiche } = await ficheJetable('École Galerie Légende');

      const reponse = await admin
        .post(`/admin/etablissements/${fiche.id}/photos`)
        .attach('photos', png(), 'IMG_2043.png')
        .expect(201);

      expect(reponse.body.data[0].alt).toBeNull();
    });

    it('accepte plusieurs fichiers d’un coup et les range à la suite', async () => {
      const { admin, fiche } = await ficheJetable('École Galerie Multiple');

      const reponse = await admin
        .post(`/admin/etablissements/${fiche.id}/photos`)
        .attach('photos', png(), 'facade.png')
        .attach('photos', png(), 'cantine.png')
        .expect(201);

      expect(reponse.body.data.map((p: { ordre: number }) => p.ordre)).toEqual([0, 1]);

      // Un second envoi continue la numérotation, il ne la recommence pas.
      const suite = await admin
        .post(`/admin/etablissements/${fiche.id}/photos`)
        .attach('photos', png(), 'gymnase.png')
        .expect(201);

      expect(suite.body.data.map((p: { ordre: number }) => p.ordre)).toEqual([0, 1, 2]);
    });

    /**
     * LE `Content-Type` D'UN MULTIPART EST ÉCRIT PAR LE CLIENT.
     *
     * Annoncer `image/png` sur un exécutable suffirait à le déposer dans un
     * dossier servi en statique. Seule la signature réelle des premiers octets
     * ne se déclare pas — c'est elle qui décide ici.
     */
    it('refuse un fichier qui ment sur son type, sans rien écrire', async () => {
      const { admin, fiche } = await ficheJetable('École Galerie Imposteur');

      const reponse = await admin
        .post(`/admin/etablissements/${fiche.id}/photos`)
        .attach('photos', Buffer.from('MZ\x90\x00 pas une image du tout'), {
          filename: 'piege.png',
          contentType: 'image/png',
        })
        .expect(422);

      expect(reponse.body.code).toBe(ERROR_CODES.VALIDATION_ECHOUEE);

      const restees = await db.photo.count({ where: { etablissement_id: BigInt(fiche.id) } });
      expect(restees).toBe(0);
    });

    it('refuse un format non géré', async () => {
      const { admin, fiche } = await ficheJetable('École Galerie Format');

      await admin
        .post(`/admin/etablissements/${fiche.id}/photos`)
        .attach('photos', Buffer.from('%PDF-1.7 et la suite'), {
          filename: 'plaquette.pdf',
          contentType: 'application/pdf',
        })
        .expect(422);
    });

    it('remplace le fichier en gardant la place et la légende', async () => {
      const { admin, fiche } = await ficheJetable('École Galerie Remplacement');

      const initiale = await admin
        .post(`/admin/etablissements/${fiche.id}/photos`)
        .attach('photos', png(), 'facade.png')
        .attach('photos', png(), 'cantine.png')
        .expect(201);

      const cible = initiale.body.data[0] as { id: string; chemin: string; alt: string };

      const apres = await admin
        .put(`/admin/etablissements/${fiche.id}/photos/${cible.id}`)
        .attach('photo', png(), 'facade-corrigee.png')
        .expect(200);

      const remplacee = apres.body.data.find((p: { id: string }) => p.id === cible.id);

      expect(remplacee.chemin).not.toBe(cible.chemin);
      expect(remplacee.ordre).toBe(0);
      expect(remplacee.alt).toBe(cible.alt); // la légende survit au remplacement

      // L'ancien fichier a quitté le volume, le nouveau y est.
      await expect(fs.stat(surLeDisque(cible.chemin))).rejects.toThrow();
      await expect(fs.stat(surLeDisque(remplacee.chemin))).resolves.toBeDefined();
    });

    it('refuse de toucher la photo d’une autre fiche', async () => {
      const premiere = await ficheJetable('École Galerie Portée A');
      const seconde = await ficheJetable('École Galerie Portée B');

      const photo = await premiere.admin
        .post(`/admin/etablissements/${premiere.fiche.id}/photos`)
        .attach('photos', png(), 'facade.png')
        .expect(201);

      const id = photo.body.data[0].id as string;

      await seconde.admin
        .delete(`/admin/etablissements/${seconde.fiche.id}/photos/${id}`)
        .expect(404);

      // Elle est toujours là.
      await expect(
        db.photo.findUniqueOrThrow({ where: { id: BigInt(id) } }),
      ).resolves.toBeDefined();
    });

    it('supprime la ligne, le fichier, et referme le trou d’ordre', async () => {
      const { admin, fiche } = await ficheJetable('École Galerie Suppression');

      const galerie = await admin
        .post(`/admin/etablissements/${fiche.id}/photos`)
        .attach('photos', png(), 'un.png')
        .attach('photos', png(), 'deux.png')
        .attach('photos', png(), 'trois.png')
        .expect(201);

      const milieu = galerie.body.data[1] as { id: string; chemin: string };

      const restantes = await admin
        .delete(`/admin/etablissements/${fiche.id}/photos/${milieu.id}`)
        .expect(200);

      // SANS COMPACTAGE, les rangs seraient 0 et 2 — et le prochain ajout
      // reprendrait à 3 en laissant un vide définitif.
      expect(restantes.body.data.map((p: { ordre: number }) => p.ordre)).toEqual([0, 1]);
      await expect(fs.stat(surLeDisque(milieu.chemin))).rejects.toThrow();
    });

    it('réordonne la galerie', async () => {
      const { admin, fiche } = await ficheJetable('École Galerie Ordre');

      const galerie = await admin
        .post(`/admin/etablissements/${fiche.id}/photos`)
        .attach('photos', png(), 'un.png')
        .attach('photos', png(), 'deux.png')
        .expect(201);

      const ids = (galerie.body.data as { id: string }[]).map((p) => p.id);

      const apres = await admin
        .put(`/admin/etablissements/${fiche.id}/photos/ordre`)
        .send({ ids: [...ids].reverse() })
        .expect(200);

      expect(apres.body.data.map((p: { id: string }) => p.id)).toEqual([...ids].reverse());
    });

    it('refuse un ordre partiel plutôt que de deviner (409)', async () => {
      const { admin, fiche } = await ficheJetable('École Galerie Ordre Partiel');

      const galerie = await admin
        .post(`/admin/etablissements/${fiche.id}/photos`)
        .attach('photos', png(), 'un.png')
        .attach('photos', png(), 'deux.png')
        .expect(201);

      const reponse = await admin
        .put(`/admin/etablissements/${fiche.id}/photos/ordre`)
        .send({ ids: [galerie.body.data[0].id] })
        .expect(409);

      expect(reponse.body.code).toBe(ERROR_CODES.CONFLIT_METIER);
    });

    it('modifie la légende, et la journalise', async () => {
      const { admin, fiche } = await ficheJetable('École Galerie Cartouche');

      const galerie = await admin
        .post(`/admin/etablissements/${fiche.id}/photos`)
        .attach('photos', png(), 'facade.png')
        .expect(201);

      const id = galerie.body.data[0].id as string;

      const apres = await admin
        .patch(`/admin/etablissements/${fiche.id}/photos/${id}`)
        .send({ alt: 'Façade côté rue' })
        .expect(200);

      expect(apres.body.data[0].alt).toBe('Façade côté rue');

      const trace = await db.journalAudit.findFirst({
        where: { action: 'etablissement.photos.legende', cible_id: BigInt(fiche.id) },
      });

      expect(trace).not.toBeNull();
    });

    it('sert la galerie à la fiche publique une fois validée', async () => {
      const { admin, fiche } = await ficheJetable('École Galerie Publique');

      await admin
        .post(`/admin/etablissements/${fiche.id}/photos`)
        .attach('photos', png(), 'facade.png')
        .expect(201);

      await admin.post(`/admin/etablissements/${fiche.id}/essai-gratuit`).expect(204);
      await admin
        .patch(`/admin/etablissements/${fiche.id}/statut`)
        .send({ statut: 'validee' })
        .expect(204);

      const publique = await request(app.getHttpServer())
        .get(`/api/v1/etablissements/${fiche.slug}`)
        .expect(200);

      expect(publique.body.data.photos).toHaveLength(1);
      expect(publique.body.data.photos[0].chemin).toMatch(/^\/media\//);
    });

    it('répond 404 sur la galerie d’une fiche inexistante', async () => {
      const admin = await connecte(ADMIN);

      await admin.get('/admin/etablissements/999999/photos').expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  //  La même galerie, côté espace établissement — RG05
  // ---------------------------------------------------------------------------

  describe('galerie depuis l’espace établissement', () => {
    /** Fiche d'Al Massira — celle que porte le compte de démonstration. */
    async function ficheDuCompte() {
      return db.etablissement.findUniqueOrThrow({ where: { slug: SLUG } });
    }

    it('téléverse sur SA fiche, et nulle part ailleurs', async () => {
      const ecole = await connecte('contact@almassira.ma');
      const fiche = await ficheDuCompte();

      const avant = await db.photo.count({ where: { etablissement_id: fiche.id } });

      const galerie = await ecole
        .post('/mon-espace/fiche/photos')
        .attach('photos', png(), 'preau.png')
        .expect(201);

      expect(galerie.body.data).toHaveLength(avant + 1);

      // Aucune route ne prend d'identifiant d'établissement : la fiche vient
      // de la SESSION. C'est ce qui rend la portée infranchissable ici.
      const ajoutee = galerie.body.data.at(-1) as { id: string; chemin: string };
      await expect(fs.stat(surLeDisque(ajoutee.chemin))).resolves.toBeDefined();

      await ecole.delete(`/mon-espace/fiche/photos/${ajoutee.id}`).expect(200);
    });

    /**
     * RG05 — la portée déléguée vaut aussi pour la galerie.
     *
     * Yassine porte `fiches` et `contacts` ; le test vérifie qu'il PEUT, là où
     * une portée absente refuserait. Sans cette assertion, on ne saurait pas
     * si le décorateur `@PorteeEspace(fiches)` a bien été posé sur ces routes.
     */
    it('autorise un secrétariat qui porte la portée « fiches »', async () => {
      const yassine = await connecte('yassine.b@ecoles360.com');

      await yassine.get('/mon-espace/fiche/photos').expect(200);
    });

    it('journalise avec le rôle réel de l’acteur, pas « établissement »', async () => {
      const yassine = await connecte('yassine.b@ecoles360.com');
      const fiche = await ficheDuCompte();

      const galerie = await yassine
        .post('/mon-espace/fiche/photos')
        .attach('photos', png(), 'salle-informatique.png')
        .expect(201);

      const ajoutee = galerie.body.data.at(-1) as { id: string };

      const trace = await db.journalAudit.findFirst({
        where: { action: 'etablissement.photos.ajout', cible_id: fiche.id },
        orderBy: { id: 'desc' },
      });

      expect(trace!.role_acteur).toBe('secretariat');

      await yassine.delete(`/mon-espace/fiche/photos/${ajoutee.id}`).expect(200);
    });

    it('refuse de remplacer la photo d’une autre école', async () => {
      const { admin, fiche } = await ficheJetable('École Portée Espace');

      const etrangere = await admin
        .post(`/admin/etablissements/${fiche.id}/photos`)
        .attach('photos', png(), 'facade.png')
        .expect(201);

      const ecole = await connecte('contact@almassira.ma');

      await ecole
        .put(`/mon-espace/fiche/photos/${etrangere.body.data[0].id}`)
        .attach('photo', png(), 'detournement.png')
        .expect(404);
    });

    it('refuse un commercial (RG25)', async () => {
      const commercial = await connecte('younes.c@ecoles360.com');

      await commercial.get('/mon-espace/fiche/photos').expect(403);
    });
  });
});

/**
 * Un PNG 1×1 valide, fabriqué plutôt que collé en base64.
 *
 * La signature et les CRC sont calculés ici : un blob opaque dans le fichier
 * de test n'apprendrait rien sur CE QUI est vérifié côté serveur — à savoir
 * les huit premiers octets.
 */
function png(): Buffer {
  const morceau = (type: string, contenu: Buffer): Buffer => {
    const entete = Buffer.alloc(4);
    entete.writeUInt32BE(contenu.length);

    const corps = Buffer.concat([Buffer.from(type, 'ascii'), contenu]);
    const controle = Buffer.alloc(4);
    controle.writeUInt32BE(crc32(corps) >>> 0);

    return Buffer.concat([entete, corps, controle]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0); // largeur
  ihdr.writeUInt32BE(1, 4); // hauteur
  ihdr[8] = 8; // 8 bits par canal
  ihdr[9] = 2; // couleur vraie (RVB)

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    morceau('IHDR', ihdr),
    morceau('IDAT', deflateSync(Buffer.from([0x00, 0xff, 0xff, 0xff]))),
    morceau('IEND', Buffer.alloc(0)),
  ]);
}

/** CRC-32 des morceaux PNG — table calculée à la volée. */
function crc32(donnees: Buffer): number {
  let crc = ~0;

  for (const octet of donnees) {
    crc ^= octet;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return ~crc;
}
