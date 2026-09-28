import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum } from 'class-validator';
import { PermissionPortee } from '../../../generated/prisma';

/** Accorder ou retirer une portée déléguée — RG05. */
export class PorteeSecretariatDto {
  @ApiProperty({ enum: PermissionPortee, description: 'RG05 — fiches · contacts · avis.' })
  @IsEnum(PermissionPortee, { message: "Cette portée n'existe pas." })
  portee!: PermissionPortee;

  @ApiProperty({ description: 'true accorde, false révoque.' })
  @IsBoolean()
  accordee!: boolean;
}
