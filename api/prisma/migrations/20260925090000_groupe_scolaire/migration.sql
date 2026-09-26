-- Groupes scolaires : plusieurs cycles sous une même enseigne.
--
-- Au Maroc, la plupart des établissements privés accueillent l'enfant de la
-- crèche au lycée. La maquette le montre par un bandeau « Établissement
-- multi-cycles » et des puces qui ouvrent la fiche de chaque cycle.
--
-- Chaque cycle reste une fiche à part : filières, tarifs, horaires et avis
-- d'une crèche n'ont rien à voir avec ceux d'un lycée.
CREATE TABLE `groupes_scolaires` (
  `id`      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nom`     VARCHAR(180) NOT NULL,
  `slug`    VARCHAR(200) NOT NULL,
  `cree_le` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `groupes_scolaires_slug_key` (`slug`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

ALTER TABLE `etablissements`
  ADD COLUMN `groupe_id` BIGINT UNSIGNED NULL AFTER `nom`,
  ADD INDEX `idx_eta_groupe` (`groupe_id`),
  ADD CONSTRAINT `fk_eta_groupe`
    FOREIGN KEY (`groupe_id`) REFERENCES `groupes_scolaires` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
