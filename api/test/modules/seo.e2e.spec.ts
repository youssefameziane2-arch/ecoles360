import { HttpStatus, type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { ValidationException } from '@/common/errors';
import { DatabaseModule } from '@/database/database.module';
import { DemoSeeder } from '@/database/seeders/demo.seeder';
import { ReferentielsSeeder } from '@/database/seeders/referentiels.seeder';
import { PrismaService } from '@/prisma/prisma.service';
import { verifierBaseRedisDeTest } from '../helpers/env';

/**
 * Plan de site — référencement du site public.
 *
 * TROIS DÉFAUTS POSSIBLES, TOUS SILENCIEUX, aucun visible au typage ni au
 * lint. Le fichier peut répondre 401 sous la garde de session globale ; il
 * peut atterrir sous `api/v1`, là où aucun robot ne le cherche ; il peut
 * lister une fiche non validée, ce qui révélerait à Google une fiche que
 * l'API refuse de montrer (RG03) et lui livrerait un lien mort. Rien ne les
 * signale côté serveur — seulement l'absence de trafic, des mois plus tard.
 */
describe('Plan de site (intégration)', () => {
  let app: INestApplication;
  let db: PrismaService;

  beforeAll(async () => {
    verifierBaseRedisDeTest(process.env.REDIS_URL ?? '');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
    }).compile();

    app = moduleRef.createNestApplication();
    db = moduleRef.get(PrismaService);

    // LA MÊME EXCLUSION QUE `main.ts`, et c'est tout l'objet du premier test :
    // sans elle la route vivrait sous `api/v1`, où aucun robot ne la cherche.
    app.setGlobalPrefix('api/v1', { exclude: ['sitemap.xml'] });
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
    await referentiels.contenuSite();

    const demo = moduleRef.get(DemoSeeder);
    await demo.donnees(await demo.comptes());
  });

  afterAll(async () => {
    await app.close();
  });

  const plan = () => request(app.getHttpServer()).get('/sitemap.xml');

  it('se sert à la racine, sans session, en XML', async () => {
    const reponse = await plan().expect(200);

    expect(reponse.headers['content-type']).toContain('application/xml');
    expect(reponse.text).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(reponse.text).toContain('http://www.sitemaps.org/schemas/sitemap/0.9');
  });

  it('n’existe pas sous le préfixe de l’API', async () => {
    await request(app.getHttpServer()).get('/api/v1/sitemap.xml').expect(404);
  });

  it('n’est pas enveloppé dans {data, meta, links}', async () => {
    const reponse = await plan().expect(200);
    expect(reponse.text).not.toContain('"data"');
  });

  /**
   * LE TEST QUI COMPTE. Une fiche non validée dans ce fichier, et Google
   * apprend l'existence de ce que la RG03 cache — puis reçoit un 404 en
   * allant voir.
   */
  it('ne liste que les fiches validées (RG03)', async () => {
    const reponse = await plan().expect(200);

    const [validees, cachees] = await Promise.all([
      db.etablissement.findMany({ where: { statut: 'validee' }, select: { slug: true } }),
      db.etablissement.findMany({
        where: { statut: { not: 'validee' } },
        select: { slug: true },
      }),
    ]);

    expect(validees.length).toBeGreaterThan(0);

    for (const fiche of validees) {
      expect(reponse.text).toContain(`/etablissements/${fiche.slug}<`);
    }

    for (const fiche of cachees) {
      expect(reponse.text).not.toContain(`/etablissements/${fiche.slug}<`);
    }
  });

  /**
   * Une ville sans fiche validée a bien une page, mais elle n'affiche rien.
   * Indexée, elle dessert le référencement du reste du site.
   */
  it('n’annonce que les villes qui portent au moins une fiche validée', async () => {
    const reponse = await plan().expect(200);

    const vides = await db.ville.findMany({
      where: { etablissements: { none: { statut: 'validee' } } },
      select: { slug: true },
    });

    for (const ville of vides) {
      expect(reponse.text).not.toContain(`/villes/${ville.slug}<`);
    }
  });

  it('porte les trois pages légales (RG09)', async () => {
    const reponse = await plan().expect(200);

    for (const cle of ['mentions-legales', 'confidentialite', 'cookies']) {
      expect(reponse.text).toContain(`/${cle}<`);
    }
  });

  it('donne des URL absolues, jamais relatives', async () => {
    const reponse = await plan().expect(200);

    const locs = [...reponse.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);

    expect(locs.length).toBeGreaterThan(5);
    // Un chemin relatif est ignoré par les moteurs, en silence.
    for (const loc of locs) {
      expect(loc).toMatch(/^https?:\/\//);
    }
  });
});
