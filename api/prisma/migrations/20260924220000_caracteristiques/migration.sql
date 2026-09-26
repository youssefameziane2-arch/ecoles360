-- Familles de caractéristiques : langue, activité, matière, cursus, domaine,
-- format de formation.
--
-- La table `niveau_filieres` est un référentiel générique de caractéristiques
-- rattachées à un établissement par `etablissement_niveaux`. Les filtres
-- dynamiques du site public (langues, activités, filières selon le type)
-- reposent dessus : une catégorie de plus, et aucune jointure nouvelle.
ALTER TABLE `niveau_filieres`
  MODIFY `categorie` ENUM(
    'niveau',
    'filiere',
    'langue',
    'activite',
    'matiere',
    'cursus',
    'domaine',
    'format'
  ) NOT NULL;

-- Unicité sur le COUPLE (libellé, catégorie) et non sur le libellé seul :
-- « Sport » est à la fois une filière et une activité parascolaire,
-- « Informatique » une filière et un domaine, « Français » une langue et une
-- matière. Ce sont des caractéristiques distinctes qui partagent un mot.
ALTER TABLE `niveau_filieres`
  DROP INDEX `niveau_filieres_libelle_key`,
  ADD UNIQUE INDEX `uk_caracteristique` (`libelle`, `categorie`),
  ADD INDEX `idx_caracteristique_cat` (`categorie`);
