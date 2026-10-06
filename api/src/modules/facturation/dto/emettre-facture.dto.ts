import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

/**
 * `POST /admin/abonnements/:id/facture` — RG14, RG18.
 *
 * AUCUN MONTANT ICI, ET C'EST LE POINT. Le montant vient de l'abonnement :
 * laisser l'écran l'envoyer permettrait de facturer autre chose que ce qui a
 * été contractualisé, sans que la facture et l'abonnement ne se contredisent
 * visiblement.
 */
export class EmettreFactureDto {
  @ApiPropertyOptional({
    description:
      'Taux de commission pour cette affaire. Par défaut, le paramètre global — zéro tant que ' +
      'la Direction ne l’a pas fixé, et aucune commission n’est alors créée.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(100)
  commission_pct?: number;
}
