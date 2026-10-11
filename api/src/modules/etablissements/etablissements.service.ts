import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException, ERROR_CODES } from '../../common/errors';
import { Page } from '../../common/interceptors';
import { PrismaService } from '../../prisma/prisma.service';
import { SponsoringsService } from '../sponsorings/sponsorings.service';
import { TracesRechercheService } from './traces-recherche.service';
import { EtablissementStatut, type EtablissementType, type Prisma } from '../../generated/prisma';
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
  constructor(
    private readonly db: PrismaService,
    private readonly sponsorings: SponsoringsService,
    private readonly traces: TracesRechercheService,
  ) {}

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

    if (filtres.type && filtres.type.length > 1) {
      await this.restreindreAuxGroupesComplets(where, filtres.type);
    }

    if (filtres.niveaux?.length) {
      await this.appliquerCaracteristiques(
        where,
        filtres.niveaux.map(Number).filter(Number.isFinite),
      );
    }

    // Campagnes actives concernées par CETTE recherche, déjà classées par
    // niveau puis par rotation équitable (RG19).
    const misesEnAvant = await this.sponsorings.miseEnAvantPour({
      villeSlug: filtres.ville,
      types: filtres.type,
      q: filtres.q,
    });

    const idsEnAvant = misesEnAvant.map((mise) => mise.etablissementId);

    // LES FICHES MISES EN AVANT FORMENT UNE TÊTE DE LISTE ordonnée en mémoire,
    // le reste est paginé en base. Les fondre dans un seul `ORDER BY` est
    // impossible : la rotation change chaque jour et ne s'exprime pas en SQL
    // sans requête brute. La tête est courte par construction — quelques
    // campagnes actives concernent une recherche donnée — donc la charger
    // entière ne coûte rien.
    const [total, tete] = await Promise.all([
      this.db.etablissement.count({ where }),
      idsEnAvant.length > 0
        ? this.db.etablissement.findMany({
            where: { ...where, id: { in: idsEnAvant } },
            select: SELECTION_LISTE,
          })
        : Promise.resolve([]),
    ]);

    // Une campagne peut viser une fiche que la recherche écarte (note minimale,
    // budget) : on ordonne ce que la base a RÉELLEMENT rendu, pas la liste
    // demandée.
    const rang = new Map(idsEnAvant.map((id, index) => [id.toString(), index]));
    tete.sort((a, b) => (rang.get(a.id.toString()) ?? 0) - (rang.get(b.id.toString()) ?? 0));

    const debutPage = (page - 1) * perPage;
    const teteDeLaPage = tete.slice(debutPage, debutPage + perPage);
    const placesRestantes = perPage - teteDeLaPage.length;

    const reste =
      placesRestantes > 0
        ? await this.db.etablissement.findMany({
            where: idsEnAvant.length > 0 ? { ...where, id: { notIn: idsEnAvant } } : where,
            orderBy: this.construireTri(filtres.tri),
            select: SELECTION_LISTE,
            // La tête a déjà consommé `tete.length` places : le reste reprend
            // exactement là où elle s'arrête, sans trou ni doublon d'une page
            // à l'autre.
            skip: Math.max(0, debutPage - tete.length),
            take: placesRestantes,
          })
        : [];

    // SANS `await` : la trace est une statistique d'administration, et le
    // parent n'a pas à l'attendre pour voir ses résultats. Le service avale
    // ses propres erreurs — il n'y a donc aucun rejet à rattraper ici.
    void this.traces.enregistrer(filtres, total);

    return new Page([...teteDeLaPage, ...reste].map(versListe), total, page, perPage);
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

    return { ...versDetail(fiche), cycles: await this.cyclesFreres(fiche) };
  }

  /**
   * Les cycles du même groupe scolaire, dans l'ordre d'âge.
   *
   * VIDE QUAND LA FICHE N'APPARTIENT À AUCUN GROUPE : le bandeau
   * « Établissement multi-cycles » ne doit pas s'afficher pour une école
   * unique, et un tableau vide le dit sans que le front ait à tester un nul.
   *
   * L'ORDRE EST CELUI DE LA SCOLARITÉ, pas l'alphabétique : un parent lit
   * « crèche, primaire, collège, lycée » comme un parcours. Trié par nom, le
   * lycée passerait avant le primaire et la progression disparaîtrait.
   */
  private async cyclesFreres(fiche: {
    id: bigint;
    groupe: { nom: string; slug: string } | null;
    groupe_id: bigint | null;
  }): Promise<{ nom: string; slug: string; type: string; actif: boolean }[]> {
    if (!fiche.groupe_id) {
      return [];
    }

    const freres = await this.db.etablissement.findMany({
      where: { groupe_id: fiche.groupe_id, statut: EtablissementStatut.validee },
      select: { id: true, nom: true, slug: true, type: true },
    });

    return freres
      .sort((a, b) => ORDRE_DES_CYCLES.indexOf(a.type) - ORDRE_DES_CYCLES.indexOf(b.type))
      .map((frere) => ({
        nom: frere.nom,
        slug: frere.slug,
        type: frere.type,
        actif: frere.id === fiche.id,
      }));
  }

  /**
   * Établissements similaires — même type, même ville, fiche exclue.
   *
   * MÊME TYPE ET MÊME VILLE, PAS « LES MIEUX NOTÉS ». Un parent qui regarde un
   * lycée de Casablanca compare avec d'autres lycées de Casablanca ; lui
   * proposer une crèche de Tanger parce qu'elle a cinq étoiles ne l'aide en
   * rien.
   *
   * LES FRÈRES DU MÊME GROUPE SONT EXCLUS : ils ont déjà leur bandeau en haut
   * de page, et les reproposer ici donnerait l'impression d'un annuaire qui se
   * répète.
   *
   * Élargi à la région quand la ville ne suffit pas — trois cartes vides
   * valent moins qu'une suggestion un peu plus lointaine.
   */
  async similaires(slug: string) {
    const fiche = await this.db.etablissement.findFirst({
      where: { slug, statut: EtablissementStatut.validee },
      select: { id: true, type: true, ville_id: true, groupe_id: true },
    });

    if (!fiche) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cet établissement n'existe pas ou n'est pas encore publié.",
      );
    }

    const exclusions: Prisma.EtablissementWhereInput = {
      statut: EtablissementStatut.validee,
      type: fiche.type,
      id: { not: fiche.id },
      // LE PIÈGE DU NULL. `NOT (groupe_id = 5)` vaut INDÉTERMINÉ — et non VRAI —
      // pour une fiche dont `groupe_id` est nul : SQL écartait alors toutes les
      // fiches hors groupe, c'est-à-dire la majorité. Il faut dire les deux cas
      // explicitement.
      ...(fiche.groupe_id
        ? { OR: [{ groupe_id: null }, { groupe_id: { not: fiche.groupe_id } }] }
        : {}),
    };

    const memeVille = await this.db.etablissement.findMany({
      where: { ...exclusions, ville_id: fiche.ville_id },
      orderBy: [{ sponsorise: 'desc' }, { note_moy: 'desc' }],
      take: 3,
      select: SELECTION_LISTE,
    });

    if (memeVille.length >= 3) {
      return memeVille.map(versListe);
    }

    const ailleurs = await this.db.etablissement.findMany({
      where: {
        ...exclusions,
        ville_id: { not: fiche.ville_id },
        id: { notIn: [fiche.id, ...memeVille.map((e) => e.id)] },
      },
      orderBy: [{ sponsorise: 'desc' }, { note_moy: 'desc' }],
      take: 3 - memeVille.length,
      select: SELECTION_LISTE,
    });

    return [...memeVille, ...ailleurs].map(versListe);
  }

  /**
   * Référentiel des villes — alimente la barre de filtres (RG01).
   *
   * `nb_etablissements` COMPTE LES FICHES VALIDÉES, PAS TOUTES LES FICHES
   * (RG03) : une ville avec cinq fiches en attente et zéro publiée doit
   * afficher zéro, sans quoi la page d'accueil annoncerait des établissements
   * qu'un visiteur ne peut pas encore consulter.
   *
   * `groupBy` plutôt qu'un `_count` de relation filtré : la version de Prisma
   * posée ici ne stabilise pas encore le comptage de relation avec `where`.
   */
  async villes() {
    const [villes, comptes] = await Promise.all([
      this.db.ville.findMany({
        orderBy: { nom: 'asc' },
        select: { id: true, nom: true, slug: true, region: true },
      }),
      this.db.etablissement.groupBy({
        by: ['ville_id'],
        where: { statut: EtablissementStatut.validee },
        _count: { _all: true },
      }),
    ]);

    const parVille = new Map(comptes.map((c) => [c.ville_id.toString(), c._count._all]));

    return villes.map((ville) => ({
      ...ville,
      nb_etablissements: parVille.get(ville.id.toString()) ?? 0,
    }));
  }

  /**
   * Page d'une ville — livrable 12 §5.
   *
   * AGRÉGATS CALCULÉS EN BASE, PAS DEVINÉS DEPUIS UNE PAGE DE RÉSULTATS. La
   * page affiche « 42 établissements · ★ 4,3 de moyenne · 7 quartiers » : ces
   * chiffres portent sur TOUTE la ville, alors qu'une recherche n'en rend que
   * dix-huit. Les déduire de la première page donnerait des totaux faux dès la
   * dix-neuvième fiche.
   *
   * Seules les fiches validées comptent (RG03), ici comme partout.
   */
  async ville(slug: string) {
    const ville = await this.db.ville.findUnique({
      where: { slug },
      select: { id: true, nom: true, slug: true, region: true },
    });

    if (!ville) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cette ville n'existe pas.",
      );
    }

    const where = { ville_id: ville.id, statut: EtablissementStatut.validee };

    const [agregat, parType, quartiers] = await Promise.all([
      this.db.etablissement.aggregate({ where, _avg: { note_moy: true }, _count: { _all: true } }),
      this.db.etablissement.groupBy({ by: ['type'], where, _count: { _all: true } }),
      this.db.etablissement.findMany({
        where: { ...where, quartier: { not: null } },
        select: { quartier: true },
        distinct: ['quartier'],
        orderBy: { quartier: 'asc' },
      }),
    ]);

    return {
      ...ville,
      nb_etablissements: agregat._count._all,
      // Arrondi à une décimale, comme `note_moy` : l'affichage est « ★ 4,3 ».
      note_moyenne: agregat._avg.note_moy
        ? (Math.round(Number(agregat._avg.note_moy) * 10) / 10).toString()
        : null,
      par_type: parType.map((ligne) => ({ type: ligne.type, total: ligne._count._all })),
      quartiers: quartiers.map((ligne) => ligne.quartier).filter((q): q is string => Boolean(q)),
    };
  }

  /** Référentiel des niveaux et filières (RG02). */
  niveauxFilieres() {
    return this.db.niveauFiliere.findMany({
      orderBy: [{ categorie: 'asc' }, { libelle: 'asc' }],
      select: { id: true, libelle: true, categorie: true },
    });
  }

  /**
   * Restreint aux fiches dont le GROUPE couvre tous les cycles cochés.
   *
   * COCHER PLUSIEURS CYCLES, C'EST CHERCHER UN GROUPE QUI LES A TOUS. Un parent
   * qui coche « Crèche » et « Collège » a deux enfants d'âges différents : il
   * veut UNE enseigne pour les deux, pas la liste de toutes les crèches plus
   * celle de tous les collèges. La maquette, elle, fait un simple OU — c'est
   * une divergence assumée, demandée par le client, et plus utile au parent.
   *
   * Chaque cycle étant une fiche distincte, la condition ne peut pas se poser
   * sur la fiche : aucune ne porte deux types. Elle se pose sur le groupe, puis
   * on garde les fiches de ces groupes dont le type est parmi ceux cochés —
   * les portes d'entrée qui intéressent le parent.
   *
   * UN SEUL CYCLE COCHÉ NE DÉCLENCHE RIEN : chercher « crèche » doit rendre
   * toutes les crèches, groupées ou non. La contrainte n'a de sens qu'à partir
   * de deux.
   */
  private async restreindreAuxGroupesComplets(
    where: Prisma.EtablissementWhereInput,
    types: EtablissementType[],
  ): Promise<void> {
    if (types.length < 2) {
      return;
    }

    // Fiches validées portant l'un des cycles cochés, avec leur groupe.
    const candidates = await this.db.etablissement.findMany({
      where: { statut: EtablissementStatut.validee, type: { in: types }, groupe_id: { not: null } },
      select: { groupe_id: true, type: true },
    });

    const cyclesParGroupe = new Map<string, Set<string>>();

    for (const fiche of candidates) {
      const cle = String(fiche.groupe_id);
      const cycles = cyclesParGroupe.get(cle) ?? new Set<string>();
      cycles.add(fiche.type);
      cyclesParGroupe.set(cle, cycles);
    }

    const complets = [...cyclesParGroupe.entries()]
      .filter(([, cycles]) => types.every((type) => cycles.has(type)))
      .map(([cle]) => BigInt(cle));

    // Aucun groupe ne couvre la combinaison : on le dit franchement par un
    // ensemble vide, plutôt que de rendre une liste qui ne répond pas.
    where.groupe_id = complets.length > 0 ? { in: complets } : { in: [] };
  }

  /**
   * Applique les caractéristiques cochées : OU dans une famille, ET entre elles.
   *
   * C'EST LA SEULE SÉMANTIQUE QUI CORRESPOND À CE QU'ON COCHE. Un parent qui
   * coche « Arabe » et « Français » veut un établissement qui propose l'une OU
   * l'autre — il élargit. Mais s'il coche aussi « Sport » dans les activités,
   * il veut les deux à la fois : une langue parmi celles cochées ET le sport.
   * Un unique `some` sur tous les identifiants confondus rendrait des écoles
   * qui n'ont que le sport, sans aucune des langues demandées.
   *
   * La famille de chaque identifiant est LUE EN BASE plutôt que transmise par
   * le client : c'est le serveur qui connaît le référentiel, et un client qui
   * mentirait sur la famille fausserait le regroupement.
   */
  private async appliquerCaracteristiques(
    where: Prisma.EtablissementWhereInput,
    ids: number[],
  ): Promise<void> {
    const caracteristiques = await this.db.niveauFiliere.findMany({
      where: { id: { in: ids.map((id) => BigInt(id)) } },
      select: { id: true, categorie: true },
    });

    if (caracteristiques.length === 0) {
      return;
    }

    const parFamille = new Map<string, bigint[]>();

    for (const caracteristique of caracteristiques) {
      const famille = parFamille.get(caracteristique.categorie) ?? [];
      famille.push(caracteristique.id);
      parFamille.set(caracteristique.categorie, famille);
    }

    // Un `some` par famille : leurs conditions se cumulent naturellement dans
    // le `AND` de Prisma.
    where.AND = [...parFamille.values()].map((identifiants) => ({
      niveaux: { some: { niveau_id: { in: identifiants } } },
    }));
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

    if (filtres.type?.length) {
      where.type = { in: filtres.type };
    }

    // Les caractéristiques cochées sont appliquées plus bas, par
    // `appliquerCaracteristiques` : elles demandent une lecture du référentiel
    // pour savoir à quelle famille chaque identifiant appartient.

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
  // Coordonnées publiques dès la liste — pas de risque RG09/RG10 comme pour
  // tel/whatsapp/email : c'est une position approximative, pas un canal de
  // contact. Elle alimente la carte des résultats (livrable 12 §5).
  lat: true,
  lng: true,
  // Les canaux de contact SONT PUBLICS SUR LA FICHE, donc sur la carte aussi :
  // la maquette pose « appeler », « WhatsApp » et « site web » directement dans
  // la liste. Les cacher ici obligerait à ouvrir la fiche pour composer un
  // numéro, ce qui est précisément ce que ces boutons évitent.
  tel: true,
  whatsapp: true,
  site_web: true,
  groupe_id: true,
  groupe: {
    select: {
      nom: true,
      slug: true,
      // Les cycles du groupe, pour l'étiquette « Crèche → Lycée ».
      etablissements: {
        where: { statut: EtablissementStatut.validee },
        select: { type: true },
      },
    },
  },
  ville: { select: { nom: true, slug: true } },
  photos: { select: { chemin: true, alt: true }, orderBy: { ordre: 'asc' }, take: 1 },
} as const;

/** Ordre de la scolarité — sert à ranger les cycles d'un groupe. */
const ORDRE_DES_CYCLES: string[] = [
  'creche',
  'primaire',
  'college',
  'lycee',
  'universite',
  'superieur',
  'formation',
];

const SELECTION_DETAIL = {
  ...SELECTION_LISTE,
  adresse: true,
  tel: true,
  whatsapp: true,
  email: true,
  chiffres: true,
  faq: true,
  horaires: true,
  socials: true,
  autres_projets: true,
  facilites: true,
  equipe: true,
  video_url: true,
  video_poster: true,
  gamme_label: true,
  devis_label: true,
  langues: true,
  site_web: true,
  projet_pedagogique: true,
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
  lat: string | null;
  lng: string | null;
  tel: string | null;
  whatsapp: string | null;
  site_web: string | null;
  /** Étendue du groupe scolaire — nul hors groupe ou sous deux cycles. */
  groupe: { nom: string; slug: string; premier: string; dernier: string } | null;
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
    lat: ligne.lat?.toString() ?? null,
    lng: ligne.lng?.toString() ?? null,
    tel: ligne.tel,
    whatsapp: ligne.whatsapp,
    site_web: ligne.site_web,
    groupe: etenduDuGroupe(ligne.groupe),
    photo: ligne.photos[0] ?? null,
  };
}

/**
 * Étendue d'un groupe scolaire : son nom et ses cycles extrêmes.
 *
 * « Crèche → Lycée » DIT EN TROIS MOTS ce qu'une liste de quatre puces mettrait
 * une ligne à dire. C'est ce que montre la maquette sur les cartes de
 * résultats, et c'est l'information qui décide un parent : cette enseigne
 * couvre-t-elle toute la scolarité de mes enfants ?
 *
 * NUL SOUS DEUX CYCLES : une enseigne qui n'a qu'une école n'est pas un groupe,
 * et l'étiquette « Crèche → Crèche » n'apprendrait rien.
 */
function etenduDuGroupe(
  groupe: { nom: string; slug: string; etablissements: { type: string }[] } | null,
): { nom: string; slug: string; premier: string; dernier: string } | null {
  if (!groupe) {
    return null;
  }

  const cycles = [...new Set(groupe.etablissements.map((e) => e.type))].sort(
    (a, b) => ORDRE_DES_CYCLES.indexOf(a) - ORDRE_DES_CYCLES.indexOf(b),
  );

  if (cycles.length < 2) {
    return null;
  }

  return {
    nom: groupe.nom,
    slug: groupe.slug,
    premier: cycles[0] as string,
    dernier: cycles[cycles.length - 1] as string,
  };
}

function versDetail(ligne: LigneDetail): EtablissementDetail {
  // lat/lng, note_moy ET groupe sortent exclus de `reste` : `versListe` les
  // transforme (chaînes pour les décimaux, étendue « Crèche → Lycée » pour le
  // groupe), et les reprendre bruts depuis `ligne` écraserait ces conversions
  // par les objets Prisma — `Decimal` non sérialisable, groupe sans étendue.
  const { photos, niveaux, lat: _lat, lng: _lng, groupe: _groupe, ...reste } = ligne;

  return {
    ...versListe({ ...ligne, photos: photos.slice(0, 1) }),
    ...reste,
    note_moy: ligne.note_moy.toString(),
    photos,
    niveaux: niveaux.map((lien) => lien.niveau),
  };
}
