import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Un chiffre clé de la fiche — `{ label, valeur }` (livrable 12 §5). */
export class ChiffreCleDto {
  @ApiPropertyOptional({ example: 'Taux de réussite bac' })
  @IsString()
  @MaxLength(60)
  label!: string;

  @ApiPropertyOptional({ example: '96 %' })
  @IsString()
  @MaxLength(30)
  valeur!: string;
}

/** Une question de la FAQ — `{ q, r }`. */
export class FaqItemFicheDto {
  @ApiPropertyOptional({ example: 'Proposez-vous le transport ?' })
  @IsString()
  @MaxLength(200)
  q!: string;

  @ApiPropertyOptional({ example: 'Oui, sur les principaux axes de la ville.' })
  @IsString()
  @MaxLength(600)
  r!: string;
}

/**
 * Une autre enseigne du même propriétaire — bloc « Autres projets » de la
 * page profil : type (Restaurant, Café, Hôtel…), nom, ville et description.
 */
export class AutreProjetDto {
  @ApiPropertyOptional({ example: 'Restaurant' })
  @IsString()
  @MaxLength(40)
  type!: string;

  @ApiPropertyOptional({ example: 'Le Riad Gourmand' })
  @IsString()
  @MaxLength(120)
  nom!: string;

  @ApiPropertyOptional({ example: 'Casablanca · Maârif' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  ville?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}

/**
 * Blocs modifiables d'une fiche — livrable 11 §3.2 (avenant 3, RG20, RG27).
 *
 * TOUT EST FACULTATIF : une proposition peut ne porter que sur un seul champ.
 * `FicheProposalService` calcule lui-même `champs_modifies` en comparant ce
 * DTO à la fiche actuelle — l'appelant ne l'envoie pas.
 *
 * CE QUI N'Y FIGURE PAS EST DÉLIBÉRÉ : `sponsorise`, `verifie`, `premium`,
 * `note_moy`, `nb_avis`, `type`, `ville_id` et `slug` sont des attributs de
 * plateforme ou structurants — `ValidationPipe` (`forbidNonWhitelisted`) les
 * rejette par construction s'ils sont envoyés (RG27, livrable 11 §5). La
 * galerie de photos a sa propre route dédiée (`/fiche/photos`, upload de
 * fichiers) et n'est pas de ce DTO.
 */
export class ProposerFicheDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(180)
  nom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  adresse?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  quartier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  tel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsapp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  budget_min?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  budget_max?: number;

  @ApiPropertyOptional({ type: [ChiffreCleDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => ChiffreCleDto)
  chiffres?: ChiffreCleDto[];

  @ApiPropertyOptional({ type: [FaqItemFicheDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqItemFicheDto)
  faq?: FaqItemFicheDto[];

  @ApiPropertyOptional({ description: 'Plages horaires par clé libre (ex. lundi_vendredi).' })
  @IsOptional()
  @IsObject()
  horaires?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Liens des réseaux sociaux, par plateforme.' })
  @IsOptional()
  @IsObject()
  socials?: Record<string, string>;

  @ApiPropertyOptional({ type: [AutreProjetDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AutreProjetDto)
  autres_projets?: AutreProjetDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  facilites?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({}, { message: 'Le lien de la vidéo doit être une URL valide.' })
  video_url?: string;

  @ApiPropertyOptional({ example: 'Arabe · Français · Anglais' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  langues?: string;

  @ApiPropertyOptional({ example: 'https://www.almassira.ma' })
  @IsOptional()
  @IsUrl({}, { message: 'Le site web doit être une URL valide.' })
  site_web?: string;

  @ApiPropertyOptional({ description: 'Second texte de présentation — « Projet pédagogique ».' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  projet_pedagogique?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  gamme_label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  devis_label?: string;
}
