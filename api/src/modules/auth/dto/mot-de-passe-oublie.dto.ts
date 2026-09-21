import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

/** `POST /api/v1/auth/mot-de-passe-oublie` — livrable 11 §3.1. */
export class MotDePasseOublieDto {
  @ApiProperty({ example: 'direction@ecoles360.com' })
  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  @MaxLength(160)
  email!: string;
}
