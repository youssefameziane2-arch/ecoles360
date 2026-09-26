import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt, Min } from 'class-validator';

/**
 * `PUT /admin/faq/ordre` — livrable 11 §3.7, « /faq (+ réordonnancement) ».
 *
 * LA LISTE ENVOYÉE DOIT ÊTRE COMPLÈTE : le service refuse un sous-ensemble.
 * C'est volontaire — l'écran d'administration réordonne une liste qu'il détient
 * entière, et un envoi partiel signifie presque toujours qu'une question a été
 * ajoutée ou supprimée entre-temps par quelqu'un d'autre. Mieux vaut un refus
 * lisible qu'un rangement silencieusement faux.
 */
export class OrdreFaqDto {
  @ApiProperty({ type: [Number], example: [3, 1, 2] })
  @IsArray()
  @ArrayNotEmpty({ message: 'La liste des questions est obligatoire.' })
  @IsInt({ each: true, message: 'Chaque identifiant doit être un entier.' })
  @Min(1, { each: true })
  ids!: number[];
}
