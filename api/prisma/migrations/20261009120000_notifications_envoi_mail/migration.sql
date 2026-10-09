-- File d'envoi des courriels — B-53.
--
-- POURQUOI DEUX COLONNES DE PLUS SUR UNE TABLE QUI MARCHAIT. Le canal
-- `in_app` n'avait besoin de rien : une notification écrite EST une
-- notification délivrée, puisqu'elle s'affiche à la prochaine ouverture du
-- centre. `envoyee_le` était donc posé à l'écriture et ne servait qu'à
-- dater la ligne.
--
-- Le canal `email` rompt cette équivalence. Un courriel est écrit maintenant
-- et part plus tard, parce qu'on ne tient pas un serveur SMTP ouvert au
-- milieu d'une transaction de base : un `ROLLBACK` après l'envoi laisserait
-- un message parti pour une demande qui n'existe pas. La ligne est donc
-- créée avec `envoyee_le` NUL, et un expéditeur la reprend ensuite.
--
-- `cree_le` EST CE QUI MANQUAIT POUR PILOTER CETTE FILE. Sans date de
-- création, « les courriels en attente depuis plus de deux heures » ne
-- s'écrit pas, et la cloche n'avait rien à afficher sous une notification
-- jamais envoyée. Les lignes existantes la reçoivent depuis `envoyee_le`
-- quand elles en ont une — leur vraie date — plutôt que l'instant de cette
-- migration.
--
-- `tentatives` BORNE L'ACHARNEMENT. Une adresse qui n'existe plus fait
-- échouer l'envoi à chaque passage ; sans compteur, l'expéditeur la
-- reprendrait toutes les minutes jusqu'à la fin des temps, et les vraies
-- erreurs se noieraient dans ce bruit.

ALTER TABLE `notifications`
  ADD COLUMN `cree_le`    TIMESTAMP(0)        NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `canal`,
  ADD COLUMN `tentatives` TINYINT UNSIGNED    NOT NULL DEFAULT 0 AFTER `envoyee_le`;

UPDATE `notifications` SET `cree_le` = `envoyee_le` WHERE `envoyee_le` IS NOT NULL;

-- L'expéditeur ne cherche QUE les courriels en attente. Sans cet index, il
-- balaierait toute la table à chaque minute — y compris les `in_app`, qui
-- sont et resteront l'écrasante majorité des lignes.
CREATE INDEX `idx_notif_a_envoyer` ON `notifications` (`canal`, `envoyee_le`, `tentatives`);
