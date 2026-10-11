import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** `POST /admin/categories-articles` — onglet « Catégories » de « Contenu du site ». */
export class CategorieArticleDto {
  @ApiProperty({ example: 'Orientation', maxLength: 60 })
  /**
   * COUPÉ AVANT VALIDATION, PAS APRÈS. Sans cela, « ␣␣␣ » passe
   * `@IsNotEmpty()` — la chaîne n'est pas vide —, puis le service la coupe et
   * crée une catégorie au libellé vide. Un test l'a attrapé ; la relecture ne
   * l'avait pas vu.
   */
  @Transform(({ value }): unknown => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Le libellé de la catégorie est obligatoire.' })
  // 60, comme la colonne : au-delà, MySQL tronquerait en silence et la
  // catégorie posée ne serait pas celle qu'on a tapée.
  @MaxLength(60, { message: 'Le libellé ne peut pas dépasser 60 caractères.' })
  libelle!: string;
}
