import { HttpStatus, Logger, type LogLevel, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ValidationException } from './common/errors';

/** Préfixe global de l'API — livrable 11 §1, `app.setGlobalPrefix("api/v1")`. */
const PREFIXE_API = 'api/v1';

/** Chemin de la documentation OpenAPI — livrable 11 §1, hors préfixe global. */
const CHEMIN_SWAGGER = 'api/docs';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: niveauxDeJournal(process.env.LOG_LEVEL),
  });

  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // En-têtes de sécurité — livrable 7 §6 et livrable 11 §5. Le front et l'API
  // étant servis sous la même origine par nginx, la CSP applicative se limite
  // aux réponses de l'API ; nginx pose la sienne pour le front (livrable 14 §6).
  app.use(helmet());

  // CORS fermé par défaut : même origine en production (livrable 11 §5).
  // Aucune origine n'est autorisée tant qu'aucune n'est nécessaire.
  app.enableCors({ origin: false });

  app.setGlobalPrefix(PREFIXE_API);

  /**
   * ValidationPipe global — lot 1 §2, livrable 11 §5.
   *
   *   whitelist              retire toute propriété non déclarée dans le DTO ;
   *   forbidNonWhitelisted   refuse la requête plutôt que de l'ignorer, ce qui
   *                          écarte PAR CONSTRUCTION les champs de plateforme
   *                          (sponsorisé, vérifié, premium, note) d'une charge
   *                          utile cliente — RG27, livrable 11 §5 ;
   *   transform              instancie le DTO et applique les conversions de
   *                          type, condition des `@Type()` et `@Transform()`.
   *
   * `exceptionFactory` est indispensable : Nest répond 400 par défaut, alors
   * que le contrat du livrable 11 §1 impose 422 pour un échec de validation,
   * avec le détail champ par champ dans `details`.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      exceptionFactory: (erreurs) => ValidationException.fromValidationErrors(erreurs),
    }),
  );

  // Le filtre d'exception global est déclaré par APP_FILTER dans AppModule :
  // il passe ainsi par le conteneur d'injection, et les tests Supertest du
  // livrable 13 §2.2 l'obtiennent sans rejouer ce fichier.

  if (swaggerActif(config)) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('écoles360 — API')
        .setDescription(
          'Annuaire web payant des établissements scolaires privés au Maroc. ' +
            'Contrat détaillé au livrable 11 ; enveloppe de réponse `{data, meta, links}`, ' +
            "format d'erreur `{code, message, details}`.",
        )
        .setVersion(config.get<string>('APP_VERSION', '0.0.0'))
        .addServer(`/${PREFIXE_API}`)
        .build(),
    );

    SwaggerModule.setup(CHEMIN_SWAGGER, app, document, {
      customSiteTitle: 'écoles360 — API',
    });
  }

  const port = config.get<number>('PORT', 3000);

  // 0.0.0.0 et non localhost : dans un conteneur, une écoute sur la boucle
  // locale est injoignable depuis le réseau Docker — nginx et les autres
  // services ne verraient jamais l'API (livrable 14 §2).
  await app.listen(port, '0.0.0.0');

  logger.log(`API écoles360 à l'écoute sur le port ${port} — préfixe /${PREFIXE_API}`);
  logger.log(`Sonde de santé : GET /${PREFIXE_API}/health`);

  if (swaggerActif(config)) {
    logger.log(`Documentation OpenAPI : GET /${CHEMIN_SWAGGER}`);
  }
}

/**
 * Exposition de Swagger.
 *
 * Active hors production par défaut. Le livrable 11 §1 en réserve l'accès au
 * Super Admin hors développement : la garde arrivera avec le module
 * d'authentification (docs/BACKLOG.md, B-07). D'ici là, `SWAGGER_ENABLED`
 * permet de l'ouvrir explicitement sur un environnement de recette.
 */
function swaggerActif(config: ConfigService): boolean {
  const explicite = config.get<boolean>('SWAGGER_ENABLED');

  if (typeof explicite === 'boolean') {
    return explicite;
  }

  return config.get<string>('NODE_ENV') !== 'production';
}

/** Traduit `LOG_LEVEL` en niveaux Nest, du plus grave au plus bavard. */
function niveauxDeJournal(niveau: string | undefined): LogLevel[] {
  const echelle: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];
  const index = echelle.indexOf((niveau ?? 'log') as LogLevel);

  return echelle.slice(0, index === -1 ? 3 : index + 1);
}

void bootstrap();
