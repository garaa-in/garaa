import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/errorHandler.middleware';

export const adminRouter = Router();

// Strictly protect all administrative routes with PLATFORM_ADMIN check
adminRouter.use(authenticateJwt);
adminRouter.use((req: Request, res: Response, next: NextFunction) => {
  if (req.user?.systemRole !== 'PLATFORM_ADMIN') {
    res.status(403).json({
      success: false,
      error: 'Forbidden: Garaa Platform Administrator credentials required for system operations.'
    });
    return;
  }
  next();
});

adminRouter.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalOrgs,
      totalUsers,
      totalVerifications,
      reviewQueueCount,
      recentErrors
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.verificationRequest.count(),
      prisma.verificationRequest.count({ where: { status: 'NEEDS_REVIEW' } }),
      prisma.auditLog.count({ where: { outcome: { in: ['FAILURE', 'DENIED'] } } })
    ]);

    res.json({
      success: true,
      data: {
        totalOrganizations: totalOrgs,
        totalUsers,
        totalVerifications,
        reviewQueueCount,
        recentErrorsCount: recentErrors,
        providers: [
          {
            provider: 'DigiLocker Gateway',
            status: 'UNCONFIGURED (DEMO MODE)',
            notes: 'Requires production OAuth2 Client ID & private key'
          },
          {
            provider: 'UIDAI Offline e-KYC PKI',
            status: 'UNCONFIGURED (DEMO MODE)',
            notes: 'Requires active UIDAI AUA/KUA license certificate'
          },
          {
            provider: 'National Academic Depository (NAD)',
            status: 'UNCONFIGURED (DEMO MODE)',
            notes: 'Requires accredited institution API access token'
          },
          {
            provider: 'Local Criminal Screening Index',
            status: 'ACTIVE (DEMO INDEX)',
            notes: 'Running local test dataset'
          }
        ]
      }
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/organizations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            members: true,
            verificationRequests: true,
            apiKeys: true
          }
        }
      }
    });

    res.json({ success: true, data: orgs });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/review-queue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queue = await prisma.verificationRequest.findMany({
      where: { status: 'NEEDS_REVIEW' },
      orderBy: { createdAt: 'asc' },
      include: {
        organization: {
          select: { id: true, name: true, slug: true }
        },
        document: true,
        checks: true
      }
    });

    res.json({ success: true, data: queue });
  } catch (err) {
    next(err);
  }
});
