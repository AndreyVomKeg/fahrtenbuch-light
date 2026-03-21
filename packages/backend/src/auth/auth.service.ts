import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.email, user.role, user.lang);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: (dto.role as Role) || Role.BENUTZER,
        lang: dto.lang || 'de',
      },
    });

    return this.generateTokens(user.id, user.email, user.role, user.lang);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user.id, user.email, user.role, user.lang);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async demo() {
    const demoEmail = 'demo@fahrtenbuch.de';
    let user = await this.prisma.user.findUnique({
      where: { email: demoEmail },
    });

    if (!user) {
      const passwordHash = await bcrypt.hash('demo1234', 12);
      user = await this.prisma.user.create({
        data: {
          email: demoEmail,
          passwordHash,
          role: 'BENUTZER',
          lang: 'de',
        },
      });

      // Create demo vehicles
      await this.prisma.fahrzeug.createMany({
        data: [
          {
            userId: user.id,
            kennzeichen: 'B AB 1234',
            marke: 'BMW',
            modell: '320d',
            kraftstoff: 'DIESEL',
            kmInitial: 45000,
            kmCurrent: 67500,
          },
          {
            userId: user.id,
            kennzeichen: 'M XY 5678',
            marke: 'Volkswagen',
            modell: 'Golf 8',
            kraftstoff: 'BENZIN',
            kmInitial: 12000,
            kmCurrent: 23400,
          },
        ],
      });
    }

    return this.generateTokens(user.id, user.email, user.role, user.lang);
  }

  private generateTokens(
    userId: string,
    email: string,
    role: string,
    lang: string,
  ) {
    const payload = { sub: userId, email, role, lang };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
      expiresIn: '7d',
    });

    return { accessToken, refreshToken, user: { id: userId, email, role, lang } };
  }
}
