import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
  type DependanceSanteDto,
  type HealthResponseDto,
  StatutDependance,
  StatutSante,
} from './dto/health-response.dto';

/**
 * Sonde de santé — lot 1 §5.
 *
 * Elle a trois consommateurs qui ne se parlent pas (livrable 14 §2.2 et §5) :
 *   · le HEALTHCHECK Docker, qui n'en lit que le code HTTP ;
 *   · `depends_on: { condition: service_healthy }`, qui décide si les autres
 *     conteneurs démarrent ;
 *   · la sonde externe UptimeRobot, qui alerte l'astreinte.
 *
 * Trois règles en découlent, et expliquent la forme du code ci-dessous.
 *
 * 1. ELLE VÉRIFIE, ELLE NE DÉDUIT PAS. Chaque dépendance fait un vrai
 *    aller-retour réseau (`SELECT 1`, `PING`). Un client Prisma instancié n'est
 *    pas une base joignable, et un pool ouvert peut mener à un serveur mort.
 *
 * 2. ELLE NE PEUT PAS SE BLOQUER. Chaque vérification est bornée par
 *    `HEALTH_CHECK_TIMEOUT_MS`. Sans ce garde-fou, une MySQL qui accepte la
 *    connexion sans jamais répondre ferait expirer la requête HTTP : Docker
 *    verrait un `timeout` indistinct au lieu du 503 qui nomme le coupable, et
 *    l'astreinte chercherait à l'aveugle.
 *
 * 3. ELLE NE MENT JAMAIS PAR OMISSION. Les vérifications sont concurrentes et
 *    toutes menées à terme : une MySQL en échec n'empêche pas de savoir où en
 *    est Redis. Un diagnostic partiel est ce qui fait rouvrir l'incident.
 */
@Injectable()
export class HealthService {
  private readonly version: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    config: ConfigService,
  ) {
    this.version = config.get<string>('APP_VERSION', '0.0.0');
    this.timeoutMs = config.get<number>('HEALTH_CHECK_TIMEOUT_MS', 2000);
  }

  /**
   * Exécute la sonde.
   *
   * Ne lève jamais : l'échec d'une dépendance est une donnée du rapport, pas
   * une exception. C'est le controller qui traduit un rapport `degrade` en 503.
   */
  async verifier(): Promise<HealthResponseDto> {
    const debut = Date.now();

    const [mysql, redis] = await Promise.all([
      this.mesurer(() => this.prisma.verifierConnexion()),
      this.mesurer(() => this.redis.verifierConnexion()),
    ]);

    const degrade =
      mysql.statut === StatutDependance.Erreur || redis.statut === StatutDependance.Erreur;

    return {
      statut: degrade ? StatutSante.Degrade : StatutSante.Ok,
      version: this.version,
      horodatage: new Date().toISOString(),
      duree_ms: Date.now() - debut,
      dependances: { mysql, redis },
    };
  }

  /** Exécute une vérification bornée dans le temps et en rapporte le résultat. */
  private async mesurer(verification: () => Promise<void>): Promise<DependanceSanteDto> {
    const debut = Date.now();

    try {
      await this.avecDelaiMaximal(verification());
      return { statut: StatutDependance.Ok, duree_ms: Date.now() - debut };
    } catch (erreur) {
      return {
        statut: StatutDependance.Erreur,
        duree_ms: Date.now() - debut,
        erreur: this.resumerErreur(erreur),
      };
    }
  }

  /**
   * Borne une promesse dans le temps.
   *
   * Le minuteur est systématiquement annulé, y compris quand la vérification
   * gagne la course : un `setTimeout` laissé en vie maintiendrait la boucle
   * d'événements active et retarderait l'arrêt du conteneur à chaque appel de
   * la sonde — soit toutes les 30 secondes, indéfiniment.
   */
  private async avecDelaiMaximal(promesse: Promise<void>): Promise<void> {
    let minuteur: NodeJS.Timeout | undefined;

    const expiration = new Promise<never>((_, rejeter) => {
      minuteur = setTimeout(
        () => rejeter(new Error(`Délai de ${this.timeoutMs} ms dépassé.`)),
        this.timeoutMs,
      );
    });

    try {
      await Promise.race([promesse, expiration]);
    } finally {
      if (minuteur !== undefined) {
        clearTimeout(minuteur);
      }
      // La promesse perdante de la course reste en vol ; sans ce rattrapage,
      // son rejet tardif remonterait en « unhandled rejection » et abattrait le
      // processus — la sonde tuerait le service qu'elle surveille.
      promesse.catch(() => undefined);
    }
  }

  /**
   * Réduit une erreur à une ligne exploitable.
   *
   * Le message est conservé — « connect ECONNREFUSED redis:6379 » est
   * exactement ce qu'on veut lire dans une alerte — mais tronqué : certaines
   * erreurs Prisma embarquent la requête et la chaîne de connexion complète,
   * mot de passe compris.
   */
  private resumerErreur(erreur: unknown): string {
    const message = erreur instanceof Error ? erreur.message : String(erreur);
    const premiereLigne = message.split('\n')[0]?.trim() ?? 'Erreur inconnue.';

    return premiereLigne.length > LONGUEUR_MAX_ERREUR
      ? `${premiereLigne.slice(0, LONGUEUR_MAX_ERREUR)}…`
      : premiereLigne;
  }
}

const LONGUEUR_MAX_ERREUR = 200;
