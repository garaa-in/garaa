import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiKeyService } from './apiKey.service';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

export const apiKeyRouter = Router();

apiKeyRouter.use(authenticateJwt);
apiKeyRouter.use(requireTenant);

const createKeySchema = z.object({
  name: z.string().min(2, 'Key name must be at least 2 characters'),
  scopes: z.array(z.string()).optional(),
  expiresInDays: z.number().int().positive().optional()
});

apiKeyRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keys = await ApiKeyService.listKeys(req.organizationId!);
    res.json({ success: true, data: keys });
  } catch (err) {
    next(err);
  }
});

apiKeyRouter.post('/', requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createKeySchema.parse(req.body);
    const result = await ApiKeyService.createKey({
      ...validated,
      organizationId: req.organizationId!,
      actorUserId: req.user?.id
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

apiKeyRouter.delete('/:id', requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ApiKeyService.revokeKey(req.params.id, req.organizationId!, req.user?.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
