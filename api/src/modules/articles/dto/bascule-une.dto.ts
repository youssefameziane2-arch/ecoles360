import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/** `PATCH /admin/articles/{id}/a-la-une` — un seul article à la une. */
export class BasculeUneDto {
  @ApiProperty()
  @IsBoolean()
  a_la_une!: boolean;
}
