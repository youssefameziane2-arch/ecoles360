import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

/** Légende d'une photo — sert de texte alternatif et de cartouche en galerie. */
export class LegendePhotoDto {
  @ApiProperty({ example: 'Cour de récréation', maxLength: 160 })
  @IsString()
  @Length(1, 160, { message: 'La légende doit faire entre 1 et 160 caractères.' })
  alt!: string;
}
