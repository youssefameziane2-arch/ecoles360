import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** `POST /avis/{id}/signalements` — RG07. */
export class SignalerAvisDto {
  @ApiProperty({ example: 'Propos diffamatoires' })
  @IsString()
  @IsNotEmpty({ message: 'Le motif du signalement est obligatoire.' })
  @MaxLength(255)
  motif!: string;

  @ApiPropertyOptional({ description: 'Pour recontacter le signalant, facultatif.' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  contact?: string;
}
