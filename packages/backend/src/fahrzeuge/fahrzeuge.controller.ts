import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { FahrzeugeService } from './fahrzeuge.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateFahrzeugDto } from './dto/create-fahrzeug.dto';
import { UpdateFahrzeugDto } from './dto/update-fahrzeug.dto';

@Controller('fahrzeuge')
@UseGuards(JwtAuthGuard)
export class FahrzeugeController {
  constructor(private fahrzeugeService: FahrzeugeService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string; role: string }) {
    return this.fahrzeugeService.findAll(user.id, user.role);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.fahrzeugeService.findOne(id, user.id, user.role);
  }

  @Post()
  create(
    @Body() dto: CreateFahrzeugDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const ua = req.headers['user-agent'] || 'unknown';
    return this.fahrzeugeService.create(dto, user.id, ip, ua);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFahrzeugDto,
    @CurrentUser() user: { id: string; role: string },
    @Req() req: Request,
  ) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const ua = req.headers['user-agent'] || 'unknown';
    return this.fahrzeugeService.update(id, dto, user.id, user.role, ip, ua);
  }
}
