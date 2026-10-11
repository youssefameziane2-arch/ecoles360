-- Traces de recherche — B-40, tuiles « Recherches effectuées » et bloc
-- « Recherches par ville » des écrans d'administration.
--
-- UNE TABLE DÉDIÉE, PAS UNE VALEUR DE PLUS DANS `EvenementType`. Les deux
-- étaient possibles ; la seconde aurait obligé à rendre
-- `evenement_traces.etablissement_id` nullable — une recherche ne porte sur
-- aucune fiche —, donc à relâcher une contrainte NOT NULL qui protège
-- aujourd'hui toutes les autres traces. Et « Recherches par ville » a besoin
-- de la ville CHERCHÉE, que `evenement_traces` n'aurait eu aucun endroit où
-- mettre.
--
-- AUCUN TERME LIBRE N'EST CONSERVÉ, et c'est délibéré. La barre de recherche
-- accepte du texte ; une personne y tape parfois autre chose qu'un nom
-- d'école. Les écrans ne demandent que la ville et le type — les seuls
-- champs stockés. Ce qu'on ne garde pas ne fuit pas.
--
-- NI UTILISATEUR, NI ADRESSE IP. Une recherche est anonyme par construction :
-- la table compte des recherches, elle ne suit personne.
--
-- `ville_id` EN `SET NULL` plutôt qu'en cascade : supprimer une ville du
-- référentiel ne doit pas effacer l'historique des recherches qui la
-- visaient. La ligne reste, sans ville — le bloc « par ville » l'ignore, les
-- totaux restent justes.

CREATE TABLE `traces_recherche` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ville_id`     BIGINT UNSIGNED NULL,
  `type`         VARCHAR(40)  NULL,
  `nb_resultats` INT UNSIGNED NOT NULL DEFAULT 0,
  `survenu_le`   TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_rech_periode` (`survenu_le`),
  INDEX `idx_rech_ville` (`ville_id`, `survenu_le`),
  CONSTRAINT `fk_rech_ville` FOREIGN KEY (`ville_id`) REFERENCES `villes` (`id`) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
