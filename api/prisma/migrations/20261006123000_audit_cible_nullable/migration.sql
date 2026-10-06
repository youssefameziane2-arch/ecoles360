-- `journal_audits.cible_id` devient nullable.
--
-- Les purges de la loi 09-08 (livrable 10 §6.3) journalisent leur exécution,
-- et une tâche qui anonymise un lot de demandes NE VISE AUCUNE LIGNE en
-- particulier. L'alternative aurait été d'y écrire 0 — un identifiant magique
-- que personne ne saurait relire dans deux ans, et qui pointerait vers une
-- ligne inexistante dans tout outil de jointure.
--
-- Changement ADDITIF : passer NOT NULL à NULL n'invalide aucune ligne
-- existante et ne demande aucune reprise de données.

ALTER TABLE `journal_audits` MODIFY `cible_id` BIGINT UNSIGNED NULL;
