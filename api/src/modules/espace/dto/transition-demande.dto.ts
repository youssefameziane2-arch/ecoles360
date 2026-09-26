import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DemandeStatut } from '../../../generated/prisma';

/** `PATCH /mon-espace/demandes/{id}` — RG09 : nouvelle → en_cours → traitee. */
export class TransitionDemandeDto {
  @ApiProperty({ enum: DemandeStatut })
  @IsEnum(DemandeStatut, { message: 'Le statut doit être nouvelle, en_cours ou traitee.' })
  statut!: DemandeStatut;
}
