-- =============================================================================
--  écoles360 — initialisation MySQL du poste de développement
--  Exécuté UNE SEULE FOIS, à la création du volume mysql_data
--  (mécanisme /docker-entrypoint-initdb.d de l'image mysql:8).
-- =============================================================================

-- Base de test (livrable 13 §1 : MySQL 8 réelle, jamais SQLite). Séparée de la
-- base de développement pour qu'une suite de tests ne puisse jamais effacer les
-- données de démonstration sur lesquelles on travaille.
CREATE DATABASE IF NOT EXISTS ecoles360_test
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON ecoles360_test.* TO 'ecoles360'@'%';

-- Bases « fantômes » de Prisma Migrate.
--
-- `prisma migrate dev` crée une base temporaire, y rejoue tout l'historique des
-- migrations et compare le résultat au schéma : c'est ainsi qu'il détecte une
-- dérive ou une migration éditée à la main. Sans le droit de la créer, la
-- commande échoue en P3014 et le développeur ne peut plus produire de migration.
--
-- Le droit est restreint au PRÉFIXE que Prisma utilise, plutôt qu'accordé sur
-- `*.*` : l'utilisateur applicatif ne gagne aucun pouvoir sur les autres bases.
-- Développement uniquement — en production, `prisma migrate deploy` applique
-- des migrations déjà écrites et n'a jamais besoin de base fantôme.
GRANT ALL PRIVILEGES ON `prisma_migrate_shadow_db%`.* TO 'ecoles360'@'%';

FLUSH PRIVILEGES;
