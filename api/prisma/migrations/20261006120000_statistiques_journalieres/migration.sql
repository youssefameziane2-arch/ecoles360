-- Agrégats d'audience — loi 09-08, livrable 10 §6.3.
--
-- ÉCRITE À LA MAIN, VOLONTAIREMENT. `prisma migrate diff` proposait en plus de
-- renommer la clé étrangère du groupe scolaire et de recréer l'index FULLTEXT :
-- du bruit cosmétique né de l'écart entre les conventions de nommage de Prisma
-- et le SQL écrit à la main des migrations précédentes. Les appliquer ferait
-- reconstruire un index FULLTEXT sur toute la table pour rien, et renommerait
-- une contrainte que le reste du projet désigne par son nom actuel.
--
-- Cette migration ne fait donc QUE ce qu'elle annonce : créer la table.

CREATE TABLE `statistiques_journalieres` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `etablissement_id` BIGINT UNSIGNED NOT NULL,
    `type` ENUM('appel', 'whatsapp', 'vue', 'vue_sponsorisee') NOT NULL,
    `jour` DATE NOT NULL,
    `total` INTEGER UNSIGNED NOT NULL DEFAULT 0,

    INDEX `idx_stat_jour`(`jour`),
    -- L'unicité rend la purge REJOUABLE : une seconde exécution sur la même
    -- journée met à jour la ligne au lieu d'en créer une seconde.
    UNIQUE INDEX `uq_stat_jour`(`etablissement_id`, `type`, `jour`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `statistiques_journalieres`
  ADD CONSTRAINT `fk_stat_etablissement`
  FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
