import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { ArticleStatut } from '../../../generated/prisma';

/**
 * `PATCH /admin/articles/{id}` — livrable 11 §3.5, « motif requis au refus ».
 *
 * LE MOTIF EST OBLIGATOIRE AU REFUS, et seulement au refus. Il part à l'auteur :
 * sans lui, l'article reviendrait inchangé et serait refusé une seconde fois.
 * Vingt caractères minimum, parce qu'un « non » n'explique rien.
 */
export class DecisionArticleDto {
  @ApiProperty({ enum: [ArticleStatut.approuve, ArticleStatut.refuse] })
  @IsEnum(ArticleStatut, { message: 'La décision doit être « approuve » ou « refuse ».' })
  decision!: ArticleStatut;

  /**
   * PAS DE `@IsOptional()` ICI, ET C'EST LE CŒUR DE LA RÈGLE.
   *
   * `@IsOptional()` court-circuite TOUS les autres validateurs dès que la
   * valeur est absente — y compris quand `@ValidateIf` demande de valider. Le
   * champ devenait alors facultatif même au refus, et un article se refusait
   * sans un mot d'explication. `@ValidateIf` suffit : il désactive la
   * validation à l'approbation, et l'exige au refus.
   */
  @ApiPropertyOptional({ example: 'Un classement nominatif contrevient à la charte éditoriale.' })
  @ValidateIf((dto: DecisionArticleDto) => dto.decision === ArticleStatut.refuse)
  @IsString({ message: 'Le motif du refus est obligatoire.' })
  @MinLength(20, { message: 'Le motif du refus doit faire au moins 20 caractères.' })
  @MaxLength(300, { message: 'Le motif ne doit pas dépasser 300 caractères.' })
  motif?: string;
}
