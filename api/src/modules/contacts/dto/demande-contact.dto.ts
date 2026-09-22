import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { DemandeCanal } from '../../../generated/prisma';

/** `POST /etablissements/{slug}/demandes-contact` — RG09, loi 09-08. */
export class DemandeContactDto {
  @ApiProperty({ example: 'Yasmine El Amrani' })
  @IsString()
  @IsNotEmpty({ message: 'Votre nom est obligatoire.' })
  @MaxLength(120)
  parent_nom!: string;

  @ApiProperty({ example: '06 61 42 88 30' })
  @IsString()
  @IsNotEmpty({ message: 'Votre téléphone est obligatoire.' })
  // Numéro marocain : 06/07 mobile, 05 fixe, avec ou sans +212, espaces tolérés.
  @Matches(/^(?:\+212[\s-]?|0)([5-7])[\s-]?(\d[\s-]?){8}$/, {
    message: 'Le numéro de téléphone marocain est invalide.',
  })
  @MaxLength(30)
  parent_tel!: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Votre message ne peut pas dépasser 1000 caractères.' })
  message?: string;

  @ApiProperty({ enum: DemandeCanal, default: DemandeCanal.formulaire })
  @IsEnum(DemandeCanal)
  canal!: DemandeCanal;

  @ApiProperty({
    description:
      'Consentement explicite au traitement des données (loi 09-08). ' +
      'Obligatoirement true — la demande est refusée sans lui.',
  })
  // @Equals(true) et non @IsBoolean() : un `false` doit être REFUSÉ, pas
  // enregistré. Sans consentement, la collecte est illégale (RG09).
  @Equals(true, { message: 'Votre consentement est nécessaire pour transmettre la demande.' })
  consentement!: boolean;
}
