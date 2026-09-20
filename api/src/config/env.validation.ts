import { plainToInstance, Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum Environnement {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

/**
 * Contrat des variables d'environnement.
 *
 * Validé au démarrage, avant que le premier module ne se charge : un
 * `DATABASE_URL` absent doit faire échouer le processus tout de suite, avec un
 * message lisible, plutôt que de produire un 500 à la première requête. C'est
 * la même exigence que la sonde de santé — le service ne se déclare jamais
 * disponible s'il ne l'est pas (livrable 14 §2.1).
 *
 * Les décorateurs sont ceux des DTO du livrable 11 §5 : une seule grammaire de
 * validation dans tout le projet.
 */
export class EnvironmentVariables {
  @IsEnum(Environnement, {
    message: 'NODE_ENV doit valoir development, test ou production.',
  })
  @IsOptional()
  NODE_ENV: Environnement = Environnement.Development;

  @Transform(({ value }) => Number.parseInt(String(value), 10))
  @IsInt({ message: 'PORT doit être un entier.' })
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT = 3000;

  @IsString()
  @IsOptional()
  APP_VERSION = '0.0.0';

  @IsString({ message: 'DATABASE_URL doit être une chaîne de connexion Prisma.' })
  @IsNotEmpty({ message: 'DATABASE_URL est obligatoire (connexion MySQL 8).' })
  DATABASE_URL!: string;

  @IsString({ message: 'REDIS_URL doit être une URL redis://…' })
  @IsNotEmpty({ message: 'REDIS_URL est obligatoire (sessions, files, cache).' })
  REDIS_URL!: string;

  @Transform(({ value }) => Number.parseInt(String(value), 10))
  @IsInt({ message: 'HEALTH_CHECK_TIMEOUT_MS doit être un entier (millisecondes).' })
  @Min(100)
  @Max(30_000)
  @IsOptional()
  HEALTH_CHECK_TIMEOUT_MS = 2000;

  @Transform(({ value }) => value === undefined || value === '' || value === 'true')
  @IsOptional()
  SWAGGER_ENABLED?: boolean;

  @IsString()
  @IsOptional()
  LOG_LEVEL = 'log';
}

/**
 * Fonction de validation branchée sur `ConfigModule.forRoot({ validate })`.
 *
 * Elle lève avec la liste complète des variables fautives : on corrige son
 * `.env` en une passe, pas variable par variable.
 */
export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const instance = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
    excludeExtraneousValues: false,
  });

  const erreurs = validateSync(instance, {
    skipMissingProperties: false,
    whitelist: false,
    forbidNonWhitelisted: false,
  });

  if (erreurs.length > 0) {
    const detail = erreurs
      .map(
        (erreur) =>
          `  · ${erreur.property} : ${Object.values(erreur.constraints ?? {}).join(', ')}`,
      )
      .join('\n');

    throw new Error(
      `Configuration d'environnement invalide.\n${detail}\n\n` +
        'Copiez .env.example en .env et complétez les valeurs manquantes.',
    );
  }

  return instance;
}
