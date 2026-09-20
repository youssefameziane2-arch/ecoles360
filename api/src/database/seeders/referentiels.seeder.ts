import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NiveauFiliereCat, RoleCode } from '../../generated/prisma';

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
   * Niveaux et filières (RG02) — aligné sur les filtres des maquettes.
   *
   * À ne pas confondre avec les six TYPES d'établissement, qui sont une
   * énumération du schéma : ici ce sont les cycles et spécialités qu'un
   * établissement propose, en relation (n,n).
   */
  async niveauxFilieres(): Promise<void> {
    const niveaux = [
      'Éveil',
      'Maternelle',
      'Primaire',
      'Collège',
      'Lycée',
      'Classes préparatoires',
      'Licence',
      'Master',
      'BTS',
    ];

    const filieres = [
      'Sciences',
      'Économie',
      'Lettres',
      'Langues',
      'Bilingue',
      'Mission française',
      'Montessori',
      'Sport',
      'Informatique',
      'Droit',
      'Gestion',
    ];

    for (const libelle of niveaux) {
      await this.db.niveauFiliere.upsert({
        where: { libelle },
        update: { categorie: NiveauFiliereCat.niveau },
        create: { libelle, categorie: NiveauFiliereCat.niveau },
      });
    }

    for (const libelle of filieres) {
      await this.db.niveauFiliere.upsert({
        where: { libelle },
        update: { categorie: NiveauFiliereCat.filiere },
        create: { libelle, categorie: NiveauFiliereCat.filiere },
      });
    }

    this.logger.log(`${niveaux.length} niveaux et ${filieres.length} filières`);
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
    await this.db.pageCms.upsert({
      where: { cle: 'a-propos' },
      update: {},
      create: {
        cle: 'a-propos',
        titre: 'À propos',
        blocs: {
          histoire:
            "écoles360 est né d'un constat simple : au Maroc, choisir un établissement scolaire privé " +
            'relève encore du bouche-à-oreille. Les familles comparent des brochures, appellent au hasard, ' +
            'se déplacent pour découvrir un tarif ou une filière qui ne correspond pas.',
          mission:
            'Rassembler en un seul endroit une information fiable, vérifiée et comparable sur les ' +
            'établissements privés du Royaume — gratuitement pour les parents.',
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
          coordonnees: {
            email: 'contact@ecoles360.com',
            telephone: '+212 5 22 00 00 00',
            adresse: 'Casablanca, Maroc',
          },
        },
      },
    });

    const faq = [
      {
        question: 'Le service est-il gratuit pour les parents ?',
        reponse:
          'Oui, entièrement. La recherche, la consultation des fiches, la lecture des avis et la prise ' +
          'de contact avec un établissement sont gratuites et sans création de compte.',
        ordre: 1,
      },
      {
        question: 'Comment les établissements sont-ils vérifiés ?',
        reponse:
          'Chaque fiche est contrôlée par notre équipe avant publication. Les établissements portant le ' +
          "badge « Vérifié » ont fourni les justificatifs de leur autorisation d'exercer.",
        ordre: 2,
      },
      {
        question: 'Que signifie la mention « Sponsorisé » ?',
        reponse:
          "L'établissement a souscrit une campagne de mise en avant. Sa fiche apparaît en tête des " +
          'résultats correspondant à votre recherche, mais ne remplace jamais les autres résultats.',
        ordre: 3,
      },
      {
        question: 'Comment déposer un avis ?',
        reponse:
          "Depuis la fiche de l'établissement, bouton « Laisser un avis ». Votre avis est relu par notre " +
          "équipe avant publication, et l'établissement peut y répondre une fois.",
        ordre: 4,
      },
      {
        question: 'Comment inscrire mon établissement ?',
        reponse:
          'Remplissez le formulaire « Inscrivez-vous » : un conseiller vous recontacte pour définir la ' +
          'formule adaptée à votre établissement et créer votre espace.',
        ordre: 5,
      },
    ];

    for (const item of faq) {
      const existante = await this.db.faqItem.findFirst({ where: { question: item.question } });

      if (existante) {
        continue;
      }

      await this.db.faqItem.create({ data: item });
    }

    this.logger.log(`Page « À propos » et ${faq.length} questions de FAQ`);
  }
}
