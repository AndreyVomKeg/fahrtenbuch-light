import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GobdService } from '../gobd/gobd.service';
import { Kraftstoff } from '@prisma/client';
import { CreateFahrzeugDto } from './dto/create-fahrzeug.dto';
import { UpdateFahrzeugDto } from './dto/update-fahrzeug.dto';

@Injectable()
export class FahrzeugeService {
  constructor(
    private prisma: PrismaService,
    private gobdService: GobdService,
  ) {}

  async findAll(userId: string, role: string) {
    const where = role === 'ADMIN' ? {} : { userId };
    return this.prisma.fahrzeug.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, role: string) {
    const fahrzeug = await this.prisma.fahrzeug.findUnique({
      where: { id },
    });

    if (!fahrzeug) {
      throw new NotFoundException('Fahrzeug not found');
    }

    if (role !== 'ADMIN' && fahrzeug.userId !== userId) {
      throw new NotFoundException('Fahrzeug not found');
    }

    return fahrzeug;
  }

  async create(
    dto: CreateFahrzeugDto,
    userId: string,
    ip: string,
    userAgent: string,
  ) {
    const fahrzeug = await this.prisma.fahrzeug.create({
      data: {
        userId,
        kennzeichen: dto.kennzeichen,
        marke: dto.marke,
        modell: dto.modell,
        vin: dto.vin,
        kraftstoff: (dto.kraftstoff as Kraftstoff) || Kraftstoff.BENZIN,
        tuvDatum: dto.tuvDatum ? new Date(dto.tuvDatum) : null,
        kmInitial: dto.kmInitial,
        kmCurrent: dto.kmInitial,
      },
    });

    await this.gobdService.logChange({
      entityType: 'fahrzeuge',
      entityId: fahrzeug.id,
      action: 'CREATE',
      userId,
      ipAddress: ip,
      userAgent,
    });

    return fahrzeug;
  }

  async update(
    id: string,
    dto: UpdateFahrzeugDto,
    userId: string,
    role: string,
    ip: string,
    userAgent: string,
  ) {
    const existing = await this.findOne(id, userId, role);

    const data: Record<string, unknown> = {};
    const changes: { field: string; oldValue: string; newValue: string }[] = [];

    if (dto.modell !== undefined && dto.modell !== existing.modell) {
      changes.push({ field: 'modell', oldValue: existing.modell, newValue: dto.modell });
      data.modell = dto.modell;
    }
    if (dto.marke !== undefined && dto.marke !== existing.marke) {
      changes.push({ field: 'marke', oldValue: existing.marke, newValue: dto.marke });
      data.marke = dto.marke;
    }
    if (dto.tuvDatum !== undefined) {
      const oldVal = existing.tuvDatum ? existing.tuvDatum.toISOString() : '';
      const newVal = dto.tuvDatum || '';
      changes.push({ field: 'tuvDatum', oldValue: oldVal, newValue: newVal });
      data.tuvDatum = dto.tuvDatum ? new Date(dto.tuvDatum) : null;
    }
    if (dto.vin !== undefined && dto.vin !== existing.vin) {
      changes.push({ field: 'vin', oldValue: existing.vin || '', newValue: dto.vin || '' });
      data.vin = dto.vin;
    }
    if (dto.kraftstoff !== undefined && dto.kraftstoff !== existing.kraftstoff) {
      changes.push({ field: 'kraftstoff', oldValue: existing.kraftstoff, newValue: dto.kraftstoff });
      data.kraftstoff = dto.kraftstoff;
    }

    if (Object.keys(data).length === 0) {
      return existing;
    }

    const updated = await this.prisma.fahrzeug.update({
      where: { id },
      data,
    });

    for (const change of changes) {
      await this.gobdService.logChange({
        entityType: 'fahrzeuge',
        entityId: id,
        action: 'UPDATE',
        fieldName: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        userId,
        ipAddress: ip,
        userAgent,
      });
    }

    return updated;
  }
}
