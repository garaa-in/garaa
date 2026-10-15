import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const requireTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // If request was authenticated via API key, req.organizationId is already set
  if (req.isApiKey && req.organizationId) {
    next();
    return;
  }

  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required before tenant resolution.' });
    return;
  }

  // Tenant ID can be provided via header or query or body
  const requestedOrgId = (req.headers['x-organization-id'] as string) || req.query.orgId as string || (req.body && req.body.organizationId);

  // Platform admin bypass if specifically flagged
  if (req.user.systemRole === 'PLATFORM_ADMIN') {
    if (requestedOrgId) {
      req.organizationId = requestedOrgId;
      req.orgRole = 'PLATFORM_ADMIN';
      next();
      return;
    }
  }

  // Find membership
  let membership;
  if (requestedOrgId) {
    membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: requestedOrgId,
          userId: req.user.id
        }
      },
      include: { organization: true }
    });
  } else {
    // Default to user's first active organization
    membership = await prisma.organizationMember.findFirst({
      where: {
        userId: req.user.id,
        status: 'ACTIVE'
      },
      include: { organization: true }
    });
  }

  if (!membership || membership.status !== 'ACTIVE') {
    res.status(403).json({
      success: false,
      error: 'Access denied: You do not have active authorized access to this organization.'
    });
    return;
  }

  req.organizationId = membership.organizationId;
  req.orgRole = membership.role;
  next();
};
