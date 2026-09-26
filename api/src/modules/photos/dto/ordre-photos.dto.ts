import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNumberString } from 'class-validator';

/**
 * Nouvel ordre de la galerie — la liste COMPLÈTE des identifiants.
 *
 * `IsNumberString` et non `IsInt` : les identifiants sont des `BigInt`
 * sérialisés en chaînes (livrable 11 §1). Les faire transiter en nombre les
 * tronquerait au-delà de 2^53 — improbable ici, mais le contrat est le même
 * partout et il n'y a aucune raison de l'entamer.
 */
export class OrdrePhotosDto {
  @ApiProperty({ type: [String], example: ['12', '9', '14'] })
  @IsArray()
  @ArrayNotEmpty({ message: 'La liste des photos est vide.' })
  @IsNumberString({}, { each: true, message: 'Identifiant de photo invalide.' })
  ids!: string[];
}
