import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/** `PATCH /admin/avis/{id}/en-avant` — avis mis en avant sur l'accueil (RG27). */
export class BasculeEnAvantDto {
  @ApiProperty()
  @IsBoolean()
  en_avant!: boolean;
}
