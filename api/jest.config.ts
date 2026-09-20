import type { Config } from 'jest';

/**
 * Stratégie de tests — livrable 13.
 *
 * Les suites s'exécutent contre une MySQL 8 et une Redis 7 RÉELLES, jamais
 * SQLite (§1) : `docker-compose.dev.yml` en local, services GitHub Actions en
 * intégration continue (livrable 14 §3). Redis utilise la base 15, dédiée aux
 * tests — jamais la base 0 (§2.2).
 */
const config: Config = {
  rootDir: '.',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/test/**/*.spec.ts'],
  // `dist/` contient une COPIE du client Prisma généré (voir nest-cli.json) :
  // sans cette exclusion, Jest y voit deux `package.json` de même nom et émet
  // un avertissement de collision à chaque exécution — y compris en CI, où le
  // build précède les tests.
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  transform: {
    '^.+\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  // Alias `@/…` des exemples du livrable 13 §2.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    // Amorçage du processus : couvert de fait par les tests Supertest, mais non
    // instrumentable puisque exécuté hors du bac à sable Jest.
    '<rootDir>/src/main.ts',
    // Client Prisma généré (livrable 10 §2.0).
    '<rootDir>/src/generated/',
    // Modules de déclaration : aucune logique.
    '\.module\.ts$',
    '\.dto\.ts$',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text-summary', 'lcov'],
  /**
   * Seuils du livrable 13 §1 : ≥ 90 % de branches sur les services,
   * ≥ 85 % sur les guards, ≥ 80 % sur les controllers.
   *
   * Ils sont déclarés fichier par fichier plutôt qu'en global : un seuil global
   * baisse mécaniquement quand on ajoute du code d'infrastructure non testable,
   * et finit par ne plus rien garantir. Chaque lot ajoute ses propres entrées.
   */
  coverageThreshold: {
    // Aucun seuil global, volontairement : il mêlerait la logique métier au
    // code d'amorçage et de câblage, et baisserait à chaque module ajouté
    // jusqu'à ne plus rien garantir. Les seuils qui comptent sont ci-dessous.
    global: {},
    './src/modules/health/health.service.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/common/filters/http-exception.filter.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  // Les suites de concurrence du livrable 13 §2.3 exigeront --runInBand ;
  // par défaut on garde le parallélisme, chaque suite écrivant dans son propre
  // sous-arbre de données (§1).
  testTimeout: 30_000,
  clearMocks: true,
  restoreMocks: true,
};

export default config;
