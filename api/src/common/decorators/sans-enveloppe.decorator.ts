import { SetMetadata } from '@nestjs/common';

export const CLE_SANS_ENVELOPPE = 'ecoles360:sans-enveloppe';

/**
 * Sort une réponse de l'enveloppe `{data, meta, links}`.
 *
 * Réservé aux sorties qui ne sont pas des ressources métier : la sonde de santé
 * (lue par Docker, qui n'interprète pas de JSON applicatif), les reçus HTML
 * (livrable 11 §3.2) et les exports CSV en flux (RG23).
 *
 * Tout le reste porte l'enveloppe — c'est le contrat du livrable 11 §1, et le
 * front est écrit contre lui.
 */
export const SansEnveloppe = (): MethodDecorator & ClassDecorator =>
  SetMetadata(CLE_SANS_ENVELOPPE, true);
