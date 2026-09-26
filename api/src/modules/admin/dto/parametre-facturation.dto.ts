import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

/**
 * `PUT /admin/parametres-facturation/{cle}` — livrable 11 §3.4.
 *
 * La valeur est stockée en chaîne (colonne `varchar`), mais toutes les clés
 * connues portent un nombre : le motif l'impose ici pour qu'une TVA « vingt »
 * ne parte pas en base et ne casse pas un calcul de facture plus tard.
 */
export class ParametreFacturationDto {
  @ApiProperty({ example: '20' })
  @IsString()
  @IsNotEmpty({ message: 'La valeur est obligatoire.' })
  @MaxLength(40)
  @Matches(/^\d+([.,]\d{1,2})?$/, {
    message: 'La valeur doit être un nombre, avec au plus deux décimales.',
  })
  valeur!: string;
}
