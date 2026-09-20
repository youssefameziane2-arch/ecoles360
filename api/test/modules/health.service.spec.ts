import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { HealthService } from '@/modules/health/health.service';
import { StatutDependance, StatutSante } from '@/modules/health/dto/health-response.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';

/**
 * Unitaires de la sonde — livrable 13 §2.1.
 *
 * Le module réduit est monté par `Test.createTestingModule()` (le conteneur de
 * dépendances réel), les deux dépendances externes étant remplacées par des
 * doubles : ce qui est éprouvé ici est la LOGIQUE de la sonde — agrégation,
 * expiration, confinement des erreurs — et non la connectivité, couverte par
 * la suite d'intégration contre MySQL et Redis réelles.
 */
describe('HealthService', () => {
  const TIMEOUT_MS = 150;

  interface Doubles {
    prisma: { verifierConnexion: jest.Mock };
    redis: { verifierConnexion: jest.Mock };
  }

  async function creerService(doubles: Doubles): Promise<HealthService> {
    const moduleRef = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: doubles.prisma },
        { provide: RedisService, useValue: doubles.redis },
        {
          provide: ConfigService,
          useValue: {
            get: (cle: string, defaut: unknown) =>
              cle === 'HEALTH_CHECK_TIMEOUT_MS'
                ? TIMEOUT_MS
                : cle === 'APP_VERSION'
                  ? '9.9.9'
                  : defaut,
          },
        },
      ],
    }).compile();

    return moduleRef.get(HealthService);
  }

  const repond = (): jest.Mock => jest.fn().mockResolvedValue(undefined);
  const echoue = (message: string): jest.Mock => jest.fn().mockRejectedValue(new Error(message));

  it('rapporte « ok » quand les deux dépendances répondent', async () => {
    const service = await creerService({
      prisma: { verifierConnexion: repond() },
      redis: { verifierConnexion: repond() },
    });

    const rapport = await service.verifier();

    expect(rapport.statut).toBe(StatutSante.Ok);
    expect(rapport.dependances.mysql.statut).toBe(StatutDependance.Ok);
    expect(rapport.dependances.redis.statut).toBe(StatutDependance.Ok);
    expect(rapport.version).toBe('9.9.9');
    expect(rapport.duree_ms).toBeGreaterThanOrEqual(0);
  });

  it('rapporte « degrade » dès qu’une seule dépendance échoue', async () => {
    const service = await creerService({
      prisma: { verifierConnexion: echoue('connect ECONNREFUSED 127.0.0.1:3306') },
      redis: { verifierConnexion: repond() },
    });

    const rapport = await service.verifier();

    expect(rapport.statut).toBe(StatutSante.Degrade);
    expect(rapport.dependances.mysql.statut).toBe(StatutDependance.Erreur);
    expect(rapport.dependances.mysql.erreur).toContain('ECONNREFUSED');
    expect(rapport.dependances.redis.statut).toBe(StatutDependance.Ok);
  });

  it('vérifie chaque dépendance même quand l’autre est déjà en échec', async () => {
    // Un diagnostic partiel fait rouvrir l'incident : le rapport doit être complet.
    const doubles: Doubles = {
      prisma: { verifierConnexion: echoue('MySQL absente') },
      redis: { verifierConnexion: echoue('Redis absente') },
    };
    const service = await creerService(doubles);

    const rapport = await service.verifier();

    expect(doubles.prisma.verifierConnexion).toHaveBeenCalledTimes(1);
    expect(doubles.redis.verifierConnexion).toHaveBeenCalledTimes(1);
    expect(rapport.dependances.mysql.erreur).toBe('MySQL absente');
    expect(rapport.dependances.redis.erreur).toBe('Redis absente');
  });

  it('déclare en échec une dépendance qui ne répond pas dans le délai imparti', async () => {
    // Une base qui accepte la connexion sans jamais répondre est le cas qui
    // ferait expirer la requête HTTP au lieu de produire un 503 exploitable.
    const service = await creerService({
      prisma: { verifierConnexion: jest.fn(() => new Promise<void>(() => undefined)) },
      redis: { verifierConnexion: repond() },
    });

    const rapport = await service.verifier();

    expect(rapport.statut).toBe(StatutSante.Degrade);
    expect(rapport.dependances.mysql.statut).toBe(StatutDependance.Erreur);
    expect(rapport.dependances.mysql.erreur).toContain(`${TIMEOUT_MS} ms`);
    expect(rapport.dependances.mysql.duree_ms).toBeGreaterThanOrEqual(TIMEOUT_MS - 20);
  });

  it('ne laisse pas un rejet tardif remonter en exception non capturée', async () => {
    // La promesse perdante de la course se rejette APRÈS la réponse : sans
    // rattrapage, Node abattrait le processus — la sonde tuerait le service.
    const rejetTardif = new Promise<void>((_, rejeter) =>
      setTimeout(() => rejeter(new Error('rejet tardif')), TIMEOUT_MS + 60),
    );
    const surUnhandled = jest.fn();
    process.on('unhandledRejection', surUnhandled);

    try {
      const service = await creerService({
        prisma: { verifierConnexion: jest.fn(() => rejetTardif) },
        redis: { verifierConnexion: repond() },
      });

      await service.verifier();
      await new Promise((resoudre) => setTimeout(resoudre, TIMEOUT_MS + 120));

      expect(surUnhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', surUnhandled);
    }
  });

  it('tronque une cause d’échec verbeuse et n’en garde que la première ligne', async () => {
    // Certaines erreurs Prisma embarquent la requête et la chaîne de connexion,
    // mot de passe compris : le rapport de sonde n'est pas un endroit pour ça.
    const message = `${'x'.repeat(400)}\nmysql://root:motdepasse@mysql:3306/ecoles360`;
    const service = await creerService({
      prisma: { verifierConnexion: jest.fn().mockRejectedValue(new Error(message)) },
      redis: { verifierConnexion: repond() },
    });

    const rapport = await service.verifier();
    const erreur = rapport.dependances.mysql.erreur ?? '';

    expect(erreur.length).toBeLessThanOrEqual(201);
    expect(erreur).not.toContain('motdepasse');
    expect(erreur.endsWith('…')).toBe(true);
  });

  it('nomme toujours la panne, même si l’erreur commence par des lignes vides', async () => {
    // Les erreurs Prisma commencent par un saut de ligne : prendre la première
    // ligne sans plus de précaution produisait `erreur: ""` — une sonde qui
    // signale une panne sans la nommer.
    const message = '\n\nInvalid `prisma.$queryRaw()` invocation:\nDetails: libssl.so.1.1 absente';
    const service = await creerService({
      prisma: { verifierConnexion: jest.fn().mockRejectedValue(new Error(message)) },
      redis: { verifierConnexion: repond() },
    });

    const rapport = await service.verifier();

    expect(rapport.dependances.mysql.erreur).toBe('Invalid `prisma.$queryRaw()` invocation:');
  });

  it('accepte une valeur rejetée qui n’est pas une Error', async () => {
    const service = await creerService({
      prisma: { verifierConnexion: jest.fn().mockRejectedValue('panne brute') },
      redis: { verifierConnexion: repond() },
    });

    const rapport = await service.verifier();

    expect(rapport.dependances.mysql.erreur).toBe('panne brute');
  });

  it('horodate le rapport en ISO 8601', async () => {
    const service = await creerService({
      prisma: { verifierConnexion: repond() },
      redis: { verifierConnexion: repond() },
    });

    const rapport = await service.verifier();

    expect(rapport.horodatage).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
