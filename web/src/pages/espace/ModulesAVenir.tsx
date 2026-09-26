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

export const StatistiquesAdmin = ecranAdmin(
  'Statistiques',
  'Audience et activité de l’ensemble de la plateforme',
  "Les agrégats plateforme (visites, recherches, vues, demandes, taux de transformation, classement) demandent le module de statistiques.",
);

export const JournalAdmin = ecranAdmin(
  'Journal d’audit',
  'Traçabilité des actions et activité par profil',
  "Les décisions d'administration sont DÉJÀ journalisées côté serveur — validation d'établissement, bascule de badge, approbation et refus de proposition. Seul l'écran de consultation reste à construire (RG26).",
);
