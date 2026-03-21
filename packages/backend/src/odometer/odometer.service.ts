import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GobdService } from '../gobd/gobd.service';
import { CreateOdometerDto } from './dto/create-odometer.dto';

@Injectable()
export class OdometerService {
  constructor(
    private prisma: PrismaService,
    private gobdService: GobdService,
  ) {}

  async findByFahrzeug(fahrzeugId: string, userId: string, role: string) {
    const fahrzeug = await this.prisma.fahrzeug.findUnique({
      where: { id: fahrzeugId },
    });

    if (!fahrzeug) {
      throw new NotFoundException('Fahrzeug not found');
    }

    if (role !== 'ADMIN' && fahrzeug.userId !== userId) {
      throw new NotFoundException('Fahrzeug not found');
    }

    return this.prisma.odometerReading.findMany({
      where: { fahrzeugId },
      orderBy: { datum: 'desc' },
    });
  }

  async create(
    dto: CreateOdometerDto,
    userId: string,
    ip: string,
    userAgent: string,
  ) {
    const fahrzeug = await this.prisma.fahrzeug.findUnique({
      where: { id: dto.fahrzeugId },
    });

    if (!fahrzeug) {
      throw new NotFoundException('Fahrzeug not found');
    }

    const reading = await this.prisma.odometerReading.create({
      data: {
        fahrzeugId: dto.fahrzeugId,
        userId,
        datum: new Date(dto.datum),
        kmStand: dto.kmStand,
        quelle: 'KONTROLLE',
      },
    });

    // Update current km on vehicle
    if (dto.kmStand > fahrzeug.kmCurrent) {
      await this.prisma.fahrzeug.update({
        where: { id: dto.fahrzeugId },
        data: { kmCurrent: dto.kmStand },
      });
    }

    await this.gobdService.logChange({
      entityType: 'odometer_readings',
      entityId: reading.id,
      action: 'CREATE',
      userId,
      ipAddress: ip,
      userAgent,
    });

    return reading;
  }
}
