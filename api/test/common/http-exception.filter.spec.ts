import {
  type ArgumentsHost,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { AppException, ERROR_CODES, ValidationException } from '@/common/errors';

/**
 * Filtre d'exception global — livrable 11 §1.
 *
 * Ce qui est vérifié ici est le CONTRAT DE SORTIE de toute l'API : la forme
 * `{code, message, details}` exacte, la langue française, et l'étanchéité des
 * erreurs non prévues. Le front du livrable 12 et les fixtures MSW du
 * livrable 13 §1 n'ont qu'une forme à connaître — c'est celle-ci.
 */
describe('HttpExceptionFilter', () => {
  let filtre: HttpExceptionFilter;
  let json: jest.Mock;
  let status: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    // Le filtre journalise les 4xx en warn et les 5xx en error : on coupe le
    // bruit sans perdre la possibilité de vérifier les appels.
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    filtre = new HttpExceptionFilter();
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });

    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ method: 'GET', originalUrl: '/api/v1/etablissements' }),
      }),
    } as unknown as ArgumentsHost;
  });

  /** Déclenche le filtre et retourne la charge utile envoyée au client. */
  function capturer(exception: unknown): Record<string, unknown> {
    filtre.catch(exception, host);
    return json.mock.calls[0]?.[0] as Record<string, unknown>;
  }

  describe('forme de la réponse', () => {
    it("n'émet jamais autre chose que code, message et details", () => {
      const charge = capturer(new NotFoundException());

      expect(Object.keys(charge).sort()).toEqual(['code', 'details', 'message']);
    });

    it('fournit toujours un details, objet vide à défaut', () => {
      // Le front n'a ainsi jamais à tester l'existence du champ.
      expect(capturer(new ForbiddenException()).details).toEqual({});
    });
  });

  describe('exceptions métier (AppException)', () => {
    it('propage le code, le message et les détails tels quels', () => {
      const charge = capturer(
        new AppException(HttpStatus.CONFLICT, 'facture_non_payee', 'La facture doit être payée.', {
          facture_id: '42',
        }),
      );

      expect(status).toHaveBeenCalledWith(409);
      expect(charge).toEqual({
        code: 'facture_non_payee',
        message: 'La facture doit être payée.',
        details: { facture_id: '42' },
      });
    });

    it('retombe sur le dictionnaire quand aucun message n’est fourni', () => {
      const charge = capturer(new AppException(HttpStatus.CONFLICT, ERROR_CODES.CONFLIT_METIER));

      expect(charge.message).toBe("L'opération est en conflit avec l'état actuel de la ressource.");
    });
  });

  describe('échec de validation — 422 (livrable 11 §1 et §5)', () => {
    it('rapporte les champs fautifs dans details.champs', () => {
      const exception = ValidationException.fromValidationErrors([
        {
          property: 'note',
          constraints: { min: 'La note doit être comprise entre 1 et 5.' },
          children: [],
        },
        {
          property: 'parent',
          children: [
            {
              property: 'telephone',
              constraints: { matches: 'Le numéro de téléphone est invalide.' },
              children: [],
            },
          ],
        },
      ]);

      const charge = capturer(exception);

      expect(status).toHaveBeenCalledWith(422);
      expect(charge.code).toBe(ERROR_CODES.VALIDATION_ECHOUEE);
      expect(charge.details).toEqual({
        champs: [
          { champ: 'note', contraintes: ['La note doit être comprise entre 1 et 5.'] },
          // Les DTO imbriqués (@ValidateNested) remontent en chemin pointé,
          // pour que le front puisse cibler un champ de formulaire directement.
          { champ: 'parent.telephone', contraintes: ['Le numéro de téléphone est invalide.'] },
        ],
      });
    });
  });

  describe('exceptions Nest standard', () => {
    it.each([
      [new UnauthorizedException(), 401, ERROR_CODES.NON_AUTHENTIFIE],
      [new ForbiddenException(), 403, ERROR_CODES.ACCES_REFUSE],
      [new NotFoundException(), 404, ERROR_CODES.RESSOURCE_INTROUVABLE],
      [new ConflictException(), 409, ERROR_CODES.CONFLIT_METIER],
    ])('mappe %# vers le code du statut', (exception, statutAttendu, codeAttendu) => {
      const charge = capturer(exception);

      expect(status).toHaveBeenCalledWith(statutAttendu);
      expect(charge.code).toBe(codeAttendu);
    });

    it('remplace les messages anglais de Nest par leur équivalent français', () => {
      // `new ForbiddenException()` produit « Forbidden resource » : ce message
      // partirait tel quel dans un toast du design system.
      const charge = capturer(new ForbiddenException());

      expect(charge.message).toBe("Vous n'avez pas les droits nécessaires pour cette action.");
    });

    it('conserve un message français posé volontairement par un service', () => {
      const charge = capturer(new NotFoundException("Cet établissement n'est pas publié."));

      expect(charge.message).toBe("Cet établissement n'est pas publié.");
    });

    it('ne laisse pas fuir le « Cannot GET /… » d’Express', () => {
      // Il décrit la surface de l'API à qui la sonde, et n'apprend rien à l'utilisateur.
      const charge = capturer(new NotFoundException('Cannot GET /api/v1/routes-internes'));

      expect(charge.message).not.toContain('Cannot GET');
      expect(charge.message).toBe("La ressource demandée n'existe pas.");
    });

    it('respecte une charge utile { code, message, details } déjà complète', () => {
      const charge = capturer(
        new HttpException(
          { code: 'reponse_existante', message: 'Une réponse existe déjà.', details: { avis: 7 } },
          HttpStatus.CONFLICT,
        ),
      );

      expect(charge).toEqual({
        code: 'reponse_existante',
        message: 'Une réponse existe déjà.',
        details: { avis: 7 },
      });
    });

    it('ignore un details qui n’est pas un objet', () => {
      const charge = capturer(
        new HttpException({ code: 'x', message: 'y', details: ['a', 'b'] }, HttpStatus.CONFLICT),
      );

      expect(charge.details).toEqual({});
    });

    it('écarte le message tableau du ValidationPipe non surchargé', () => {
      // La forme attendue est `details.champs`, jamais un tableau dans `message`.
      const charge = capturer(
        new BadRequestException({ message: ['note must be an integer'], error: 'Bad Request' }),
      );

      expect(typeof charge.message).toBe('string');
      expect(charge.message).not.toContain('must be an integer');
    });
  });

  describe('erreurs non prévues', () => {
    it('répond 500 sans rien divulguer', () => {
      const charge = capturer(new Error('Prisma: mysql://root:motdepasse@mysql:3306/ecoles360'));

      expect(status).toHaveBeenCalledWith(500);
      expect(charge).toEqual({
        code: ERROR_CODES.ERREUR_INTERNE,
        message: "Une erreur interne est survenue. L'incident a été enregistré.",
        details: {},
      });
      expect(JSON.stringify(charge)).not.toContain('motdepasse');
    });

    it('journalise la pile complète côté serveur', () => {
      const erreur = new Error('panne');
      capturer(erreur);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('erreur_interne'),
        erreur.stack,
      );
    });

    it('journalise un 5xx délibéré sans pile', () => {
      // La sonde est interrogée toutes les 30 s : une panne d'une heure
      // produirait 120 traces identiques, qui noieraient l'incident réel.
      capturer(new AppException(HttpStatus.SERVICE_UNAVAILABLE, ERROR_CODES.SERVICE_INDISPONIBLE));

      expect(Logger.prototype.error).toHaveBeenCalledTimes(1);
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining(ERROR_CODES.SERVICE_INDISPONIBLE),
      );
    });

    it('accepte une valeur levée qui n’est pas une Error', () => {
      const charge = capturer('quelque chose a mal tourné');

      expect(status).toHaveBeenCalledWith(500);
      expect(charge.code).toBe(ERROR_CODES.ERREUR_INTERNE);
    });
  });
});
