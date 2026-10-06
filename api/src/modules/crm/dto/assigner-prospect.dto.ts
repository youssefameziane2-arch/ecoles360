import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * `PATCH /admin/crm/prospects/:id/commercial` — RG18.
 *
 * `null` RETIRE LE PROSPECT DU PORTEFEUILLE, et c'est un cas réel : un
 * commercial part, ses dossiers doivent pouvoir être rendus au pot commun
 * avant d'être redistribués.
 *
 * `@ValidateIf` SEUL, PAS `@IsOptional` : ce dernier court-circuiterait tous
 * les validateurs du champ, y compris sur une valeur fournie — un
 * identifiant de commercial fantaisiste passerait alors sans contrôle.
 */
export class AssignerProspectDto {
  @ApiPropertyOptional({ description: 'Identifiant du commercial, ou null pour désassigner.' })
  @ValidateIf((_, valeur) => valeur !== null)
  @Type(() => Number)
  @IsInt({ message: 'Le commercial doit être un identifiant.' })
  @Min(1)
  commercial_id!: number | null;
}
