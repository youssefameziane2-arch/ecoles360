import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public, SansEnveloppe } from '../../common/decorators';
import { SeoService } from './seo.service';

/**
 * Plan de site — livrable 12, référencement du site public.
 *
 * HORS DU PRÉFIXE `api/v1`, et ce n'est pas un caprice : les robots cherchent
 * `/sitemap.xml` à la racine du domaine, et nulle part ailleurs. Servi sous
 * `/api/v1/sitemap.xml`, le fichier existerait sans que personne ne le lise.
 * L'exclusion est déclarée dans `main.ts`.
 *
 * SANS L'ENVELOPPE `{data, meta, links}` : un robot attend du XML conforme au
 * schéma sitemaps.org. Enveloppé dans du JSON, le fichier serait rejeté en
 * entier — et silencieusement.
 */
@ApiExcludeController()
@Controller()
export class SeoController {
  constructor(private readonly seo: SeoService) {}

  @Get('sitemap.xml')
  // La garde de session est globale : sans `@Public()`, le plan de site
  // répond 401 à tout le monde, robots compris. Le défaut ne se voit ni au
  // typage ni au lint — seulement en appelant la route.
  @Public()
  @SansEnveloppe()
  @Header('Content-Type', 'application/xml; charset=utf-8')
  // Une heure de cache : le plan se reconstruit à chaque appel, et il
  // interroge quatre tables. Un robot qui le redemande en boucle ne doit pas
  // peser sur la base qui sert les visiteurs.
  @Header('Cache-Control', 'public, max-age=3600')
  planDuSite(): Promise<string> {
    return this.seo.planDuSite();
  }
}
