-- =====================================================================
--  écoles360 — Base de données (état actuel, avant ajout « École supérieure »)
--  MySQL 8.0 · InnoDB · utf8mb4_unicode_ci
--  Fidèle au Livrable 10 (MPD v2.1) — 24 tables, modèle commercial v2 + Avenant 1 (CRM leads)
--  Mots de passe démo : hachés (bcrypt) — en réel via SEED_*_PASSWORD (jamais en dur)
--  Généré le 15/07/2026
-- =====================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS lead_suivis, leads, journal_audits, notifications, permissions,
  propositions_fiche, commissions, relances, prospects, sponsorings, factures,
  paiements_vue, abonnements, evenement_traces, demande_contacts, signalements, avis,
  photos, etablissement_niveau, etablissements, niveau_filieres, villes,
  parametres_facturation, users;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------- 00 · users (socle Laravel + colonnes métier RG04) ----------
CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  email_verified_at TIMESTAMP NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','secretaire','etablissement') NOT NULL DEFAULT 'etablissement',
  statut ENUM('actif','suspendu') NOT NULL DEFAULT 'actif',
  derniere_connexion_le TIMESTAMP NULL,
  remember_token VARCHAR(100) NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  PRIMARY KEY (id), UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 02 · villes (RG01) ----------
CREATE TABLE villes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nom VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  region VARCHAR(100) NULL,
  PRIMARY KEY (id), UNIQUE KEY uq_villes_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 03 · niveau_filieres (RG02) ----------
CREATE TABLE niveau_filieres (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  libelle VARCHAR(80) NOT NULL,
  categorie ENUM('niveau','filiere') NOT NULL,
  PRIMARY KEY (id), UNIQUE KEY uq_nf_libelle (libelle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 04 · etablissements (pivot) ----------
CREATE TABLE etablissements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ville_id BIGINT UNSIGNED NOT NULL,
  proprietaire_user_id BIGINT UNSIGNED NULL,
  slug VARCHAR(160) NOT NULL,
  nom VARCHAR(180) NOT NULL,
  type ENUM('creche','primaire','college','lycee','universite','formation') NOT NULL,
  statut ENUM('en_attente','validee','masquee','suspendue') NOT NULL DEFAULT 'en_attente',
  description TEXT NULL,
  adresse VARCHAR(255) NULL,
  quartier VARCHAR(100) NULL,
  lat DECIMAL(10,7) NULL, lng DECIMAL(10,7) NULL,
  tel VARCHAR(30) NULL, whatsapp VARCHAR(30) NULL, email VARCHAR(160) NULL,
  budget_min INT UNSIGNED NULL, budget_max INT UNSIGNED NULL,
  note_moy DECIMAL(2,1) NOT NULL DEFAULT 0,
  nb_avis INT UNSIGNED NOT NULL DEFAULT 0,
  source ENUM('open_data','direct') NOT NULL DEFAULT 'direct',
  sponsorise TINYINT(1) NOT NULL DEFAULT 0,
  valide_le TIMESTAMP NULL,
  cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_eta_slug (slug),
  KEY idx_eta_recherche (ville_id, type, statut),
  KEY idx_eta_tri (statut, note_moy),
  FULLTEXT KEY ft_eta_nom_desc (nom, description),
  CONSTRAINT fk_eta_ville FOREIGN KEY (ville_id) REFERENCES villes(id),
  CONSTRAINT fk_eta_user FOREIGN KEY (proprietaire_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 05 · etablissement_niveau (n,n) ----------
CREATE TABLE etablissement_niveau (
  etablissement_id BIGINT UNSIGNED NOT NULL,
  niveau_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (etablissement_id, niveau_id),
  CONSTRAINT fk_en_eta FOREIGN KEY (etablissement_id) REFERENCES etablissements(id) ON DELETE CASCADE,
  CONSTRAINT fk_en_niveau FOREIGN KEY (niveau_id) REFERENCES niveau_filieres(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 06 · photos (RG16) ----------
CREATE TABLE photos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  etablissement_id BIGINT UNSIGNED NOT NULL,
  chemin VARCHAR(255) NOT NULL,
  ordre TINYINT UNSIGNED NOT NULL DEFAULT 0,
  poids INT UNSIGNED NULL,
  alt VARCHAR(160) NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_photo_eta FOREIGN KEY (etablissement_id) REFERENCES etablissements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 07 · avis (RG06, RG07) ----------
CREATE TABLE avis (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  etablissement_id BIGINT UNSIGNED NOT NULL,
  auteur_nom VARCHAR(120) NOT NULL,
  auteur_contact VARCHAR(160) NOT NULL,
  note TINYINT UNSIGNED NOT NULL,
  commentaire TEXT NOT NULL,
  statut ENUM('en_attente','publie','rejete') NOT NULL DEFAULT 'en_attente',
  verifie TINYINT(1) NOT NULL DEFAULT 0,
  modere_par BIGINT UNSIGNED NULL,
  decision_motif VARCHAR(255) NULL,
  modere_le TIMESTAMP NULL,
  reponse TEXT NULL,
  reponse_le TIMESTAMP NULL,
  depose_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_avis_fiche (etablissement_id, statut, depose_le),
  CONSTRAINT fk_avis_eta FOREIGN KEY (etablissement_id) REFERENCES etablissements(id) ON DELETE CASCADE,
  CONSTRAINT fk_avis_mod FOREIGN KEY (modere_par) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_avis_note CHECK (note BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 08 · signalements (RG07) ----------
CREATE TABLE signalements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  avis_id BIGINT UNSIGNED NOT NULL,
  motif VARCHAR(255) NOT NULL,
  contact VARCHAR(160) NULL,
  statut ENUM('nouveau','traite') NOT NULL DEFAULT 'nouveau',
  signale_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_sig_avis FOREIGN KEY (avis_id) REFERENCES avis(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 09 · demande_contacts (RG09 — minimisation loi 09-08) ----------
CREATE TABLE demande_contacts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  etablissement_id BIGINT UNSIGNED NOT NULL,
  parent_nom VARCHAR(120) NOT NULL,
  parent_tel VARCHAR(30) NOT NULL,
  message TEXT NULL,
  canal ENUM('formulaire','appel','whatsapp') NOT NULL,
  statut ENUM('nouvelle','en_cours','traitee') NOT NULL DEFAULT 'nouvelle',
  consentement TINYINT(1) NOT NULL,
  traitee_par BIGINT UNSIGNED NULL,
  recue_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  traitee_le TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_dem_inbox (etablissement_id, statut, recue_le),
  CONSTRAINT fk_dem_eta FOREIGN KEY (etablissement_id) REFERENCES etablissements(id) ON DELETE CASCADE,
  CONSTRAINT fk_dem_user FOREIGN KEY (traitee_par) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 10 · evenement_traces (RG10) ----------
CREATE TABLE evenement_traces (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  etablissement_id BIGINT UNSIGNED NOT NULL,
  type ENUM('appel','whatsapp','vue','vue_sponsorisee') NOT NULL,
  source VARCHAR(40) NULL,
  survenu_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_evt_stats (etablissement_id, type, survenu_le),
  CONSTRAINT fk_evt_eta FOREIGN KEY (etablissement_id) REFERENCES etablissements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 11 · abonnements (RG11, RG13, RG14) ----------
CREATE TABLE abonnements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  etablissement_id BIGINT UNSIGNED NOT NULL,
  formule ENUM('essai_gratuit','mensuel','annuel') NOT NULL,
  tarif_mad DECIMAL(10,2) NULL,
  remise_pct DECIMAL(4,1) NULL,
  debut DATE NOT NULL, echeance DATE NOT NULL,
  statut ENUM('essai','actif','expire','resilie') NOT NULL DEFAULT 'actif',
  PRIMARY KEY (id),
  KEY idx_abo_actif (etablissement_id, statut),
  CONSTRAINT fk_abo_eta FOREIGN KEY (etablissement_id) REFERENCES etablissements(id) ON DELETE CASCADE,
  CONSTRAINT chk_abo_tarif CHECK ((formule='essai_gratuit' AND tarif_mad IS NULL) OR (formule<>'essai_gratuit' AND tarif_mad IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 12 · paiements_vue (RG12) ----------
CREATE TABLE paiements_vue (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  etablissement_id BIGINT UNSIGNED NOT NULL,
  prix_unitaire_mad DECIMAL(6,2) NOT NULL,
  plafond_mensuel INT UNSIGNED NOT NULL,
  periode CHAR(7) NOT NULL,
  compteur_mois_courant INT UNSIGNED NOT NULL DEFAULT 0,
  statut ENUM('actif','suspendu') NOT NULL DEFAULT 'actif',
  PRIMARY KEY (id),
  UNIQUE KEY uq_pv_periode (etablissement_id, periode),
  CONSTRAINT fk_pv_eta FOREIGN KEY (etablissement_id) REFERENCES etablissements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 13 · factures (RG14, RG18 — origine exclusive) ----------
CREATE TABLE factures (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  etablissement_id BIGINT UNSIGNED NOT NULL,
  numero VARCHAR(20) NOT NULL,
  objet VARCHAR(160) NOT NULL,
  abonnement_id BIGINT UNSIGNED NULL,
  paiement_vue_id BIGINT UNSIGNED NULL,
  sponsoring_id BIGINT UNSIGNED NULL,
  montant_ht DECIMAL(10,2) NOT NULL,
  tva DECIMAL(10,2) NOT NULL,
  total_ttc DECIMAL(10,2) NOT NULL,
  statut_paiement ENUM('non_payee','payee') NOT NULL DEFAULT 'non_payee',
  pdf_chemin VARCHAR(255) NULL,
  emise_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payee_le TIMESTAMP NULL,
  PRIMARY KEY (id), UNIQUE KEY uq_fac_numero (numero),
  CONSTRAINT fk_fac_eta FOREIGN KEY (etablissement_id) REFERENCES etablissements(id) ON DELETE CASCADE,
  CONSTRAINT fk_fac_abo FOREIGN KEY (abonnement_id) REFERENCES abonnements(id) ON DELETE SET NULL,
  CONSTRAINT fk_fac_pv FOREIGN KEY (paiement_vue_id) REFERENCES paiements_vue(id) ON DELETE SET NULL,
  CONSTRAINT chk_fac_origine CHECK (
    (abonnement_id IS NOT NULL AND paiement_vue_id IS NULL AND sponsoring_id IS NULL) OR
    (paiement_vue_id IS NOT NULL AND abonnement_id IS NULL AND sponsoring_id IS NULL) OR
    (sponsoring_id IS NOT NULL AND abonnement_id IS NULL AND paiement_vue_id IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 14 · sponsorings (RG19) ----------
CREATE TABLE sponsorings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  etablissement_id BIGINT UNSIGNED NOT NULL,
  niveau ENUM('premium','gold','silver') NOT NULL,
  ville_id BIGINT UNSIGNED NULL,
  categorie VARCHAR(60) NULL,
  mot_cle VARCHAR(80) NULL,
  debut DATE NOT NULL, fin DATE NOT NULL,
  tarif_mad DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_spo_rotation (niveau, ville_id, debut, fin),
  CONSTRAINT fk_spo_eta FOREIGN KEY (etablissement_id) REFERENCES etablissements(id) ON DELETE CASCADE,
  CONSTRAINT fk_spo_ville FOREIGN KEY (ville_id) REFERENCES villes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- FK différée factures→sponsorings ----------
ALTER TABLE factures ADD CONSTRAINT fk_fac_spo FOREIGN KEY (sponsoring_id) REFERENCES sponsorings(id) ON DELETE SET NULL;

-- ---------- 15 · prospects (RG17) ----------
CREATE TABLE prospects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  etablissement_id BIGINT UNSIGNED NULL,
  commercial_id BIGINT UNSIGNED NULL,
  etablissement_nom VARCHAR(180) NOT NULL,
  ville VARCHAR(100) NULL,
  type_vise VARCHAR(40) NULL,
  contact_nom VARCHAR(120) NOT NULL,
  contact_fonction VARCHAR(100) NULL,
  telephone VARCHAR(30) NOT NULL,
  email VARCHAR(160) NULL,
  formule_visee VARCHAR(40) NULL,
  message TEXT NULL,
  source ENUM('formulaire','telephone','manuel') NOT NULL DEFAULT 'formulaire',
  statut_pipeline ENUM('nouveau','a_contacter','chaud','relance','transforme','perdu') NOT NULL DEFAULT 'nouveau',
  cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pros_pipeline (statut_pipeline, commercial_id),
  CONSTRAINT fk_pros_eta FOREIGN KEY (etablissement_id) REFERENCES etablissements(id) ON DELETE SET NULL,
  CONSTRAINT fk_pros_com FOREIGN KEY (commercial_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 16 · relances (RG17) ----------
CREATE TABLE relances (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  prospect_id BIGINT UNSIGNED NOT NULL,
  commercial_id BIGINT UNSIGNED NOT NULL,
  note TEXT NULL,
  prevue_le TIMESTAMP NULL,
  effectuee_le TIMESTAMP NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_rel_pros FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
  CONSTRAINT fk_rel_com FOREIGN KEY (commercial_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 17 · commissions (RG18) ----------
CREATE TABLE commissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  facture_id BIGINT UNSIGNED NOT NULL,
  commercial_id BIGINT UNSIGNED NOT NULL,
  taux_pct DECIMAL(4,1) NOT NULL,
  montant_mad DECIMAL(10,2) NOT NULL,
  statut ENUM('a_valider','validee','reglee') NOT NULL DEFAULT 'a_valider',
  validee_par BIGINT UNSIGNED NULL,
  validee_le TIMESTAMP NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_com_fac FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE,
  CONSTRAINT fk_com_com FOREIGN KEY (commercial_id) REFERENCES users(id),
  CONSTRAINT fk_com_val FOREIGN KEY (validee_par) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 18 · propositions_fiche (RG20) ----------
CREATE TABLE propositions_fiche (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  etablissement_id BIGINT UNSIGNED NOT NULL,
  proposee_par BIGINT UNSIGNED NOT NULL,
  champs_modifies JSON NOT NULL,
  statut ENUM('en_attente','validee','rejetee') NOT NULL DEFAULT 'en_attente',
  decision_motif VARCHAR(200) NULL,
  validee_par BIGINT UNSIGNED NULL,
  proposee_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  traitee_le TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_prop_fiche (etablissement_id, statut),
  CONSTRAINT fk_prop_eta FOREIGN KEY (etablissement_id) REFERENCES etablissements(id) ON DELETE CASCADE,
  CONSTRAINT fk_prop_par FOREIGN KEY (proposee_par) REFERENCES users(id),
  CONSTRAINT fk_prop_val FOREIGN KEY (validee_par) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 19 · permissions (RG05) ----------
CREATE TABLE permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  portee ENUM('fiches','contacts','avis') NOT NULL,
  accordee_par BIGINT UNSIGNED NOT NULL,
  accordee_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoquee_le TIMESTAMP NULL,
  PRIMARY KEY (id), UNIQUE KEY uq_perm_user_portee (user_id, portee),
  CONSTRAINT fk_perm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_perm_par FOREIGN KEY (accordee_par) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 20 · notifications ----------
CREATE TABLE notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type ENUM('echeance_abonnement','plafond_vue_atteint','demande','moderation','proposition_fiche') NOT NULL,
  contenu VARCHAR(255) NOT NULL,
  canal ENUM('in_app','email') NOT NULL,
  envoyee_le TIMESTAMP NULL,
  lue_le TIMESTAMP NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 21 · journal_audits (RG15) ----------
CREATE TABLE journal_audits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  action VARCHAR(60) NOT NULL,
  cible_type VARCHAR(60) NOT NULL,
  cible_id BIGINT UNSIGNED NOT NULL,
  details JSON NULL,
  adresse_ip VARCHAR(45) NULL,
  cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_cible (cible_type, cible_id),
  KEY idx_audit_user (user_id, cree_le),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 22 · parametres_facturation ----------
CREATE TABLE parametres_facturation (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cle VARCHAR(60) NOT NULL,
  valeur VARCHAR(40) NOT NULL,
  libelle VARCHAR(160) NOT NULL,
  modifie_par BIGINT UNSIGNED NULL,
  maj_le TIMESTAMP NULL,
  PRIMARY KEY (id), UNIQUE KEY uq_param_cle (cle),
  CONSTRAINT fk_param_user FOREIGN KEY (modifie_par) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 23 · leads (Avenant 1 — RG21, RG22, RG23) ----------
CREATE TABLE leads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  etablissement_id BIGINT UNSIGNED NOT NULL,
  demande_contact_id BIGINT UNSIGNED NULL,
  cree_par BIGINT UNSIGNED NULL,
  candidat_nom VARCHAR(120) NOT NULL,
  pour_qui ENUM('soi','enfant') NOT NULL DEFAULT 'enfant',
  tel VARCHAR(30) NOT NULL,
  whatsapp TINYINT(1) NOT NULL DEFAULT 0,
  email VARCHAR(160) NULL,
  ville VARCHAR(100) NULL,
  cycle VARCHAR(60) NULL,
  niveau VARCHAR(80) NULL,
  budget_min INT UNSIGNED NULL, budget_max INT UNSIGNED NULL,
  urgence ENUM('imminente','semaine','mois','rentree','flexible') NOT NULL DEFAULT 'flexible',
  source ENUM('ecoles360','whatsapp','appel','reseaux','google','recommandation','salon','autre') NOT NULL,
  fiche_besoin JSON NULL,
  score TINYINT UNSIGNED NOT NULL DEFAULT 0,
  statut_pipeline ENUM('nouveau','contacte','qualifie','proposition_envoyee','inscrit','perdu') NOT NULL DEFAULT 'nouveau',
  raison_perte VARCHAR(120) NULL,
  acompte_mad DECIMAL(10,2) NULL,
  converti_le TIMESTAMP NULL,
  cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_lead_kanban (etablissement_id, statut_pipeline),
  KEY idx_lead_chauds (etablissement_id, score),
  CONSTRAINT fk_lead_eta FOREIGN KEY (etablissement_id) REFERENCES etablissements(id) ON DELETE CASCADE,
  CONSTRAINT fk_lead_dem FOREIGN KEY (demande_contact_id) REFERENCES demande_contacts(id) ON DELETE SET NULL,
  CONSTRAINT fk_lead_par FOREIGN KEY (cree_par) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_lead_score CHECK (score BETWEEN 0 AND 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- 24 · lead_suivis (Avenant 1 — RG21) ----------
CREATE TABLE lead_suivis (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lead_id BIGINT UNSIGNED NOT NULL,
  auteur_id BIGINT UNSIGNED NULL,
  type ENUM('commentaire','relance') NOT NULL,
  note TEXT NULL,
  prevue_le TIMESTAMP NULL,
  effectuee_le TIMESTAMP NULL,
  cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_suivi_timeline (lead_id, cree_le),
  KEY idx_suivi_relances (prevue_le),
  CONSTRAINT fk_suivi_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  CONSTRAINT fk_suivi_auteur FOREIGN KEY (auteur_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
--  DONNÉES — référentiels (tous environnements) + démonstration (dev/recette)
-- =====================================================================

-- users (mots de passe démo hachés)
INSERT INTO users (id, name, email, email_verified_at, password, role, statut) VALUES
(1,'Direction écoles360','direction@ecoles360.com',NOW(),'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin','actif'),
(2,'Sara Idrissi','sara.s@ecoles360.com',NOW(),'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','secretaire','actif'),
(3,'Lycée Al Massira','contact@almassira.ma',NOW(),'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','etablissement','actif'),
(4,'Yassine Bennani','yassine.b@ecoles360.com',NOW(),'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','secretaire','actif'),
(5,'Khalid Amrani','khalid.a@ecoles360.com',NOW(),'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','secretaire','suspendu');

-- villes (RG01 — 12 villes couvertes)
INSERT INTO villes (id, nom, slug, region) VALUES
(1,'Casablanca','casablanca','Casablanca-Settat'),
(2,'Rabat','rabat','Rabat-Salé-Kénitra'),
(3,'Fès','fes','Fès-Meknès'),
(4,'Marrakech','marrakech','Marrakech-Safi'),
(5,'Tanger','tanger','Tanger-Tétouan-Al Hoceïma'),
(6,'Kénitra','kenitra','Rabat-Salé-Kénitra'),
(7,'Agadir','agadir','Souss-Massa'),
(8,'Meknès','meknes','Fès-Meknès'),
(9,'Oujda','oujda','Oriental'),
(10,'Tétouan','tetouan','Tanger-Tétouan-Al Hoceïma'),
(11,'Salé','sale','Rabat-Salé-Kénitra'),
(12,'El Jadida','el-jadida','Casablanca-Settat');

-- niveau_filieres (RG02 — référentiel niveaux + filières)
INSERT INTO niveau_filieres (id, libelle, categorie) VALUES
(1,'Éveil','niveau'),
(2,'Maternelle','niveau'),
(3,'Primaire','niveau'),
(4,'Collège','niveau'),
(5,'Lycée','niveau'),
(6,'Supérieur','niveau'),
(7,'BTS','niveau'),
(8,'Sciences','filiere'),
(9,'Économie','filiere'),
(10,'Lettres','filiere'),
(11,'Langues','filiere'),
(12,'Bilingue','filiere'),
(13,'Mission française','filiere'),
(14,'Montessori','filiere'),
(15,'Sport','filiere'),
(16,'Informatique','filiere'),
(17,'Droit','filiere'),
(18,'Gestion','filiere');

-- parametres_facturation (constantes globales §5 — aucun tarif établissement)
INSERT INTO parametres_facturation (cle, valeur, libelle) VALUES
('tva_pct','20','Taux de TVA appliqué à toute facture'),
('duree_essai_gratuit_jours','30','Durée de l''essai gratuit toutes options (RG13)'),
('remise_annuelle_pct','10','Remise si abonnement annuel réglé en une fois (RG11)'),
('delai_rappel_echeance_jours','7','Délai de rappel avant échéance d''abonnement (J-7, RG14)'),
('purge_traces_mois','12','Anonymisation / purge des traces (loi 09-08, CNDP)');

-- etablissements (20 fiches des maquettes)
INSERT INTO etablissements (id, ville_id, proprietaire_user_id, slug, nom, type, statut, quartier, tel, whatsapp, email, budget_min, budget_max, note_moy, nb_avis, source, sponsorise, valide_le, cree_le) VALUES
(1,1,3,'lycee-al-massira-1','Lycée Al Massira','lycee','validee','Maârif','+2125210 00 07','+2126100007','contact@lyceealmassira1.ma',2500,3500,4.8,142,'direct',1,NOW(),NOW()),
(2,2,NULL,'institut-lumiere-2','Institut Lumière','college','validee','Agdal','+2125210 00 14','+2126100014','contact@institutlumiere2.ma',1800,2600,4.6,98,'direct',1,NOW(),NOW()),
(3,3,NULL,'universite-atlas-3','Université Atlas','universite','validee','Saïss','+2125210 00 21','+2126100021','contact@universiteatlas3.ma',32000,48000,4.7,211,'direct',1,NOW(),NOW()),
(4,1,NULL,'groupe-scolaire-avenir-4','Groupe Scolaire Avenir','primaire','validee','Gauthier','+2125210 00 28','+2126100028','contact@groupescolaireavenir.ma',1600,2400,4.5,76,'direct',1,NOW(),NOW()),
(5,1,NULL,'lycee-la-residence-5','Lycée La Résidence','lycee','validee','Californie','+2125210 00 35','+2126100035','contact@lyceelaresidence5.ma',3000,4200,4.9,188,'direct',0,NOW(),NOW()),
(6,1,NULL,'creche-les-petits-genies-6','Crèche Les Petits Génies','creche','validee','Bourgogne','+2125210 00 42','+2126100042','contact@crechelespetitsgenie.ma',1200,1800,4.7,54,'direct',0,NOW(),NOW()),
(7,2,NULL,'college-ibn-sina-7','Collège Ibn Sina','college','validee','Hay Riad','+2125210 00 49','+2126100049','contact@collegeibnsina7.ma',1500,2200,4.4,67,'open_data',0,NOW(),NOW()),
(8,1,NULL,'ecole-montessori-casa-8','École Montessori Casa','primaire','validee','Ain Diab','+2125210 00 56','+2126100056','contact@ecolemontessoricasa8.ma',2200,3000,4.8,91,'direct',0,NOW(),NOW()),
(9,4,NULL,'lycee-moliere-9','Lycée Molière','lycee','validee','Guéliz','+2125210 00 63','+2126100063','contact@lyceemoliere9.ma',2800,3800,4.6,120,'direct',0,NOW(),NOW()),
(10,3,NULL,'universite-privee-de-fes-10','Université Privée de Fès','universite','validee','Centre','+2125210 00 70','+2126100070','contact@universitepriveedefe.ma',24000,36000,4.3,143,'open_data',0,NOW(),NOW()),
(11,1,NULL,'centre-digital-skills-11','Centre Digital Skills','formation','validee','Maârif','+2125210 00 77','+2126100077','contact@centredigitalskills1.ma',5000,8000,4.5,88,'direct',1,NOW(),NOW()),
(12,2,NULL,'creche-arc-en-ciel-12','Crèche Arc-en-Ciel','creche','validee','Souissi','+2125210 00 84','+2126100084','contact@crechearcenciel12.ma',1400,2000,4.6,42,'direct',0,NOW(),NOW()),
(13,5,NULL,'ecole-les-oliviers-13','École Les Oliviers','primaire','validee','Centre','+2125210 00 91','+2126100091','contact@ecolelesoliviers13.ma',900,1400,4.2,38,'open_data',0,NOW(),NOW()),
(14,1,NULL,'college-al-khawarizmi-14','Collège Al Khawarizmi','college','validee','Bourgogne','+2125210 00 98','+2126100098','contact@collegealkhawarizmi1.ma',1600,2300,4.5,73,'direct',0,NOW(),NOW()),
(15,2,NULL,'lycee-descartes-15','Lycée Descartes','lycee','validee','Hassan','+2125210 01 05','+2126100105','contact@lyceedescartes15.ma',2900,3900,4.7,156,'direct',0,NOW(),NOW()),
(16,1,NULL,'universite-horizon-16','Université Horizon','universite','validee','Californie','+2125210 01 12','+2126100112','contact@universitehorizon16.ma',30000,42000,4.4,97,'direct',0,NOW(),NOW()),
(17,4,NULL,'centre-proskills-17','Centre ProSkills','formation','validee','Guéliz','+2125210 01 19','+2126100119','contact@centreproskills17.ma',3500,6000,4.3,51,'open_data',0,NOW(),NOW()),
(18,6,NULL,'groupe-scolaire-el-yakada-18','Groupe Scolaire El Yakada','primaire','en_attente','Centre','+2125210 01 26','+2126100126','contact@groupescolaireelyaka.ma',800,1300,4.1,29,'open_data',0,NULL,NOW()),
(19,4,NULL,'college-bilingue-atlas-19','Collège Bilingue Atlas','college','validee','Hivernage','+2125210 01 33','+2126100133','contact@collegebilingueatlas.ma',1900,2700,4.6,64,'direct',0,NOW(),NOW()),
(20,5,NULL,'creche-doudou-20','Crèche Doudou','creche','validee','Iberia','+2125210 01 40','+2126100140','contact@crechedoudou20.ma',1100,1700,4.5,36,'direct',0,NOW(),NOW());

-- etablissement_niveau (filières / niveaux rattachés)
INSERT INTO etablissement_niveau (etablissement_id, niveau_id) VALUES
(1,8),
(1,9),
(2,10),
(2,11),
(3,8),
(3,9),
(4,12),
(4,15),
(5,13),
(5,8),
(6,1),
(6,14),
(7,8),
(7,16),
(8,14),
(8,12),
(9,13),
(9,10),
(10,9),
(10,17),
(11,16),
(11,11),
(12,1),
(12,12),
(13,12),
(14,8),
(14,15),
(15,13),
(15,8),
(16,9),
(16,16),
(17,11),
(17,18),
(18,8),
(19,12),
(19,11),
(20,1);

-- photos (RG16 — 1 photo par fiche gratuite)
INSERT INTO photos (etablissement_id, chemin, ordre, alt) VALUES
(1,'etablissements/lycee-al-massira-1.jpg',0,'Lycée Al Massira'),
(2,'etablissements/institut-lumiere-2.jpg',0,'Institut Lumière'),
(3,'etablissements/universite-atlas-3.jpg',0,'Université Atlas'),
(4,'etablissements/groupe-scolaire-avenir-4.jpg',0,'Groupe Scolaire Avenir'),
(5,'etablissements/lycee-la-residence-5.jpg',0,'Lycée La Résidence'),
(6,'etablissements/creche-les-petits-genies-6.jpg',0,'Crèche Les Petits Génies'),
(7,'etablissements/college-ibn-sina-7.jpg',0,'Collège Ibn Sina'),
(8,'etablissements/ecole-montessori-casa-8.jpg',0,'École Montessori Casa'),
(9,'etablissements/lycee-moliere-9.jpg',0,'Lycée Molière'),
(10,'etablissements/universite-privee-de-fes-10.jpg',0,'Université Privée de Fès'),
(11,'etablissements/centre-digital-skills-11.jpg',0,'Centre Digital Skills'),
(12,'etablissements/creche-arc-en-ciel-12.jpg',0,'Crèche Arc-en-Ciel'),
(13,'etablissements/ecole-les-oliviers-13.jpg',0,'École Les Oliviers'),
(14,'etablissements/college-al-khawarizmi-14.jpg',0,'Collège Al Khawarizmi'),
(15,'etablissements/lycee-descartes-15.jpg',0,'Lycée Descartes'),
(16,'etablissements/universite-horizon-16.jpg',0,'Université Horizon'),
(17,'etablissements/centre-proskills-17.jpg',0,'Centre ProSkills'),
(18,'etablissements/groupe-scolaire-el-yakada-18.jpg',0,'Groupe Scolaire El Yakada'),
(19,'etablissements/college-bilingue-atlas-19.jpg',0,'Collège Bilingue Atlas'),
(20,'etablissements/creche-doudou-20.jpg',0,'Crèche Doudou');

-- permissions (RG05 — Sara Idrissi : fiches + contacts + avis ; Yassine : fiches + contacts)
INSERT INTO permissions (user_id, portee, accordee_par) VALUES
(2,'fiches',1),
(2,'contacts',1),
(2,'avis',1),
(4,'fiches',1),
(4,'contacts',1);

-- abonnement annuel Al Massira (−10 %), sponsoring premium, facture payée F2026-000612
INSERT INTO abonnements (id, etablissement_id, formule, tarif_mad, remise_pct, debut, echeance, statut) VALUES
(1,1,'annuel',24000.00,10.0,'2026-01-01','2026-12-31','actif');
INSERT INTO sponsorings (id, etablissement_id, niveau, ville_id, categorie, debut, fin, tarif_mad) VALUES
(1,1,'premium',1,'lycee','2026-01-01','2026-06-30',6000.00);
INSERT INTO factures (id, etablissement_id, numero, objet, abonnement_id, montant_ht, tva, total_ttc, statut_paiement, emise_le, payee_le) VALUES
(1,1,'F2026-000612','Abonnement annuel 2026-2027 (−10 %)',1,21600.00,4320.00,25920.00,'payee','2026-01-05 09:00:00','2026-01-06 11:30:00');

-- avis (Al Massira : publiés vérifiés, un en attente, un signalé)
INSERT INTO avis (id, etablissement_id, auteur_nom, auteur_contact, note, commentaire, statut, verifie, depose_le) VALUES
(1,1,'Karima B.','+2126612•••••',5,'Excellent encadrement, ma fille s''y épanouit. Équipe à l''écoute.','publie',1,'2026-05-20 10:00:00'),
(2,1,'Younes T.','younes.t@example.ma',5,'Très bon niveau en sciences, locaux modernes. Je recommande.','publie',1,'2026-05-28 14:20:00'),
(3,1,'Hanane M.','+2126655•••••',4,'Bon lycée dans l''ensemble, communication perfectible.','en_attente',1,'2026-06-30 09:10:00'),
(4,1,'Anonyme','contact@spam.example',1,'Message promotionnel hors sujet.','en_attente',0,'2026-07-01 22:05:00');
INSERT INTO signalements (avis_id, motif, contact, statut) VALUES
(4,'Contenu promotionnel / hors sujet','moderation@ecoles360.com','nouveau');

-- demande_contacts (RG09 — 3 canaux)
INSERT INTO demande_contacts (id, etablissement_id, parent_nom, parent_tel, message, canal, statut, consentement, recue_le) VALUES
(1,1,'Yasmine El Amrani','+212661234567','Bonjour, je souhaite des informations sur les inscriptions 2026-2027 en 1re année collège.','formulaire','nouvelle',1,'2026-07-02 08:30:00'),
(2,1,'Karim Bensaid','+212662345678',NULL,'appel','en_cours',1,'2026-07-03 11:15:00'),
(3,1,'Salma Cherkaoui','+212663456789','Places disponibles en Terminale Sciences ?','whatsapp','traitee',1,'2026-06-28 16:40:00');

-- leads (Avenant 1 — 8 leads du kanban, rattachés à Al Massira)
INSERT INTO leads (etablissement_id, cree_par, candidat_nom, pour_qui, tel, whatsapp, email, ville, cycle, niveau, budget_min, budget_max, urgence, source, score, statut_pipeline) VALUES
(1,1,'Yasmine El Amrani','enfant','+212661234567',1,'yasmine.a@example.ma','Casablanca','Collège','5e',1800,2600,'rentree','ecoles360',9,'nouveau'),
(1,2,'Karim Bensaid','enfant','+212662345678',0,NULL,'Casablanca','Lycée','2nde',2500,3500,'semaine','whatsapp',8,'contacte'),
(1,3,'Salma Cherkaoui','enfant','+212663456789',1,'salma.c@example.ma','Casablanca','Lycée','Terminale',3000,4000,'imminente','appel',9,'qualifie'),
(1,NULL,'Rachid Belkadi','enfant','+212664567890',0,NULL,'Mohammedia','Collège','6e',1500,2200,'mois','reseaux',5,'proposition_envoyee'),
(1,NULL,'Nadia Alaoui','enfant','+212665678901',1,'nadia.a@example.ma','Casablanca','Primaire','CE2',1600,2400,'rentree','google',6,'contacte'),
(1,NULL,'Hamza Idrissi','enfant','+212666789012',1,NULL,'Casablanca','Lycée','1re',2800,3800,'flexible','recommandation',4,'nouveau'),
(1,2,'Fatima-Zahra Berrada','enfant','+212667890123',1,'fz.berrada@example.ma','Casablanca','Collège','4e',1800,2700,'semaine','ecoles360',7,'qualifie'),
(1,NULL,'Mohammed Tazi','enfant','+212668901234',0,NULL,'Casablanca','Lycée','Terminale',3200,4200,'imminente','salon',2,'perdu');
INSERT INTO lead_suivis (lead_id, auteur_id, type, note, prevue_le, effectuee_le) VALUES
(2,2,'commentaire','Premier contact téléphonique établi, parent intéressé.',NULL,'2026-07-03 12:00:00'),
(2,2,'relance','Rappeler pour fixer une visite.','2026-07-10 10:00:00',NULL),
(3,3,'commentaire','Dossier complet reçu, en attente de décision.',NULL,'2026-07-04 09:30:00');

-- prospects (RG17 — pipeline commercial ; Al Massira déjà transformé)
INSERT INTO prospects (etablissement_id, commercial_id, etablissement_nom, ville, type_vise, contact_nom, contact_fonction, telephone, email, formule_visee, source, statut_pipeline) VALUES
(1,1,'Lycée Al Massira','Casablanca','lycee','M. Alaoui','Directeur','+212522000000','contact@almassira.ma','annuel','manuel','transforme'),
(NULL,1,'Institut Andalous','Rabat','college','Mme Fassi','Directrice','+212537111222','contact@andalous.ma','mensuel','formulaire','nouveau'),
(NULL,1,'Groupe Ennour','Marrakech','primaire','M. Sbai','Gérant','+212524333444',NULL,'essai_gratuit','telephone','a_contacter');

SET FOREIGN_KEY_CHECKS = 1;
-- fin du dump
