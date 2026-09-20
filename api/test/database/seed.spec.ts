import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@/database/database.module';
import { SeedCommand } from '@/database/seed.command';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * Seeders — livrable 10 §3.
 *
 * Exécutés contre la MySQL 8 réelle (livrable 13 §1). Ce qui est vérifié ici
 * n'est pas « les données existent » — le seeder vient de les écrire — mais les
 * deux GARANTIES sur lesquelles repose toute la chaîne :
 *
 *   1. l'IDEMPOTENCE, qui permet de rejouer la commande à chaque déploiement
 *      sans réfléchir. Sans elle, un second `db:seed` doublerait les villes et
 *      les fiches, et personne ne s'en apercevrait avant une liste déroulante
 *      pleine de doublons ;
 *   2. le REFUS EN PRODUCTION, qui empêche de poser des comptes aux mots de
 *      passe connus à côté de vraies fiches clientes. C'est une garantie de
 *      sécurité, pas une commodité.
 */
describe('Seeders (base réelle)', () => {
  let moduleRef: TestingModule;
  let db: PrismaService;

  /**
   * Monte la CLI avec l'environnement demandé.
   *
   * `process.env.NODE_ENV` est surchargé pour de vrai, et non injecté par la
   * configuration du module : `ConfigService.get()` consulte `process.env`
   * AVANT les valeurs passées à `load`, si bien qu'une surcharge par là serait
   * ignorée. Le test doit reproduire la condition réelle — sans quoi il
   * vérifierait un garde-fou qui n'a jamais été sollicité, et passerait au vert
   * en ne testant rien.
   */
  async function creerModule(nodeEnv: string): Promise<TestingModule> {
    process.env.NODE_ENV = nodeEnv;

    return Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
        }),
        PrismaModule,
        DatabaseModule,
      ],
    }).compile();
  }

  /** Vide les tables touchées par les seeders, dans l'ordre des dépendances. */
  async function viderBase(prisma: PrismaService): Promise<void> {
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');

    for (const table of [
      'lead_suivis',
      'leads',
      'journal_audits',
      'propositions_fiche',
      'articles',
      'signalements',
      'avis',
      'demande_contacts',
      'factures',
      'abonnements',
      'relances',
      'prospects',
      'permissions',
      'etablissement_niveau',
      'etablissements',
      'users',
      'faq_items',
      'pages_cms',
      'parametres_facturation',
      'niveau_filieres',
      'villes',
      'roles',
    ]) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\``);
    }

    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
  }

  const environnementInitial = process.env.NODE_ENV;

  afterEach(async () => {
    await moduleRef?.close();
    process.env.NODE_ENV = environnementInitial;
  });

  describe('développement', () => {
    it('reconstruit une base de démonstration complète depuis zéro', async () => {
      moduleRef = await creerModule('development');
      db = moduleRef.get(PrismaService);
      await db.$connect();
      await viderBase(db);

      await moduleRef.get(SeedCommand).run([]);

      // Référentiels — sans eux, rien ne peut être créé.
      expect(await db.role.count()).toBe(4); // RG25
      expect(await db.ville.count()).toBe(12); // RG01
      expect(await db.parametreFacturation.count()).toBeGreaterThan(0);

      // Données de démonstration — les écrans des maquettes ont de quoi vivre.
      expect(await db.user.count()).toBeGreaterThan(0);
      expect(await db.etablissement.count()).toBeGreaterThan(0);
      expect(await db.lead.count()).toBe(8); // le kanban des maquettes

      // La fiche vitrine porte bien les valeurs conçues.
      const almassira = await db.etablissement.findUniqueOrThrow({
        where: { slug: 'lycee-al-massira-casablanca' },
      });
      expect(almassira.note_moy.toString()).toBe('4.8');
      expect(almassira.nb_avis).toBe(142);
      expect(almassira.statut).toBe('validee');
    });

    it('est idempotent : un second passage ne duplique rien', async () => {
      moduleRef = await creerModule('development');
      db = moduleRef.get(PrismaService);
      await db.$connect();

      const commande = moduleRef.get(SeedCommand);
      await commande.run([]);

      const avant = {
        villes: await db.ville.count(),
        users: await db.user.count(),
        etablissements: await db.etablissement.count(),
        leads: await db.lead.count(),
        avis: await db.avis.count(),
        articles: await db.article.count(),
        audits: await db.journalAudit.count(),
      };

      await commande.run([]);

      expect({
        villes: await db.ville.count(),
        users: await db.user.count(),
        etablissements: await db.etablissement.count(),
        leads: await db.lead.count(),
        avis: await db.avis.count(),
        articles: await db.article.count(),
        audits: await db.journalAudit.count(),
      }).toEqual(avant);
    });

    it('hache les mots de passe en Argon2id, jamais en clair', async () => {
      moduleRef = await creerModule('development');
      db = moduleRef.get(PrismaService);
      await db.$connect();
      await moduleRef.get(SeedCommand).run([]);

      const admin = await db.user.findUniqueOrThrow({
        where: { email: 'direction@ecoles360.com' },
      });

      expect(admin.passwordHash).toMatch(/^\$argon2id\$/);
    });
  });

  describe('production', () => {
    it('pose les référentiels mais REFUSE les données de démonstration', async () => {
      moduleRef = await creerModule('production');
      db = moduleRef.get(PrismaService);
      await db.$connect();
      await viderBase(db);

      await moduleRef.get(SeedCommand).run([]);

      // Les référentiels sont indispensables partout.
      expect(await db.role.count()).toBe(4);
      expect(await db.ville.count()).toBe(12);
      expect(await db.parametreFacturation.count()).toBeGreaterThan(0);

      // Les comptes aux mots de passe connus n'ont rien à faire en production.
      expect(await db.user.count()).toBe(0);
      expect(await db.etablissement.count()).toBe(0);
      expect(await db.lead.count()).toBe(0);
    });
  });
});
