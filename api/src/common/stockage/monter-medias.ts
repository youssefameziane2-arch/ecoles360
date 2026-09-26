import type { NestExpressApplication } from '@nestjs/platform-express';
import { StockageService } from './stockage.service';

/** Préfixe public des médias — il est écrit en base, dans `photos.chemin`. */
export const PREFIXE_MEDIAS = '/media/';

/**
 * Monte le volume de médias en service statique — livrable 7 §1.
 *
 * EXTRAIT DE `main.ts` POUR ÊTRE REJOUÉ TEL QUEL PAR LES TESTS. Le lien entre
 * le chemin persisté (`/media/etablissements/3/ab….jpg`) et l'emplacement
 * réel du fichier ne tient qu'à la concordance entre ce préfixe et celui que
 * `StockageService` inscrit en base. Une suite qui déclarerait son propre
 * montage vérifierait sa propre déclaration, pas celle qui sert en production.
 *
 * NGINX PREND LE RELAIS EN PRODUCTION (livrable 14 §2) : faire transiter une
 * photo de 400 Ko par la boucle d'événements de Node occupe le processus qui
 * doit répondre aux requêtes métier. Ce montage reste néanmoins déclaré —
 * mieux vaut des fiches complètes qu'un dossier inaccessible le jour où nginx
 * n'est pas encore devant.
 *
 * HORS DU PRÉFIXE `/api/v1` À DESSEIN : ces chemins se retrouvent dans le HTML
 * public. Les ranger sous le préfixe de l'API les ferait passer pour des
 * ressources versionnées, qu'une v2 devrait alors porter aussi.
 */
export function monterMedias(app: NestExpressApplication): void {
  app.useStaticAssets(app.get(StockageService).racineDisque, {
    prefix: PREFIXE_MEDIAS,
    index: false,
    // Le nom du fichier est un aléa de 16 octets : son contenu ne change
    // jamais. Un remplacement produit un NOUVEAU nom, donc rien à invalider —
    // un an de cache est sans risque.
    maxAge: '365d',
    immutable: true,
    // Le volume ne doit rien exposer d'autre que ce que le service y écrit, et
    // ce qui commence par un point n'a jamais vocation à être public.
    dotfiles: 'deny',
  });
}
