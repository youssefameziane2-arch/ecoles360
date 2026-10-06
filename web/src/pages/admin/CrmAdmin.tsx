import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { PipelineCrm } from '@/components/PipelineCrm';
import { useTitrePage } from '@/lib/titre';

/**
 * CRM Clients — écran `isAdminCrm` de la maquette.
 *
 * LA DIRECTION VOIT TOUS LES PORTEFEUILLES, et c'est le seul écran d'où l'on
 * confie un dossier à un commercial. Ce geste décide qui touchera la
 * commission à la facturation (RG18) : le laisser au vendeur reviendrait à le
 * laisser s'attribuer sa propre rémunération.
 */
export function CrmAdmin() {
  useTitrePage('CRM Clients');

  return (
    <AvecIdentite
      role={['superadmin']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="CRM Clients"
          sousTitre="Pipeline commercial, relances et attribution des dossiers"
        >
          <PipelineCrm administration />
        </CoquilleEspace>
      )}
    />
  );
}
