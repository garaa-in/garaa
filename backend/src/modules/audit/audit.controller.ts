import { Router, Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

export const auditRouter = Router();

auditRouter.use(authenticateJwt);
auditRouter.use(requireTenant);
auditRouter.use(requireRole(['OWNER', 'ADMIN', 'REVIEWER']));

auditRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string || '50', 10);
    const offset = parseInt(req.query.offset as string || '0', 10);

    const logs = await AuditService.listForOrg(req.organizationId!, limit, offset);
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});
