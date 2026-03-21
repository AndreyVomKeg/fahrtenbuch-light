import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { OdometerService } from './odometer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateOdometerDto } from './dto/create-odometer.dto';

@Controller('odometer')
@UseGuards(JwtAuthGuard)
export class OdometerController {
  constructor(private odometerService: OdometerService) {}

  @Get(':fahrzeugId')
  findByFahrzeug(
    @Param('fahrzeugId') fahrzeugId: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.odometerService.findByFahrzeug(fahrzeugId, user.id, user.role);
  }

  @Post()
  create(
    @Body() dto: CreateOdometerDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const ua = req.headers['user-agent'] || 'unknown';
    return this.odometerService.create(dto, user.id, ip, ua);
  }
}
