import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { authenticateFlexible } from '../../middleware/apiKey.middleware';

export const dashboardRouter = Router();

dashboardRouter.use(authenticateFlexible('read:verifications'));

dashboardRouter.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId!;

    const [
      totalRequests,
      verifiedCount,
      failedCount,
      reviewCount,
      unableCount,
      recentVerifications,
      categoryGroup,
      apiKeysCount
    ] = await Promise.all([
      prisma.verificationRequest.count({ where: { organizationId: orgId } }),
      prisma.verificationRequest.count({ where: { organizationId: orgId, status: 'VERIFIED' } }),
      prisma.verificationRequest.count({ where: { organizationId: orgId, status: { in: ['FAILED', 'REJECTED'] } } }),
      prisma.verificationRequest.count({ where: { organizationId: orgId, status: 'NEEDS_REVIEW' } }),
      prisma.verificationRequest.count({ where: { organizationId: orgId, status: 'UNABLE_TO_VERIFY' } }),
      prisma.verificationRequest.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          requestNumber: true,
          subjectName: true,
          documentCategory: true,
          status: true,
          riskLevel: true,
          confidenceScore: true,
          credentialId: true,
          createdAt: true
        }
      }),
      prisma.verificationRequest.groupBy({
        by: ['documentCategory'],
        where: { organizationId: orgId },
        _count: { id: true }
      }),
      prisma.apiKey.count({ where: { organizationId: orgId, revokedAt: null } })
    ]);

    const completed = verifiedCount + failedCount + unableCount;
    const successRate = completed > 0 ? Math.round((verifiedCount / completed) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalRequests,
        completedCount: completed,
        pendingCount: totalRequests - completed - reviewCount,
        verifiedCount,
        failedCount,
        reviewCount,
        unableCount,
        successRate,
        categoryDistribution: categoryGroup.map((c) => ({
          category: c.documentCategory,
          count: c._count.id
        })),
        apiKeysCount,
        recentActivity: recentVerifications
      }
    });
  } catch (err) {
    next(err);
  }
});
