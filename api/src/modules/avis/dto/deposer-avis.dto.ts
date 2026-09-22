import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

/** `POST /etablissements/{slug}/avis` — RG06. */
export class DeposerAvisDto {
  @ApiProperty({ example: 'Karima B.' })
  @IsString()
  @IsNotEmpty({ message: 'Votre nom est obligatoire.' })
  @MaxLength(120)
  auteur_nom!: string;

  @ApiProperty({ description: 'E-mail ou téléphone, jamais exposé publiquement.' })
  @IsString()
  @IsNotEmpty({ message: 'Un moyen de vous contacter est obligatoire.' })
  @MaxLength(160)
  auteur_contact!: string;

  @ApiProperty({ minimum: 1, maximum: 5, example: 5 })
  @IsInt({ message: 'La note doit être un entier.' })
  @Min(1, { message: 'La note doit être comprise entre 1 et 5.' })
  @Max(5, { message: 'La note doit être comprise entre 1 et 5.' })
  note!: number;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @IsNotEmpty({ message: 'Votre commentaire est obligatoire.' })
  @MaxLength(2000, { message: 'Votre commentaire ne peut pas dépasser 2000 caractères.' })
  commentaire!: string;
}
