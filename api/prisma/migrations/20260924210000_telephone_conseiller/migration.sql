-- Ligne directe des conseillers commerciaux.
--
-- La bannière d'aide du site public annonce « un conseiller vous rappelle »
-- avec un nom et un numéro. Ils viennent du compte commercial, ce qui permet
-- de répartir les appels entre plusieurs conseillers sans toucher au code.
--
-- Nullable : seuls les comptes `commercial` en portent un.
ALTER TABLE `users`
  ADD COLUMN `telephone` VARCHAR(30) NULL AFTER `etablissement_rattache_id`;
