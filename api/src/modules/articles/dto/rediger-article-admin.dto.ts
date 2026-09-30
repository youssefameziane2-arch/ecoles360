import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RedigerArticleDto } from './rediger-article.dto';

/**
 * `POST /admin/articles` — même rédaction, avec un auteur au choix.
 *
 * UN DTO DISTINCT, ET C'EST TOUT L'ENJEU. `etablissement_id` ne peut pas
 * rejoindre `RedigerArticleDto` : ce DTO sert aussi la route de l'espace
 * établissement, où le champ permettrait à une école de publier sur la fiche
 * d'une AUTRE. Là-bas, l'établissement vient de la session et de nulle part
 * ailleurs.
 *
 * Ici, l'administrateur est l'autorité éditoriale : il publie soit au nom de
 * la plateforme (champ absent), soit au nom d'un établissement — c'est le
 * seul moyen de remplir le bloc « Blog » d'une fiche tant que l'école n'a pas
 * de compte.
 */
export class RedigerArticleAdminDto extends RedigerArticleDto {
  @ApiPropertyOptional({
    description:
      'Publier au nom de cet établissement. Absent : article de la plateforme, signé écoles360.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'L’établissement doit être un identifiant.' })
  @Min(1)
  etablissement_id?: number;
}
