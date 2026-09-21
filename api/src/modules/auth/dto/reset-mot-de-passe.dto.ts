import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** `POST /api/v1/auth/reset-mot-de-passe` — livrable 11 §3.1. */
export class ResetMotDePasseDto {
  @ApiProperty({ description: 'Jeton reçu par e-mail, à usage unique, valable une heure.' })
  @IsString()
  @IsNotEmpty({ message: 'Le jeton est obligatoire.' })
  @MaxLength(128)
  jeton!: string;

  @ApiProperty({ example: 'UnMotDePasseSolide2026' })
  @IsString()
  @MinLength(12, { message: 'Le mot de passe doit contenir au moins 12 caractères.' })
  @MaxLength(200, { message: 'Le mot de passe est trop long.' })
  // Longueur d'abord, composition ensuite : une phrase longue résiste mieux
  // qu'un « P@ss1 » court, et la borne de 12 caractères fait l'essentiel du
  // travail. La règle de composition reste une exigence courante des recettes.
  @Matches(/(?=.*[a-zà-ÿ])(?=.*[A-ZÀ-Ÿ])(?=.*\d)/, {
    message: 'Le mot de passe doit contenir une minuscule, une majuscule et un chiffre.',
  })
  nouveau_mot_de_passe!: string;
}
