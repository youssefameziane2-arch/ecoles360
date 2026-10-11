import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
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

  /**
   * Origine publique du site — sert les URL absolues du plan de site.
   *
   * UN PLAN DE SITE NE TOLÈRE QUE DES URL ABSOLUES : un chemin relatif y est
   * ignoré par les moteurs, et une origine fausse leur ferait indexer un
   * domaine qui n'est pas le nôtre. La valeur par défaut vaut pour le poste ;
   * en production, `.env.prod` la porte.
   */
  @IsString()
  @IsOptional()
  APP_URL = 'http://localhost:5173';

  @IsString({ message: 'DATABASE_URL doit être une chaîne de connexion Prisma.' })
  @IsNotEmpty({ message: 'DATABASE_URL est obligatoire (connexion MySQL 8).' })
  DATABASE_URL!: string;

  /**
   * Compte SMTP d'envoi — B-53.
   *
   * TOUS OPTIONNELS, ET C'EST DÉLIBÉRÉ. Le projet n'a pas encore d'adresse
   * expéditrice : les rendre obligatoires empêcherait l'API de démarrer et
   * ferait échouer les 397 tests, pour une fonction dont l'absence se
   * rattrape — les notifications restent visibles dans le centre.
   * `MailService` exige les quatre ensemble à l'exécution et se déclare
   * éteint sinon, en le disant une fois au démarrage.
   */
  @IsString()
  @IsOptional()
  SMTP_HOST?: string;

  @IsString()
  @IsOptional()
  SMTP_PORT?: string;

  @IsString()
  @IsOptional()
  SMTP_USER?: string;

  @IsString()
  @IsOptional()
  SMTP_PASSWORD?: string;

  /** L'adresse affichée en expéditeur — « contact@ecoles360.com ». */
  @IsString()
  @IsOptional()
  MAIL_FROM?: string;

  /**
   * Secret de signature des cookies de session (livrable 14 §6).
   *
   * Au moins 32 caractères : ce secret protège l'identifiant de session. Le
   * rendre obligatoire dès le démarrage évite le pire scénario — une mise en
   * production avec une valeur par défaut connue, qui laisserait forger des
   * sessions valides pour n'importe quel compte.
   */
  @IsString({ message: 'SESSION_SECRET est obligatoire.' })
  @MinLength(32, { message: 'SESSION_SECRET doit faire au moins 32 caractères.' })
  SESSION_SECRET!: string;

  @IsString()
  @IsOptional()
  SESSION_PREFIX = 'ecoles360:sess:';

  @IsString({ message: 'REDIS_URL doit être une URL redis://…' })
  @IsNotEmpty({ message: 'REDIS_URL est obligatoire (sessions, files, cache).' })
  REDIS_URL!: string;

  @Transform(({ value }) => Number.parseInt(String(value), 10))
  @IsInt({ message: 'HEALTH_CHECK_TIMEOUT_MS doit être un entier (millisecondes).' })
  @Min(100)
  @Max(30_000)
  @IsOptional()
  HEALTH_CHECK_TIMEOUT_MS = 2000;

  /**
   * Exposition de `/api/docs`.
   *
   * Laisser `undefined` quand la variable est absente ou vide est ce qui
   * compte : `main.ts` retombe alors sur « actif hors production », donc
   * FERMÉ en production. Écrire `value === undefined || … === 'true'`
   * renverrait `true` pour une variable absente et ouvrirait la
   * documentation en production — au prix d'un pari sur le fait que
   * class-transformer n'appelle pas `@Transform` sur une clé manquante.
   * Un défaut d'exposition ne se décide pas par effet de bord.
   */
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    return value === 'true' || value === '1';
  })
  @IsBoolean({ message: 'SWAGGER_ENABLED doit valoir true ou false.' })
  @IsOptional()
  SWAGGER_ENABLED?: boolean;

  @IsString()
  @IsOptional()
  LOG_LEVEL = 'log';

  /**
   * Racine du volume de médias téléversés — livrable 7 §1.
   *
   * Laissée vide, elle vaut `storage/` à la racine du dépôt, qui est le point
   * de montage du volume Docker du même nom. Les tests la détournent vers un
   * dossier temporaire pour ne rien laisser derrière eux.
   */
  @IsString()
  @IsOptional()
  STOCKAGE_RACINE?: string;
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
