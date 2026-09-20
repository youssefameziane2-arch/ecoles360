-- =============================================================================
--  écoles360 — contraintes CHECK
--  Livrable 10 §2 — invariants que le DSL Prisma ne sait pas exprimer
-- -----------------------------------------------------------------------------
--  Ces quatre contraintes sont la dernière ligne de défense : les services du
--  livrable 11 valident déjà les mêmes règles, et les DTO class-validator les
--  valident avant eux. Mais un import open data, une reprise de données ou une
--  requête d'exploitation contournent l'application — pas le moteur.
--
--  DIVERGENCE SIGNALÉE (docs/BACKLOG.md, B-13) — le livrable 10 §1 annonce un
--  « fichier SQL supplémentaire dans le même dossier de migration (prisma
--  migrate exécute tout *.sql présent) ». Prisma Migrate n'exécute QUE le
--  fichier `migration.sql` de chaque dossier ; un fichier voisin serait ignoré
--  en silence, et les contraintes n'existeraient jamais en base. Elles sont
--  donc portées par une migration dédiée, ce qui préserve l'intention du
--  livrable — des CHECK versionnés, appliqués par la même chaîne — sans
--  reposer sur un comportement que l'outil n'a pas.
-- =============================================================================

-- RG06 — une note d'avis vaut de 1 à 5.
ALTER TABLE `avis`
  ADD CONSTRAINT `chk_avis_note` CHECK (`note` BETWEEN 1 AND 5);

-- RG13, RG14 — l'essai gratuit est sans tarif ; toute autre formule en a un.
-- Un essai facturé, ou un abonnement payant sans prix, sont l'un et l'autre
-- des incohérences de facturation que rien ne rattraperait ensuite.
ALTER TABLE `abonnements`
  ADD CONSTRAINT `chk_abo_tarif` CHECK (
    (`formule` = 'essai_gratuit' AND `tarif_mad` IS NULL) OR
    (`formule` <> 'essai_gratuit' AND `tarif_mad` IS NOT NULL)
  );

-- RG14 — ORIGINE EXCLUSIVE : CONTRAINTE NON POSÉE, VOIR docs/BACKLOG.md, B-14.
--
-- Le livrable 10 §2.7 demande un CHECK garantissant qu une facture vient d un
-- abonnement, OU d un paiement à la vue, OU d un sponsoring — et déclare les
-- trois clés étrangères en ON DELETE SET NULL. MySQL 8 refuse la combinaison
-- (erreur 3823), et il a raison : si la suppression d un abonnement met
-- abonnement_id à NULL, la facture se retrouve SANS AUCUNE origine, ce que le
-- CHECK interdit. La contrainte se briserait d elle-même.
--
-- L invariant reste garanti à l écriture par FacturationService (livrable 11
-- §4). À arbitrer au lot de la facturation : passer les trois clés en
-- ON DELETE RESTRICT rendrait le CHECK posable ET empêcherait de supprimer un
-- abonnement déjà facturé — ce qui est de toute façon le comportement attendu
-- d un document conservé dix ans (RG14).

-- RG22 — le score d'un lead reste dans 0–10, y compris après un ajustement
-- manuel (±3 refusé s'il sort des bornes).
ALTER TABLE `leads`
  ADD CONSTRAINT `chk_lead_score` CHECK (`score` BETWEEN 0 AND 10);
