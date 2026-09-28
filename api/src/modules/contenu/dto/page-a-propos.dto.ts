import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/**
 * `PUT /admin/pages/a-propos` — la page entière, pas un fragment.
 *
 * CHAQUE BLOC EST DÉCLARÉ, JUSQU'AU DERNIER CHAMP. `blocs` est un Json en
 * base : sans ces classes, n'importe quelle clé passerait et finirait publiée
 * sur le site. Avec elles, `forbidNonWhitelisted` refuse en 422 un champ
 * inconnu à toutes les profondeurs, comme partout ailleurs dans l'API.
 */

export class ValeurDto {
  @ApiProperty({ example: 'Transparence' })
  @IsString()
  @IsNotEmpty({ message: 'Le titre d’une valeur est obligatoire.' })
  @MaxLength(60)
  titre!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Le texte d’une valeur est obligatoire.' })
  @MaxLength(400)
  texte!: string;
}

/** Un engagement — plusieurs paragraphes, séparés par une ligne vide. */
export class EngagementDto {
  @ApiProperty({ example: 'Les avis' })
  @IsString()
  @IsNotEmpty({ message: 'Le titre d’un engagement est obligatoire.' })
  @MaxLength(120)
  titre!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Le texte d’un engagement est obligatoire.' })
  @MaxLength(3000)
  texte!: string;
}

/**
 * Un membre de l'équipe écoles360.
 *
 * SANS PHOTO : aucune route ne téléverse d'image pour cette page, et accepter
 * une URL libre publierait sur le site une image hébergée n'importe où.
 * `TeamMember` affiche alors les initiales, comme la maquette.
 */
export class MembreEquipeDto {
  @ApiProperty({ example: 'Younes Chraibi' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom d’un membre est obligatoire.' })
  @MaxLength(120)
  nom!: string;

  @ApiProperty({ example: 'Conseiller' })
  @IsString()
  @IsNotEmpty({ message: 'Le rôle d’un membre est obligatoire.' })
  @MaxLength(120)
  role!: string;
}

export class CoordonneesDto {
  @ApiProperty({ example: 'contact@ecoles360.com' })
  @IsEmail({}, { message: 'L’adresse e-mail n’est pas valide.' })
  @MaxLength(160)
  email!: string;

  @ApiProperty({ example: '+212 5 22 00 00 00' })
  @IsString()
  @IsNotEmpty({ message: 'Le téléphone est obligatoire.' })
  @MaxLength(40)
  telephone!: string;

  @ApiProperty({ example: 'Casablanca, Maroc' })
  @IsString()
  @IsNotEmpty({ message: 'L’adresse est obligatoire.' })
  @MaxLength(200)
  adresse!: string;

  @ApiPropertyOptional({
    description: 'Absent : le bloc « Contact rapide sur WhatsApp » est masqué.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  whatsapp?: string;

  @ApiPropertyOptional({ example: 'Lun.–Ven. · 9h–18h' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  horaires?: string;
}

export class BlocsAProposDto {
  @ApiProperty({ description: 'Le grand titre de la page.' })
  @IsString()
  @IsNotEmpty({ message: 'Le titre principal est obligatoire.' })
  @MaxLength(200)
  accroche!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'La mission est obligatoire.' })
  @MaxLength(600)
  mission!: string;

  @ApiProperty({ description: 'Paragraphes séparés par une ligne vide.' })
  @IsString()
  @IsNotEmpty({ message: 'L’histoire est obligatoire.' })
  @MaxLength(4000)
  histoire!: string;

  @ApiProperty({ type: [ValeurDto] })
  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => ValeurDto)
  valeurs!: ValeurDto[];

  @ApiProperty({ type: [EngagementDto] })
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => EngagementDto)
  engagements!: EngagementDto[];

  @ApiProperty({
    type: [MembreEquipeDto],
    description: 'Vide : la section « Équipe » est masquée.',
  })
  @IsArray()
  @ArrayMaxSize(24)
  @ValidateNested({ each: true })
  @Type(() => MembreEquipeDto)
  equipe!: MembreEquipeDto[];

  @ApiProperty({ type: CoordonneesDto })
  @ValidateNested()
  @Type(() => CoordonneesDto)
  coordonnees!: CoordonneesDto;
}

export class PageAProposDto {
  @ApiProperty({ example: 'À propos' })
  @IsString()
  @IsNotEmpty({ message: 'Le titre de la page est obligatoire.' })
  @MaxLength(160)
  titre!: string;

  @ApiProperty({ type: BlocsAProposDto })
  @ValidateNested()
  @Type(() => BlocsAProposDto)
  blocs!: BlocsAProposDto;
}
