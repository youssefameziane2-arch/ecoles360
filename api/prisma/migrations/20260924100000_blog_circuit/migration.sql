-- Circuit éditorial du blog (avenant 3, livrable 11 §3.5).
--
-- Motif rendu à l'auteur quand un article est refusé : sans lui, l'article
-- serait resoumis à l'identique et refusé une seconde fois.
--
-- L'activation du blog n'est PAS ici : `users.blog_actif` existe déjà depuis
-- le modèle initial (RG27), et la maquette l'attache elle aussi au compte et
-- non à l'établissement.
ALTER TABLE `articles`
  ADD COLUMN `motif_refus` VARCHAR(300) NULL AFTER `statut`;
