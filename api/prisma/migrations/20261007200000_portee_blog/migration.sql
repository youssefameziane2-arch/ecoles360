-- Quatrième portée déléguée : `blog` — décision du client, 7 octobre 2026.
--
-- La RG05 en posait trois : `fiches`, `contacts`, `avis`. Le client ajoute la
-- relecture du blog, et la formule exactement comme les autres : « c'est un
-- privilège que [l'admin] peut céder à la secrétaire lors de l'ajout ».
--
-- CE QU'ELLE OUVRE : voir les articles soumis, les approuver ou les refuser.
-- Approuver adopte au passage une catégorie inédite (B-50) — une secrétaire à
-- qui l'on confie cette portée enrichit donc le référentiel que toute la
-- rédaction se verra proposer. C'est voulu : c'est le même geste que celui de
-- l'administrateur, pas un sous-ensemble.
--
-- ADDITIF : ajouter une valeur en fin d'énumération MySQL ne réécrit aucune
-- ligne et ne verrouille pas la table. Aucune permission existante ne change,
-- et personne ne reçoit cette portée par défaut — un secrétariat déjà créé
-- continue exactement comme avant.

ALTER TABLE `permissions`
  MODIFY `portee` ENUM('fiches', 'contacts', 'avis', 'blog') NOT NULL;
