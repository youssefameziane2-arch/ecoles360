import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  AppException,
  DEFAULT_CODE_BY_STATUS,
  ERROR_CODES,
  ERROR_MESSAGES,
  type ErrorPayload,
} from '../errors';

/**
 * Filtre d'exception global — livrable 11 §1.
 *
 * « Un HttpExceptionFilter global (src/common/filters/) mappe toute exception
 * métier vers ce format. »  Rien ne sort de l'API sans passer par ici :
 *
 *   { "code": "…", "message": "…", "details": { } }
 *
 * Trois garanties, dans cet ordre :
 *
 *   1. FORME — la réponse a exactement ces trois clés, quel que soit ce qui a
 *      été levé (AppException, exception Nest, erreur non typée). Le front du
 *      livrable 12 et les fixtures MSW du livrable 13 §1 n'ont qu'une forme à
 *      connaître.
 *   2. LANGUE — le message est en français (Maroc) et affichable tel quel. Les
 *      messages anglais par défaut de Nest (« Forbidden resource », « Cannot
 *      GET /… ») sont remplacés par le dictionnaire `ERROR_MESSAGES`.
 *   3. ÉTANCHÉITÉ — une erreur non prévue ne fuit jamais son message ni sa pile
 *      au client : 500 générique côté réseau, détail complet côté journal.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.resoudreStatut(exception);
    const payload = this.construirePayload(exception, status);

    this.journaliser(exception, status, request, payload);

    response.status(status).json(payload);
  }

  private resoudreStatut(exception: unknown): number {
    return exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private construirePayload(exception: unknown, status: number): ErrorPayload {
    // 1. Exception métier : le code, le message et les détails sont déjà posés.
    if (exception instanceof AppException) {
      return exception.toPayload();
    }

    // 2. Exception Nest standard (NotFoundException, ForbiddenException…).
    if (exception instanceof HttpException) {
      return this.depuisHttpException(exception, status);
    }

    // 3. Tout le reste : rien ne sort, le détail reste au journal.
    return {
      code: ERROR_CODES.ERREUR_INTERNE,
      message: ERROR_MESSAGES[ERROR_CODES.ERREUR_INTERNE],
      details: {},
    };
  }

  private depuisHttpException(exception: HttpException, status: number): ErrorPayload {
    const code = DEFAULT_CODE_BY_STATUS[status] ?? ERROR_CODES.ERREUR_INTERNE;
    const reponse: unknown = exception.getResponse();

    // Une exception levée avec un objet `{ code, message, details }` complet est
    // respectée telle quelle : c'est le cas des exceptions construites à la main
    // sans passer par AppException.
    if (this.estPayloadComplet(reponse)) {
      return {
        code: reponse.code,
        message: reponse.message,
        details: this.normaliserDetails(reponse.details),
      };
    }

    // Une exception levée avec un message personnalisé en français le conserve ;
    // sinon on retombe sur le dictionnaire plutôt que sur l'anglais de Nest.
    const message = this.extraireMessage(reponse) ?? ERROR_MESSAGES[code];

    return { code, message, details: {} };
  }

  private estPayloadComplet(
    reponse: unknown,
  ): reponse is { code: string; message: string; details?: unknown } {
    if (typeof reponse !== 'object' || reponse === null) {
      return false;
    }

    const candidat = reponse as Record<string, unknown>;
    return typeof candidat.code === 'string' && typeof candidat.message === 'string';
  }

  private extraireMessage(reponse: unknown): string | undefined {
    if (typeof reponse === 'string') {
      // Nest produit des messages anglais par défaut (« Forbidden resource »,
      // « Unauthorized »…) ; on ne les propage pas, le dictionnaire prend le relais.
      return this.estMessageParDefautDeNest(reponse) ? undefined : reponse;
    }

    if (typeof reponse === 'object' && reponse !== null) {
      const message: unknown = (reponse as Record<string, unknown>).message;

      if (typeof message === 'string') {
        return this.estMessageParDefautDeNest(message) ? undefined : message;
      }

      // `message` peut être un tableau (ValidationPipe non surchargé) : on ne le
      // laisse pas passer, la forme attendue est `details.champs`.
      if (Array.isArray(message)) {
        return undefined;
      }
    }

    return undefined;
  }

  private estMessageParDefautDeNest(message: string): boolean {
    // « Cannot GET /chemin/inconnu » : 404 posé par Express sur une route non
    // déclarée. Le chemin demandé n'apprend rien à l'utilisateur et décrit la
    // surface de l'API à qui la sonde — le dictionnaire le remplace.
    return MESSAGES_PAR_DEFAUT_NEST.has(message) || /^Cannot [A-Z]+ \//.test(message);
  }

  private normaliserDetails(details: unknown): Record<string, unknown> {
    return typeof details === 'object' && details !== null && !Array.isArray(details)
      ? (details as Record<string, unknown>)
      : {};
  }

  private journaliser(
    exception: unknown,
    status: number,
    request: Request,
    payload: ErrorPayload,
  ): void {
    const origine = `${request.method} ${request.originalUrl}`;

    if (status < PREMIER_STATUT_5XX) {
      // 4xx : comportement attendu du contrat — une ligne suffit.
      this.logger.warn(`${origine} → ${status} ${payload.code}`);
      return;
    }

    // 5xx délibéré — une `AppException` que le code a levée sciemment, comme le
    // 503 de la sonde. La pile ne dirait que ce qu'on sait déjà, et la sonde
    // étant interrogée toutes les 30 secondes par Docker (livrable 14 §2.2),
    // une panne d'une heure produirait 120 traces identiques qui noieraient
    // l'incident réel survenu au milieu.
    if (exception instanceof AppException) {
      this.logger.error(`${origine} → ${status} ${payload.code} — ${exception.message}`);
      return;
    }

    // 5xx imprévu : là, la pile est tout ce qu'on aura pour comprendre.
    const pile = exception instanceof Error ? exception.stack : String(exception);
    this.logger.error(`${origine} → ${status} ${payload.code}`, pile);
  }
}

/**
 * Seuil au-delà duquel une réponse est un incident de service, et non le refus
 * attendu que décrit le contrat. Un littéral plutôt qu'un membre de `HttpStatus` :
 * `status` est un nombre libre, et comparer un nombre à une énumération masque
 * les statuts non déclarés.
 */
const PREMIER_STATUT_5XX = 500;

/**
 * Messages anglais posés par Nest lorsqu'une exception est levée sans argument.
 * Les reconnaître permet de les remplacer par le dictionnaire français sans
 * écraser un message métier volontairement rédigé par un service.
 */
const MESSAGES_PAR_DEFAUT_NEST = new Set([
  'Bad Request',
  'Unauthorized',
  'Forbidden',
  'Forbidden resource',
  'Not Found',
  'Method Not Allowed',
  'Not Acceptable',
  'Request Timeout',
  'Conflict',
  'Gone',
  'Payload Too Large',
  'Unsupported Media Type',
  'Unprocessable Entity',
  'I am a teapot',
  'Too Many Requests',
  'Internal Server Error',
  'Not Implemented',
  'Bad Gateway',
  'Service Unavailable',
  'Gateway Timeout',
]);
