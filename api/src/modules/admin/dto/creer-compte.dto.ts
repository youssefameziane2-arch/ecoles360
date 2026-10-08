import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { RoleCode } from '../../../generated/prisma';

/** Les deux rôles que cet écran sait créer — RG25. */
export const ROLES_CREABLES = [RoleCode.secretariat, RoleCode.commercial] as const;

/**
 * `POST /admin/comptes` — création d'un compte de personnel.
 *
 * NI MOT DE PASSE NI STATUT DANS LA CHARGE UTILE, et c'est volontaire. Le mot
 * de passe est TIRÉ AU SORT par le serveur et rendu une seule fois : laisser
 * l'écran en proposer un ferait transiter un secret choisi à la hâte, et
 * surtout le ferait exister ailleurs que dans la tête de son titulaire. Le
 * statut naît `actif` ; le suspendre est un autre geste, déjà outillé (RG25).
 *
 * `superadmin` ET `etablissement` NE SONT PAS CRÉABLES ICI. Le premier se pose
 * par `compte:creer` en ligne de commande — c'est le recours quand plus
 * personne ne peut entrer, et il ne doit pas dépendre d'un écran accessible
 * depuis internet. Le second naît avec la revendication d'une fiche (RG04), un
 * chemin qui a ses propres règles.
 */
export class CreerCompteDto {
  @ApiProperty({ example: 'sara.secretariat@ecoles360.com' })
  @IsEmail({}, { message: 'L’adresse e-mail est invalide.' })
  @MaxLength(160)
  email!: string;

  @ApiProperty({ example: 'Sara Sabri' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom du titulaire est obligatoire.' })
  @MaxLength(120)
  nom!: string;

  @ApiProperty({ enum: ROLES_CREABLES })
  @IsIn(ROLES_CREABLES, { message: 'Seuls un secrétariat ou un commercial se créent ici.' })
  role!: (typeof ROLES_CREABLES)[number];

  /**
   * LA LIGNE D'UN COMMERCIAL N'EST PAS DÉCORATIVE : la bannière d'aide du site
   * public n'affiche que les commerciaux actifs QUI ONT UN TÉLÉPHONE. Sans
   * elle, le compte existe mais le conseiller reste invisible aux parents.
   */
  @ApiPropertyOptional({ example: '06 61 07 27 77' })
  @IsOptional()
  @Matches(/^(?:\+212[\s-]?|0)([5-7])[\s-]?(\d[\s-]?){8}$/, {
    message: 'Le numéro de téléphone marocain est invalide.',
  })
  @MaxLength(30)
  telephone?: string;

  /**
   * Un secrétariat SANS ÉTABLISSEMENT RATTACHÉ ne peut rien faire : toutes ses
   * routes passent par `etablissementId`. Le rattachement reste facultatif
   * ici — on crée parfois le compte avant de savoir pour quelle école — et
   * l'écran le signale tant qu'il manque.
   */
  @ApiPropertyOptional({ description: 'Établissement rattaché — secrétariat seulement.' })
  @IsOptional()
  @IsString()
  etablissement_id?: string;
}
