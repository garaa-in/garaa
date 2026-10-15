import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { authRateLimiter } from '../../middleware/rateLimit.middleware';

export const authRouter = Router();

const registerCompanySchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  companySlug: z.string().optional(),
  companyDomain: z.string().optional(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required')
});

const resetRequestSchema = z.object({
  email: z.string().email('Invalid email address format')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
});

authRouter.post('/register', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = registerCompanySchema.parse(req.body);
    const result = await AuthService.registerCompany({
      ...validated,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await AuthService.login({
      ...validated,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', authenticateJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const profile = await AuthService.getProfile(req.user.id);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/password/forgot', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = resetRequestSchema.parse(req.body);
    const result = await AuthService.requestPasswordReset(validated.email);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/password/reset', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = resetPasswordSchema.parse(req.body);
    const result = await AuthService.resetPassword(validated.token, validated.newPassword);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
