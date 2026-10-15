import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../../prisma';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { AppError } from '../../middleware/errorHandler.middleware';
import { WebhookService } from './webhook.service';

export const webhookRouter = Router();

webhookRouter.use(authenticateJwt);
webhookRouter.use(requireTenant);

const createWebhookSchema = z.object({
  url: z.string().url('Invalid webhook URL format'),
  description: z.string().optional(),
  events: z.array(z.string()).default(['verification.completed', 'verification.status_changed']),
  secret: z.string().optional()
});

webhookRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { organizationId: req.organizationId! },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { deliveries: true }
        }
      }
    });
    res.json({ success: true, data: endpoints });
  } catch (err) {
    next(err);
  }
});

webhookRouter.post('/', requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createWebhookSchema.parse(req.body);
    const secret = validated.secret || `whsec_${crypto.randomBytes(24).toString('hex')}`;

    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        organizationId: req.organizationId!,
        url: validated.url,
        description: validated.description,
        secret,
        events: JSON.stringify(validated.events)
      }
    });

    res.status(201).json({ success: true, data: endpoint });
  } catch (err) {
    next(err);
  }
});

webhookRouter.delete('/:id', requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.webhookEndpoint.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId! }
    });

    if (!existing) throw new AppError('Webhook endpoint not found.', 404);

    await prisma.webhookEndpoint.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true, message: 'Webhook endpoint deleted.' });
  } catch (err) {
    next(err);
  }
});

webhookRouter.post('/:id/test', requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId! }
    });

    if (!endpoint) throw new AppError('Webhook endpoint not found.', 404);

    await WebhookService.dispatch(req.organizationId!, 'ping', {
      message: 'Test ping notification from Garaa verification platform.',
      dispatchedAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'Test ping webhook triggered.' });
  } catch (err) {
    next(err);
  }
});

webhookRouter.get('/deliveries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deliveries = await prisma.webhookDelivery.findMany({
      where: {
        endpoint: {
          organizationId: req.organizationId!
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        endpoint: {
          select: { id: true, url: true }
        }
      }
    });

    res.json({ success: true, data: deliveries });
  } catch (err) {
    next(err);
  }
});
