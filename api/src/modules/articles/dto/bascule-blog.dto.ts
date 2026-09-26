import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/** `PUT /mon-espace/blog` — écran « Activez votre blog » de la maquette. */
export class BasculeBlogDto {
  @ApiProperty({ description: 'true ouvre le blog, false le referme.' })
  @IsBoolean()
  actif!: boolean;
}
