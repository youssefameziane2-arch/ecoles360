import { HttpException, type HttpStatus } from '@nestjs/common';
import { DEFAULT_CODE_BY_STATUS, ERROR_MESSAGES, type ErrorCode } from './error-codes';

/**
 * Charge utile d'erreur du livrable 11 §1 — la forme EXACTE renvoyée au client :
 *
 *   { "code": "plafond_vue_atteint", "message": "…", "details": { } }
 *
 * Aucune enveloppe supplémentaire, aucun champ en plus. `details` est toujours
 * présent (objet vide par défaut) : le front n'a jamais à tester son existence,
 * et les fixtures MSW du livrable 13 §1 reproduisent une forme unique.
 */
export interface ErrorPayload {
  code: string;
  message: string;
  details: Record<string, unknown>;
}

/**
 * Exception métier de l'API.
 *
 * Toutes les exceptions du domaine en héritent : le code, le message français
 * et les détails sont posés à la levée, et `HttpExceptionFilter` se contente de
 * les sérialiser. C'est le remplaçant NestJS de l'`ErrorFactory` de la v2.4
 * (livrable 11 §7).
 *
 * @example
 *   throw new AppException(HttpStatus.CONFLICT, 'facture_non_payee',
 *     "La facture doit être encaissée avant la validation de la fiche.");
 */
export class AppException extends HttpException {
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(
    status: HttpStatus,
    code: string,
    message?: string,
    details: Record<string, unknown> = {},
  ) {
    const resolved =
      message ??
      ERROR_MESSAGES[code as ErrorCode] ??
      ERROR_MESSAGES[DEFAULT_CODE_BY_STATUS[status] ?? 'erreur_interne'];

    super({ code, message: resolved, details } satisfies ErrorPayload, status);

    this.code = code;
    this.details = details;
  }

  /** Charge utile normalisée, telle qu'elle part sur le réseau. */
  toPayload(): ErrorPayload {
    return { code: this.code, message: this.message, details: this.details };
  }
}
