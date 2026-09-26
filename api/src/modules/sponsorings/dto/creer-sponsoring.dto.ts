import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { EtablissementType, SponsoringNiveau } from '../../../generated/prisma';

/**
 * `POST /admin/sponsorings` — RG19.
 *
 * LES TROIS RESTRICTIONS SONT FACULTATIVES ET SE CUMULENT. Une campagne sans
 * aucune d'elles vaut sur tout le site ; avec `ville_id`, elle ne joue que sur
 * les recherches de cette ville ; avec `categorie`, que sur ce type
 * d'établissement ; avec `mot_cle`, que si la recherche le contient.
 */
export class CreerSponsoringDto {
  @ApiProperty({ description: "Identifiant de l'établissement mis en avant." })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  etablissement_id!: number;

  @ApiProperty({ enum: SponsoringNiveau })
  @IsEnum(SponsoringNiveau, { message: 'Le niveau doit être premium, gold ou silver.' })
  niveau!: SponsoringNiveau;

  @ApiPropertyOptional({ description: 'Limite la campagne à une ville.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ville_id?: number;

  @ApiPropertyOptional({
    enum: EtablissementType,
    description: "Limite à un type d'établissement.",
  })
  @IsOptional()
  @IsEnum(EtablissementType, { message: 'La catégorie doit être un type d’établissement valide.' })
  categorie?: EtablissementType;

  @ApiPropertyOptional({ description: 'Limite aux recherches contenant ce mot.' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  mot_cle?: string;

  @ApiProperty({ example: '2026-10-01' })
  @IsISO8601({}, { message: 'La date de début doit être au format AAAA-MM-JJ.' })
  debut!: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsISO8601({}, { message: 'La date de fin doit être au format AAAA-MM-JJ.' })
  fin!: string;

  @ApiProperty({ description: 'Tarif de la campagne, en MAD — jamais public (RG14).' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99_999_999)
  tarif_mad!: number;
}
