import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeAction } from '@prisma/client';

interface ChangeLogEntry {
  entityType: string;
  entityId: string;
  action: keyof typeof ChangeAction;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
}

@Injectable()
export class GobdService {
  private readonly logger = new Logger(GobdService.name);

  constructor(private prisma: PrismaService) {}

  async logChange(entry: ChangeLogEntry) {
    try {
      await this.prisma.changeLog.create({
        data: {
          entityType: entry.entityType,
          entityId: entry.entityId,
          action: entry.action as ChangeAction,
          fieldName: entry.fieldName || null,
          oldValue: entry.oldValue || null,
          newValue: entry.newValue || null,
          reason: entry.reason || null,
          userId: entry.userId,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      });
      this.logger.log(
        `GoBD: ${entry.action} on ${entry.entityType}/${entry.entityId}`,
      );
    } catch (error) {
      this.logger.error('Failed to write GoBD change log', error);
      throw error;
    }
  }
}
