import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { EtablissementType } from '../../../generated/prisma';

/** Les quatre périodes de la maquette (`adStatPeriods`). */
export const PERIODES_STATISTIQUES = ['7j', '30j', '90j', '12m'] as const;

export type PeriodeStatistiques = (typeof PERIODES_STATISTIQUES)[number];

/**
 * Filtres de `GET /admin/statistiques` — ils commandent tout l'écran.
 *
 * TOUS FACULTATIFS, ET INDÉPENDANTS : aucun champ n'en rend un autre
 * obligatoire, d'où `@IsOptional()` sans `@ValidateIf()` — le piège de
 * CLAUDE.md ne se pose pas ici.
 */
export class StatistiquesAdminDto {
  @ApiPropertyOptional({ enum: PERIODES_STATISTIQUES, default: '30j' })
  @IsOptional()
  @IsIn(PERIODES_STATISTIQUES, { message: 'La période doit être 7j, 30j, 90j ou 12m.' })
  periode: PeriodeStatistiques = '30j';

  @ApiPropertyOptional({ description: 'Slug de la ville (RG01).', example: 'casablanca' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  ville?: string;

  @ApiPropertyOptional({ enum: EtablissementType })
  @IsOptional()
  @IsEnum(EtablissementType, {
    message:
      'Le type doit être crèche, primaire, collège, lycée, université, école supérieure ou centre de formation.',
  })
  type?: EtablissementType;
}
