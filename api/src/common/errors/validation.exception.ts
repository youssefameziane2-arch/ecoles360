import { HttpStatus } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { AppException } from './app.exception';
import { ERROR_CODES } from './error-codes';

/** Une erreur de validation rapportée champ par champ. */
export interface ChampInvalide {
  /** Chemin du champ, notation pointée pour les DTO imbriqués (`adresse.ville`). */
  champ: string;
  /** Messages français produits par les décorateurs class-validator. */
  contraintes: string[];
}

/**
 * Échec de validation d'un DTO — 422 (livrable 11 §1 et §5).
 *
 * Le ValidationPipe global de Nest lève un 400 par défaut ; le contrat impose
 * 422, et un `details` exploitable champ par champ. Le livrable 13 §3 en décrit
 * l'usage côté front : « les erreurs 422 sont re-projetées champ par champ sur
 * les Input du design system via setError ».
 */
export class ValidationException extends AppException {
  constructor(champs: ChampInvalide[]) {
    super(HttpStatus.UNPROCESSABLE_ENTITY, ERROR_CODES.VALIDATION_ECHOUEE, undefined, { champs });
  }

  /**
   * Aplatit l'arbre de `ValidationError` de class-validator.
   *
   * Les DTO imbriqués validés par `@ValidateNested()` (blocs de la page « À
   * propos », fiche de besoin d'un lead…) produisent des erreurs en cascade :
   * on les remonte en chemins pointés plutôt qu'en arbre, pour que le front
   * puisse cibler un champ de formulaire directement.
   */
  static fromValidationErrors(errors: ValidationError[]): ValidationException {
    return new ValidationException(ValidationException.aplatir(errors));
  }

  private static aplatir(errors: ValidationError[], prefixe = ''): ChampInvalide[] {
    const champs: ChampInvalide[] = [];

    for (const erreur of errors) {
      const chemin = prefixe ? `${prefixe}.${erreur.property}` : erreur.property;

      if (erreur.constraints) {
        champs.push({ champ: chemin, contraintes: Object.values(erreur.constraints) });
      }

      if (erreur.children?.length) {
        champs.push(...ValidationException.aplatir(erreur.children, chemin));
      }
    }

    return champs;
  }
}
