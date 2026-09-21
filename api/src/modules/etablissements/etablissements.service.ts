import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException, ERROR_CODES } from '../../common/errors';
import { Page } from '../../common/interceptors';
import { PrismaService } from '../../prisma/prisma.service';
import { EtablissementStatut, type Prisma } from '../../generated/prisma';
import {
  PAR_PAGE_DEFAUT,
  type RechercheEtablissementsDto,
  TriRecherche,
} from './dto/recherche-etablissements.dto';

/**
 * Recherche et consultation publiques — livrable 11 §3.1.
 *
 * Deux invariants gouvernent ce service, et ils ne sont pas négociables.
 *
 * SEULES LES FICHES VALIDÉES SORTENT (RG03). Le filtre de statut est appliqué
 * ici, dans le service, et non laissé à l'appelant : un controller qui
 * oublierait de le passer publierait des fiches en attente de validation, ou
 * des fiches suspendues qu'un administrateur a précisément retirées. La règle
 * appartient au service, pas à ses usages.
 *
 * LES SPONSORISÉES SONT EN TÊTE, JAMAIS EXCLUSIVES (RG19). Elles précèdent les
 * autres dans l'ordre, mais ne remplacent aucun résultat pertinent : une
 * recherche « Lycée · Casablanca » rend tous les lycées de Casablanca, les
 * sponsorisés d'abord. C'est la différence entre une mise en avant et une
 * éviction — et le livrable 1 en fait un engagement de confiance.
 */
@Injectable()
export class EtablissementsService {
  constructor(private readonly db: PrismaService) {}

  /**
   * Recherche filtrée et triée.
   *
   * Le comptage et la page sont lus dans UNE transaction : sans cela, une fiche
   * validée entre les deux requêtes ferait afficher « 41 résultats » au-dessus
   * de quarante lignes, et la dernière page pourrait être vide.
   */
  async rechercher(filtres: RechercheEtablissementsDto): Promise<Page<EtablissementListe>> {
    const page = filtres.page ?? 1;
    const perPage = filtres.per_page ?? PAR_PAGE_DEFAUT;
    const where = this.construireFiltres(filtres);

    const [total, lignes] = await this.db.$transaction([
      this.db.etablissement.count({ where }),
      this.db.etablissement.findMany({
        where,
        orderBy: this.construireTri(filtres.tri),
        skip: (page - 1) * perPage,
        take: perPage,
        select: SELECTION_LISTE,
      }),
    ]);

    return new Page(lignes.map(versListe), total, page, perPage);
  }

  /**
   * Fiche complète par slug.
   *
   * Une fiche non validée rend 404 et non 403 (livrable 11 §1) : répondre
   * « interdit » confirmerait son existence, et l'on saurait qu'un
   * établissement a déposé un dossier ou s'est fait suspendre.
   */
  async parSlug(slug: string): Promise<EtablissementDetail> {
    const fiche = await this.db.etablissement.findFirst({
      where: { slug, statut: EtablissementStatut.validee },
      select: SELECTION_DETAIL,
    });

    if (!fiche) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cet établissement n'existe pas ou n'est pas encore publié.",
      );
    }

    return versDetail(fiche);
  }

  /** Référentiel des villes — alimente la barre de filtres (RG01). */
  villes() {
    return this.db.ville.findMany({
      orderBy: { nom: 'asc' },
      select: { id: true, nom: true, slug: true, region: true },
    });
  }

  /** Référentiel des niveaux et filières (RG02). */
  niveauxFilieres() {
    return this.db.niveauFiliere.findMany({
      orderBy: [{ categorie: 'asc' }, { libelle: 'asc' }],
      select: { id: true, libelle: true, categorie: true },
    });
  }

  // ---------------------------------------------------------------------------
  //  Construction de la requête
  // ---------------------------------------------------------------------------

  private construireFiltres(filtres: RechercheEtablissementsDto): Prisma.EtablissementWhereInput {
    const where: Prisma.EtablissementWhereInput = {
      // RG03 — non négociable, et posé en premier pour qu'il saute aux yeux.
      statut: EtablissementStatut.validee,
    };

    if (filtres.q) {
      // `contains` et non l'index FULLTEXT : la recherche doit fonctionner sur
      // des fragments (« massir » trouve « Al Massira »), ce que le mode
      // booléen de MySQL ne fait pas sans joker explicite. Le FULLTEXT du
      // livrable 10 §2.2 reste déclaré et servira au classement par pertinence
      // quand le volume le justifiera.
      where.OR = [{ nom: { contains: filtres.q } }, { description: { contains: filtres.q } }];
    }

    if (filtres.ville) {
      where.ville = { slug: filtres.ville };
    }

    if (filtres.type) {
      where.type = filtres.type;
    }

    if (filtres.niveaux?.length) {
      // `some` et non `every` : un parent qui coche « Sciences » et « Bilingue »
      // cherche un établissement proposant l'une OU l'autre, pas l'intersection
      // exacte — la barre de filtres des maquettes élargit, elle ne restreint pas.
      where.niveaux = {
        some: { niveau_id: { in: filtres.niveaux.map((id) => BigInt(id)) } },
      };
    }

    if (filtres.budget_min !== undefined) {
      // Le budget MAXIMUM de l'établissement doit atteindre le minimum cherché :
      // une fiche à 15 000–20 000 MAD reste pertinente pour qui cherche à
      // partir de 18 000.
      where.budget_max = { gte: filtres.budget_min };
    }

    if (filtres.budget_max !== undefined) {
      where.budget_min = { lte: filtres.budget_max };
    }

    if (filtres.note_min !== undefined) {
      where.note_moy = { gte: filtres.note_min };
    }

    return where;
  }

  /**
   * Ordre des résultats — RG19.
   *
   * `sponsorise` d'abord dans TOUS les cas : c'est ce que l'établissement paie.
   * Le tri demandé départage ensuite, à l'intérieur de chaque groupe.
   */
  private construireTri(tri?: TriRecherche): Prisma.EtablissementOrderByWithRelationInput[] {
    const sponsorisesEnTete: Prisma.EtablissementOrderByWithRelationInput = {
      sponsorise: 'desc',
    };

    switch (tri) {
      case TriRecherche.Recent:
        return [sponsorisesEnTete, { valide_le: 'desc' }, { id: 'desc' }];
      case TriRecherche.Nom:
        return [sponsorisesEnTete, { nom: 'asc' }, { id: 'asc' }];
      case TriRecherche.Note:
      default:
        // `id` en dernier ressort : sans départage stable, deux fiches de même
        // note peuvent changer de place d'une page à l'autre, et un résultat
        // apparaître deux fois ou pas du tout.
        return [sponsorisesEnTete, { note_moy: 'desc' }, { nb_avis: 'desc' }, { id: 'asc' }];
    }
  }
}

// -----------------------------------------------------------------------------
//  Projection — livrable 11 §1 : « jamais un modèle Prisma brut en sortie »
// -----------------------------------------------------------------------------

/**
 * Champs servis dans une liste de résultats.
 *
 * Volontairement restreint : `tel`, `whatsapp` et `email` n'y figurent pas.
 * Les exposer dans une liste de ~8 000 fiches en ferait un annuaire
 * téléphonique aspirable en une requête, alors que la mise en relation doit
 * passer par le formulaire de contact — qui trace l'événement (RG10) et
 * recueille le consentement 09-08 (RG09).
 */
const SELECTION_LISTE = {
  id: true,
  slug: true,
  nom: true,
  type: true,
  quartier: true,
  description: true,
  note_moy: true,
  nb_avis: true,
  budget_min: true,
  budget_max: true,
  sponsorise: true,
  verifie: true,
  premium: true,
  ville: { select: { nom: true, slug: true } },
  photos: { select: { chemin: true, alt: true }, orderBy: { ordre: 'asc' }, take: 1 },
} as const;

const SELECTION_DETAIL = {
  ...SELECTION_LISTE,
  adresse: true,
  lat: true,
  lng: true,
  tel: true,
  whatsapp: true,
  email: true,
  chiffres: true,
  faq: true,
  horaires: true,
  socials: true,
  autres_projets: true,
  facilites: true,
  video_url: true,
  video_poster: true,
  gamme_label: true,
  devis_label: true,
  photos: { select: { chemin: true, alt: true }, orderBy: { ordre: 'asc' } },
  niveaux: { select: { niveau: { select: { id: true, libelle: true, categorie: true } } } },
} as const;

type LigneListe = Prisma.EtablissementGetPayload<{ select: typeof SELECTION_LISTE }>;
type LigneDetail = Prisma.EtablissementGetPayload<{ select: typeof SELECTION_DETAIL }>;

export interface EtablissementListe {
  id: bigint;
  slug: string;
  nom: string;
  type: string;
  ville: { nom: string; slug: string };
  quartier: string | null;
  description: string | null;
  note_moy: string;
  nb_avis: number;
  budget_min: number | null;
  budget_max: number | null;
  sponsorise: boolean;
  verifie: boolean;
  premium: boolean;
  photo: { chemin: string; alt: string | null } | null;
}

export type EtablissementDetail = EtablissementListe & Record<string, unknown>;

/**
 * `Decimal` de Prisma sérialisé en CHAÎNE — livrable 11 §1.
 *
 * Le rendre en nombre exposerait `4.8` aux approximations du binaire flottant.
 * Pour une note affichée « ★ 4,8 » c'est anecdotique ; pour les montants de
 * facturation qui suivront, ce ne l'est pas — et il vaut mieux une seule règle
 * pour tous les décimaux qu'une exception à retenir.
 */
function versListe(ligne: LigneListe): EtablissementListe {
  return {
    id: ligne.id,
    slug: ligne.slug,
    nom: ligne.nom,
    type: ligne.type,
    ville: ligne.ville,
    quartier: ligne.quartier,
    description: ligne.description,
    note_moy: ligne.note_moy.toString(),
    nb_avis: ligne.nb_avis,
    budget_min: ligne.budget_min,
    budget_max: ligne.budget_max,
    sponsorise: ligne.sponsorise,
    verifie: ligne.verifie,
    premium: ligne.premium,
    photo: ligne.photos[0] ?? null,
  };
}

function versDetail(ligne: LigneDetail): EtablissementDetail {
  const { photos, niveaux, lat, lng, ...reste } = ligne;

  return {
    ...versListe({ ...ligne, photos: photos.slice(0, 1) }),
    ...reste,
    note_moy: ligne.note_moy.toString(),
    lat: lat?.toString() ?? null,
    lng: lng?.toString() ?? null,
    photos,
    niveaux: niveaux.map((lien) => lien.niveau),
  };
}
