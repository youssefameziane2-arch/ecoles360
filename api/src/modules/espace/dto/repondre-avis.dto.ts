import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** `POST /mon-espace/avis/{id}/reponse` — RG07 : une seule réponse par avis. */
export class RepondreAvisDto {
  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @IsNotEmpty({ message: 'La réponse ne peut pas être vide.' })
  @MaxLength(1000, { message: 'La réponse ne peut pas dépasser 1000 caractères.' })
  reponse!: string;
}
