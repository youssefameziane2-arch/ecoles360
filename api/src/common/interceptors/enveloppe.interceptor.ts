import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CLE_SANS_ENVELOPPE } from '../decorators/sans-enveloppe.decorator';

/** Pagination d'une collection — livrable 11 §1. */
export interface MetaPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

/** Liens de navigation d'une collection paginée. */
export interface LiensPagination {
  self: string;
  first: string;
  prev: string | null;
  next: string | null;
  last: string;
}

/**
 * Collection paginée retournée par un service.
 *
 * Un controller qui rend cet objet obtient automatiquement `meta` et `links`
 * renseignés ; tout autre retour est simplement placé dans `data`.
 */
export class Page<T> {
  constructor(
    readonly elements: T[],
    readonly total: number,
    readonly page: number,
    readonly perPage: number,
  ) {}
}

/**
 * Enveloppe de réponse — livrable 11 §1.
 *
 * « data (ressource ou collection) + meta (pagination, compteurs) + links »
 *
 * C'EST UNE INTERFACE, pas une commodité : le client HTTP du front (livrable 12
 * §4) et les fixtures MSW du livrable 13 §1 sont écrits contre cette forme
 * exacte. Une réponse qui s'en écarte casse le front sans erreur serveur.
 *
 * `meta` et `links` ne sont renseignés que pour une collection paginée — une
 * ressource unique n'a ni page suivante ni total. Ils restent présents et vides
 * plutôt qu'absents : le client n'a ainsi jamais à tester leur existence, comme
 * pour `details` dans le format d'erreur.
 *
 * Trois sorties échappent à l'enveloppe, et chacune pour une raison précise :
 * la sonde de santé (lue par Docker, qui n'interprète pas de JSON métier), les
 * reçus HTML (livrable 11 §3.2) et les exports CSV en flux (RG23). Elles se
 * marquent avec `@SansEnveloppe()`.
 */
@Injectable()
export class EnveloppeInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(contexte: ExecutionContext, suivant: CallHandler): Observable<unknown> {
    const echappe = this.reflector.getAllAndOverride<boolean>(CLE_SANS_ENVELOPPE, [
      contexte.getHandler(),
      contexte.getClass(),
    ]);

    if (echappe) {
      return suivant.handle();
    }

    const requete = contexte.switchToHttp().getRequest<{ originalUrl: string }>();

    return suivant.handle().pipe(
      map((resultat: unknown) => {
        if (resultat instanceof Page) {
          return this.enveloppePaginee(resultat, requete.originalUrl);
        }

        return { data: resultat ?? null, meta: {}, links: {} };
      }),
    );
  }

  private enveloppePaginee(
    page: Page<unknown>,
    url: string,
  ): { data: unknown[]; meta: MetaPagination; links: LiensPagination } {
    const totalPages = Math.max(1, Math.ceil(page.total / page.perPage));

    return {
      data: page.elements,
      meta: {
        page: page.page,
        per_page: page.perPage,
        total: page.total,
        total_pages: totalPages,
      },
      links: {
        self: this.avecPage(url, page.page),
        first: this.avecPage(url, 1),
        prev: page.page > 1 ? this.avecPage(url, page.page - 1) : null,
        next: page.page < totalPages ? this.avecPage(url, page.page + 1) : null,
        last: this.avecPage(url, totalPages),
      },
    };
  }

  /**
   * Réécrit le paramètre `page` d'une URL en conservant tous les autres.
   *
   * Les liens doivent préserver les filtres de la recherche : sans cela,
   * « page suivante » ramènerait les ~8 000 fiches au lieu des résultats de
   * « Lycée · Casablanca ».
   */
  private avecPage(url: string, page: number): string {
    const [chemin, requete] = url.split('?');
    const parametres = new URLSearchParams(requete ?? '');
    parametres.set('page', String(page));

    return `${chemin}?${parametres.toString()}`;
  }
}
