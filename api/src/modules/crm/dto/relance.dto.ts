import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * `POST /crm/prospects/:id/relances` — RG17.
 *
 * DEUX USAGES DANS UN SEUL CORPS : programmer une relance (`prevue_le`), ou
 * consigner un appel qui vient d'avoir lieu (`effectuee`). Les séparer en
 * deux routes doublerait la garde de propriété pour une différence qui tient
 * à deux dates.
 */
export class RelanceDto {
  @ApiPropertyOptional({ description: 'Ce qui s’est dit, ou ce qu’il faudra dire.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @ApiPropertyOptional({ description: 'Date à laquelle relancer — alimente l’agenda.' })
  @IsOptional()
  @IsDateString({}, { message: 'La date de relance doit être une date valide.' })
  prevue_le?: string;

  @ApiPropertyOptional({ description: 'Vrai si l’échange vient d’avoir lieu.' })
  @IsOptional()
  @IsBoolean()
  effectuee?: boolean;
}
