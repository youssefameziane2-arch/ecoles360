import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AuditSeverite,
  AvisStatut,
  DemandeCanal,
  DemandeStatut,
  LeadSource,
  LeadStatut,
  LeadUrgence,
  PermissionPortee,
  RoleCode,
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

    const almassira = await this.db.etablissement.upsert({
      where: { slug: 'lycee-al-massira-casablanca' },
      update: {},
      create: {
        ville_id: casablanca.id,
        proprietaire_user_id: comptes.etablissement.id,
        slug: 'lycee-al-massira-casablanca',
        nom: 'Lycée Al Massira',
        type: 'lycee',
        statut: 'validee',
        quartier: 'Maârif',
        adresse: '12, rue Ibn Battouta, Maârif',
        description:
          'Établissement privé fondé en 1998, le Lycée Al Massira accueille près de 900 élèves du ' +
          'collège au baccalauréat, en filières sciences et économie, avec un enseignement bilingue ' +
          'français-arabe.',
        tel: '05 22 25 40 10',
        whatsapp: '06 61 20 40 10',
        email: 'contact@almassira.ma',
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
        horaires: { lundi_vendredi: '08:00 – 17:30', samedi: '08:00 – 12:00' },
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
    ];

    for (const fiche of autres) {
      await this.db.etablissement.upsert({
        where: { slug: fiche.slug },
        update: {},
        create: { ...fiche, source: 'direct' },
      });
    }

    await this.niveauxDeLaFiche(almassira.id, ['Lycée', 'Sciences', 'Économie', 'Bilingue']);
    await this.avis(almassira.id, comptes.admin.id);
    const demande = await this.demandesContact(almassira.id, comptes.sara.id);
    await this.abonnementEtFacture(almassira.id);
    await this.prospects(comptes.commercial.id);

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
    const articles = [
      {
        slug: 'bien-choisir-ecole-primaire-maroc',
        titre: "Bien choisir l'école primaire de son enfant au Maroc",
        categorie: 'Conseils aux parents',
        chapeau: 'Cinq critères qui comptent vraiment, au-delà du taux de réussite affiché.',
        statut: 'approuve' as const,
        a_la_une: true,
        auteur_id: comptes.admin.id,
        validee_par: comptes.admin.id,
        publie_le: new Date('2026-08-20'),
        soumis_le: new Date('2026-08-18'),
      },
      {
        slug: 'journee-portes-ouvertes-al-massira-2026',
        titre: 'Journée portes ouvertes — samedi 12 septembre',
        categorie: 'Vie des établissements',
        chapeau: 'Visite des locaux, rencontre avec les enseignants et présentation des filières.',
        statut: 'en_attente' as const, // soumis par l'établissement, pas encore décidé
        auteur_id: comptes.etablissement.id,
        etablissement_id: almassira.id,
        soumis_le: new Date('2026-09-01'),
      },
      {
        slug: 'rentree-2026-ce-qui-change',
        titre: 'Rentrée 2026 : ce qui change dans le privé',
        categorie: 'Actualités',
        chapeau: 'Nouveaux barèmes, calendrier et obligations déclaratives.',
        statut: 'brouillon' as const,
        auteur_id: comptes.admin.id,
      },
      {
        slug: 'classement-ecoles-casablanca',
        titre: 'Notre classement des écoles de Casablanca',
        categorie: 'Actualités',
        chapeau: 'Article refusé — un classement nominatif contrevient à notre charte éditoriale.',
        statut: 'refuse' as const,
        auteur_id: comptes.etablissement.id,
        etablissement_id: almassira.id,
        soumis_le: new Date('2026-07-10'),
        validee_par: comptes.admin.id,
      },
    ];

    for (const article of articles) {
      await this.db.article.upsert({
        where: { slug: article.slug },
        update: {},
        create: article,
      });
    }

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
          champs_modifies: ['description', 'budget_max'],
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
    blog_actif?: boolean;
    statut?: 'actif' | 'suspendu';
  }): Promise<User> {
    const { motDePasse, ...champs } = compte;

    return this.db.user.upsert({
      where: { email: compte.email },
      // Le mot de passe n'est PAS réécrit sur un compte existant : un
      // développeur qui a changé le sien ne doit pas le voir réinitialisé à
      // chaque `db:seed`.
      update: {},
      create: { ...champs, passwordHash: await argon2.hash(motDePasse, { type: argon2.argon2id }) },
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

  private async niveauxDeLaFiche(etablissementId: bigint, libelles: string[]): Promise<void> {
    const niveaux = await this.db.niveauFiliere.findMany({ where: { libelle: { in: libelles } } });

    await this.db.etablissementNiveau.createMany({
      data: niveaux.map((niveau) => ({
        etablissement_id: etablissementId,
        niveau_id: niveau.id,
      })),
      skipDuplicates: true,
    });
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

      if (existant) {
        continue;
      }

      const cree = await this.db.avis.create({
        data: {
          ...donnees,
          etablissement_id: etablissementId,
          modere_par: donnees.statut === AvisStatut.publie ? moderateurId : null,
          modere_le: donnees.statut === AvisStatut.publie ? new Date() : null,
          reponse_le: donnees.reponse ? new Date() : null,
        },
      });

      // Un signalement sur l'avis publié le moins favorable : l'écran de
      // modération doit montrer un avis signalé (RG07).
      if (donnees.note === 4) {
        await this.db.signalement.create({
          data: { avis_id: cree.id, motif: 'Propos jugés inexacts par l’établissement' },
        });
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
