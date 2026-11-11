import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

interface AuditInput {
  actorId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
}

export const auditService = {
  /** Audit logging must never break the main request, so failures are swallowed. */
  async log(input: AuditInput) {
    try {
      await prisma.auditLog.create({ data: input });
    } catch (error) {
      console.error('[audit] failed to write audit log', error);
    }
  },

  recent(limit = 50) {
    return prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
  },
};
