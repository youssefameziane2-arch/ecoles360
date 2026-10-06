/**
 * Textes des trois pages légales — loi 09-08 (RG09).
 *
 * BASE RÉDIGÉE, PAS TEXTE VALIDÉ. Ces pages engagent l'éditeur du site devant
 * la loi : elles doivent être relues par un juriste avant toute mise en
 * ligne. Les passages « [À COMPLÉTER] » portent des faits que seul l'éditeur
 * connaît — raison sociale, RC, ICE, directeur de publication, hébergeur — et
 * le numéro de déclaration CNDP, qui suppose une démarche préalable.
 *
 * L'écran « Contenu du site » signale une page tant qu'il y reste un de ces
 * marqueurs, et le semis ne réécrit jamais une page déjà rédigée.
 *
 * CE QUI EST ÉCRIT ICI DÉCRIT LE SITE TEL QU'IL EST, pas un site type : pas
 * de traceur tiers, deux cookies seulement et uniquement si l'on se connecte,
 * des traces d'audience sans adresse IP ni identifiant de navigateur. Une
 * politique qui énumérerait des traitements inexistants serait aussi fausse
 * qu'une qui en omettrait.
 */
export const PAGES_LEGALES: Record<
  string,
  { titre: string; sections: { titre: string; corps: string }[] }
> = {
  'mentions-legales': {
    titre: 'Mentions légales',
    sections: [
      {
        titre: 'Éditeur du site',
        corps:
          "Le site ecoles360.com est édité par [À COMPLÉTER : raison sociale exacte], [À COMPLÉTER : forme juridique — SARL, SA, auto-entrepreneur…] au capital de [À COMPLÉTER] dirhams.\n\nSiège social : [À COMPLÉTER : adresse complète]\nRegistre du commerce (RC) : [À COMPLÉTER]\nIdentifiant commun de l'entreprise (ICE) : [À COMPLÉTER]\nIdentifiant fiscal (IF) : [À COMPLÉTER]\nTéléphone : [À COMPLÉTER]\nCourriel : contact@ecoles360.com",
      },
      {
        titre: 'Directeur de la publication',
        corps:
          '[À COMPLÉTER : nom et prénom de la personne responsable de la publication], en qualité de [À COMPLÉTER : fonction].\n\nLe directeur de la publication est responsable du contenu éditorial mis en ligne sur ecoles360.com.',
      },
      {
        titre: 'Hébergement',
        corps:
          "Le site est hébergé par [À COMPLÉTER : nom de l'hébergeur], [À COMPLÉTER : adresse de l'hébergeur].\n\nTéléphone : [À COMPLÉTER]",
      },
      {
        titre: 'Objet du site',
        corps:
          "écoles360 est un annuaire des établissements scolaires privés au Maroc. Il permet aux parents de rechercher, comparer et contacter des établissements, et aux établissements de présenter leur offre.\n\nLa consultation du site est gratuite pour les parents. Les établissements référencés souscrivent un abonnement payant pour y figurer ; les modalités de cet abonnement sont contractuelles et ne sont pas publiques.\n\nLes fiches d'établissement sont renseignées par les établissements eux-mêmes ou par nos équipes, et contrôlées avant publication. Les informations — tarifs, effectifs, niveaux, coordonnées — sont fournies à titre indicatif et peuvent évoluer. Elles ne constituent ni une offre contractuelle, ni un engagement de l'établissement concerné.",
      },
      {
        titre: 'Propriété intellectuelle',
        corps:
          "La structure du site, sa charte graphique, ses textes éditoriaux, son logo et sa base de données sont la propriété de l'éditeur et sont protégés par la loi n° 2-00 relative aux droits d'auteur et droits voisins.\n\nToute reproduction, extraction ou réutilisation substantielle du contenu du site, notamment par aspiration automatisée de l'annuaire, est interdite sans autorisation écrite préalable.\n\nLes noms, logos et photographies des établissements référencés restent la propriété de leurs titulaires respectifs et sont publiés avec leur accord ou sur leur demande.",
      },
      {
        titre: 'Responsabilité',
        corps:
          "L'éditeur met tout en œuvre pour que les informations publiées soient exactes et à jour, sans pouvoir le garantir. Les données relatives à un établissement émanent de cet établissement ; il lui appartient de les tenir à jour.\n\nAvant toute décision d'inscription, nous invitons les parents à vérifier directement auprès de l'établissement les informations qui les engagent — tarifs, niveaux ouverts, disponibilité, autorisations administratives.\n\nL'éditeur n'est pas partie aux relations qui se nouent entre un parent et un établissement, et ne saurait être tenu responsable de leur contenu ni de leurs suites.\n\nLe site peut comporter des liens vers des sites tiers, sur lesquels l'éditeur n'exerce aucun contrôle et dont il décline la responsabilité du contenu.",
      },
      {
        titre: 'Avis des parents',
        corps:
          "Les avis publiés sur les fiches émanent de visiteurs du site. Ils sont relus avant publication et peuvent être refusés s'ils sont injurieux, diffamatoires, manifestement faux ou sans rapport avec l'établissement concerné.\n\nUn avis publié engage son auteur. L'établissement concerné dispose d'un droit de réponse, publié sous l'avis.\n\nToute personne peut signaler un avis depuis la fiche concernée. Un signalement entraîne un réexamen.",
      },
      {
        titre: 'Contact',
        corps:
          "Pour toute question relative au site, à une fiche d'établissement ou à un avis publié :\n\ncontact@ecoles360.com\n\nPour les demandes relatives à vos données personnelles, voir la page « Politique de confidentialité ».",
      },
    ],
  },
  confidentialite: {
    titre: 'Politique de confidentialité',
    sections: [
      {
        titre: 'Responsable du traitement',
        corps:
          "Le responsable du traitement des données collectées sur ecoles360.com est [À COMPLÉTER : raison sociale], dont le siège est situé [À COMPLÉTER : adresse].\n\nContact : contact@ecoles360.com\n\nLa présente politique est établie conformément à la loi n° 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel, et aux délibérations de la Commission Nationale de contrôle de la protection des Données à caractère Personnel (CNDP).",
      },
      {
        titre: 'Données collectées',
        corps:
          "Nous ne collectons que les données nécessaires au fonctionnement du service. Concrètement :\n\n• Lorsque vous déposez un avis sur un établissement : votre nom ou pseudonyme, un moyen de vous joindre (adresse électronique ou téléphone) et le texte de votre avis.\n\n• Lorsque vous disposez d'un compte (établissement, secrétariat, commercial, administration) : votre nom, votre adresse électronique, votre numéro de téléphone le cas échéant, et un mot de passe que nous ne conservons jamais en clair.\n\n• Lorsque vous consultez une fiche : une trace d'audience est enregistrée pour l'établissement concerné (type d'interaction et date). Cette trace ne contient ni votre adresse IP, ni identifiant de navigateur, ni aucune donnée permettant de vous identifier.\n\nNous ne demandons jamais de donnée bancaire sur ce site, et n'en conservons aucune.",
      },
      {
        titre: 'Ce que nous ne faisons pas',
        corps:
          "Nous ne vendons, ne louons et n'échangeons aucune donnée personnelle.\n\nNous n'utilisons aucun outil de mesure d'audience tiers, aucun traceur publicitaire et aucun bouton de réseau social déposant un cookie. Le site ne charge aucun script de Google Analytics, de Meta ou d'un service équivalent.\n\nNous ne pratiquons aucun profilage, et aucune décision automatisée ne vous concernant n'est prise à partir de vos données.",
      },
      {
        titre: 'Finalités du traitement',
        corps:
          "Vos données sont traitées pour :\n\n• publier et modérer les avis déposés sur les établissements, et permettre à l'établissement concerné d'y répondre ;\n• vous joindre si un avis que vous avez déposé nécessite une vérification ;\n• permettre aux titulaires de comptes d'accéder à leur espace et de gérer leur fiche ;\n• produire des statistiques d'audience agrégées à destination des établissements référencés — nombre de consultations, de clics d'appel, sans aucune donnée individuelle ;\n• assurer la sécurité du service et conserver la trace des actes d'administration.",
      },
      {
        titre: 'Base légale et consentement',
        corps:
          "Le dépôt d'un avis et la création d'un compte reposent sur votre consentement, que vous donnez en soumettant le formulaire correspondant. Ce consentement est libre : vous pouvez consulter l'intégralité de l'annuaire sans jamais fournir la moindre donnée personnelle.\n\nLe traitement des données des titulaires de comptes repose sur l'exécution du contrat qui les lie à écoles360.\n\nLa conservation des traces d'administration et des pièces comptables repose sur nos obligations légales.",
      },
      {
        titre: 'Destinataires des données',
        corps:
          "Vos données sont accessibles aux seules personnes qui en ont besoin :\n\n• les équipes d'écoles360 chargées de la modération et de l'assistance ;\n• pour un avis, l'établissement concerné reçoit votre nom ou pseudonyme et le texte publié. Votre moyen de contact ne lui est jamais communiqué et n'est jamais affiché publiquement ;\n• notre hébergeur, pour les seuls besoins techniques de l'hébergement.\n\nAucune donnée n'est transférée à un tiers à des fins commerciales. Aucun transfert hors du Maroc n'est effectué en dehors de l'hébergement du site, dont le pays d'implantation est indiqué dans les mentions légales.",
      },
      {
        titre: 'Durée de conservation',
        corps:
          "• Avis publiés : conservés tant que la fiche de l'établissement existe. Le moyen de contact de l'auteur est supprimé lorsqu'il n'est plus nécessaire à la vérification.\n• Demandes de contact et sollicitations : anonymisées au terme de douze mois.\n• Traces d'audience : agrégées au terme de douze mois ; elles ne portent alors plus aucune donnée individuelle.\n• Comptes : conservés pendant la durée de la relation, puis supprimés.\n• Journal des actes d'administration : trois ans.\n• Pièces comptables (factures) : dix ans, conformément à la législation fiscale.",
      },
      {
        titre: 'Vos droits',
        corps:
          "Conformément à la loi 09-08, vous disposez d'un droit d'accès, de rectification et d'opposition sur les données qui vous concernent.\n\nPour les exercer, écrivez à contact@ecoles360.com en précisant votre demande. Nous vous répondrons dans un délai de trente jours. Une pièce justifiant de votre identité pourra vous être demandée si un doute subsiste — elle ne sera pas conservée au-delà du traitement de votre demande.\n\nVous pouvez demander la suppression d'un avis que vous avez déposé en nous écrivant depuis l'adresse ou le numéro que vous aviez fourni.\n\nSi vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNDP : www.cndp.ma",
      },
      {
        titre: 'Déclaration CNDP',
        corps:
          "[À COMPLÉTER — obligatoire avant la mise en ligne]\n\nLe traitement des données personnelles réalisé par ce site doit faire l'objet d'une déclaration préalable auprès de la Commission Nationale de contrôle de la protection des Données à caractère Personnel (CNDP), conformément à la loi 09-08.\n\nIndiquer ici le numéro et la date du récépissé de déclaration, sous la forme : « Traitement déclaré à la CNDP sous le numéro [numéro], en date du [date]. »",
      },
      {
        titre: 'Sécurité',
        corps:
          "Les mots de passe ne sont jamais conservés en clair : ils sont transformés par une fonction de hachage à sens unique (Argon2id), qui ne permet pas de retrouver le mot de passe d'origine.\n\nLes échanges entre votre navigateur et le site sont chiffrés (HTTPS). Les sessions sont stockées côté serveur et peuvent être révoquées immédiatement.\n\nL'accès aux données est restreint par rôle : chaque intervenant ne voit que ce que sa fonction exige. Tout acte d'administration est horodaté et conservé dans un journal non modifiable.\n\nLes données sont sauvegardées quotidiennement.",
      },
      {
        titre: 'Modification de la présente politique',
        corps:
          "Cette politique peut être modifiée pour tenir compte d'évolutions du service ou de la réglementation. La date de dernière mise à jour figure en haut de cette page.\n\nEn cas de modification substantielle, les titulaires de comptes en seront informés.",
      },
    ],
  },
  cookies: {
    titre: 'Gestion des cookies',
    sections: [
      {
        titre: "Ce qu'est un cookie",
        corps:
          "Un cookie est un petit fichier déposé par un site sur votre appareil. Il permet au site de vous reconnaître d'une page à l'autre — par exemple pour que vous restiez connecté.\n\nCertains cookies sont indispensables au fonctionnement d'un service ; d'autres servent à mesurer l'audience ou à afficher de la publicité ciblée.",
      },
      {
        titre: "écoles360 n'utilise que des cookies indispensables",
        corps:
          "Ce site ne dépose AUCUN cookie de mesure d'audience, AUCUN cookie publicitaire et AUCUN cookie de réseau social.\n\nIl ne charge aucun script tiers de type Google Analytics, Meta Pixel ou équivalent.\n\nC'est la raison pour laquelle vous ne voyez pas de bandeau de consentement : les cookies strictement nécessaires au fonctionnement d'un service ne requièrent pas votre accord préalable. Nous n'en déposons pas d'autres.",
      },
      {
        titre: 'Les cookies déposés',
        corps:
          "Deux cookies seulement, et uniquement si vous vous connectez à un espace :\n\n• ecoles360_session — maintient votre session ouverte. Sans lui, vous seriez déconnecté à chaque page. Il ne contient qu'un identifiant aléatoire ; vos données restent sur le serveur. Il est inaccessible aux scripts de la page.\n\n• ecoles360_csrf — protège contre un type d'attaque consistant à vous faire exécuter une action à votre insu depuis un autre site. Il ne contient aucune donnée vous concernant.\n\nSi vous ne vous connectez pas, la simple consultation de l'annuaire ne dépose aucun cookie.",
      },
      {
        titre: 'Durée de conservation',
        corps:
          'Les deux cookies expirent à la fermeture de votre session, et au plus tard douze heures après votre connexion.\n\nIls disparaissent également lorsque vous cliquez sur « Déconnexion ».',
      },
      {
        titre: 'Comment les refuser ou les supprimer',
        corps:
          "Vous pouvez configurer votre navigateur pour refuser les cookies ou supprimer ceux déjà déposés. La procédure figure dans l'aide de votre navigateur, généralement sous « Paramètres », puis « Confidentialité et sécurité ».\n\nConséquence à connaître : ces cookies étant indispensables à l'authentification, les refuser vous empêchera de vous connecter à un espace. La consultation de l'annuaire, elle, restera possible et complète.",
      },
      {
        titre: "Mesure d'audience des fiches",
        corps:
          "Nous comptons les consultations de chaque fiche pour en communiquer le nombre à l'établissement concerné.\n\nCe comptage ne passe PAS par un cookie. Il n'enregistre ni votre adresse IP, ni identifiant de navigateur, ni aucune donnée permettant de vous identifier ou de vous suivre d'une visite à l'autre : seuls le type d'interaction, l'établissement concerné et la date sont conservés.",
      },
    ],
  },
};
