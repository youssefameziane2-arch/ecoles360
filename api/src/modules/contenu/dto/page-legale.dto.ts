import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/**
 * `PUT /admin/pages/legales/:cle` — mentions légales, confidentialité, cookies.
 *
 * UNE SEULE FORME POUR LES TROIS, là où « À propos » a un bloc par usage.
 * Ces pages n'ont pas de gabarit : ce sont des titres et de la prose, dont le
 * nombre et l'ordre changent avec le texte que fournit l'éditeur du site. Une
 * classe par page figerait un plan que le juriste n'a pas encore écrit, et
 * chaque relecture demanderait une livraison.
 */
export class SectionLegaleDto {
  @ApiProperty({ example: 'Éditeur du site' })
  @IsString()
  @IsNotEmpty({ message: 'Le titre d’une section est obligatoire.' })
  @MaxLength(160)
  titre!: string;

  /**
   * Plusieurs paragraphes, séparés par une ligne vide.
   *
   * 20 000 caractères : une politique de confidentialité conforme à la loi
   * 09-08 énumère les finalités, les destinataires, les durées et les droits.
   * Une limite courte la ferait tronquer à l'enregistrement, et personne ne
   * relit un texte de loi pour y chercher ce qui manque.
   */
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Le corps d’une section est obligatoire.' })
  @MaxLength(20_000)
  corps!: string;
}

export class PageLegaleDto {
  @ApiProperty({ example: 'Mentions légales' })
  @IsString()
  @IsNotEmpty({ message: 'Le titre de la page est obligatoire.' })
  @MaxLength(160)
  titre!: string;

  @ApiProperty({ type: [SectionLegaleDto] })
  @IsArray()
  @ArrayNotEmpty({ message: 'Une page légale compte au moins une section.' })
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => SectionLegaleDto)
  sections!: SectionLegaleDto[];
}
