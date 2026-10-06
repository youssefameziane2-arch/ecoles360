import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { AbonnementFormule } from '../../../generated/prisma';

/**
 * `POST /admin/etablissements/:id/abonnement` — RG11, RG14.
 *
 * LE TARIF EST OBLIGATOIRE ET VIENT DE L'ÉCRAN : il est propre à chaque
 * client et n'est jamais public. Aucun barème ne le fournit, et il n'y en a
 * pas à inventer.
 */
export class OuvrirAbonnementDto {
  @ApiProperty({ enum: [AbonnementFormule.mensuel, AbonnementFormule.annuel] })
  @IsEnum(AbonnementFormule, { message: 'La formule doit être mensuel ou annuel.' })
  formule!: AbonnementFormule;

  @ApiProperty({ example: 4800, description: 'Montant hors taxe négocié, en MAD.' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Le tarif doit être un montant en dirhams.' })
  @Min(1, { message: 'Le tarif doit être supérieur à zéro.' })
  @Max(99_999_999, { message: 'Le tarif dépasse ce que la base peut stocker.' })
  tarif_mad!: number;

  @ApiPropertyOptional({
    description:
      'Remise en pourcentage — annuel seulement (RG11). Par défaut, le paramètre global.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(100)
  remise_pct?: number;

  @ApiPropertyOptional({ description: 'Date de début — aujourd’hui par défaut.' })
  @IsOptional()
  @IsDateString({}, { message: 'La date de début doit être une date valide.' })
  debut?: string;
}
