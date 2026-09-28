import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { EtablissementType } from '../../../generated/prisma';

/**
 * Création d'une fiche depuis le back-office — livrable 11 §3.4.
 *
 * L'ADMINISTRATEUR SAISIT POUR UNE ÉCOLE QUI N'A PAS DE COMPTE. C'est le cas
 * ordinaire au démarrage : le commercial revient d'un rendez-vous avec les
 * coordonnées d'un établissement, la fiche est créée ici, et le propriétaire
 * la revendiquera plus tard (RG04, `proprietaire_user_id` reste NULL).
 *
 * TROIS CHAMPS SEULEMENT SONT OBLIGATOIRES — nom, ville, type. Tout le reste
 * s'enrichit par la suite, depuis cet écran ou depuis l'espace établissement.
 * Exiger l'adresse et le téléphone dès la création ferait abandonner la saisie
 * à mi-chemin, et une fiche à moitié remplie vaut mieux que pas de fiche.
 *
 * AUCUN CHAMP DE PLATEFORME ICI : `sponsorise`, `verifie`, `premium`,
 * `note_moy` et `statut` n'y figurent pas (RG27). Le `ValidationPipe` global
 * étant en `forbidNonWhitelisted`, les glisser dans la charge utile produit un
 * 422 plutôt qu'une écriture silencieuse.
 */
export class CreerEtablissementDto {
  @ApiProperty({ example: 'Groupe Scolaire Al Amal', maxLength: 180 })
  @IsString()
  @Length(3, 180, { message: 'Le nom doit faire entre 3 et 180 caractères.' })
  nom!: string;

  @ApiProperty({ description: 'Identifiant de la ville — RG01 : une fiche, une ville.' })
  @Type(() => Number)
  @IsInt({ message: 'La ville est obligatoire.' })
  @IsPositive({ message: 'La ville est obligatoire.' })
  ville_id!: number;

  @ApiProperty({ enum: EtablissementType, description: 'RG02 — sept types.' })
  @IsEnum(EtablissementType, { message: "Ce type d'établissement n'existe pas." })
  type!: EtablissementType;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  adresse?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  quartier?: string;

  /**
   * Coordonnées — ce qui fait apparaître la fiche sur la carte des résultats.
   *
   * SANS ELLES, LA FICHE EST INVISIBLE SUR LA CARTE, et son bouton « Carte »
   * n'existe pas. Les bornes sont celles du Maroc, à la marge près : une
   * latitude saisie à la place d'une longitude — l'inversion classique —
   * tombe alors hors de l'intervalle et se fait refuser, au lieu de poser une
   * épingle au milieu de l'Atlantique.
   */
  @ApiPropertyOptional({ description: 'Latitude — entre 20 et 37 (Maroc).', example: 33.5883 })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude({ message: 'La latitude doit être un nombre décimal.' })
  @Min(20, { message: 'Cette latitude est hors du Maroc.' })
  @Max(37, { message: 'Cette latitude est hors du Maroc.' })
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude — entre −18 et −1 (Maroc).', example: -7.6325 })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude({ message: 'La longitude doit être un nombre décimal.' })
  @Min(-18, { message: 'Cette longitude est hors du Maroc.' })
  @Max(-1, { message: 'Cette longitude est hors du Maroc.' })
  lng?: number;

  @ApiPropertyOptional({ maxLength: 30, example: '05 22 00 00 00' })
  @IsOptional()
  @IsString()
  @Length(0, 30)
  tel?: string;

  @ApiPropertyOptional({ maxLength: 30, example: '06 12 34 56 78' })
  @IsOptional()
  @IsString()
  @Length(0, 30)
  whatsapp?: string;

  // `ValidateIf` plutôt que `IsOptional` : un champ vidé par l'opérateur
  // arrive en chaîne vide, et `IsOptional` laisserait passer `''` jusqu'en
  // base. Ici la chaîne vide court-circuite `IsEmail`, et le service la
  // convertit en NULL.
  @ApiPropertyOptional({ maxLength: 160 })
  @ValidateIf((_, valeur) => valeur !== undefined && valeur !== '')
  @IsEmail({}, { message: "Cette adresse e-mail n'est pas valide." })
  @Length(0, 160)
  email?: string;

  @ApiPropertyOptional({ maxLength: 200, example: 'https://ecole-al-amal.ma' })
  @ValidateIf((_, valeur) => valeur !== undefined && valeur !== '')
  @IsUrl({ require_protocol: true }, { message: 'Le site web doit commencer par https://' })
  @Length(0, 200)
  site_web?: string;

  @ApiPropertyOptional({ description: 'Présentation affichée en tête de fiche.' })
  @IsOptional()
  @IsString()
  @Length(0, 5000)
  description?: string;

  @ApiPropertyOptional({ maxLength: 160, example: 'Français, Arabe, Anglais' })
  @IsOptional()
  @IsString()
  @Length(0, 160)
  langues?: string;

  @ApiPropertyOptional({ description: 'Frais annuels minimum, en dirhams.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000, { message: 'Ce budget dépasse le plafond raisonnable (1 000 000 MAD).' })
  budget_min?: number;

  @ApiPropertyOptional({ description: 'Frais annuels maximum, en dirhams.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000, { message: 'Ce budget dépasse le plafond raisonnable (1 000 000 MAD).' })
  budget_max?: number;

  @ApiPropertyOptional({
    description:
      'Groupe scolaire de rattachement. Un nom inconnu crée le groupe ; laissé vide, la fiche reste seule.',
    maxLength: 180,
  })
  @IsOptional()
  @IsString()
  @Length(0, 180)
  groupe?: string;

  @ApiPropertyOptional({
    description: 'Caractéristiques cochées — niveaux, filières, langues, activités…',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true, message: 'Caractéristique invalide.' })
  caracteristiques?: number[];
}
