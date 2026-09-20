import { ApiProperty } from '@nestjs/swagger';

/** État d'une dépendance : `ok` si l'aller-retour a abouti dans le délai imparti. */
export enum StatutDependance {
  Ok = 'ok',
  Erreur = 'erreur',
}

/** État global du service. */
export enum StatutSante {
  /** Toutes les dépendances répondent — HTTP 200. */
  Ok = 'ok',
  /** Au moins une dépendance est en échec — HTTP 503. */
  Degrade = 'degrade',
}

export class DependanceSanteDto {
  @ApiProperty({ enum: StatutDependance, example: StatutDependance.Ok })
  statut!: StatutDependance;

  @ApiProperty({ example: 4, description: "Durée de l'aller-retour, en millisecondes." })
  duree_ms!: number;

  @ApiProperty({
    required: false,
    example: 'connect ECONNREFUSED 127.0.0.1:6379',
    description: "Cause de l'échec. Absent quand la dépendance répond.",
  })
  erreur?: string;
}

export class DependancesSanteDto {
  @ApiProperty({ type: DependanceSanteDto, description: 'MySQL 8 — aller-retour `SELECT 1`.' })
  mysql!: DependanceSanteDto;

  @ApiProperty({ type: DependanceSanteDto, description: 'Redis 7 — commande `PING`.' })
  redis!: DependanceSanteDto;
}

/**
 * Corps de la réponse `200` de `GET /api/v1/health`.
 *
 * En cas d'échec, le même contenu est servi dans le `details` de l'erreur `503`
 * au format du livrable 11 §1 — la sonde rapporte toujours le détail par
 * dépendance, quel que soit le statut.
 */
export class HealthResponseDto {
  @ApiProperty({ enum: StatutSante, example: StatutSante.Ok })
  statut!: StatutSante;

  @ApiProperty({
    example: '0.1.0',
    description:
      "Version applicative. En production, le SHA de commit qui tague l'image (livrable 14 §3).",
  })
  version!: string;

  @ApiProperty({ example: '2026-09-20T13:24:11.482Z', description: 'Horodatage ISO 8601 (UTC).' })
  horodatage!: string;

  @ApiProperty({ example: 6, description: 'Durée totale de la vérification, en millisecondes.' })
  duree_ms!: number;

  @ApiProperty({ type: DependancesSanteDto })
  dependances!: DependancesSanteDto;
}
