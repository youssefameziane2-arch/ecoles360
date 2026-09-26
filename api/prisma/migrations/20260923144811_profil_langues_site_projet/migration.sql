-- AlterTable
ALTER TABLE `etablissements` ADD COLUMN `langues` VARCHAR(160) NULL,
    ADD COLUMN `projet_pedagogique` TEXT NULL,
    ADD COLUMN `site_web` VARCHAR(200) NULL;
