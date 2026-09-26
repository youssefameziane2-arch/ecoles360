import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * `PATCH /admin/etablissements/{id}/badges` — RG19, RG27.
 *
 * `note_moy` et `nb_avis` sont exclus DÉLIBÉRÉMENT, malgré la mention dans le
 * livrable 11 §3.4 : ce sont des dénormalisations recalculées par
 * `AvisService.recalculerNote()` (RG08), jamais une saisie manuelle. Les
 * exposer ici romprait l'invariant « la note affichée correspond toujours aux
 * avis publiés ».
 */
export class BadgesEtablissementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sponsorise?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  verifie?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  premium?: boolean;
}
