import { AvecIdentite, ModuleAVenir } from '@/components/CoquilleEspace';
import { useTitrePage } from '@/lib/titre';

/**
 * Écrans dont le module n'est pas encore construit.
 *
 * Ils existent pour que la navigation de la maquette soit complète sans
 * mentir : chaque entrée mène quelque part, et cette page nomme ce qui
 * manque. Elles disparaîtront une à une à mesure que les modules arrivent.
 */

const ROLES_ESPACE = ['etablissement', 'secretariat'] as const;

function ecranEspace(titre: string, sousTitre: string, explication: string) {
  return function Ecran() {
    useTitrePage(titre);

    return (
      <AvecIdentite
        role={[...ROLES_ESPACE]}
        rendu={(identite) => (
          <ModuleAVenir
            identite={identite}
            titre={titre}
            sousTitre={sousTitre}
            explication={explication}
          />
        )}
      />
    );
  };
}

function ecranAdmin(titre: string, sousTitre: string, explication: string) {
  return function Ecran() {
    useTitrePage(titre);

    return (
      <AvecIdentite
        role={['superadmin']}
        rendu={(identite) => (
          <ModuleAVenir
            identite={identite}
            titre={titre}
            sousTitre={sousTitre}
            explication={explication}
          />
        )}
      />
    );
  };
}

function ecranCommercial(titre: string, sousTitre: string, explication: string) {
  return function Ecran() {
    useTitrePage(titre);

    return (
      <AvecIdentite
        role={['commercial']}
        rendu={(identite) => (
          <ModuleAVenir
            identite={identite}
            titre={titre}
            sousTitre={sousTitre}
            explication={explication}
          />
        )}
      />
    );
  };
}

export const StatistiquesEspace = ecranEspace(
  'Statistiques',
  'Performance de votre fiche',
  "Les séries détaillées (vues par jour, sources, taux de contact) demandent l'agrégation des traces d'événements sur la durée. Le tableau de bord affiche déjà les vues des six derniers mois et la répartition des canaux.",
);

export const FacturationEspace = ecranEspace(
  'Abonnement & facturation',
  'Votre formule, vos vues et vos factures',
  "La formule, le compteur de vues facturées et l'historique des factures arrivent avec le module de facturation. En attendant, votre conseiller reste l'interlocuteur pour toute question de tarif.",
);

export const SecretariatAdmin = ecranAdmin(
  'Secrétariat',
  'Comptes du secrétariat — accès délégués et permissions',
  "La création de comptes et l'octroi des portées déléguées (fiches, contacts, avis) sont prévus au livrable 11 §3.6. Les portées existantes fonctionnent déjà côté serveur : elles ont été semées avec le jeu de démonstration.",
);

export const CommerciauxAdmin = ecranAdmin(
  'Commerciaux',
  'Comptes commerciaux et transferts',
  "Le suivi des commerciaux, de leurs transferts et de leurs commissions relève de l'avenant n° 1 (CRM).",
);

export const CrmAdmin = ecranAdmin(
  'CRM Clients',
  'Prospection commerciale — du premier contact à l’établissement client',
  "Le pipeline de prospection (prospects, relances, transformation en établissement) relève de l'avenant n° 1 et n'est pas encore construit.",
);

export const FacturationAdmin = ecranAdmin(
  'Abonnement & facturation',
  'Tarifs par établissement, encaissements et reçus',
  "Le module complet — tarification par client, génération de facture, encaissement, reçu — reste à construire. En attendant, « Activer l'essai gratuit » sur la liste des établissements débloque une validation sans facture (RG13).",
);

export const JournalAdmin = ecranAdmin(
  'Journal d’audit',
  'Traçabilité des actions et activité par profil',
  "Les décisions d'administration sont DÉJÀ journalisées côté serveur — validation d'établissement, bascule de badge, approbation et refus de proposition. Seul l'écran de consultation reste à construire (RG26).",
);

// ---------------------------------------------------------------------------
//  Espace commercial — sous-titres repris de la maquette « Espace écoles360 ».
//  Hors le blog, aucune route de l'API n'est encore ouverte au rôle
//  commercial : ces cinq entrées attendent le CRM de l'avenant n° 1.
// ---------------------------------------------------------------------------

export const TableauDeBordCommercial = ecranCommercial(
  'Tableau de bord',
  'Votre activité commerciale du jour',
  "Les tâches et relances du jour, les prospects à fort intérêt, les derniers transferts et la commission du mois agrègent l'agenda, les leads et les transferts — trois modules du CRM (avenant n° 1) qui restent à construire.",
);

export const AgendaCommercial = ecranCommercial(
  'Agenda & tâches',
  'Vos rendez-vous, relances et tâches — jour par jour',
  "Le calendrier du mois, les tâches du jour, les relances en retard et la synchronisation avec Google Agenda arrivent avec le CRM (avenant n° 1). Les relances de prospects ont déjà leur table en base, mais aucune route ne les sert encore au commercial.",
);

export const LeadsCommercial = ecranCommercial(
  'Mes leads',
  'Vos leads — recherche d’école (parents) et inscription (établissements), par étape et par intérêt',
  "Le pipeline — étape, température, intérêt, cycle et budget, prochaine relance — relève du CRM (avenant n° 1). Les leads naissent déjà en base avec chaque demande de contact (RG21) ; manquent la route qui vous les attribue et l'écran qui les classe.",
);

export const TransfertsCommercial = ecranCommercial(
  'Transferts & commissions',
  'Vos transferts d’établissements et vos commissions',
  "Le chiffre d'affaires généré, les ventes d'abonnement, les dossiers transférés et la commission créditée à l'encaissement dépendent de la facturation et du transfert de dossiers, deux modules encore à construire. Les commissions ont déjà leur table en base.",
);

export const StatistiquesCommercial = ecranCommercial(
  'Statistiques',
  'Votre activité — vues, contacts et conversions',
  "Les vues, contacts et conversions de vos établissements demandent le module de statistiques, le même qui manque encore aux espaces établissement et administration.",
);
