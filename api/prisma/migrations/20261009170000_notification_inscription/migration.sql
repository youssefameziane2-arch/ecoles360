-- Type de notification « inscription » — B-46.
--
-- LE SEUL ÉVÉNEMENT COMMERCIAL DU PRODUIT N'ALERTAIT PERSONNE. Une école
-- remplit le formulaire public de référencement, un prospect naît en
-- « nouveau » dans le CRM (RG17), et rien ne le signale : ni cloche, ni
-- e-mail. Le seul indice était une pastille dans le menu, qu'il faut déjà
-- avoir pensé à regarder. Pour un annuaire dont le modèle est que les
-- établissements paient leur visibilité, c'est l'alerte la plus rentable du
-- lot qui manquait.
--
-- UNE VALEUR DE PLUS, PAS `demande` RÉUTILISÉE. `demande` désigne une demande
-- de CONTACT — un parent qui écrit à une école — et mène à l'écran des
-- établissements. Une inscription mène au CRM. Les confondre enverrait
-- l'administration sur le mauvais écran, avec la mauvaise icône, pour un
-- événement qui ne lui ressemble pas.
--
-- LES VALEURS EXISTANTES SONT RÉÉCRITES À L'IDENTIQUE dans le même ordre :
-- MySQL stocke un ENUM par son rang, et réordonner la liste réaffecterait en
-- silence le type de chaque ligne déjà écrite.

ALTER TABLE `notifications`
  MODIFY `type` ENUM(
    'echeance_abonnement',
    'plafond_vue_atteint',
    'demande',
    'moderation',
    'proposition_fiche',
    'inscription'
  ) NOT NULL;
