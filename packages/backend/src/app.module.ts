import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FahrzeugeModule } from './fahrzeuge/fahrzeuge.module';
import { OdometerModule } from './odometer/odometer.module';
import { GobdModule } from './gobd/gobd.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FahrzeugeModule,
    OdometerModule,
    GobdModule,
    HealthModule,
  ],
})
export class AppModule {}
