import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ProspectStatut } from '../../../generated/prisma';

/**
 * `PATCH /crm/prospects/:id/statut` — RG17.
 *
 * `transforme` EST ACCEPTÉ PAR LE TYPE MAIS REFUSÉ PAR LE SERVICE, et c'est
 * volontaire : l'énumération est celle du schéma, et la restreindre ici
 * ferait diverger deux listes. Le refus porte un message qui explique quoi
 * faire à la place — créer la fiche de l'établissement — là où un simple 422
 * de validation ne dirait rien.
 */
export class StatutProspectDto {
  @ApiProperty({ enum: ProspectStatut })
  @IsEnum(ProspectStatut, {
    message: 'Le statut doit être nouveau, a_contacter, chaud, relance, transforme ou perdu.',
  })
  statut!: ProspectStatut;
}
