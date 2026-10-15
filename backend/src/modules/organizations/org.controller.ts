import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { OrgService } from './org.service';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

export const orgRouter = Router();

orgRouter.use(authenticateJwt);
orgRouter.use(requireTenant);

const updateOrgSchema = z.object({
  name: z.string().min(2).optional(),
  domain: z.string().optional(),
  settings: z.string().optional()
});

const inviteMemberSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  role: z.enum(['ADMIN', 'MEMBER', 'REVIEWER'])
});

const updateRoleSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'REVIEWER'])
});

orgRouter.get(['/current', '/me'], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await OrgService.getOrgDetails(req.organizationId!);
    const members = await OrgService.listMembers(req.organizationId!);
    res.json({ success: true, data: { organization: org, members } });
  } catch (err) {
    next(err);
  }
});

orgRouter.patch('/current', requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = updateOrgSchema.parse(req.body);
    const updated = await OrgService.updateOrg(req.organizationId!, validated, req.user!.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

orgRouter.get('/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await OrgService.listMembers(req.organizationId!);
    res.json({ success: true, data: members });
  } catch (err) {
    next(err);
  }
});

orgRouter.post('/members/invite', requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = inviteMemberSchema.parse(req.body);
    const member = await OrgService.inviteMember({
      ...validated,
      organizationId: req.organizationId!,
      invitedByUserId: req.user!.id
    });
    res.status(201).json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
});

orgRouter.patch('/members/:id/role', requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = updateRoleSchema.parse(req.body);
    const updated = await OrgService.updateMemberRole(req.organizationId!, req.params.id, validated.role, req.user!.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

orgRouter.delete('/members/:id', requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await OrgService.removeMember(req.organizationId!, req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
