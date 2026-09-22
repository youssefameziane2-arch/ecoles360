import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { EvenementType } from '../../../generated/prisma';

/** Sources reconnues — alimentent la facturation à la vue (RG12). */
export const SOURCES = ['resultats', 'fiche', 'une'] as const;

/** `POST /etablissements/{slug}/evenements` — RG10. */
export class TracerEvenementDto {
  @ApiProperty({ enum: EvenementType })
  @IsEnum(EvenementType)
  type!: EvenementType;

  @ApiPropertyOptional({ enum: SOURCES })
  @IsOptional()
  @IsIn(SOURCES, { message: 'La source doit être resultats, fiche ou une.' })
  source?: (typeof SOURCES)[number];
}
