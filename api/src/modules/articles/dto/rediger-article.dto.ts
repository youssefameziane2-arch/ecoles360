import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * `POST /mon-espace/articles` et `PUT /mon-espace/articles/{id}` — avenant 3.
 *
 * NI `statut`, NI `a_la_une`, NI `slug` ICI (RG27). Ce sont des attributs de
 * plateforme : le statut se change par le circuit de validation, la mise en
 * avant appartient à l'administrateur, et le slug est dérivé du titre. Les
 * exposer permettrait à un auteur de publier sans relecture — le
 * `ValidationPipe` global (`forbidNonWhitelisted`) refuse d'ailleurs la
 * requête qui les porterait.
 */
export class RedigerArticleDto {
  @ApiProperty({ example: 'Journée portes ouvertes — samedi 12 septembre' })
  @IsString()
  @IsNotEmpty({ message: 'Le titre est obligatoire.' })
  @MaxLength(180, { message: 'Le titre ne doit pas dépasser 180 caractères.' })
  titre!: string;

  @ApiProperty({
    example: 'Vie des établissements',
    description:
      'Saisie libre : la maquette propose les catégories existantes et permet d’en soumettre ' +
      'une nouvelle. Elle est validée avec l’article, par la même relecture.',
  })
  @IsString()
  @IsNotEmpty({ message: 'La catégorie est obligatoire.' })
  @MaxLength(60, { message: 'La catégorie ne doit pas dépasser 60 caractères.' })
  categorie!: string;

  @ApiPropertyOptional({ description: 'Résumé affiché sur la carte de l’article.' })
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Le chapeau ne doit pas dépasser 300 caractères.' })
  chapeau?: string;

  @ApiPropertyOptional({ description: 'Corps de l’article publié sur sa page.' })
  @IsOptional()
  @IsString()
  @MaxLength(40_000, { message: 'Le contenu ne doit pas dépasser 40 000 caractères.' })
  contenu?: string;
}
