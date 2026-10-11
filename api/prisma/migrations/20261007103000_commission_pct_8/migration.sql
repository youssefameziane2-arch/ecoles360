-- Taux de commission porté à 8 % — décision du client, 7 octobre 2026 (RG18).
--
-- Il valait zéro jusque-là, volontairement : aucun livrable ne fixait ce taux,
-- et l'inventer revenait à décider ce que touche un commercial. La Direction
-- l'a fixé ; cette migration l'applique aux bases déjà semées, que le semis ne
-- touche plus (`update: {}` — un re-seed ne doit jamais écraser une décision
-- de gestion).
--
-- INSERT PLUTÔT QU'UPDATE SEULE, et c'est la leçon de cette migration : une
-- base semée AVANT l'ajout du paramètre n'a pas la ligne du tout. Une simple
-- `UPDATE` n'y trouvait rien, le taux restait au repli de zéro, et aucune
-- commission n'aurait été créée — sans que rien ne le signale. C'est exactement
-- ce qui s'est produit sur la base de développement.
--
-- `ON DUPLICATE KEY` NE RELÈVE QUE LE ZÉRO. Si quelqu'un a déjà posé une autre
-- valeur depuis l'écran « Paramètres », elle est conservée : une migration de
-- données ne doit jamais défaire un geste humain plus récent qu'elle. La
-- rejouer ne change donc rien non plus.
--
-- Les commissions DÉJÀ ÉMISES ne sont pas recalculées, et c'est volontaire :
-- `Commission.taux_pct` garde le taux en vigueur au moment de la facture. Les
-- réécrire changerait rétroactivement ce qui est dû à quelqu'un.

INSERT INTO `parametres_facturation` (`cle`, `valeur`, `libelle`)
VALUES ('commission_pct', '8', 'Taux de commission du commercial apporteur (RG18)')
ON DUPLICATE KEY UPDATE `valeur` = IF(`valeur` = '0', '8', `valeur`);
