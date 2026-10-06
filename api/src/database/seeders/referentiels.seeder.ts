import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NiveauFiliereCat, Prisma, RoleCode } from '../../generated/prisma';
import { PAGES_LEGALES } from './pages-legales';

/**
 * Référentiels — livrable 10 §3.
 *
 * Exécutés dans TOUS les environnements, production comprise : ce sont les
 * données sans lesquelles l'application n'a pas de sens — on ne peut pas créer
 * un compte sans rôle (RG25), ni une fiche sans ville (RG01), ni émettre une
 * facture sans taux de TVA.
 *
 * Tous les seeders sont IDEMPOTENTS (`upsert` sur clé naturelle) : les rejouer
 * ne duplique rien et n'écrase aucune modification faite depuis le back-office.
 * C'est ce qui permet de les lancer à chaque déploiement sans y réfléchir.
 */
@Injectable()
export class ReferentielsSeeder {
  private readonly logger = new Logger(ReferentielsSeeder.name);

  constructor(private readonly db: PrismaService) {}

  /**
   * Les quatre rôles nommés (RG25).
   *
   * Préalable à tout compte : `users.role_id` est NOT NULL. Seul le secrétariat
   * accepte des permissions unitaires — les trois autres rôles ont un périmètre
   * fixe, et RoleGuard refuse toute tentative de le modifier.
   */
  async roles(): Promise<void> {
    const roles = [
      { code: RoleCode.superadmin, libelle: 'Super Admin', perimetre_fixe: true },
      { code: RoleCode.secretariat, libelle: 'Secrétariat', perimetre_fixe: false },
      { code: RoleCode.commercial, libelle: 'Commercial', perimetre_fixe: true },
      { code: RoleCode.etablissement, libelle: 'Établissement', perimetre_fixe: true },
    ];

    for (const role of roles) {
      await this.db.role.upsert({
        where: { code: role.code },
        // `perimetre_fixe` est réaffirmé à chaque exécution : c'est une règle
        // de gestion, pas un réglage. Une modification en base serait une
        // dérive à corriger, pas une préférence à préserver.
        update: { libelle: role.libelle, perimetre_fixe: role.perimetre_fixe },
        create: role,
      });
    }

    this.logger.log(`${roles.length} rôles`);
  }

  /** Les 12 villes couvertes au lancement (RG01). */
  async villes(): Promise<void> {
    const villes = [
      { nom: 'Casablanca', slug: 'casablanca', region: 'Casablanca-Settat' },
      { nom: 'Rabat', slug: 'rabat', region: 'Rabat-Salé-Kénitra' },
      { nom: 'Marrakech', slug: 'marrakech', region: 'Marrakech-Safi' },
      { nom: 'Tanger', slug: 'tanger', region: 'Tanger-Tétouan-Al Hoceïma' },
      { nom: 'Fès', slug: 'fes', region: 'Fès-Meknès' },
      { nom: 'Agadir', slug: 'agadir', region: 'Souss-Massa' },
      { nom: 'Kénitra', slug: 'kenitra', region: 'Rabat-Salé-Kénitra' },
      { nom: 'Meknès', slug: 'meknes', region: 'Fès-Meknès' },
      { nom: 'Oujda', slug: 'oujda', region: "L'Oriental" },
      { nom: 'Tétouan', slug: 'tetouan', region: 'Tanger-Tétouan-Al Hoceïma' },
      { nom: 'Salé', slug: 'sale', region: 'Rabat-Salé-Kénitra' },
      { nom: 'Mohammedia', slug: 'mohammedia', region: 'Casablanca-Settat' },
    ];

    for (const ville of villes) {
      await this.db.ville.upsert({
        where: { slug: ville.slug },
        update: { nom: ville.nom, region: ville.region },
        create: ville,
      });
    }

    this.logger.log(`${villes.length} villes`);
  }

  /**
   * Référentiel des caractéristiques d'établissement — RG02, maquette du site
   * public (`FILTER_DEFS`).
   *
   * UNE SEULE TABLE POUR HUIT FAMILLES. `niveau_filieres` n'est pas une liste
   * de niveaux : c'est le référentiel générique des caractéristiques qu'un
   * établissement peut porter. Les filtres dynamiques de la recherche s'en
   * déduisent, et ouvrir une activité nouvelle ne demande aucune livraison
   * logicielle.
   *
   * LES MÊMES MOTS REVIENNENT D'UNE FAMILLE À L'AUTRE — « Sport » est une
   * filière et une activité, « Informatique » une filière et un domaine,
   * « Français » une langue et une matière. Ce sont des caractéristiques
   * distinctes, d'où la clé composite (libellé, catégorie).
   */
  async niveauxFilieres(): Promise<void> {
    const parCategorie: Record<NiveauFiliereCat, string[]> = {
      [NiveauFiliereCat.niveau]: [
        'Éveil',
        'Maternelle',
        'Primaire',
        'Collège',
        'Lycée',
        'Classes préparatoires',
        'Licence',
        'Master',
        'BTS',
      ],
      [NiveauFiliereCat.filiere]: [
        // Lycée
        'Sciences Math',
        'Sciences PC',
        'SVT',
        'Lettres',
        'Économie',
        // Supérieur
        'Ingénierie',
        'Commerce & Gestion',
        'Médecine',
        'Droit',
        'Informatique',
        // Transverses, déjà en place
        'Sciences',
        'Langues',
        'Bilingue',
        'Mission française',
        'Montessori',
        'Sport',
        'Gestion',
      ],
      [NiveauFiliereCat.langue]: ['Arabe', 'Français', 'Anglais', 'Espagnol'],
      [NiveauFiliereCat.activite]: [
        'Dessin',
        'Musique',
        'Cinéma',
        'Théâtre',
        'Sport',
        'Parascolaire',
      ],
      [NiveauFiliereCat.matiere]: ['Arabe', 'Français', 'Anglais', 'Espagnol', 'Sport'],
      [NiveauFiliereCat.cursus]: ['LMD', 'Cycle ingénieur'],
      [NiveauFiliereCat.domaine]: [
        'Informatique',
        'Langues',
        'Comptabilité',
        'Marketing',
        'Design',
      ],
      [NiveauFiliereCat.format]: ['Continue', 'À distance', 'Présentiel', 'Certifiée'],
    };

    let total = 0;

    for (const [categorie, libelles] of Object.entries(parCategorie)) {
      for (const libelle of libelles) {
        await this.db.niveauFiliere.upsert({
          where: {
            libelle_categorie: { libelle, categorie: categorie as NiveauFiliereCat },
          },
          update: {},
          create: { libelle, categorie: categorie as NiveauFiliereCat },
        });
        total += 1;
      }
    }

    const familles = Object.keys(parCategorie).length;
    this.logger.log(`${total} caractéristiques réparties en ${familles} familles`);
  }

  /**
   * Paramètres de facturation globaux — livrable 10 §5.
   *
   * Constantes réglementaires ou commerciales communes à TOUS les clients.
   * Aucun tarif d'établissement n'y figure : le prix de l'abonnement et le prix
   * par vue vivent sur Abonnement et PaiementVue, propres à chaque client
   * (RG14 — aucun tarif n'est public).
   *
   * `update: {}` volontairement : ces valeurs sont modifiables depuis le
   * back-office admin, et un re-seed ne doit pas écraser une décision de
   * gestion — contrairement aux rôles ci-dessus, qui sont des invariants.
   */
  async parametresFacturation(): Promise<void> {
    const parametres = [
      { cle: 'tva_pct', valeur: '20', libelle: 'Taux de TVA appliqué à toute facture' },
      {
        cle: 'duree_essai_gratuit_jours',
        valeur: '30',
        libelle: "Durée de l'essai gratuit toutes options (RG13)",
      },
      {
        cle: 'remise_annuelle_pct',
        valeur: '10',
        libelle: "Remise si l'abonnement annuel est réglé en une fois (RG11)",
      },
      {
        cle: 'rappel_echeance_j',
        valeur: '7',
        libelle: "Délai du rappel avant échéance d'abonnement (RG14)",
      },
      {
        cle: 'conservation_facture_ans',
        valeur: '10',
        libelle: 'Durée légale de conservation des factures',
      },
      {
        // À ZÉRO VOLONTAIREMENT : aucun livrable ne fixe ce taux, et l'inventer
        // reviendrait à décider ce que touche un commercial. Tant qu'il vaut
        // zéro, l'émission d'une facture ne crée aucune commission (RG18) ; la
        // Direction pose la valeur depuis l'écran « Paramètres ».
        cle: 'commission_pct',
        valeur: '0',
        libelle: 'Taux de commission du commercial apporteur (RG18) — à fixer par la Direction',
      },
    ];

    for (const parametre of parametres) {
      await this.db.parametreFacturation.upsert({
        where: { cle: parametre.cle },
        update: {},
        create: parametre,
      });
    }

    this.logger.log(`${parametres.length} paramètres de facturation`);
  }

  /**
   * Contenu éditorial initial (RG27) — page « À propos » et FAQ publique.
   *
   * Ces lignes ne sont pas supprimables depuis l'interface, seulement
   * modifiables : le site public afficherait des sections vides sans elles.
   */
  async contenuSite(): Promise<void> {
    await this.pageAPropos();
    await this.pagesLegales();

    /**
     * FAQ DE RÉFÉRENCE — reprise mot pour mot de la maquette « Centre d'aide ».
     *
     * C'est le texte que le client a validé : il fixe les engagements affichés
     * publiquement (gratuité pour les parents, publication sous 48 h, remise de
     * 10 % en paiement annuel). Le réécrire ici serait le renégocier en douce.
     */
    const faq = [
      {
        groupe: 'Pour les parents',
        question: 'écoles360, c’est gratuit pour les parents ?',
        reponse:
          'Oui, totalement. La recherche, la comparaison et la prise de contact avec les ' +
          'établissements sont entièrement gratuites pour les familles.',
      },
      {
        groupe: 'Pour les parents',
        question: 'Dois-je créer un compte pour laisser un avis ?',
        reponse:
          'Non. Vous pouvez soumettre un avis sans aucun compte. Il est publié après validation par ' +
          'notre équipe (modération) et nous ne conservons pas vos données personnelles.',
      },
      {
        groupe: 'Pour les parents',
        question: 'Comment sont sélectionnés les établissements ?',
        reponse:
          'Chaque fiche est contrôlée par nos équipes : existence réelle, coordonnées et ' +
          'autorisations, pour des informations fiables.',
      },
      {
        groupe: 'Pour les parents',
        question: 'Les tarifs affichés sont-ils exacts ?',
        reponse:
          'Nous affichons une gamme indicative (économique, intermédiaire, premium) pour situer un ' +
          'établissement. Le détail des frais est communiqué par l’école que vous contactez.',
      },
      {
        groupe: 'Pour les parents',
        question: 'Comment contacter un établissement ?',
        reponse:
          'Depuis chaque fiche, le numéro de téléphone est affiché en clair et vous pouvez écrire ' +
          'sur WhatsApp en un clic.',
      },
      {
        groupe: 'Pour les établissements',
        question: 'Comment référencer mon établissement ?',
        reponse:
          'Rendez-vous sur la page « Inscrivez-vous » : appelez-nous ou remplissez le formulaire, ' +
          'notre équipe crée votre fiche avec vous.',
      },
      {
        groupe: 'Pour les établissements',
        question: 'Combien coûte le référencement ?',
        reponse:
          'Trois formules : un mois d’essai gratuit avec toutes les options, un abonnement mensuel ' +
          'ou annuel (−10 % en paiement annuel), ou un paiement à la vue de votre page profil. Les ' +
          'tarifs sont définis avec votre conseiller.',
      },
      {
        groupe: 'Pour les établissements',
        question: 'Combien de temps pour publier ma fiche ?',
        reponse: 'Nos équipes valident et publient votre fiche sous 48 h ouvrées.',
      },
      {
        groupe: 'Pour les établissements',
        question: 'Puis-je gérer mes avis et mes statistiques ?',
        reponse:
          'Oui, votre espace établissement vous donne accès aux demandes de contact, aux avis et ' +
          'aux statistiques de votre fiche.',
      },
    ];

    for (const [rang, item] of faq.entries()) {
      const existante = await this.db.faqItem.findFirst({
        where: { question: item.question },
        select: { id: true, modifiee_par: true },
      });

      if (!existante) {
        await this.db.faqItem.create({ data: { ...item, ordre: rang + 1 } });
        continue;
      }

      // UNE QUESTION RETOUCHÉE DEPUIS LE BACK-OFFICE N'EST PLUS DU RÉFÉRENTIEL.
      // Le semeur réaligne le texte livré tant que personne n'y a touché ;
      // dès qu'un administrateur l'a modifiée, sa version l'emporte — sinon
      // un `seed` de routine effacerait sans prévenir une correction voulue.
      if (existante.modifiee_par === null) {
        await this.db.faqItem.update({
          where: { id: existante.id },
          data: { ...item, ordre: rang + 1 },
        });
      }
    }

    // Les questions d'une livraison précédente, jamais retouchées, sont
    // retirées : elles ne font partie ni de la maquette ni d'une décision
    // éditoriale, et les laisser doublonnerait la FAQ publique.
    await this.db.faqItem.deleteMany({
      where: { modifiee_par: null, question: { notIn: faq.map((item) => item.question) } },
    });

    this.logger.log(`Page « À propos » et ${faq.length} questions de FAQ`);
  }

  /**
   * Page « À propos ».
   *
   * LE TEXTE VIENT DE L'ANCIENNE PAGE CODÉE EN DUR (`APropos.tsx`), repris mot
   * pour mot : le client l'avait relu, et il porte des engagements publics —
   * « un établissement ne peut pas acheter une meilleure note », « nous ne
   * revendons pas vos données ». Le réécrire ici serait les renégocier.
   *
   * SUR UNE BASE DÉJÀ SEMÉE, SEULES LES CLÉS ABSENTES SONT AJOUTÉES. Une clé
   * présente a pu être modifiée depuis le back-office : l'écraser effacerait
   * une publication. Une clé absente — `equipe`, `engagements`, ajoutées après
   * le premier semis — laisserait au contraire la page sans sa section.
   *
   * `equipe` NAÎT VIDE. La maquette y montre les visages d'une école
   * (« Directeur », « Responsable du primaire ») : les semer comme l'équipe
   * d'écoles360 publierait des personnes qui n'existent pas. La section reste
   * masquée tant que le back-office ne l'a pas remplie.
   */
  private async pageAPropos(): Promise<void> {
    const blocs: Record<string, unknown> = {
      accroche: 'Aider chaque famille à trouver la bonne école, en toute confiance',
      mission:
        'Rassembler en un seul endroit une information fiable, vérifiée et comparable sur les ' +
        'établissements privés du Royaume — gratuitement pour les parents.',
      histoire:
        "écoles360 est né d'un constat simple : au Maroc, choisir un établissement scolaire privé " +
        'relève encore du bouche-à-oreille. Les familles comparent des brochures, appellent au hasard, ' +
        'se déplacent pour découvrir un tarif ou une filière qui ne correspond pas.' +
        '\n\n' +
        'écoles360 rassemble les crèches, écoles primaires, collèges, lycées, universités et centres ' +
        'de formation privés du Maroc sur une seule plateforme. Les parents recherchent par ville, par ' +
        "type et par niveau, comparent les établissements, lisent les avis d'autres familles, et " +
        'contactent gratuitement celui qui leur convient — sans créer de compte.',
      valeurs: [
        {
          titre: 'Transparence',
          texte:
            "Les fiches sont vérifiées avant publication et les avis modérés, jamais filtrés à l'avantage d'un client.",
        },
        {
          titre: 'Proximité',
          texte:
            'Une équipe au Maroc, un service en français et en arabe, des établissements que nous visitons.',
        },
        {
          titre: 'Indépendance',
          texte:
            'Une fiche sponsorisée est signalée comme telle et ne prend jamais la place des résultats pertinents.',
        },
      ],
      engagements: [
        {
          titre: 'Comment nous gagnons notre vie',
          texte:
            'Notre service est gratuit pour les parents. Il est financé par les établissements qui ' +
            'souscrivent un abonnement pour enrichir leur fiche et recevoir les demandes de contact.' +
            '\n\n' +
            'Un établissement ne peut pas acheter une meilleure note ni faire retirer un avis. Un ' +
            'abonnement met une fiche en avant dans les résultats — et dans ce cas seulement, elle ' +
            'porte la mention « Sponsorisé ». Une mise en avant ne remplace jamais les autres ' +
            "résultats : elle s'y ajoute, en tête, et reste identifiable.",
        },
        {
          titre: 'Les avis',
          texte:
            'Chaque avis est relu avant publication. Nous écartons les contenus injurieux, les propos ' +
            'hors sujet et les tentatives manifestes de manipulation — dans les deux sens : un ' +
            "établissement qui s'auto-félicite comme un concurrent qui le dénigre." +
            '\n\n' +
            'Un établissement peut répondre publiquement, une fois, à chaque avis le concernant. Cette ' +
            "réponse s'affiche sous l'avis d'origine, qui n'est ni modifié ni masqué. La note moyenne " +
            'affichée est recalculée à partir des seuls avis publiés.',
        },
        {
          titre: 'Vos données',
          texte:
            'Lorsque vous envoyez une demande de contact, vos coordonnées sont transmises à ' +
            "l'établissement que vous avez choisi, et à lui seul, afin qu'il vous rappelle. Nous ne les " +
            'revendons pas et ne les transmettons à aucun autre établissement. Ce traitement ' +
            "s'effectue avec votre accord explicite, conformément à la loi 09-08 relative à la " +
            "protection des personnes physiques à l'égard du traitement des données à caractère " +
            'personnel.' +
            '\n\n' +
            'Pour accéder à vos données, les corriger ou en demander la suppression, écrivez-nous à ' +
            'contact@ecoles360.com.',
        },
      ],
      equipe: [],
      coordonnees: {
        email: 'contact@ecoles360.com',
        telephone: '+212 5 22 00 00 00',
        adresse: 'Casablanca, Maroc',
      },
    };

    const existante = await this.db.pageCms.findUnique({
      where: { cle: 'a-propos' },
      select: { blocs: true },
    });

    if (!existante) {
      await this.db.pageCms.create({
        data: { cle: 'a-propos', titre: 'À propos', blocs: blocs as Prisma.InputJsonObject },
      });
      return;
    }

    const actuels =
      existante.blocs && typeof existante.blocs === 'object' && !Array.isArray(existante.blocs)
        ? (existante.blocs as Record<string, unknown>)
        : {};
    const manquantes = Object.keys(blocs).filter((cle) => !(cle in actuels));

    if (manquantes.length > 0) {
      const completes = Object.fromEntries(manquantes.map((cle) => [cle, blocs[cle]]));

      await this.db.pageCms.update({
        where: { cle: 'a-propos' },
        data: { blocs: { ...completes, ...actuels } as Prisma.InputJsonObject },
      });
      this.logger.log(`Page « À propos » complétée : ${manquantes.join(', ')}`);
    }
  }

  /**
   * Les trois pages légales — loi 09-08 (RG09).
   *
   * LE TEXTE VIT DANS `pages-legales.ts`, pas ici : c'est de la prose
   * juridique, pas du code, et la mêler au semis la rendrait illisible et
   * impossible à relire par un juriste.
   *
   * BASE RÉDIGÉE, PAS TEXTE VALIDÉ. Les passages « [À COMPLÉTER] » portent
   * des faits que seul l'éditeur connaît, et l'écran « Contenu du site »
   * signale une page tant qu'il en reste un.
   *
   * Idempotent : une page déjà rédigée n'est JAMAIS réécrite. Sans cette
   * garde, un `db:seed` de routine écraserait le texte relu par le juriste.
   */
  private async pagesLegales(): Promise<void> {
    for (const [cle, page] of Object.entries(PAGES_LEGALES)) {
      const existante = await this.db.pageCms.findUnique({ where: { cle }, select: { id: true } });

      if (existante) continue;

      await this.db.pageCms.create({
        data: { cle, titre: page.titre, blocs: { sections: page.sections } },
      });

      const aCompleter = page.sections.filter((s) => s.corps.includes('[À COMPLÉTER')).length;

      this.logger.log(
        `Page « ${page.titre} » créée — ${page.sections.length} rubriques, ${aCompleter} à compléter`,
      );
    }
  }
}
