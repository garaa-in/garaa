import { prisma } from '../../prisma';

export interface AuditLogInput {
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  outcome?: 'SUCCESS' | 'FAILURE' | 'DENIED';
  metadata?: Record<string, unknown> | null;
}

export class AuditService {
  public static async log(entry: AuditLogInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          organizationId: entry.organizationId || null,
          userId: entry.userId || null,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId || null,
          ipAddress: entry.ipAddress || null,
          userAgent: entry.userAgent || null,
          outcome: entry.outcome || 'SUCCESS',
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null
        }
      });
    } catch (err) {
      // Append-only audit logger must not crash main thread but should log to stderr
      console.error('[AUDIT_LOG_ERROR]', err);
    }
  }

  public static async listForOrg(organizationId: string, limit = 50, offset = 0) {
    return prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });
  }
}
