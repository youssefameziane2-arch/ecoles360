import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { EtablissementType } from '../../../generated/prisma';

/**
 * Formules proposées — libellés de la maquette `isInscription` (`insPlanOpts`).
 *
 * LES LIBELLÉS SONT STOCKÉS TELS QUELS, pas des codes. Ce sont les mots du
 * client ; les traduire en `essai | mensuel | annuel` obligerait à retraduire
 * dans l'autre sens sur chaque écran du CRM, et une table de correspondance
 * finit toujours par diverger de la liste qu'elle traduit.
 */
export const FORMULES = [
  'Essai gratuit 1 mois',
  'Abonnement mensuel',
  'Abonnement annuel −10 %',
  'Paiement à la vue',
  'À définir avec un conseiller',
] as const;

/**
 * `POST /inscriptions` — demande de référencement, formulaire public.
 *
 * CE QUI N'EST PAS DÉCLARÉ ICI EST REFUSÉ par le `ValidationPipe` global, en
 * `whitelist` + `forbidNonWhitelisted`. C'est ce qui écarte par construction
 * `commercial_id`, `statut_pipeline` et `etablissement_id` d'une charge utile
 * venue d'internet (RG27) : personne ne peut s'attribuer un prospect, le
 * déclarer transformé, ni le rattacher à la fiche d'un autre.
 */
export class InscriptionDto {
  @ApiProperty({ example: 'Lycée Al Massira' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom de votre établissement est obligatoire.' })
  @MaxLength(180)
  etablissement_nom!: string;

  @ApiPropertyOptional({ example: 'Casablanca' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ville?: string;

  /**
   * LE TYPE EST LIBRE CÔTÉ COLONNE mais contraint ici aux sept de la RG02 :
   * un prospect dont le type ne correspond à rien obligerait le commercial à
   * le redemander au téléphone.
   */
  @ApiPropertyOptional({ enum: EtablissementType })
  @IsOptional()
  @IsIn(Object.values(EtablissementType), {
    message: 'Le type d’établissement n’est pas reconnu.',
  })
  type_vise?: string;

  @ApiProperty({ example: 'Jalal El Amrani' })
  @IsString()
  @IsNotEmpty({ message: 'Votre nom est obligatoire.' })
  @MaxLength(120)
  contact_nom!: string;

  @ApiPropertyOptional({ example: 'Directeur' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contact_fonction?: string;

  @ApiProperty({ example: '06 61 07 27 77' })
  @IsString()
  @IsNotEmpty({ message: 'Votre téléphone est obligatoire.' })
  // Même motif que la demande de contact d'un parent : 06/07 mobile, 05 fixe,
  // avec ou sans +212, espaces tolérés.
  @Matches(/^(?:\+212[\s-]?|0)([5-7])[\s-]?(\d[\s-]?){8}$/, {
    message: 'Le numéro de téléphone marocain est invalide.',
  })
  @MaxLength(30)
  telephone!: string;

  @ApiPropertyOptional({ example: 'direction@almassira.ma' })
  @IsOptional()
  @IsEmail({}, { message: 'L’adresse e-mail est invalide.' })
  @MaxLength(160)
  email?: string;

  @ApiPropertyOptional({ enum: FORMULES })
  @IsOptional()
  @IsIn(FORMULES, { message: 'Cette formule n’existe pas.' })
  formule_visee?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Votre message ne peut pas dépasser 1000 caractères.' })
  message?: string;

  @ApiProperty({
    description:
      'Consentement explicite au traitement des données (loi 09-08). ' +
      'Obligatoirement true — la demande est refusée sans lui.',
  })
  // @Equals(true) et non @IsBoolean() : un `false` doit être REFUSÉ, pas
  // enregistré. Sans consentement, la collecte est illégale (RG09).
  @Equals(true, { message: 'Votre consentement est nécessaire pour envoyer la demande.' })
  consentement!: boolean;
}
