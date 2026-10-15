import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../prisma';

export const requireApiKey = (requiredScope?: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const rawKey = req.headers['x-api-key'] as string;
    if (!rawKey) {
      res.status(401).json({
        success: false,
        error: 'Authentication failed. Please provide a valid B2B API key via the X-API-Key header.'
      });
      return;
    }

    if (!rawKey.startsWith('gk_live_') && !rawKey.startsWith('gk_test_')) {
      res.status(401).json({
        success: false,
        error: 'Invalid API key format. Expected standard Garaa prefix (gk_live_... or gk_test_...).'
      });
      return;
    }

    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { organization: true }
    });

    if (!apiKey) {
      res.status(401).json({ success: false, error: 'Unauthorized: Invalid API key.' });
      return;
    }

    if (apiKey.revokedAt) {
      res.status(403).json({ success: false, error: 'Unauthorized: This API key has been revoked.' });
      return;
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      res.status(403).json({ success: false, error: 'Unauthorized: This API key has expired.' });
      return;
    }

    if (requiredScope) {
      const allowedScopes = apiKey.scopes.split(',').map((s) => s.trim());
      if (!allowedScopes.includes(requiredScope) && !allowedScopes.includes('*')) {
        res.status(403).json({
          success: false,
          error: `Forbidden: API key lacks required scope '${requiredScope}'. Granted scopes: [${allowedScopes.join(', ')}]`
        });
        return;
      }
    }

    // Update lastUsedAt asynchronously
    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() }
    }).catch(console.error);

    req.isApiKey = true;
    req.apiKeyId = apiKey.id;
    req.organizationId = apiKey.organizationId;
    req.orgRole = 'API_CLIENT';

    next();
  };
};

// Flexible auth: supports either Bearer JWT or X-API-Key
export const authenticateFlexible = (requiredScope?: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.headers['x-api-key']) {
      return requireApiKey(requiredScope)(req, res, next);
    }
    // Fall back to JWT
    const { authenticateJwt } = await import('./auth.middleware');
    const { requireTenant } = await import('./tenant.middleware');
    authenticateJwt(req, res, (err) => {
      if (err) return next(err);
      requireTenant(req, res, next);
    });
  };
};
