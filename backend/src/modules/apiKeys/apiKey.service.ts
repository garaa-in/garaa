import crypto from 'crypto';
import { prisma } from '../../prisma';
import { AppError } from '../../middleware/errorHandler.middleware';
import { AuditService } from '../audit/audit.service';

export interface CreateApiKeyInput {
  organizationId: string;
  name: string;
  scopes?: string[];
  expiresInDays?: number;
  actorUserId?: string;
}

export class ApiKeyService {
  public static async listKeys(organizationId: string) {
    return prisma.apiKey.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        revokedAt: true,
        expiresAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  public static async createKey(input: CreateApiKeyInput) {
    const rawSecret = `gk_live_${crypto.randomBytes(24).toString('hex')}`;
    const keyPrefix = rawSecret.slice(0, 16);
    const keyHash = crypto.createHash('sha256').update(rawSecret).digest('hex');

    const scopes = input.scopes && input.scopes.length
      ? input.scopes.join(',')
      : 'read:verifications,write:verifications,read:reports';

    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const apiKey = await prisma.apiKey.create({
      data: {
        organizationId: input.organizationId,
        name: input.name.trim(),
        keyPrefix,
        keyHash,
        scopes,
        expiresAt
      }
    });

    await AuditService.log({
      organizationId: input.organizationId,
      userId: input.actorUserId,
      action: 'API_KEY_CREATED',
      resource: 'ApiKey',
      resourceId: apiKey.id,
      outcome: 'SUCCESS',
      metadata: { name: apiKey.name, keyPrefix, scopes }
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      scopes: apiKey.scopes,
      secretKey: rawSecret, // Displayed ONLY once upon creation!
      createdAt: apiKey.createdAt
    };
  }

  public static async revokeKey(keyId: string, organizationId: string, actorUserId?: string) {
    const existing = await prisma.apiKey.findFirst({
      where: { id: keyId, organizationId }
    });

    if (!existing) throw new AppError('API key not found in your organization.', 404);
    if (existing.revokedAt) throw new AppError('API key is already revoked.', 400);

    const revoked = await prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() }
    });

    await AuditService.log({
      organizationId,
      userId: actorUserId,
      action: 'API_KEY_REVOKED',
      resource: 'ApiKey',
      resourceId: keyId,
      outcome: 'SUCCESS',
      metadata: { keyPrefix: existing.keyPrefix }
    });

    return { message: 'API key successfully revoked.', revokedAt: revoked.revokedAt };
  }
}
