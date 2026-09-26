import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { AvisStatut } from '../../../generated/prisma';

/**
 * `PATCH /admin/avis/{id}` — RG06.
 *
 * LE MOTIF EST EXIGÉ AU REJET, et seulement au rejet — même règle que pour un
 * article refusé. Pas de `@IsOptional()` : il court-circuiterait `@ValidateIf`
 * et rendrait le motif facultatif là où il est obligatoire.
 */
export class DecisionAvisDto {
  @ApiProperty({ enum: [AvisStatut.publie, AvisStatut.rejete] })
  @IsEnum(AvisStatut, { message: 'La décision doit être « publie » ou « rejete ».' })
  decision!: AvisStatut;

  @ApiPropertyOptional({ example: 'Propos injurieux visant nommément un enseignant.' })
  @ValidateIf((dto: DecisionAvisDto) => dto.decision === AvisStatut.rejete)
  @IsString({ message: 'Le motif du rejet est obligatoire.' })
  @MinLength(15, { message: 'Le motif du rejet doit faire au moins 15 caractères.' })
  @MaxLength(255, { message: 'Le motif ne doit pas dépasser 255 caractères.' })
  motif?: string;
}
