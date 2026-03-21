import { Module } from '@nestjs/common';
import { FahrzeugeController } from './fahrzeuge.controller';
import { FahrzeugeService } from './fahrzeuge.service';

@Module({
  controllers: [FahrzeugeController],
  providers: [FahrzeugeService],
  exports: [FahrzeugeService],
})
export class FahrzeugeModule {}
