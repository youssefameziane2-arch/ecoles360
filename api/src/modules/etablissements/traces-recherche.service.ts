import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RechercheEtablissementsDto } from './dto/recherche-etablissements.dto';

/**
 * Enregistrement des recherches — B-40, tuile « Recherches effectuées », bloc
 * « Recherches par ville » et « Taux de transformation » (demandes ÷
 * recherches) de la maquette `isAdminStats`.
 *
 * ENREGISTRÉ CÔTÉ SERVEUR, PAS PAR UNE ROUTE QUE LE FRONT APPELLE. Une route
 * dédiée aurait laissé le client DÉCLARER son nombre de résultats : un chiffre
 * fourni par le navigateur atterrirait tel quel dans une statistique
 * d'administration. Ici `nb_resultats` est celui que la base vient de rendre.
 *
 * UNE RECHERCHE EST UN CRITÈRE, PAS UN AFFICHAGE. La page de résultats se
 * charge sans filtre au premier affichage, et chaque passage à la page
 * suivante rappelle la même route : compter ces appels gonflerait la tuile et
 * fausserait le taux de transformation, qui divise les demandes par les
 * recherches. On n'enregistre donc qu'un premier écran portant au moins un
 * critère — parcourir le catalogue n'est pas chercher.
 *
 * L'ÉCRITURE NE DOIT JAMAIS FAIRE ÉCHOUER LA RECHERCHE. Un parent qui cherche
 * une école n'a pas à voir une erreur parce qu'une statistique n'a pas pu
 * s'écrire : la trace est tentée, et son échec est journalisé sans remonter.
 */
@Injectable()
export class TracesRechercheService {
  private readonly logger = new Logger(TracesRechercheService.name);

  constructor(private readonly db: PrismaService) {}

  /**
   * Trace une recherche si elle en est une. Ne renvoie rien et ne lève rien :
   * l'appelant la déclenche et poursuit.
   */
  async enregistrer(filtres: RechercheEtablissementsDto, nbResultats: number): Promise<void> {
    if (!this.estUneRecherche(filtres)) return;

    try {
      // La ville est reçue en slug ; la trace garde l'identifiant, pour que
      // renommer une ville du référentiel ne scinde pas son historique en deux.
      const ville = filtres.ville
        ? await this.db.ville.findUnique({
            where: { slug: filtres.ville },
            select: { id: true },
          })
        : null;

      await this.db.traceRecherche.create({
        data: {
          ville_id: ville?.id ?? null,
          // Un parent coche souvent plusieurs cycles : la trace garde le
          // premier, seul format que « Recherches par type » sait lire. Les
          // autres ne sont pas perdus pour la tuile, qui compte des recherches.
          type: filtres.type?.[0] ?? null,
          nb_resultats: nbResultats,
        },
      });
    } catch (erreur) {
      this.logger.warn(`Trace de recherche non écrite : ${(erreur as Error).message}`);
    }
  }

  /**
   * Vrai si l'appel exprime une intention de recherche : un premier écran,
   * et au moins un critère.
   */
  private estUneRecherche(filtres: RechercheEtablissementsDto): boolean {
    if ((filtres.page ?? 1) !== 1) return false;

    return Boolean(
      filtres.q ||
      filtres.ville ||
      filtres.type?.length ||
      filtres.niveaux?.length ||
      filtres.budget_min !== undefined ||
      filtres.budget_max !== undefined ||
      filtres.note_min !== undefined,
    );
  }
}
