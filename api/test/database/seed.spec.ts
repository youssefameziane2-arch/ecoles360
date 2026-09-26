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

  /**
   * Vide toute la base de test, sauf l'historique des migrations.
   *
   * LA LISTE EST DEMANDÉE À MySQL, PAS ÉCRITE À LA MAIN. Une liste tenue
   * manuellement dérive silencieusement dès qu'un modèle s'ajoute — `photos`
   * y manquait, et comme `TRUNCATE etablissements` remet l'auto-incrément à
   * zéro, les fiches créées ensuite héritaient des photos de fiches
   * disparues. Une suite d'après s'est mise à compter des images fantômes,
   * sans que rien ne pointe vers ce fichier.
   */
  async function viderBase(prisma: PrismaService): Promise<void> {
    const tables = await prisma.$queryRaw<{ TABLE_NAME: string }[]>`
      SELECT TABLE_NAME
        FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_TYPE = 'BASE TABLE'
         AND TABLE_NAME <> '_prisma_migrations'
    `;

    // Les contraintes sont coupées le temps du nettoyage : un ordre de
    // dépendances correct existerait, mais il faudrait le maintenir lui aussi.
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');

    for (const { TABLE_NAME } of tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${TABLE_NAME}\``);
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

      const almassira = await db.etablissement.findUniqueOrThrow({
        where: { slug: 'lycee-al-massira-casablanca' },
      });
      expect(almassira.statut).toBe('validee');

      // LA FICHE NE MENT PAS SUR SES AVIS (RG08).
      //
      // Ce test vérifiait auparavant des valeurs d'affichage — 4,8 de moyenne
      // pour 142 avis — alors que trois avis existaient en base. Il verrouillait
      // donc l'incohérence au lieu de la détecter : à la première décision de
      // modération, `recalculerNote` aurait ramené la fiche à la réalité et
      // fait chuter le compteur sous les yeux de l'administrateur.
      //
      // On éprouve désormais l'invariant, pas le chiffre : ce qui est affiché
      // correspond exactement aux avis publiés.
      const reel = await db.avis.aggregate({
        where: { etablissement_id: almassira.id, statut: 'publie' },
        _avg: { note: true },
        _count: { _all: true },
      });

      expect(almassira.nb_avis).toBe(reel._count._all);
      expect(Number(almassira.note_moy)).toBeCloseTo(
        reel._avg.note ? Math.round(reel._avg.note * 10) / 10 : 0,
        1,
      );
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
