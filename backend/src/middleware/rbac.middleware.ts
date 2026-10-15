import { Request, Response, NextFunction } from 'express';

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // If request authenticated via API key with appropriate scopes, allow
    if (req.isApiKey) {
      next();
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (req.user.systemRole === 'PLATFORM_ADMIN') {
      next();
      return;
    }

    const currentRole = req.orgRole;
    if (!currentRole || !allowedRoles.includes(currentRole)) {
      res.status(403).json({
        success: false,
        error: `Insufficient permissions. Requires one of: [${allowedRoles.join(', ')}]. Current role: ${currentRole || 'none'}`
      });
      return;
    }

    next();
  };
};
