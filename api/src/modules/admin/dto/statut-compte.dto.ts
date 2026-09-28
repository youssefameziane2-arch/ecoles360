import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/**
 * Suspendre ou réactiver un compte — RG25.
 *
 * Un booléen plutôt qu'un enum de statut : `UserStatut` en compte deux, et
 * cet écran ne pilote que la bascule entre eux. Exposer l'enum inviterait à
 * en ajouter un troisième par cette porte-là.
 */
export class StatutCompteDto {
  @ApiProperty({ description: 'true suspend et coupe les sessions, false réactive.' })
  @IsBoolean()
  suspendu!: boolean;
}
