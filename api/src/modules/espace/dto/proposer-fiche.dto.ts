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
  Validate,
  ValidateIf,
  ValidateNested,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

/** Les plateformes que la maquette affiche — `socDefs` du site public. */
const RESEAUX_CONNUS = ['facebook', 'instagram', 'linkedin', 'youtube', 'tiktok', 'web'] as const;

/**
 * Valide `socials` : clés connues, valeurs en http(s).
 *
 * UN VALIDATEUR SUR MESURE PARCE QUE LA FORME EST UN DICTIONNAIRE. Les
 * décorateurs de `class-validator` portent sur des champs déclarés ; ici les
 * clés SONT la donnée. La seule autre voie aurait été de remplacer l'objet par
 * six champs nommés — ce qui aurait cassé le format déjà stocké en base et
 * déjà lu par la fiche publique.
 */
@ValidatorConstraint({ name: 'reseauxSociauxValides' })
export class ReseauxSociauxValides implements ValidatorConstraintInterface {
  validate(valeur: unknown): boolean {
    if (valeur === undefined || valeur === null) return true;
    if (typeof valeur !== 'object' || Array.isArray(valeur)) return false;

    return Object.entries(valeur as Record<string, unknown>).every(([cle, lien]) => {
      if (!(RESEAUX_CONNUS as readonly string[]).includes(cle)) return false;
      if (typeof lien !== 'string') return false;
      // Vider un réseau est une façon légitime de le retirer.
      if (lien.trim() === '') return true;

      try {
        // `new URL` plutôt qu'une expression régulière : c'est l'analyseur du
        // navigateur, donc exactement ce qui décidera du sort de l'`href`.
        const url = new URL(lien);

        return (url.protocol === 'http:' || url.protocol === 'https:') && lien.length <= 300;
      } catch {
        return false;
      }
    });
  }

  defaultMessage(): string {
    return `Les réseaux sociaux acceptent ${RESEAUX_CONNUS.join(', ')}, avec une adresse http ou https.`;
  }
}

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
/**
 * Un membre de l'équipe pédagogique — onglet « Équipe » de la fiche.
 *
 * LA PHOTO EST UNE URL, PAS UN TÉLÉVERSEMENT. La galerie de la fiche a son
 * propre circuit (`/fiche/photos`, volume `storage`) ; un portrait n'a pas
 * besoin du même. Tant qu'aucune route ne le prend en charge, le champ reste
 * vide et `TeamMember` retombe sur un monogramme — ce qui vaut mieux qu'une
 * silhouette générique répétée dix fois.
 */
export class MembreEquipeDto {
  @ApiPropertyOptional({ example: 'Mme Laila Cherkaoui' })
  @IsString()
  @MaxLength(120)
  nom!: string;

  @ApiPropertyOptional({ example: 'Directrice pédagogique' })
  @IsString()
  @MaxLength(120)
  role!: string;

  @ApiPropertyOptional({ description: 'Portrait, facultatif.' })
  @ValidateIf((_, valeur) => valeur !== undefined && valeur !== '')
  @IsUrl({ require_protocol: true }, { message: 'Le portrait doit être une URL complète.' })
  @MaxLength(300)
  photo?: string;
}

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

  /**
   * Liens des réseaux sociaux — plateformes connues, adresses web seules.
   *
   * CES VALEURS DEVIENNENT DES `href` SUR LE SITE PUBLIC, et c'est pourquoi
   * elles ne peuvent plus être un objet quelconque. Un `@IsObject()` seul
   * laissait passer `{"facebook": "javascript:…"}` : la fiche passait bien par
   * la file de propositions (RG20), mais l'administrateur y relit un nom de
   * plateforme, pas une URL. Le lien partait alors sur chaque visite de la
   * page publique.
   *
   * LES CLÉS SONT UNE LISTE FERMÉE. Libres, elles produisaient des pastilles
   * au nom choisi par l'établissement — « Contactez-nous ! » en guise de
   * réseau social — et rien n'empêchait d'en poser cinquante.
   */
  @ApiPropertyOptional({
    description: 'Liens des réseaux sociaux, par plateforme connue. Adresses http ou https.',
    example: { facebook: 'https://facebook.com/mon-ecole' },
  })
  @IsOptional()
  @IsObject()
  @Validate(ReseauxSociauxValides)
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

  @ApiPropertyOptional({ type: [MembreEquipeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MembreEquipeDto)
  equipe?: MembreEquipeDto[];

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
