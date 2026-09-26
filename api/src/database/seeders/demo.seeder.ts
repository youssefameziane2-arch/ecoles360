import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Algorithm, hash } from '@node-rs/argon2';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AuditSeverite,
  AvisStatut,
  DemandeCanal,
  DemandeStatut,
  EtablissementStatut,
  EtablissementType,
  LeadSource,
  LeadStatut,
  LeadUrgence,
  NiveauFiliereCat,
  PermissionPortee,
  RoleCode,
  SponsoringNiveau,
  type Etablissement,
  type User,
} from '../../generated/prisma';

/**
 * Données de démonstration — livrable 10 §3.
 *
 * Réservées au développement et à la recette. La commande refuse de les poser
 * en production (voir SeedCommand) : ce sont des comptes aux mots de passe
 * connus et des données inventées, qui n'ont rien à faire à côté de vraies
 * fiches clientes.
 *
 * Elles reproduisent les écrans des maquettes — c'est leur raison d'être : un
 * développeur qui lance `db:seed` doit retrouver le tableau de bord, le kanban
 * CRM et la fiche vitrine tels qu'ils ont été conçus, chiffres compris.
 *
 * Idempotentes comme les référentiels : `upsert` sur clé naturelle.
 */
@Injectable()
export class DemoSeeder {
  private readonly logger = new Logger(DemoSeeder.name);

  constructor(
    private readonly db: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Les comptes de connexion des maquettes (livrable 10 §3).
   *
   * Les mots de passe viennent de l'environnement et sont hachés en Argon2id —
   * jamais de secret en dur dans le dépôt, même pour de la démonstration. En
   * l'absence de variable, un mot de passe de développement explicite est
   * utilisé : il vaut mieux un secret visiblement factice qu'un seeder qui
   * échoue à froid sur un poste neuf.
   */
  async comptes(): Promise<{ admin: User; sara: User; etablissement: User; commercial: User }> {
    const [superadmin, secretariat, commercial, etablissement] = await Promise.all([
      this.db.role.findUniqueOrThrow({ where: { code: RoleCode.superadmin } }),
      this.db.role.findUniqueOrThrow({ where: { code: RoleCode.secretariat } }),
      this.db.role.findUniqueOrThrow({ where: { code: RoleCode.commercial } }),
      this.db.role.findUniqueOrThrow({ where: { code: RoleCode.etablissement } }),
    ]);

    const admin = await this.creerCompte({
      email: 'direction@ecoles360.com',
      name: 'Direction écoles360',
      role_id: superadmin.id,
      motDePasse: this.motDePasse('SEED_ADMIN_PASSWORD'),
    });

    const sara = await this.creerCompte({
      email: 'sara.s@ecoles360.com',
      name: 'Sara Idrissi',
      role_id: secretariat.id,
      motDePasse: this.motDePasse('SEED_SECRETAIRE_PASSWORD'),
    });

    const compteEtablissement = await this.creerCompte({
      email: 'contact@almassira.ma',
      name: 'Lycée Al Massira',
      role_id: etablissement.id,
      motDePasse: this.motDePasse('SEED_ETABLISSEMENT_PASSWORD'),
      blog_actif: true,
    });

    const compteCommercial = await this.creerCompte({
      email: 'younes.c@ecoles360.com',
      name: 'Younes Chraibi',
      role_id: commercial.id,
      motDePasse: this.motDePasse('SEED_COMMERCIAL_PASSWORD'),
      telephone: '06 61 18 98 21',
    });

    // DEUX CONSEILLERS, PAS UN. La bannière d'aide du site public répartit les
    // appels entre eux : avec un seul compte, on ne verrait jamais la rotation
    // et le défaut passerait en production.
    await this.creerCompte({
      email: 'karim.o@ecoles360.com',
      name: 'Karim Ouazzani',
      role_id: commercial.id,
      motDePasse: this.motDePasse('SEED_COMMERCIAL_PASSWORD'),
      telephone: '06 55 73 22 09',
    });

    // Deux secrétaires supplémentaires : l'un actif aux portées partielles,
    // l'autre suspendu — l'écran « Utilisateurs & rôles » a besoin des deux
    // états pour être lisible, et le SessionGuard d'un compte suspendu à
    // refuser (RG25).
    const yassine = await this.creerCompte({
      email: 'yassine.b@ecoles360.com',
      name: 'Yassine Bennani',
      role_id: secretariat.id,
      motDePasse: this.motDePasse('SEED_SECRETAIRE_PASSWORD'),
    });

    await this.creerCompte({
      email: 'khalid.a@ecoles360.com',
      name: 'Khalid Amrani',
      role_id: secretariat.id,
      motDePasse: this.motDePasse('SEED_SECRETAIRE_PASSWORD'),
      statut: 'suspendu',
    });

    // Portées déléguées (RG05) — Sara les a toutes trois, Yassine seulement
    // fiches et contacts : c'est ce qui donne la « nav réduite » du livrable 13.
    await this.accorderPortees(sara.id, admin.id, [
      PermissionPortee.fiches,
      PermissionPortee.contacts,
      PermissionPortee.avis,
    ]);
    await this.accorderPortees(yassine.id, admin.id, [
      PermissionPortee.fiches,
      PermissionPortee.contacts,
    ]);

    this.logger.log('6 comptes de démonstration et leurs portées');

    return { admin, sara, etablissement: compteEtablissement, commercial: compteCommercial };
  }

  /**
   * La fiche vitrine des maquettes et son activité.
   *
   * Les valeurs sont celles des écrans conçus : ★ 4,8 · 142 avis · 96 % de
   * réussite au bac · abonnement annuel à −10 %. Les modifier ferait diverger
   * le poste de développement des maquettes validées.
   */
  async donnees(comptes: {
    admin: User;
    sara: User;
    etablissement: User;
    commercial: User;
  }): Promise<{ almassira: Etablissement }> {
    const casablanca = await this.db.ville.findUniqueOrThrow({ where: { slug: 'casablanca' } });
    const rabat = await this.db.ville.findUniqueOrThrow({ where: { slug: 'rabat' } });
    const marrakech = await this.db.ville.findUniqueOrThrow({ where: { slug: 'marrakech' } });
    const tanger = await this.db.ville.findUniqueOrThrow({ where: { slug: 'tanger' } });

    // Les blocs de présentation sont RÉÉCRITS à chaque amorçage, contrairement
    // aux mots de passe des comptes : ce sont du contenu de démonstration, pas
    // des données qu'un développeur aurait personnalisées. Sans cela, enrichir
    // la fiche vitrine — un bloc « Langues », un « Projet pédagogique » — ne
    // toucherait jamais une base déjà semée, et la maquette resterait devant.
    const blocsPresentation = {
      quartier: 'Maârif',
      adresse: '12, rue Ibn Battouta, Maârif',
      tel: '05 22 25 40 10',
      whatsapp: '06 61 20 40 10',
      email: 'contact@almassira.ma',
      langues: 'Arabe · Français · Anglais',
      site_web: 'https://www.almassira.ma',
      // Coordonnées réelles du quartier Maârif, à Casablanca. Approximatives
      // par construction : la carte situe le quartier, elle ne mène pas au
      // portail — c'est ce que la maquette montre, et c'est suffisant.
      lat: 33.5883,
      lng: -7.6325,
      video_url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      projet_pedagogique:
        'Une pédagogie active centrée sur l’élève, alliant rigueur académique, ouverture sur ' +
        'les langues et activités parascolaires. Les effectifs réduits permettent un suivi ' +
        'personnalisé et un accompagnement régulier des familles.',
      horaires: {
        'Lundi – Jeudi': '08h00 – 17h30',
        Vendredi: '08h00 – 12h00',
        Samedi: '09h00 – 13h00',
        Dimanche: 'Fermé',
      },
      socials: {
        facebook: 'https://facebook.com/almassira',
        instagram: 'https://instagram.com/almassira',
      },
      autres_projets: [
        {
          type: 'Restaurant',
          nom: 'Le Riad Gourmand',
          ville: 'Casablanca · Maârif',
          description: 'Cuisine marocaine raffinée, à deux pas de l’établissement.',
        },
        {
          type: 'Café',
          nom: 'Café Massira',
          ville: 'Casablanca · Maârif',
          description: 'Espace détente et petit-déjeuner pour parents et étudiants.',
        },
      ],
    };

    const almassira = await this.db.etablissement.upsert({
      where: { slug: 'lycee-al-massira-casablanca' },
      update: blocsPresentation,
      create: {
        ...blocsPresentation,
        ville_id: casablanca.id,
        proprietaire_user_id: comptes.etablissement.id,
        slug: 'lycee-al-massira-casablanca',
        nom: 'Lycée Al Massira',
        type: 'lycee',
        statut: 'validee',
        description:
          'Établissement privé fondé en 1998, le Lycée Al Massira accueille près de 900 élèves du ' +
          'collège au baccalauréat, en filières sciences et économie, avec un enseignement bilingue ' +
          'français-arabe.',
        budget_min: 22000,
        budget_max: 38000,
        note_moy: 4.8,
        nb_avis: 142,
        sponsorise: true,
        verifie: true,
        premium: true,
        valide_le: new Date('2026-02-14'),
        chiffres: [
          { label: 'Taux de réussite bac', valeur: '96 %' },
          { label: 'Élèves par classe', valeur: '18' },
          { label: 'Enseignants', valeur: '27' },
        ],
        faq: [
          { q: 'Quels sont les horaires ?', r: 'Du lundi au vendredi, 8 h 00 – 17 h 30.' },
          { q: 'Proposez-vous le transport ?', r: 'Oui, sur les principaux axes de Casablanca.' },
        ],
        facilites: ['Cantine', 'Transport scolaire', 'Laboratoire', 'Gymnase', 'Bibliothèque'],
      },
    });

    // Quelques fiches supplémentaires : les listes de résultats, les filtres et
    // la file de validation admin ont besoin de plusieurs états de cycle de vie.
    const autres = [
      {
        slug: 'institut-lumiere-rabat',
        nom: 'Institut Lumière',
        ville_id: rabat.id,
        type: 'college' as const,
        statut: 'validee' as const,
        note_moy: 4.5,
        nb_avis: 87,
      },
      {
        slug: 'universite-atlas-marrakech',
        nom: 'Université Atlas',
        ville_id: marrakech.id,
        type: 'universite' as const,
        statut: 'validee' as const,
        note_moy: 4.2,
        nb_avis: 54,
      },
      {
        slug: 'creche-les-petits-genies-casablanca',
        nom: 'Crèche Les Petits Génies',
        ville_id: casablanca.id,
        type: 'creche' as const,
        statut: 'en_attente' as const, // alimente la file « en attente » de l'admin (RG03)
        note_moy: 0,
        nb_avis: 0,
      },

      // TROIS CONCURRENTS DE PLUS, ET C'EST NÉCESSAIRE. Avec un seul lycée et
      // un seul collège, le bloc « Établissements similaires » restait vide sur
      // toutes les fiches, et la page de résultats n'avait jamais de quoi
      // paginer. Un jeu de démonstration doit permettre de VOIR les écrans, pas
      // seulement de vérifier qu'ils ne plantent pas.
      {
        slug: 'lycee-ibn-sina-casablanca',
        lat: 33.5951,
        lng: -7.6698,
        nom: 'Lycée Ibn Sina',
        ville_id: casablanca.id,
        type: 'lycee' as const,
        statut: 'validee' as const,
        quartier: 'Ain Diab',
        description:
          'Lycée privé casablancais reconnu pour ses filières scientifiques et son taux de ' +
          'réussite au baccalauréat international.',
        tel: '05 22 39 18 40',
        whatsapp: '06 62 39 18 40',
        site_web: 'https://www.ibnsina.ma',
        langues: 'Arabe · Français',
        budget_min: 26000,
        budget_max: 42000,
        verifie: true,
        note_moy: 4.3,
        nb_avis: 0,
        valide_le: new Date('2026-03-02'),
      },
      {
        slug: 'lycee-al-khawarizmi-rabat',
        lat: 33.9911,
        lng: -6.8498,
        nom: 'Lycée Al Khawarizmi',
        ville_id: rabat.id,
        type: 'lycee' as const,
        statut: 'validee' as const,
        quartier: 'Agdal',
        description:
          'Établissement rbati à taille humaine, filières sciences mathématiques et sciences ' +
          'physiques, préparation intensive aux classes préparatoires.',
        tel: '05 37 68 22 15',
        whatsapp: '06 61 68 22 15',
        langues: 'Arabe · Français · Anglais',
        budget_min: 21000,
        budget_max: 33000,
        verifie: true,
        note_moy: 4.1,
        nb_avis: 0,
        valide_le: new Date('2026-03-05'),
      },
      {
        slug: 'college-an-nahda-tanger',
        lat: 35.7806,
        lng: -5.7856,
        nom: 'Collège An-Nahda',
        ville_id: tanger.id,
        type: 'college' as const,
        statut: 'validee' as const,
        quartier: 'Malabata',
        description:
          'Collège privé tangérois, enseignement trilingue et accompagnement personnalisé vers ' +
          'les filières du lycée.',
        tel: '05 39 32 44 70',
        whatsapp: '06 66 32 44 70',
        langues: 'Arabe · Français · Espagnol',
        budget_min: 15000,
        budget_max: 24000,
        note_moy: 3.9,
        nb_avis: 0,
        valide_le: new Date('2026-03-08'),
      },
    ];

    for (const fiche of autres) {
      const creee = await this.db.etablissement.upsert({
        where: { slug: fiche.slug },
        // Les champs sont réappliqués : un `update: {}` laisserait les fiches
        // déjà semées sans les coordonnées ajoutées depuis, et leurs cartes
        // sans bouton d'appel.
        update: fiche,
        create: { ...fiche, source: 'direct' },
      });

      // Deux vues seulement : une galerie courte doit s'afficher aussi bien
      // qu'une longue, et c'est le cas le plus fréquent en production.
      if (fiche.statut === 'validee') {
        await this.galerieDeLaFiche(creee.id, 2);
      }
    }

    // RG25 — un compte secrétariat est TOUJOURS rattaché à un établissement.
    // Le rattachement se pose ici et non dans `comptes()` : la fiche n'existe
    // pas encore à ce moment-là. Sans lui, les routes `/mon-espace` refusent
    // le secrétariat faute d'établissement en session, et l'écran « Vos
    // fiches » du livrable 13 n'aurait rien à montrer.
    await this.db.user.updateMany({
      where: { email: { in: ['sara.s@ecoles360.com', 'yassine.b@ecoles360.com'] } },
      data: { etablissement_rattache_id: almassira.id },
    });

    await this.caracteristiquesDeLaFiche(almassira.id, [
      [NiveauFiliereCat.niveau, 'Collège'],
      [NiveauFiliereCat.niveau, 'Lycée'],
      [NiveauFiliereCat.filiere, 'Sciences Math'],
      [NiveauFiliereCat.filiere, 'Sciences PC'],
      [NiveauFiliereCat.filiere, 'Économie'],
      [NiveauFiliereCat.filiere, 'Bilingue'],
      [NiveauFiliereCat.langue, 'Arabe'],
      [NiveauFiliereCat.langue, 'Français'],
      [NiveauFiliereCat.langue, 'Anglais'],
      [NiveauFiliereCat.activite, 'Sport'],
      [NiveauFiliereCat.activite, 'Musique'],
      [NiveauFiliereCat.activite, 'Théâtre'],
    ]);
    await this.galerieDeLaFiche(almassira.id, 7);
    await this.cyclesDuGroupe(almassira, casablanca.id, comptes.etablissement.id);
    await this.avis(almassira.id, comptes.admin.id);
    const demande = await this.demandesContact(almassira.id, comptes.sara.id);
    await this.abonnementEtFacture(almassira.id);
    await this.sponsoring(almassira.id, casablanca.id);
    await this.prospects(comptes.commercial.id);
    await this.realignerCompteursAvis();

    this.logger.log('4 fiches, avis, demandes, abonnement et facture');

    // La demande sert d'origine au premier lead du kanban (RG21).
    this.demandeOrigine = demande;

    return { almassira };
  }

  /**
   * Les 8 leads du kanban maquette, rattachés au Lycée Al Massira (RG21, RG22).
   *
   * Répartis sur les six statuts du pipeline avec des scores de 2 à 9 : c'est
   * ce qui donne au kanban ses colonnes garnies et au tableau de bord son bloc
   * CRM (« nouveaux », « à relancer », « chauds ≥ 7 »).
   */
  async leads(almassira: Etablissement, etablissement: User): Promise<void> {
    const leads: Array<{
      candidat_nom: string;
      tel: string;
      cycle: string;
      niveau: string;
      budget_min: number;
      budget_max: number;
      urgence: LeadUrgence;
      source: LeadSource;
      score: number;
      statut_pipeline: LeadStatut;
      raison_perte?: string;
      acompte_mad?: number;
      avecDemande?: boolean;
    }> = [
      {
        candidat_nom: 'Yasmine El Amrani',
        tel: '06 61 42 88 30',
        cycle: 'Primaire',
        niveau: 'CP',
        budget_min: 25000,
        budget_max: 35000,
        urgence: LeadUrgence.rentree,
        source: LeadSource.ecoles360,
        score: 7, // urgence 3 + budget 2 + complétude 2
        statut_pipeline: LeadStatut.nouveau,
        avecDemande: true,
      },
      {
        candidat_nom: 'Karim Bensaid',
        tel: '06 12 77 45 902'.slice(0, 20),
        cycle: 'Collège',
        niveau: '6e',
        budget_min: 20000,
        budget_max: 28000,
        urgence: LeadUrgence.mois,
        source: LeadSource.whatsapp,
        score: 5,
        statut_pipeline: LeadStatut.contacte,
      },
      {
        candidat_nom: 'Salma Cherkaoui',
        tel: '06 70 31 22 18',
        cycle: 'Lycée',
        niveau: 'Seconde',
        budget_min: 30000,
        budget_max: 40000,
        urgence: LeadUrgence.imminente,
        source: LeadSource.recommandation,
        score: 9,
        statut_pipeline: LeadStatut.qualifie,
      },
      {
        candidat_nom: 'Rachid Belkadi',
        tel: '06 55 90 14 07',
        cycle: 'Lycée',
        niveau: 'Première',
        budget_min: 28000,
        budget_max: 36000,
        urgence: LeadUrgence.semaine,
        source: LeadSource.appel,
        score: 8,
        statut_pipeline: LeadStatut.proposition_envoyee,
      },
      {
        candidat_nom: 'Nadia Alaoui',
        tel: '06 43 60 85 21',
        cycle: 'Primaire',
        niveau: 'CE2',
        budget_min: 22000,
        budget_max: 30000,
        urgence: LeadUrgence.rentree,
        source: LeadSource.google,
        score: 6,
        statut_pipeline: LeadStatut.inscrit,
        acompte_mad: 5000,
      },
      {
        candidat_nom: 'Hamza Idrissi',
        tel: '06 88 12 39 44',
        cycle: 'Collège',
        niveau: '4e',
        budget_min: 15000,
        budget_max: 19000,
        urgence: LeadUrgence.flexible,
        source: LeadSource.reseaux,
        score: 2,
        statut_pipeline: LeadStatut.perdu,
        raison_perte: 'Budget insuffisant',
      },
      {
        candidat_nom: 'Fatima-Zahra Berrada',
        tel: '06 21 55 78 63',
        cycle: 'Lycée',
        niveau: 'Terminale',
        budget_min: 32000,
        budget_max: 45000,
        urgence: LeadUrgence.imminente,
        source: LeadSource.salon,
        score: 9,
        statut_pipeline: LeadStatut.qualifie,
      },
      {
        candidat_nom: 'Mohammed Tazi',
        tel: '06 39 47 11 05',
        cycle: 'Primaire',
        niveau: 'CM1',
        budget_min: 18000,
        budget_max: 24000,
        urgence: LeadUrgence.mois,
        source: LeadSource.autre,
        score: 4,
        statut_pipeline: LeadStatut.contacte,
      },
    ];

    for (const donnees of leads) {
      const { avecDemande, ...champs } = donnees;

      const existant = await this.db.lead.findFirst({
        where: { etablissement_id: almassira.id, candidat_nom: champs.candidat_nom },
      });

      if (existant) {
        continue;
      }

      const lead = await this.db.lead.create({
        data: {
          ...champs,
          etablissement_id: almassira.id,
          demande_contact_id: avecDemande ? (this.demandeOrigine ?? null) : null,
          cree_par: avecDemande ? null : etablissement.id,
          pour_qui: 'enfant',
          whatsapp: true,
          ville: 'Casablanca',
          converti_le: champs.statut_pipeline === LeadStatut.inscrit ? new Date() : null,
          fiche_besoin: {
            motif: 'Première inscription au privé',
            filiere: 'Bilingue FR-AR',
            priorites: ['reputation', 'proximite', 'prix', 'rapidite'],
          },
        },
      });

      await this.db.leadSuivi.create({
        data: {
          lead_id: lead.id,
          type: 'commentaire',
          note: avecDemande
            ? 'Fiche reçue depuis ecoles360.com'
            : 'Premier contact téléphonique, fiche de besoin à compléter',
        },
      });

      // Une relance programmée sur les leads en cours : c'est ce qui alimente
      // le bloc « relances du jour » du secrétariat.
      if (champs.statut_pipeline === LeadStatut.contacte) {
        await this.db.leadSuivi.create({
          data: {
            lead_id: lead.id,
            type: 'relance',
            note: 'Rappeler pour proposer une visite',
            prevue_le: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    this.logger.log(`${leads.length} leads CRM et leurs suivis`);
  }

  /** Articles de blog des maquettes, sur les quatre statuts du circuit (RG27). */
  async cms(
    almassira: Etablissement,
    comptes: { admin: User; etablissement: User },
  ): Promise<void> {
    /**
     * SIX ARTICLES DE PLATEFORME, repris de la maquette (titres, catégories,
     * chapeaux et dates), PUIS trois articles d'établissement qui montrent le
     * circuit de validation dans ses trois autres états.
     *
     * Sans les six premiers, la grille du blog serait vide : le seul article
     * publié serait celui à la une, que la grille exclut par construction.
     * L'écran paraîtrait cassé alors qu'il fonctionne.
     *
     * Les auteurs nommés de la maquette (Nadia Bennani, Karim Idrissi…) ne
     * sont pas recréés en comptes : inventer des utilisateurs pour habiller une
     * démonstration polluerait la table des accès. Les articles de plateforme
     * sont signés par la direction, ce qui est vrai.
     */
    const articles = [
      {
        slug: 'choisir-ecole-privee-ideale',
        titre: 'Comment choisir l’école privée idéale pour votre enfant',
        categorie: 'Conseils aux parents',
        chapeau:
          'Pédagogie, distance, budget, valeurs : les 7 critères qui comptent vraiment avant de ' +
          'vous décider.',
        contenu:
          "Choisir une école privée engage plusieurs années de la vie d'un enfant, et souvent " +
          "l'organisation de toute une famille. Voici ce qu'il faut regarder avant de signer.\n\n" +
          "Le projet pédagogique, d'abord. Demandez à le lire. Une école qui ne sait pas expliquer " +
          'en quelques phrases ce qu’elle cherche à transmettre a rarement une réponse plus ' +
          'convaincante une fois votre enfant inscrit.\n\n' +
          'La distance et le rythme quotidien ensuite. Un trajet trop long pèse vite sur la ' +
          'fatigue et sur l’organisation familiale. Vérifiez les options de transport scolaire et ' +
          'la compatibilité des horaires avec votre emploi du temps avant de vous engager.\n\n' +
          'Le budget, en toute transparence. Au-delà des mensualités, pensez aux frais ' +
          'd’inscription, aux fournitures, à la cantine et aux activités. Sur écoles360, chaque ' +
          'fiche affiche une gamme indicative pour situer un établissement, et vous pouvez ' +
          'contacter l’école directement pour le détail.\n\n' +
          'L’encadrement, enfin. Le nombre d’élèves par classe en dit plus long qu’une plaquette. ' +
          'Demandez-le, et demandez aussi depuis combien de temps les enseignants sont en poste : ' +
          'une équipe stable vaut mieux qu’un bâtiment neuf.',
        statut: 'approuve' as const,
        a_la_une: true,
        publie_le: new Date('2026-06-12'),
      },
      {
        slug: 'creche-ou-maternelle-casablanca',
        titre: 'Crèche ou maternelle à Casablanca : que choisir ?',
        categorie: 'Conseils aux parents',
        chapeau:
          'À partir de quel âge, pour quel rythme et quel encadrement ? Le point pour faire le ' +
          'bon choix.',
        contenu:
          'La crèche accueille généralement de trois mois à trois ans, avec des journées souples ' +
          'et un encadrement centré sur l’éveil et le rythme de l’enfant. La maternelle commence ' +
          'vers trois ans et introduit une structure scolaire : horaires fixes, groupe de classe, ' +
          'premiers apprentissages.\n\n' +
          'Le critère décisif n’est pas l’âge mais l’autonomie. Un enfant propre, capable de ' +
          'suivre une consigne collective et de tenir une matinée sans sieste est prêt pour la ' +
          'maternelle, même à deux ans et demi.\n\n' +
          'Côté organisation, la crèche offre des amplitudes horaires plus larges, ce qui compte ' +
          'quand les deux parents travaillent. La maternelle, elle, prépare la continuité avec le ' +
          'primaire du même établissement — un point à vérifier si vous visez une scolarité ' +
          'complète au même endroit.',
        statut: 'approuve' as const,
        publie_le: new Date('2026-06-08'),
      },
      {
        slug: 'comprendre-frais-scolarite-maroc',
        titre: 'Comprendre les frais de scolarité au Maroc',
        categorie: 'Budget',
        chapeau:
          'Inscription, mensualités, fournitures, cantine : à quoi correspond chaque ligne du ' +
          'budget scolaire.',
        contenu:
          'Les frais d’inscription se paient une fois, à l’entrée dans l’établissement, et ne ' +
          'sont généralement pas remboursables. Ils couvrent le dossier administratif et, selon ' +
          'les écoles, une partie du matériel collectif.\n\n' +
          'Les mensualités constituent le gros du budget. Elles sont dues sur dix ou douze mois ' +
          'selon les établissements — une différence qui change le coût annuel réel de près de ' +
          'vingt pour cent. Demandez toujours le montant sur l’année, pas sur le mois.\n\n' +
          'Restent les postes variables : fournitures, tenue, cantine, transport et activités ' +
          'parascolaires. Ils représentent souvent un quart de la dépense totale et n’apparaissent ' +
          'presque jamais sur les plaquettes.\n\n' +
          'Sur écoles360, chaque fiche affiche une gamme indicative — économique, intermédiaire, ' +
          'premium — pour situer un établissement. Le détail exact vient de l’école que vous ' +
          'contactez.',
        statut: 'approuve' as const,
        publie_le: new Date('2026-06-02'),
      },
      {
        slug: 'reussir-la-rentree-check-list',
        titre: 'Réussir la rentrée : la check-list des parents organisés',
        categorie: 'Vie scolaire',
        chapeau:
          'Anticiper les démarches, le matériel et le rythme pour une rentrée sereine de toute ' +
          'la famille.',
        contenu:
          'Trois semaines avant : rassemblez les pièces du dossier — certificat de scolarité, ' +
          'carnet de vaccination, photos d’identité, justificatif de domicile. C’est le poste qui ' +
          'fait perdre le plus de temps au dernier moment.\n\n' +
          'Deux semaines avant : remettez l’heure du coucher en place, progressivement, quinze ' +
          'minutes par jour. Un enfant qui reprend l’école avec trois heures de décalage met un ' +
          'mois à s’en remettre.\n\n' +
          'La semaine d’avant : vérifiez le trajet à l’heure réelle de la rentrée, pas à vide un ' +
          'dimanche. Et étiquetez tout — les vêtements perdus la première semaine ne reviennent ' +
          'jamais.',
        statut: 'approuve' as const,
        publie_le: new Date('2026-05-28'),
      },
      {
        slug: 'mission-francaise-bilingue-ou-marocaine',
        titre: 'Mission française, bilingue ou marocaine : quel cursus ?',
        categorie: 'Orientation',
        chapeau:
          'Trois systèmes, trois projets. Comprendre les différences pour aligner école et ' +
          'ambitions.',
        contenu:
          'Le cursus de la mission française suit les programmes de l’Éducation nationale ' +
          'française et prépare au baccalauréat français. Il ouvre directement les universités ' +
          'françaises et européennes, mais les places sont rares et la sélection à l’entrée réelle.\n\n' +
          'Le cursus bilingue combine le programme marocain et un enseignement renforcé en ' +
          'français ou en anglais. C’est le compromis le plus répandu : diplôme national, ' +
          'ouverture linguistique, coût intermédiaire.\n\n' +
          'Le cursus marocain suit le programme national, en arabe avec le français comme langue ' +
          'seconde. C’est la voie la plus accessible financièrement et la mieux adaptée si le ' +
          'projet universitaire reste au Maroc.\n\n' +
          'Le bon choix se décide moins sur le prestige que sur le projet : où votre enfant ' +
          'étudiera-t-il après le bac ? C’est cette réponse qui doit guider les douze années ' +
          'précédentes.',
        statut: 'approuve' as const,
        publie_le: new Date('2026-05-21'),
      },
      {
        slug: 'education-privee-tendances-2026',
        titre: 'Éducation privée : les tendances 2026 à suivre',
        categorie: 'Actualités',
        chapeau:
          'Numérique, bien-être, langues : ce qui change dans les écoles privées marocaines ' +
          'cette année.',
        contenu:
          'Le numérique s’installe, mais plus sobrement qu’annoncé. Après plusieurs années ' +
          'd’équipement massif, les établissements privilégient désormais la formation des ' +
          'enseignants à l’achat de matériel.\n\n' +
          'Le bien-être scolaire devient un argument affiché. Psychologue scolaire, médiation ' +
          'entre élèves, aménagement des temps de pause : des postes qui n’existaient presque pas ' +
          'il y a cinq ans.\n\n' +
          'Enfin, l’anglais gagne du terrain dès le primaire, souvent en troisième langue après ' +
          'l’arabe et le français. Un mouvement porté par la demande des familles plus que par ' +
          'les programmes.',
        statut: 'approuve' as const,
        publie_le: new Date('2026-05-15'),
      },

      // --- Articles d'établissement : le circuit dans ses trois autres états ---
      {
        slug: 'journee-portes-ouvertes-al-massira-2026',
        titre: 'Journée portes ouvertes — samedi 12 septembre',
        categorie: 'Vie des établissements',
        chapeau: 'Visite des locaux, rencontre avec les enseignants et présentation des filières.',
        contenu:
          'Nous ouvrons nos portes le samedi 12 septembre, de 9 h à 17 h, sans inscription ' +
          'préalable.\n\n' +
          'Au programme : visite guidée des locaux toutes les heures, présentation des filières ' +
          'du collège et du lycée, et rencontre avec les enseignants de chaque niveau. L’équipe ' +
          'de direction répondra aux questions sur les modalités d’inscription et les tarifs.\n\n' +
          'Un espace est prévu pour les enfants pendant que les parents visitent. L’entrée se ' +
          'fait par le portail principal, avenue Hassan II.',
        statut: 'en_attente' as const,
        etablissement_id: almassira.id,
        soumis_le: new Date('2026-09-01'),
      },
      {
        slug: 'rentree-2026-ce-qui-change',
        titre: 'Rentrée 2026 : ce qui change dans le privé',
        categorie: 'Actualités',
        chapeau: 'Nouveaux barèmes, calendrier et obligations déclaratives.',
        contenu:
          'Brouillon en cours de rédaction — à compléter avec les références réglementaires ' +
          'avant soumission.',
        statut: 'brouillon' as const,
        etablissement_id: almassira.id,
      },
      {
        slug: 'classement-ecoles-casablanca',
        titre: 'Notre classement des écoles de Casablanca',
        categorie: 'Actualités',
        chapeau: 'Article refusé — un classement nominatif contrevient à notre charte éditoriale.',
        contenu:
          'Proposition de classement nominatif des établissements de Casablanca, du premier au ' +
          'vingtième rang.',
        statut: 'refuse' as const,
        motif_refus:
          'Un classement nominatif des établissements contrevient à la charte éditoriale : ' +
          'écoles360 compare des critères, jamais des écoles entre elles.',
        etablissement_id: almassira.id,
        soumis_le: new Date('2026-07-10'),
        validee_par: comptes.admin.id,
      },
    ];

    for (const article of articles) {
      // L'auteur suit le propriétaire de l'article : la direction pour les
      // articles de plateforme, le compte de l'établissement pour les siens.
      const donnees = {
        validee_par: article.statut === 'approuve' ? comptes.admin.id : undefined,
        ...article,
        auteur_id: article.etablissement_id ? comptes.etablissement.id : comptes.admin.id,
      };

      // `update` porte les mêmes champs que `create` : un `update: {}` laisserait
      // les articles déjà semés sans le `contenu` ni le `motif_refus` ajoutés
      // depuis, et la page publique afficherait un corps vide sur une base
      // existante.
      await this.db.article.upsert({
        where: { slug: article.slug },
        update: donnees,
        create: donnees,
      });
    }

    // Les articles d'une livraison précédente, absents de ce jeu, sont retirés :
    // ils fausseraient les compteurs du blog et de la file de validation.
    await this.db.article.deleteMany({
      where: { slug: { notIn: articles.map((article) => article.slug) } },
    });

    // Deux avis mis en avant pour la section « Ce que disent les parents ».
    const publies = await this.db.avis.findMany({
      where: { etablissement_id: almassira.id, statut: AvisStatut.publie },
      take: 2,
    });

    for (const avis of publies) {
      await this.db.avis.update({ where: { id: avis.id }, data: { en_avant: true } });
    }

    // Une proposition de fiche en attente, avec son comparatif (RG20, RG27) :
    // l'écran « Vérifier une modification de fiche » en a besoin pour exister.
    const enAttente = await this.db.propositionFiche.findFirst({
      where: { etablissement_id: almassira.id, statut: 'en_attente' },
    });

    if (!enAttente) {
      await this.db.propositionFiche.create({
        data: {
          etablissement_id: almassira.id,
          proposee_par: comptes.etablissement.id,
          // Comparatif avant / après, champ par champ — MÊME FORME que celle
          // produite par `FicheProposalService.calculerDiff()`. Une simple
          // liste de noms de champs ne suffirait pas : l'écran de validation
          // affiche l'ancienne valeur barrée à côté de la nouvelle.
          champs_modifies: {
            description: {
              avant: almassira.description,
              apres:
                'Établissement privé fondé en 1998, le Lycée Al Massira accueille près de 950 élèves ' +
                'du collège au baccalauréat, en filières sciences, économie et lettres.',
            },
            budget_max: { avant: almassira.budget_max, apres: 42000 },
          },
          payload: {
            description:
              'Établissement privé fondé en 1998, le Lycée Al Massira accueille près de 950 élèves ' +
              'du collège au baccalauréat, en filières sciences, économie et lettres.',
            budget_max: 42000,
          },
        },
      });
    }

    this.logger.log(`${articles.length} articles, avis en avant et proposition de fiche`);
  }

  /**
   * Journal d'audit (RG26) — couvre les quatre rôles et les trois sévérités,
   * pour que l'écran « Journal d'audit » et ses filtres aient de la matière.
   */
  async audit(almassira: Etablissement, comptes: { admin: User; sara: User }): Promise<void> {
    const dejaSeme = await this.db.journalAudit.count();

    if (dejaSeme > 0) {
      return;
    }

    const entrees = [
      {
        user_id: comptes.admin.id,
        role_acteur: 'superadmin',
        action: 'etablissement.valide',
        cible_type: 'Etablissement',
        cible_id: almassira.id,
        severite: AuditSeverite.info,
      },
      {
        user_id: comptes.admin.id,
        role_acteur: 'superadmin',
        action: 'facture.encaissee',
        cible_type: 'Facture',
        cible_id: almassira.id,
        severite: AuditSeverite.info,
      },
      {
        user_id: comptes.sara.id,
        role_acteur: 'secretariat',
        action: 'avis.publie',
        cible_type: 'Avis',
        cible_id: almassira.id,
        severite: AuditSeverite.info,
      },
      {
        user_id: comptes.admin.id,
        role_acteur: 'superadmin',
        action: 'compte.motdepasse.reinitialise',
        cible_type: 'User',
        cible_id: comptes.sara.id,
        severite: AuditSeverite.avertissement, // RG25 — sévérité imposée
      },
      {
        user_id: comptes.admin.id,
        role_acteur: 'superadmin',
        action: 'compte.suspendu',
        cible_type: 'User',
        cible_id: comptes.sara.id,
        severite: AuditSeverite.avertissement,
      },
      {
        user_id: null, // acteur système (avenant 3)
        role_acteur: 'systeme',
        action: 'purge.traces',
        cible_type: 'EvenementTrace',
        cible_id: BigInt(0),
        severite: AuditSeverite.info,
      },
      {
        user_id: comptes.admin.id,
        role_acteur: 'superadmin',
        action: 'article.refuse',
        cible_type: 'Article',
        cible_id: almassira.id,
        severite: AuditSeverite.erreur,
      },
    ];

    await this.db.journalAudit.createMany({ data: entrees });

    this.logger.log(`${entrees.length} entrées de journal d'audit`);
  }

  // ---------------------------------------------------------------------------
  //  Outillage interne
  // ---------------------------------------------------------------------------

  /** Identifiant de la demande de contact servant d'origine au premier lead. */
  private demandeOrigine?: bigint;

  private motDePasse(variable: string): string {
    // Un mot de passe visiblement factice vaut mieux qu'un seeder qui échoue à
    // froid sur un poste neuf ; les vraies valeurs viennent des secrets GitHub
    // en CI (livrable 14 §3).
    return this.config.get<string>(variable) ?? 'motdepasse-de-demonstration';
  }

  private async creerCompte(compte: {
    email: string;
    name: string;
    role_id: bigint;
    motDePasse: string;
    telephone?: string;
    blog_actif?: boolean;
    statut?: 'actif' | 'suspendu';
  }): Promise<User> {
    const { motDePasse, ...champs } = compte;

    return this.db.user.upsert({
      where: { email: compte.email },
      // LE MOT DE PASSE N'EST PAS RÉÉCRIT sur un compte existant : un
      // développeur qui a changé le sien ne doit pas le voir réinitialisé à
      // chaque `db:seed`.
      //
      // Les autres champs, SI : un `update: {}` laisserait les comptes déjà
      // créés à l'écart de toute évolution du jeu de démonstration — un
      // drapeau ajouté plus tard (`blog_actif`) ne leur parviendrait jamais,
      // et l'écran correspondant paraîtrait cassé sur une base existante.
      update: champs,
      create: {
        ...champs,
        passwordHash: await hash(motDePasse, { algorithm: Algorithm.Argon2id }),
      },
    });
  }

  private async accorderPortees(
    userId: bigint,
    parId: bigint,
    portees: PermissionPortee[],
  ): Promise<void> {
    for (const portee of portees) {
      await this.db.permission.upsert({
        where: { user_id_portee: { user_id: userId, portee } },
        update: { revoquee_le: null },
        create: { user_id: userId, portee, accordee_par: parId },
      });
    }
  }

  /**
   * Les cycles frères du Lycée Al Massira — crèche, primaire, collège.
   *
   * LE MULTI-CYCLE EST LA NORME, PAS L'EXCEPTION. La plupart des groupes
   * scolaires marocains accompagnent l'enfant de la crèche au lycée. Sans au
   * moins un groupe complet dans le jeu de démonstration, ni le bandeau
   * « Établissement multi-cycles » ni le filtre « toutes ces classes à la fois »
   * ne peuvent se montrer — et un défaut sur l'un des deux passerait en
   * production sans qu'on le voie.
   *
   * CHAQUE CYCLE A SON BUDGET ET SA DESCRIPTION : c'est toute la raison de les
   * garder distincts. Une crèche à 9 000 MAD et un lycée à 38 000 ne se
   * résument pas par une fourchette commune.
   */
  private async cyclesDuGroupe(
    lycee: Etablissement,
    villeId: bigint,
    proprietaireId: bigint,
  ): Promise<void> {
    const groupe = await this.db.groupeScolaire.upsert({
      where: { slug: 'groupe-scolaire-al-massira' },
      update: { nom: 'Groupe scolaire Al Massira' },
      create: { nom: 'Groupe scolaire Al Massira', slug: 'groupe-scolaire-al-massira' },
    });

    const cycles = [
      {
        slug: 'creche-al-massira-casablanca',
        nom: 'Crèche Al Massira',
        type: EtablissementType.creche,
        description:
          'La crèche du groupe Al Massira accueille les enfants de 3 mois à 3 ans dans un espace ' +
          'dédié, avec un encadrement de proximité et un éveil aux langues dès la deuxième année.',
        budget_min: 9000,
        budget_max: 14000,
        caracteristiques: [
          [NiveauFiliereCat.niveau, 'Éveil'],
          [NiveauFiliereCat.langue, 'Arabe'],
          [NiveauFiliereCat.langue, 'Français'],
          [NiveauFiliereCat.activite, 'Musique'],
          [NiveauFiliereCat.activite, 'Dessin'],
        ] as [NiveauFiliereCat, string][],
      },
      {
        slug: 'ecole-primaire-al-massira-casablanca',
        nom: 'École primaire Al Massira',
        type: EtablissementType.primaire,
        description:
          'Le primaire du groupe Al Massira suit le programme marocain renforcé en français, avec ' +
          'un enseignement de l’anglais dès la troisième année et des effectifs limités à 22 élèves.',
        budget_min: 14000,
        budget_max: 22000,
        caracteristiques: [
          [NiveauFiliereCat.niveau, 'Maternelle'],
          [NiveauFiliereCat.niveau, 'Primaire'],
          [NiveauFiliereCat.matiere, 'Arabe'],
          [NiveauFiliereCat.matiere, 'Français'],
          [NiveauFiliereCat.matiere, 'Anglais'],
          [NiveauFiliereCat.activite, 'Sport'],
          [NiveauFiliereCat.activite, 'Théâtre'],
        ] as [NiveauFiliereCat, string][],
      },
      {
        slug: 'college-al-massira-casablanca',
        nom: 'Collège Al Massira',
        type: EtablissementType.college,
        description:
          'Le collège du groupe Al Massira prépare au brevet en filière bilingue, avec un suivi ' +
          'individualisé et une orientation accompagnée vers les filières du lycée.',
        budget_min: 18000,
        budget_max: 28000,
        caracteristiques: [
          [NiveauFiliereCat.niveau, 'Collège'],
          [NiveauFiliereCat.langue, 'Arabe'],
          [NiveauFiliereCat.langue, 'Français'],
          [NiveauFiliereCat.langue, 'Anglais'],
          [NiveauFiliereCat.activite, 'Sport'],
          [NiveauFiliereCat.activite, 'Parascolaire'],
        ] as [NiveauFiliereCat, string][],
      },
    ];

    for (const cycle of cycles) {
      const { caracteristiques, ...champs } = cycle;

      // LES COORDONNÉES DU GROUPE VONT DANS LES DEUX BRANCHES. Rangées dans
      // le seul `create`, elles n'atteignaient jamais une fiche déjà semée :
      // ajouter le site web plus tard ne faisait rien, et la carte de résultat
      // restait sans bouton. C'est la même enseigne — même adresse, même
      // standard, même site.
      const communs = {
        groupe_id: groupe.id,
        ville_id: villeId,
        proprietaire_user_id: proprietaireId,
        statut: EtablissementStatut.validee,
        quartier: 'Maârif',
        adresse: '12, rue Ibn Battouta, Maârif',
        lat: 33.5883,
        lng: -7.6325,
        tel: '05 22 25 40 10',
        whatsapp: '06 61 20 40 10',
        email: 'contact@almassira.ma',
        site_web: 'https://www.almassira.ma',
        langues: 'Arabe · Français · Anglais',
        verifie: true,
        valide_le: new Date('2026-02-14'),
      };

      const fiche = await this.db.etablissement.upsert({
        where: { slug: cycle.slug },
        update: { ...communs, ...champs },
        create: { ...communs, ...champs },
      });

      await this.caracteristiquesDeLaFiche(fiche.id, caracteristiques);
      // Trois vues par cycle : assez pour que les flèches et les puces se
      // voient, sans faire croire que chaque cycle a son propre bâtiment.
      await this.galerieDeLaFiche(fiche.id, 3);
    }

    // Le lycée rejoint ses frères.
    await this.db.etablissement.update({
      where: { id: lycee.id },
      data: { groupe_id: groupe.id },
    });
  }

  /**
   * Galerie d'une fiche — les vues de la maquette.
   *
   * SEPT VUES SUR LA FICHE VITRINE, MOINS SUR LES AUTRES. La galerie n'a pas
   * de limite par construction : un établissement qui téléverse quinze photos
   * doit pouvoir les montrer toutes. Les fiches de démonstration en portent
   * un nombre différent exprès — une galerie testée avec un seul cardinal
   * cache les défauts d'affichage des autres.
   *
   * LES FICHIERS SONT SERVIS LOCALEMENT (`web/public/galerie/`), rapatriés par
   * `node web/scripts/telecharger-galerie.mjs`. Ce sont des images de
   * remplacement : les vraies viendront du téléversement de l'espace
   * établissement.
   */
  private async galerieDeLaFiche(etablissementId: bigint, vues: number): Promise<void> {
    const toutes = [
      { chemin: '/galerie/facade.jpg', alt: 'Façade' },
      { chemin: '/galerie/salle-de-classe.jpg', alt: 'Salle de classe' },
      { chemin: '/galerie/cour.jpg', alt: 'Cour de récréation' },
      { chemin: '/galerie/laboratoire.jpg', alt: 'Laboratoire' },
      { chemin: '/galerie/bibliotheque.jpg', alt: 'Bibliothèque' },
      { chemin: '/galerie/gymnase.jpg', alt: 'Gymnase' },
      { chemin: '/galerie/cantine.jpg', alt: 'Cantine' },
    ].slice(0, vues);

    // Remise à plat plutôt qu'un upsert : `photos` n'a pas de clé naturelle,
    // et un second amorçage dupliquerait la galerie.
    await this.db.photo.deleteMany({ where: { etablissement_id: etablissementId } });

    await this.db.photo.createMany({
      data: toutes.map((vue, rang) => ({
        etablissement_id: etablissementId,
        chemin: vue.chemin,
        alt: vue.alt,
        ordre: rang,
      })),
    });
  }

  /**
   * Rattache des caractéristiques à une fiche.
   *
   * Prend des COUPLES (famille, libellé) et non des libellés seuls : « Sport »
   * existe comme filière ET comme activité parascolaire, « Informatique »
   * comme filière et comme domaine. Rattacher par libellé seul accrocherait
   * les deux, et la fiche apparaîtrait dans des filtres qu'elle ne mérite pas.
   */
  private async caracteristiquesDeLaFiche(
    etablissementId: bigint,
    couples: [NiveauFiliereCat, string][],
  ): Promise<void> {
    const trouvees = await this.db.niveauFiliere.findMany({
      where: {
        OR: couples.map(([categorie, libelle]) => ({ categorie, libelle })),
      },
      select: { id: true },
    });

    await this.db.etablissementNiveau.createMany({
      data: trouvees.map((caracteristique) => ({
        etablissement_id: etablissementId,
        niveau_id: caracteristique.id,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Réaligne `nb_avis` et `note_moy` sur les avis RÉELLEMENT publiés.
   *
   * Les fiches de démonstration portaient des chiffres d'affichage — 142 avis,
   * 4,8 de moyenne — pour trois avis en base. C'est un mensonge qu'un parent
   * repère en faisant défiler la page, et surtout une VIOLATION DE RG08 en
   * sursis : à la première décision de modération, `recalculerNote` remet le
   * compteur à la réalité et la fiche passerait de 142 à 3 sous les yeux de
   * l'administrateur.
   *
   * Mieux vaut une fiche modeste et exacte qu'une fiche flatteuse et fausse.
   */
  private async realignerCompteursAvis(): Promise<void> {
    const etablissements = await this.db.etablissement.findMany({ select: { id: true } });

    for (const { id } of etablissements) {
      const agregat = await this.db.avis.aggregate({
        where: { etablissement_id: id, statut: AvisStatut.publie },
        _avg: { note: true },
        _count: { _all: true },
      });

      await this.db.etablissement.update({
        where: { id },
        data: {
          nb_avis: agregat._count._all,
          note_moy: agregat._avg.note ? Math.round(agregat._avg.note * 10) / 10 : 0,
        },
      });
    }
  }

  private async avis(etablissementId: bigint, moderateurId: bigint): Promise<void> {
    const avis = [
      {
        auteur_nom: 'Karima B.',
        auteur_contact: 'karima.b@example.ma',
        note: 5,
        commentaire:
          'Encadrement sérieux et enseignants disponibles. Ma fille a progressé en mathématiques dès le premier trimestre.',
        statut: AvisStatut.publie,
        verifie: true,
        reponse: 'Merci pour votre confiance, nous transmettons à l’équipe pédagogique.',
      },
      {
        auteur_nom: 'Younes T.',
        auteur_contact: '06 12 34 56 78',
        note: 4,
        commentaire: 'Bon niveau général, mais les effectifs sont un peu chargés en terminale.',
        statut: AvisStatut.publie,
        verifie: true,
      },
      {
        auteur_nom: 'Hanane M.',
        auteur_contact: 'hanane.m@example.ma',
        note: 3,
        commentaire: 'Frais de scolarité élevés par rapport aux prestations de la cantine.',
        statut: AvisStatut.en_attente, // alimente la file de modération
      },
    ];

    for (const donnees of avis) {
      const existant = await this.db.avis.findFirst({
        where: { etablissement_id: etablissementId, auteur_nom: donnees.auteur_nom },
      });

      const champs = {
        ...donnees,
        etablissement_id: etablissementId,
        modere_par: donnees.statut === AvisStatut.publie ? moderateurId : null,
        modere_le: donnees.statut === AvisStatut.publie ? new Date() : null,
        reponse_le: donnees.reponse ? new Date() : null,
      };

      // RÉÉCRIT LE STATUT SUR UN AVIS EXISTANT, pas seulement créé une fois :
      // les tests d'intégration exercent `POST /avis/:id/signalements`, qui
      // fait passer cet avis en `en_attente` (RG07). Sans cette réécriture,
      // rejouer `pnpm test` contre une base de test persistante laisse l'avis
      // coincé en modération après le premier passage, et « Karima B. » ne
      // ressort plus jamais du jeu de données avec sa réponse.
      const cree = existant
        ? await this.db.avis.update({ where: { id: existant.id }, data: champs })
        : await this.db.avis.create({ data: champs });

      // Un signalement sur l'avis publié le moins favorable : l'écran de
      // modération doit montrer un avis signalé (RG07). `skipDuplicates`
      // évite d'en empiler un nouveau à chaque réamorçage.
      if (donnees.note === 4) {
        const dejaSignale = await this.db.signalement.findFirst({ where: { avis_id: cree.id } });

        if (!dejaSignale) {
          await this.db.signalement.create({
            data: { avis_id: cree.id, motif: 'Propos jugés inexacts par l’établissement' },
          });
        }
      }
    }
  }

  private async demandesContact(etablissementId: bigint, secretaireId: bigint): Promise<bigint> {
    const canaux = [
      {
        canal: DemandeCanal.formulaire,
        statut: DemandeStatut.nouvelle,
        parent_nom: 'Yasmine El Amrani',
      },
      { canal: DemandeCanal.appel, statut: DemandeStatut.en_cours, parent_nom: 'Karim Bensaid' },
      {
        canal: DemandeCanal.whatsapp,
        statut: DemandeStatut.traitee,
        parent_nom: 'Salma Cherkaoui',
      },
    ];

    let premiere: bigint | undefined;

    for (const donnees of canaux) {
      const existante = await this.db.demandeContact.findFirst({
        where: { etablissement_id: etablissementId, parent_nom: donnees.parent_nom },
      });

      const demande =
        existante ??
        (await this.db.demandeContact.create({
          data: {
            ...donnees,
            etablissement_id: etablissementId,
            parent_tel: '06 61 42 88 30',
            message: 'Bonjour, je souhaite des informations sur les inscriptions.',
            consentement: true, // RG09 — obligatoire
            traitee_par: donnees.statut === DemandeStatut.traitee ? secretaireId : null,
            traitee_le: donnees.statut === DemandeStatut.traitee ? new Date() : null,
          },
        }));

      premiere ??= demande.id;
    }

    return premiere!;
  }

  /**
   * Une campagne de sponsoring en cours — RG19.
   *
   * Sans elle, l'écran « Campagnes » du back-office serait vide et la rotation
   * équitable n'aurait rien à ordonner. Portée sur Casablanca : c'est aussi ce
   * qui permet de vérifier qu'une campagne de ville ne remonte pas une fiche
   * sur une recherche à Rabat.
   */
  private async sponsoring(etablissementId: bigint, villeId: bigint): Promise<void> {
    const existante = await this.db.sponsoring.findFirst({
      where: { etablissement_id: etablissementId },
    });

    if (existante) {
      return;
    }

    const debut = new Date();
    debut.setMonth(debut.getMonth() - 1);
    const fin = new Date();
    fin.setMonth(fin.getMonth() + 2);

    await this.db.sponsoring.create({
      data: {
        etablissement_id: etablissementId,
        niveau: SponsoringNiveau.premium,
        ville_id: villeId,
        debut,
        fin,
        tarif_mad: 4500,
      },
    });
  }

  private async abonnementEtFacture(etablissementId: bigint): Promise<void> {
    const existante = await this.db.facture.findUnique({ where: { numero: 'F2026-000612' } });

    if (existante) {
      return;
    }

    const abonnement = await this.db.abonnement.create({
      data: {
        etablissement_id: etablissementId,
        formule: 'annuel',
        tarif_mad: 2400, // tarif propre à ce client (RG14)
        remise_pct: 10, // RG11 — annuel réglé en une fois
        debut: new Date('2026-03-01'),
        echeance: new Date('2027-03-01'),
        statut: 'actif',
      },
    });

    await this.db.facture.create({
      data: {
        etablissement_id: etablissementId,
        numero: 'F2026-000612',
        objet: 'Abonnement annuel 2026-2027 (−10 %)',
        abonnement_id: abonnement.id,
        montant_ht: 25920,
        tva: 5184, // 20 %
        total_ttc: 31104,
        statut_paiement: 'payee',
        payee_le: new Date('2026-03-01'),
      },
    });
  }

  private async prospects(commercialId: bigint): Promise<void> {
    const prospects = [
      {
        etablissement_nom: 'École Al Andalous',
        contact_nom: 'Mme Naïma Berrada',
        telephone: '05 37 70 12 45',
        ville: 'Rabat',
        statut_pipeline: 'chaud' as const,
      },
      {
        etablissement_nom: 'Groupe Scolaire Ibn Sina',
        contact_nom: 'M. Abdellah Fassi',
        telephone: '05 24 43 88 21',
        ville: 'Marrakech',
        statut_pipeline: 'a_contacter' as const,
      },
      {
        etablissement_nom: 'Institut Chourouk',
        contact_nom: 'Mme Latifa Ouazzani',
        telephone: '05 39 33 60 07',
        ville: 'Tanger',
        statut_pipeline: 'nouveau' as const,
      },
    ];

    for (const donnees of prospects) {
      const existant = await this.db.prospect.findFirst({
        where: { etablissement_nom: donnees.etablissement_nom },
      });

      if (existant) {
        continue;
      }

      const prospect = await this.db.prospect.create({
        data: { ...donnees, commercial_id: commercialId },
      });

      if (donnees.statut_pipeline === 'chaud') {
        await this.db.relance.create({
          data: {
            prospect_id: prospect.id,
            commercial_id: commercialId,
            note: 'Devis envoyé, relance prévue sous 48 h',
            prevue_le: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
  }
}
