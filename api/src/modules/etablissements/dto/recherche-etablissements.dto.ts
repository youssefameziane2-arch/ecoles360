import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { EtablissementType } from '../../../generated/prisma';

/** Tris proposés par la barre de filtres des maquettes. */
export enum TriRecherche {
  Note = 'note',
  Recent = 'recent',
  Nom = 'nom',
}

/** 18 fiches par page — RG05, livrable 7 §4. */
export const PAR_PAGE_DEFAUT = 18;

/**
 * Filtres de `GET /api/v1/etablissements` — livrable 11 §1.
 *
 * « ?q=&ville=&type=&niveaux=1,2&budget_max=&note_min=&tri=note&page=2 »
 *
 * Les noms de paramètres sont une INTERFACE : ils figurent dans les URL
 * partageables du site public et dans le client HTTP du front. Les renommer
 * casserait les liens déjà en circulation et le référencement des pages de
 * résultats (RG03).
 */
export class RechercheEtablissementsDto {
  @ApiPropertyOptional({ description: 'Recherche plein texte sur le nom et la description.' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }): unknown => (typeof value === 'string' ? value.trim() : value))
  q?: string;

  @ApiPropertyOptional({ description: 'Slug de la ville (RG01).', example: 'casablanca' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  ville?: string;

  /**
   * Types cochés, séparés par des virgules — `?type=creche,primaire`.
   *
   * PLUSIEURS TYPES À LA FOIS, ET C'EST LE CAS COURANT. La plupart des
   * établissements marocains sont des groupes scolaires qui couvrent la crèche,
   * le primaire, le collège et le lycée. Un parent qui cherche « une école pour
   * mes deux enfants » coche plusieurs cycles ; l'obliger à choisir un seul
   * type lui ferait faire quatre recherches.
   *
   * Le paramètre garde son nom au singulier : il figure déjà dans des URL
   * partagées et dans le référencement des pages de type. Un seul type reste
   * une valeur simple, plusieurs deviennent une liste.
   */
  @ApiPropertyOptional({
    description: "Types d'établissement (RG02), séparés par des virgules.",
    example: 'creche,primaire,college',
  })
  @IsOptional()
  @Transform(({ value }): unknown =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean)
      : value,
  )
  @IsEnum(EtablissementType, {
    each: true,
    message:
      'Le type doit être crèche, primaire, collège, lycée, université, école supérieure ou centre de formation.',
  })
  type?: EtablissementType[];

  @ApiPropertyOptional({
    description:
      'Identifiants de caractéristiques, séparés par des virgules : niveaux, ' +
      'filières, langues, activités, matières, cursus, domaines, formats. ' +
      'OU à l’intérieur d’une famille, ET entre familles.',
    example: '1,4,23',
  })
  @IsOptional()
  @Transform(({ value }): unknown =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean)
      : value,
  )
  @IsString({ each: true })
  niveaux?: string[];

  @ApiPropertyOptional({ description: 'Budget annuel minimum, en MAD.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  budget_min?: number;

  @ApiPropertyOptional({ description: 'Budget annuel maximum, en MAD.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  budget_max?: number;

  @ApiPropertyOptional({ description: 'Note moyenne minimale, de 1 à 5.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  note_min?: number;

  @ApiPropertyOptional({ enum: TriRecherche, default: TriRecherche.Note })
  @IsOptional()
  @IsEnum(TriRecherche, { message: 'Le tri doit être note, recent ou nom.' })
  tri?: TriRecherche;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: PAR_PAGE_DEFAUT, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  // Plafonné : sans borne, `?per_page=100000` ferait charger les ~8 000 fiches
  // en une requête — un déni de service offert à qui lit l'URL.
  @Max(50)
  per_page?: number;
}
