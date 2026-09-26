import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * `POST /admin/faq` et `PUT /admin/faq/{id}` — livrable 11 §3.7.
 *
 * L'ORDRE N'EST PAS ICI. Le rang d'une question se change par glisser-déposer
 * sur l'écran d'administration, qui envoie la liste complète à
 * `PUT /admin/faq/ordre` ; l'exposer aussi dans ce DTO donnerait deux chemins
 * concurrents pour le même champ, et donc deux occasions de le désynchroniser.
 */
export class FaqItemDto {
  @ApiProperty({ example: 'écoles360, c’est gratuit pour les parents ?' })
  @IsString()
  @IsNotEmpty({ message: 'La question est obligatoire.' })
  @MaxLength(200, { message: 'La question ne doit pas dépasser 200 caractères.' })
  question!: string;

  @ApiProperty({ example: 'Oui, totalement. La recherche et la prise de contact sont gratuites.' })
  @IsString()
  @IsNotEmpty({ message: 'La réponse est obligatoire.' })
  @MaxLength(4000, { message: 'La réponse ne doit pas dépasser 4000 caractères.' })
  reponse!: string;

  @ApiProperty({ example: 'Pour les parents' })
  @IsString()
  @IsNotEmpty({ message: 'La rubrique est obligatoire.' })
  @MaxLength(80, { message: 'La rubrique ne doit pas dépasser 80 caractères.' })
  groupe!: string;

  @ApiPropertyOptional({
    description: 'Une question dépubliée reste en base et disparaît de /faq.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  publiee?: boolean;
}
