-- Catégories d'articles — onglet « Catégories » de l'écran « Contenu du site ».
--
-- `Article.categorie` EST ET RESTE UNE CHAÎNE. La transformer en clé étrangère
-- aurait obligé à migrer toutes les lignes existantes et à décider, pour
-- chacune, vers quelle catégorie pointer — un travail de reprise de données
-- pour un bénéfice nul : rien dans le produit ne joint sur la catégorie, on
-- filtre dessus. Cette table est donc un RÉFÉRENTIEL de ce que l'écran
-- propose, pas une contrainte sur ce qui existe. Retirer une catégorie ne
-- déclasse aucun article : elle cesse seulement d'être offerte à la rédaction.
--
-- PAS DE COLONNE `slug`, et c'est délibéré. Une première version en posait une,
-- ce qui obligeait à replier les accents en SQL — MySQL 8 ne sait pas le faire,
-- et la liste de REPLACE imbriqués qui en résultait était fausse d'un
-- argument. Or RIEN NE LIT CE SLUG : le blog filtre sur le libellé. Le jour où
-- une URL en aura besoin, `common/texte/slug.ts` le fabriquera côté
-- applicatif, là où la normalisation NFD existe déjà. `libelle` est unique, ce
-- qui suffit à empêcher les doublons.
--
-- ELLE EST PEUPLÉE DEPUIS LES ARTICLES EXISTANTS, et c'est la seule façon de
-- ne pas mentir. Une liste écrite en dur — même celle de la maquette, qui
-- propose « Conseils, Cursus, Pratique, Actualité, Établissement » — aurait
-- laissé hors liste les six catégories réellement utilisées en base. Un
-- administrateur aurait vu des articles classés dans des catégories que son
-- écran de gestion ignore.

CREATE TABLE `categories_articles` (
  `id`      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `libelle` VARCHAR(60)  NOT NULL,
  `ordre`   INT UNSIGNED NOT NULL DEFAULT 0,
  `cree_le` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_cat_article_libelle` (`libelle`)
) ENGINE = InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Reprise de l'existant, dans l'ordre alphabétique faute de mieux : l'écran
-- permet ensuite de remanier cet ordre.
INSERT INTO `categories_articles` (`libelle`, `ordre`)
SELECT `categorie`, 0
FROM (SELECT DISTINCT `categorie` FROM `articles` WHERE `categorie` <> '') AS existantes
ORDER BY `categorie`;
