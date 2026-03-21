import { Global, Module } from '@nestjs/common';
import { GobdService } from './gobd.service';

@Global()
@Module({
  providers: [GobdService],
  exports: [GobdService],
})
export class GobdModule {}
