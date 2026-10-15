import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { VerificationService } from './verification.service';
import { authenticateFlexible } from '../../middleware/apiKey.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

export const verificationRouter = Router();

verificationRouter.use(authenticateFlexible('read:verifications'));

const createVerificationSchema = z.object({
  documentId: z.string().uuid().optional(),
  subjectName: z.string().min(2, 'Subject name must be at least 2 characters'),
  subjectDob: z.string().optional(),
  declaredIdentifier: z.string().optional(),
  documentCategory: z.string().min(2, 'Document category is required'),
  extractedText: z.string().optional()
});

const reviewDecisionSchema = z.object({
  decision: z.enum(['VERIFIED', 'REJECTED', 'UNABLE_TO_VERIFY']),
  notes: z.string().min(2, 'Reviewer notes are mandatory for audit trail')
});

verificationRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createVerificationSchema.parse(req.body);
    const result = await VerificationService.createAndProcess({
      ...validated,
      organizationId: req.organizationId!,
      actorUserId: req.user?.id
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

verificationRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string;
    const category = req.query.category as string;
    const search = req.query.search as string;
    const limit = parseInt(req.query.limit as string || '50', 10);
    const offset = parseInt(req.query.offset as string || '0', 10);

    const result = await VerificationService.listVerifications(
      req.organizationId!,
      { status, category, search },
      limit,
      offset
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

verificationRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await VerificationService.getVerificationById(req.params.id, req.organizationId!);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

verificationRouter.post('/:id/review', requireRole(['REVIEWER', 'ADMIN', 'OWNER']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = reviewDecisionSchema.parse(req.body);
    const result = await VerificationService.submitReviewDecision({
      verificationId: req.params.id,
      organizationId: req.organizationId!,
      reviewerId: req.user ? req.user.id : 'api-reviewer',
      decision: validated.decision,
      notes: validated.notes
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
