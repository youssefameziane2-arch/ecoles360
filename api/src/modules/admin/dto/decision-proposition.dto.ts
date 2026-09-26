import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';

/**
 * `PATCH /admin/propositions-fiche/{id}` — RG20.
 *
 * Une seule route pour les deux décisions, comme au contrat (livrable 11
 * §3.4) : `decision` distingue approbation et refus plutôt que deux routes
 * `/approuver` et `/refuser` qui dupliqueraient l'URL documentée.
 */
export class DecisionPropositionDto {
  @ApiProperty({ enum: ['validee', 'rejetee'] })
  @IsIn(['validee', 'rejetee'], { message: 'La décision doit être validee ou rejetee.' })
  decision!: 'validee' | 'rejetee';

  @ApiPropertyOptional({ description: 'Obligatoire si la décision est un refus.' })
  @ValidateIf((dto: DecisionPropositionDto) => dto.decision === 'rejetee')
  @IsString()
  @IsNotEmpty({ message: 'Le motif du refus est obligatoire.' })
  @MaxLength(200)
  motif?: string;
}
