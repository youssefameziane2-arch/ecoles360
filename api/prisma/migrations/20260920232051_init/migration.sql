-- CreateTable
CREATE TABLE `roles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` ENUM('superadmin', 'secretariat', 'commercial', 'etablissement') NOT NULL,
    `libelle` VARCHAR(40) NOT NULL,
    `perimetre_fixe` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `roles_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(160) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role_id` BIGINT UNSIGNED NOT NULL,
    `etablissement_rattache_id` BIGINT UNSIGNED NULL,
    `blog_actif` BOOLEAN NOT NULL DEFAULT false,
    `statut` ENUM('actif', 'suspendu') NOT NULL DEFAULT 'actif',
    `derniere_connexion_le` TIMESTAMP(0) NULL,
    `cree_le` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `idx_user_role`(`role_id`, `statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expire_le` TIMESTAMP(0) NOT NULL,
    `utilise_le` TIMESTAMP(0) NULL,
    `cree_le` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `password_reset_tokens_token_hash_key`(`token_hash`),
    INDEX `idx_reset_user`(`user_id`, `expire_le`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `villes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `region` VARCHAR(100) NULL,

    UNIQUE INDEX `villes_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `niveau_filieres` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `libelle` VARCHAR(80) NOT NULL,
    `categorie` ENUM('niveau', 'filiere') NOT NULL,

    UNIQUE INDEX `niveau_filieres_libelle_key`(`libelle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `etablissements` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `ville_id` BIGINT UNSIGNED NOT NULL,
    `proprietaire_user_id` BIGINT UNSIGNED NULL,
    `slug` VARCHAR(160) NOT NULL,
    `nom` VARCHAR(180) NOT NULL,
    `type` ENUM('creche', 'primaire', 'college', 'lycee', 'universite', 'formation') NOT NULL,
    `statut` ENUM('en_attente', 'validee', 'masquee', 'suspendue') NOT NULL DEFAULT 'en_attente',
    `description` TEXT NULL,
    `adresse` VARCHAR(255) NULL,
    `quartier` VARCHAR(100) NULL,
    `lat` DECIMAL(10, 7) NULL,
    `lng` DECIMAL(10, 7) NULL,
    `tel` VARCHAR(30) NULL,
    `whatsapp` VARCHAR(30) NULL,
    `email` VARCHAR(160) NULL,
    `budget_min` INTEGER UNSIGNED NULL,
    `budget_max` INTEGER UNSIGNED NULL,
    `note_moy` DECIMAL(2, 1) NOT NULL DEFAULT 0,
    `nb_avis` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `source` ENUM('open_data', 'direct') NOT NULL DEFAULT 'direct',
    `sponsorise` BOOLEAN NOT NULL DEFAULT false,
    `valide_le` TIMESTAMP(0) NULL,
    `cree_le` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `verifie` BOOLEAN NOT NULL DEFAULT false,
    `premium` BOOLEAN NOT NULL DEFAULT false,
    `chiffres` JSON NULL,
    `faq` JSON NULL,
    `horaires` JSON NULL,
    `socials` JSON NULL,
    `autres_projets` JSON NULL,
    `facilites` JSON NULL,
    `video_url` VARCHAR(200) NULL,
    `video_poster` VARCHAR(200) NULL,
    `gamme_label` VARCHAR(80) NULL,
    `devis_label` VARCHAR(120) NULL,

    UNIQUE INDEX `etablissements_slug_key`(`slug`),
    INDEX `idx_eta_recherche`(`ville_id`, `type`, `statut`),
    INDEX `idx_eta_tri`(`statut`, `note_moy` DESC),
    FULLTEXT INDEX `ft_eta_nom_desc`(`nom`, `description`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `etablissement_niveau` (
    `etablissement_id` BIGINT UNSIGNED NOT NULL,
    `niveau_id` BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (`etablissement_id`, `niveau_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `photos` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `etablissement_id` BIGINT UNSIGNED NOT NULL,
    `chemin` VARCHAR(255) NOT NULL,
    `ordre` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `poids` INTEGER UNSIGNED NULL,
    `alt` VARCHAR(160) NULL,

    INDEX `idx_photo_galerie`(`etablissement_id`, `ordre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `avis` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `etablissement_id` BIGINT UNSIGNED NOT NULL,
    `auteur_nom` VARCHAR(120) NOT NULL,
    `auteur_contact` VARCHAR(160) NOT NULL,
    `note` TINYINT UNSIGNED NOT NULL,
    `commentaire` TEXT NOT NULL,
    `statut` ENUM('en_attente', 'publie', 'rejete') NOT NULL DEFAULT 'en_attente',
    `verifie` BOOLEAN NOT NULL DEFAULT false,
    `en_avant` BOOLEAN NOT NULL DEFAULT false,
    `modere_par` BIGINT UNSIGNED NULL,
    `decision_motif` VARCHAR(255) NULL,
    `modere_le` TIMESTAMP(0) NULL,
    `reponse` TEXT NULL,
    `reponse_le` TIMESTAMP(0) NULL,
    `depose_le` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_avis_fiche`(`etablissement_id`, `statut`, `depose_le` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `signalements` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `avis_id` BIGINT UNSIGNED NOT NULL,
    `motif` VARCHAR(255) NOT NULL,
    `contact` VARCHAR(160) NULL,
    `statut` ENUM('nouveau', 'traite') NOT NULL DEFAULT 'nouveau',
    `signale_le` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_sig_file`(`avis_id`, `statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `demande_contacts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `etablissement_id` BIGINT UNSIGNED NOT NULL,
    `parent_nom` VARCHAR(120) NOT NULL,
    `parent_tel` VARCHAR(30) NOT NULL,
    `message` TEXT NULL,
    `canal` ENUM('formulaire', 'appel', 'whatsapp') NOT NULL,
    `statut` ENUM('nouvelle', 'en_cours', 'traitee') NOT NULL DEFAULT 'nouvelle',
    `consentement` BOOLEAN NOT NULL,
    `traitee_par` BIGINT UNSIGNED NULL,
    `recue_le` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `traitee_le` TIMESTAMP(0) NULL,

    INDEX `idx_dem_inbox`(`etablissement_id`, `statut`, `recue_le` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evenement_traces` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `etablissement_id` BIGINT UNSIGNED NOT NULL,
    `type` ENUM('appel', 'whatsapp', 'vue', 'vue_sponsorisee') NOT NULL,
    `source` VARCHAR(40) NULL,
    `survenu_le` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_evt_stats`(`etablissement_id`, `type`, `survenu_le`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `abonnements` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `etablissement_id` BIGINT UNSIGNED NOT NULL,
    `formule` ENUM('essai_gratuit', 'mensuel', 'annuel') NOT NULL,
    `tarif_mad` DECIMAL(10, 2) NULL,
    `remise_pct` DECIMAL(4, 1) NULL,
    `debut` DATE NOT NULL,
    `echeance` DATE NOT NULL,
    `statut` ENUM('essai', 'actif', 'expire', 'resilie') NOT NULL DEFAULT 'actif',

    INDEX `idx_abo_actif`(`etablissement_id`, `statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paiements_vue` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `etablissement_id` BIGINT UNSIGNED NOT NULL,
    `prix_unitaire_mad` DECIMAL(6, 2) NOT NULL,
    `plafond_mensuel` INTEGER UNSIGNED NOT NULL,
    `periode` CHAR(7) NOT NULL,
    `compteur_mois_courant` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `statut` ENUM('actif', 'suspendu') NOT NULL DEFAULT 'actif',

    UNIQUE INDEX `uq_pv_periode`(`etablissement_id`, `periode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `factures` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `etablissement_id` BIGINT UNSIGNED NOT NULL,
    `numero` VARCHAR(20) NOT NULL,
    `objet` VARCHAR(160) NOT NULL,
    `abonnement_id` BIGINT UNSIGNED NULL,
    `paiement_vue_id` BIGINT UNSIGNED NULL,
    `sponsoring_id` BIGINT UNSIGNED NULL,
    `montant_ht` DECIMAL(10, 2) NOT NULL,
    `tva` DECIMAL(10, 2) NOT NULL,
    `total_ttc` DECIMAL(10, 2) NOT NULL,
    `statut_paiement` ENUM('non_payee', 'payee') NOT NULL DEFAULT 'non_payee',
    `pdf_chemin` VARCHAR(255) NULL,
    `emise_le` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `payee_le` TIMESTAMP(0) NULL,

    UNIQUE INDEX `factures_numero_key`(`numero`),
    INDEX `idx_fac_historique`(`etablissement_id`, `statut_paiement`, `emise_le` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sponsorings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `etablissement_id` BIGINT UNSIGNED NOT NULL,
    `niveau` ENUM('premium', 'gold', 'silver') NOT NULL,
    `ville_id` BIGINT UNSIGNED NULL,
    `categorie` VARCHAR(60) NULL,
    `mot_cle` VARCHAR(80) NULL,
    `debut` DATE NOT NULL,
    `fin` DATE NOT NULL,
    `tarif_mad` DECIMAL(10, 2) NOT NULL,

    INDEX `idx_spo_rotation`(`niveau`, `ville_id`, `debut`, `fin`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prospects` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `etablissement_id` BIGINT UNSIGNED NULL,
    `commercial_id` BIGINT UNSIGNED NULL,
    `etablissement_nom` VARCHAR(180) NOT NULL,
    `ville` VARCHAR(100) NULL,
    `type_vise` VARCHAR(40) NULL,
    `contact_nom` VARCHAR(120) NOT NULL,
    `contact_fonction` VARCHAR(100) NULL,
    `telephone` VARCHAR(30) NOT NULL,
    `email` VARCHAR(160) NULL,
    `formule_visee` VARCHAR(40) NULL,
    `message` TEXT NULL,
    `source` ENUM('formulaire', 'telephone', 'manuel') NOT NULL DEFAULT 'formulaire',
    `statut_pipeline` ENUM('nouveau', 'a_contacter', 'chaud', 'relance', 'transforme', 'perdu') NOT NULL DEFAULT 'nouveau',
    `cree_le` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `prospects_etablissement_id_key`(`etablissement_id`),
    INDEX `idx_pros_pipeline`(`statut_pipeline`, `commercial_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `relances` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `prospect_id` BIGINT UNSIGNED NOT NULL,
    `commercial_id` BIGINT UNSIGNED NOT NULL,
    `note` TEXT NULL,
    `prevue_le` TIMESTAMP(0) NULL,
    `effectuee_le` TIMESTAMP(0) NULL,

    INDEX `idx_rel_prospect`(`prospect_id`, `prevue_le`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commissions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `facture_id` BIGINT UNSIGNED NOT NULL,
    `commercial_id` BIGINT UNSIGNED NOT NULL,
    `taux_pct` DECIMAL(4, 1) NOT NULL,
    `montant_mad` DECIMAL(10, 2) NOT NULL,
    `statut` ENUM('a_valider', 'validee', 'reglee') NOT NULL DEFAULT 'a_valider',
    `validee_par` BIGINT UNSIGNED NULL,
    `validee_le` TIMESTAMP(0) NULL,

    INDEX `idx_com_commercial`(`commercial_id`, `statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `propositions_fiche` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `etablissement_id` BIGINT UNSIGNED NOT NULL,
    `proposee_par` BIGINT UNSIGNED NOT NULL,
    `champs_modifies` JSON NOT NULL,
    `payload` JSON NULL,
    `statut` ENUM('en_attente', 'validee', 'rejetee') NOT NULL DEFAULT 'en_attente',
    `decision_motif` VARCHAR(200) NULL,
    `validee_par` BIGINT UNSIGNED NULL,
    `proposee_le` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `traitee_le` TIMESTAMP(0) NULL,
    `annulee_le` TIMESTAMP(0) NULL,

    INDEX `idx_prop_fiche`(`etablissement_id`, `statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `portee` ENUM('fiches', 'contacts', 'avis') NOT NULL,
    `accordee_par` BIGINT UNSIGNED NOT NULL,
    `accordee_le` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `revoquee_le` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_perm_user_portee`(`user_id`, `portee`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `type` ENUM('echeance_abonnement', 'plafond_vue_atteint', 'demande', 'moderation', 'proposition_fiche') NOT NULL,
    `contenu` VARCHAR(255) NOT NULL,
    `canal` ENUM('in_app', 'email') NOT NULL,
    `envoyee_le` TIMESTAMP(0) NULL,
    `lue_le` TIMESTAMP(0) NULL,

    INDEX `idx_notif_centre`(`user_id`, `lue_le`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `journal_audits` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NULL,
    `role_acteur` VARCHAR(20) NOT NULL,
    `action` VARCHAR(60) NOT NULL,
    `cible_type` VARCHAR(60) NOT NULL,
    `cible_id` BIGINT UNSIGNED NOT NULL,
    `severite` ENUM('info', 'avertissement', 'erreur') NOT NULL DEFAULT 'info',
    `details` JSON NULL,
    `adresse_ip` VARCHAR(45) NULL,
    `cree_le` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_audit_cible`(`cible_type`, `cible_id`),
    INDEX `idx_audit_user`(`user_id`, `cree_le` DESC),
    INDEX `idx_audit_role`(`role_acteur`, `cree_le` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parametres_facturation` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `cle` VARCHAR(60) NOT NULL,
    `valeur` VARCHAR(40) NOT NULL,
    `libelle` VARCHAR(160) NOT NULL,
    `modifie_par` BIGINT UNSIGNED NULL,
    `maj_le` TIMESTAMP(0) NULL,

    UNIQUE INDEX `parametres_facturation_cle_key`(`cle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leads` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `etablissement_id` BIGINT UNSIGNED NOT NULL,
    `demande_contact_id` BIGINT UNSIGNED NULL,
    `cree_par` BIGINT UNSIGNED NULL,
    `candidat_nom` VARCHAR(120) NOT NULL,
    `pour_qui` ENUM('soi', 'enfant') NOT NULL DEFAULT 'enfant',
    `tel` VARCHAR(30) NOT NULL,
    `whatsapp` BOOLEAN NOT NULL DEFAULT false,
    `email` VARCHAR(160) NULL,
    `ville` VARCHAR(100) NULL,
    `cycle` VARCHAR(60) NULL,
    `niveau` VARCHAR(80) NULL,
    `budget_min` INTEGER UNSIGNED NULL,
    `budget_max` INTEGER UNSIGNED NULL,
    `urgence` ENUM('imminente', 'semaine', 'mois', 'rentree', 'flexible') NOT NULL DEFAULT 'flexible',
    `source` ENUM('ecoles360', 'whatsapp', 'appel', 'reseaux', 'google', 'recommandation', 'salon', 'autre') NOT NULL,
    `fiche_besoin` JSON NULL,
    `score` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `statut_pipeline` ENUM('nouveau', 'contacte', 'qualifie', 'proposition_envoyee', 'inscrit', 'perdu') NOT NULL DEFAULT 'nouveau',
    `raison_perte` VARCHAR(120) NULL,
    `acompte_mad` DECIMAL(10, 2) NULL,
    `converti_le` TIMESTAMP(0) NULL,
    `cree_le` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_lead_kanban`(`etablissement_id`, `statut_pipeline`),
    INDEX `idx_lead_chauds`(`etablissement_id`, `score` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_suivis` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `lead_id` BIGINT UNSIGNED NOT NULL,
    `auteur_id` BIGINT UNSIGNED NULL,
    `type` ENUM('commentaire', 'relance') NOT NULL,
    `note` TEXT NULL,
    `prevue_le` TIMESTAMP(0) NULL,
    `effectuee_le` TIMESTAMP(0) NULL,
    `cree_le` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_suivi_timeline`(`lead_id`, `cree_le` DESC),
    INDEX `idx_suivi_relances`(`prevue_le`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `articles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `auteur_id` BIGINT UNSIGNED NULL,
    `etablissement_id` BIGINT UNSIGNED NULL,
    `validee_par` BIGINT UNSIGNED NULL,
    `titre` VARCHAR(180) NOT NULL,
    `slug` VARCHAR(200) NOT NULL,
    `categorie` VARCHAR(60) NOT NULL,
    `chapeau` VARCHAR(300) NULL,
    `contenu` MEDIUMTEXT NULL,
    `image_chemin` VARCHAR(200) NULL,
    `statut` ENUM('brouillon', 'en_attente', 'approuve', 'refuse') NOT NULL DEFAULT 'brouillon',
    `a_la_une` BOOLEAN NOT NULL DEFAULT false,
    `soumis_le` TIMESTAMP(0) NULL,
    `publie_le` TIMESTAMP(0) NULL,
    `cree_le` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `articles_slug_key`(`slug`),
    INDEX `idx_art_public`(`statut`, `publie_le` DESC),
    INDEX `idx_art_scope`(`etablissement_id`, `statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faq_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `question` VARCHAR(200) NOT NULL,
    `reponse` TEXT NOT NULL,
    `ordre` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `publiee` BOOLEAN NOT NULL DEFAULT true,
    `modifiee_par` BIGINT UNSIGNED NULL,
    `modifiee_le` TIMESTAMP(0) NULL,

    INDEX `idx_faq_ordre`(`publiee`, `ordre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pages_cms` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `cle` VARCHAR(60) NOT NULL,
    `titre` VARCHAR(160) NOT NULL,
    `blocs` JSON NOT NULL,
    `modifiee_par` BIGINT UNSIGNED NULL,
    `modifiee_le` TIMESTAMP(0) NULL,

    UNIQUE INDEX `pages_cms_cle_key`(`cle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_etablissement_rattache_id_fkey` FOREIGN KEY (`etablissement_rattache_id`) REFERENCES `etablissements`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `etablissements` ADD CONSTRAINT `etablissements_ville_id_fkey` FOREIGN KEY (`ville_id`) REFERENCES `villes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `etablissements` ADD CONSTRAINT `etablissements_proprietaire_user_id_fkey` FOREIGN KEY (`proprietaire_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `etablissement_niveau` ADD CONSTRAINT `etablissement_niveau_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `etablissement_niveau` ADD CONSTRAINT `etablissement_niveau_niveau_id_fkey` FOREIGN KEY (`niveau_id`) REFERENCES `niveau_filieres`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `photos` ADD CONSTRAINT `photos_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avis` ADD CONSTRAINT `avis_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avis` ADD CONSTRAINT `avis_modere_par_fkey` FOREIGN KEY (`modere_par`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `signalements` ADD CONSTRAINT `signalements_avis_id_fkey` FOREIGN KEY (`avis_id`) REFERENCES `avis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demande_contacts` ADD CONSTRAINT `demande_contacts_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demande_contacts` ADD CONSTRAINT `demande_contacts_traitee_par_fkey` FOREIGN KEY (`traitee_par`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evenement_traces` ADD CONSTRAINT `evenement_traces_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `abonnements` ADD CONSTRAINT `abonnements_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paiements_vue` ADD CONSTRAINT `paiements_vue_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `factures` ADD CONSTRAINT `factures_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `factures` ADD CONSTRAINT `factures_abonnement_id_fkey` FOREIGN KEY (`abonnement_id`) REFERENCES `abonnements`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `factures` ADD CONSTRAINT `factures_paiement_vue_id_fkey` FOREIGN KEY (`paiement_vue_id`) REFERENCES `paiements_vue`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `factures` ADD CONSTRAINT `factures_sponsoring_id_fkey` FOREIGN KEY (`sponsoring_id`) REFERENCES `sponsorings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sponsorings` ADD CONSTRAINT `sponsorings_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sponsorings` ADD CONSTRAINT `sponsorings_ville_id_fkey` FOREIGN KEY (`ville_id`) REFERENCES `villes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospects` ADD CONSTRAINT `prospects_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospects` ADD CONSTRAINT `prospects_commercial_id_fkey` FOREIGN KEY (`commercial_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `relances` ADD CONSTRAINT `relances_prospect_id_fkey` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `relances` ADD CONSTRAINT `relances_commercial_id_fkey` FOREIGN KEY (`commercial_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commissions` ADD CONSTRAINT `commissions_facture_id_fkey` FOREIGN KEY (`facture_id`) REFERENCES `factures`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commissions` ADD CONSTRAINT `commissions_commercial_id_fkey` FOREIGN KEY (`commercial_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commissions` ADD CONSTRAINT `commissions_validee_par_fkey` FOREIGN KEY (`validee_par`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `propositions_fiche` ADD CONSTRAINT `propositions_fiche_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `propositions_fiche` ADD CONSTRAINT `propositions_fiche_proposee_par_fkey` FOREIGN KEY (`proposee_par`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `propositions_fiche` ADD CONSTRAINT `propositions_fiche_validee_par_fkey` FOREIGN KEY (`validee_par`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_accordee_par_fkey` FOREIGN KEY (`accordee_par`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journal_audits` ADD CONSTRAINT `journal_audits_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `parametres_facturation` ADD CONSTRAINT `parametres_facturation_modifie_par_fkey` FOREIGN KEY (`modifie_par`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_demande_contact_id_fkey` FOREIGN KEY (`demande_contact_id`) REFERENCES `demande_contacts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_cree_par_fkey` FOREIGN KEY (`cree_par`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_suivis` ADD CONSTRAINT `lead_suivis_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_suivis` ADD CONSTRAINT `lead_suivis_auteur_id_fkey` FOREIGN KEY (`auteur_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `articles` ADD CONSTRAINT `articles_auteur_id_fkey` FOREIGN KEY (`auteur_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `articles` ADD CONSTRAINT `articles_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `articles` ADD CONSTRAINT `articles_validee_par_fkey` FOREIGN KEY (`validee_par`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `faq_items` ADD CONSTRAINT `faq_items_modifiee_par_fkey` FOREIGN KEY (`modifiee_par`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pages_cms` ADD CONSTRAINT `pages_cms_modifiee_par_fkey` FOREIGN KEY (`modifiee_par`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
