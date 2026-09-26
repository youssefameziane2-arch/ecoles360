import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EtablissementStatut } from '../../../generated/prisma';

/** `PATCH /admin/etablissements/{id}/statut` — RG03. Le passage à `validee` exige un abonnement encaissé (RG14). */
export class TransitionStatutEtablissementDto {
  @ApiProperty({ enum: EtablissementStatut })
  @IsEnum(EtablissementStatut, {
    message: 'Le statut doit être en_attente, validee, masquee ou suspendue.',
  })
  statut!: EtablissementStatut;
}
