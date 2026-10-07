import { AvecIdentite, ModuleAVenir } from '@/components/CoquilleEspace';
import { useTitrePage } from '@/lib/titre';

/**
 * Écrans dont le module n'est pas encore construit.
 *
 * Ils existent pour que la navigation de la maquette soit complète sans
 * mentir : chaque entrée mène quelque part, et cette page nomme ce qui
 * manque. Elles disparaissent une à une à mesure que les modules arrivent —
 * **il n'en reste qu'une**.
 *
 * LES LAISSER APRÈS COUP SERAIT PIRE QUE DE NE PAS LES AVOIR ÉCRITES. Ce
 * fichier a porté pendant un temps dix écrans « à venir » dont neuf étaient
 * construits ailleurs : un développeur qui l'ouvrait y lisait que le CRM, la
 * facturation et le journal d'audit n'existaient pas.
 */
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

/**
 * Le seul écran encore en attente — et il attend une DÉFINITION, pas du
 * travail : la maquette y remet les chiffres d'une fiche, mais ce qu'un
 * commercial doit voir de ses établissements n'est écrit nulle part.
 */
export const StatistiquesCommercial = ecranCommercial(
  'Statistiques',
  'Votre activité — vues, contacts et conversions',
  'Ce que cet écran doit montrer n’est pas tranché : la maquette y remet les statistiques d’une fiche, qui appartiennent à l’établissement. Vos commissions et vos relances sont dans « Transferts & commissions » et « Agenda & tâches ».',
);
