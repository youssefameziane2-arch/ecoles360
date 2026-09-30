import { Module } from '@nestjs/common';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';

/** Plan de site du site public — hors du préfixe `api/v1` (voir main.ts). */
@Module({
  controllers: [SeoController],
  providers: [SeoService],
})
export class SeoModule {}
