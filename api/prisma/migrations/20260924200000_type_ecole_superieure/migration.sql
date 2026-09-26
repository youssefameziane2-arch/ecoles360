-- Septième type d'établissement : « École supérieure » (RG02 amendé).
--
-- La maquette du site public distingue les grandes écoles (ingénierie,
-- commerce, santé) de l'université. Ce ne sont ni les mêmes cursus, ni les
-- mêmes concours, ni les mêmes tarifs : un parent qui cherche une école
-- d'ingénieurs ne veut pas voir les facultés.
--
-- La valeur est ajoutée AVANT `formation` pour que l'ordre de l'énumération
-- suive l'ordre d'affichage de la maquette (crèche → supérieur → formation).
ALTER TABLE `etablissements`
  MODIFY `type` ENUM(
    'creche',
    'primaire',
    'college',
    'lycee',
    'universite',
    'superieur',
    'formation'
  ) NOT NULL;
