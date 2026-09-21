import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** `POST /api/v1/auth/login` — livrable 11 §3.1. */
export class LoginDto {
  @ApiProperty({ example: 'direction@ecoles360.com' })
  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  @MaxLength(160)
  email!: string;

  @ApiProperty({ example: '••••••••' })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire.' })
  // Aucune contrainte de longueur maximale raisonnable n'est imposée ici, mais
  // une borne haute reste nécessaire : Argon2 sur une chaîne d'un mégaoctet est
  // un déni de service à une ligne.
  @MaxLength(200, { message: 'Le mot de passe est trop long.' })
  mot_de_passe!: string;
}
