-- Rubriques de la FAQ publique (maquette « Questions fréquentes » : deux
-- rubriques, « Pour les parents » et « Pour les établissements »).
-- Le défaut range les questions déjà saisies dans la première rubrique plutôt
-- que dans une rubrique vide : une FAQ existante reste affichable telle quelle.
ALTER TABLE `faq_items`
  ADD COLUMN `groupe` VARCHAR(80) NOT NULL DEFAULT 'Pour les parents' AFTER `reponse`;
