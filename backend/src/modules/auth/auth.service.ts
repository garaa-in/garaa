import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../prisma';
import { config } from '../../config';
import { AppError } from '../../middleware/errorHandler.middleware';
import { AuditService } from '../audit/audit.service';

export interface RegisterCompanyInput {
  companyName: string;
  companySlug?: string;
  companyDomain?: string;
  fullName: string;
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuthService {
  public static async registerCompany(input: RegisterCompanyInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() }
    });

    if (existingUser) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    const slug = (input.companySlug || input.companyName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `org-${Date.now()}`;

    const existingOrg = await prisma.organization.findUnique({ where: { slug } });
    if (existingOrg) {
      throw new AppError(`Organization slug '${slug}' is already taken. Please choose another name or slug.`, 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase().trim(),
        fullName: input.fullName.trim(),
        passwordHash,
        systemRole: 'USER'
      }
    });

    const org = await prisma.organization.create({
      data: {
        name: input.companyName.trim(),
        slug,
        domain: input.companyDomain ? input.companyDomain.trim() : null
      }
    });

    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: 'OWNER',
        status: 'ACTIVE'
      }
    });

    await AuditService.log({
      organizationId: org.id,
      userId: user.id,
      action: 'ORGANIZATION_REGISTERED',
      resource: 'Organization',
      resourceId: org.id,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      outcome: 'SUCCESS',
      metadata: { companyName: org.name, slug: org.slug }
    });

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        systemRole: user.systemRole
      },
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        role: 'OWNER'
      }
    };
  }

  public static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: { organization: true }
        }
      }
    });

    if (!user) {
      await AuditService.log({
        action: 'USER_LOGIN',
        resource: 'User',
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        outcome: 'FAILURE',
        metadata: { email: input.email, reason: 'User not found' }
      });
      throw new AppError('Invalid email or password.', 401);
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      await AuditService.log({
        userId: user.id,
        action: 'USER_LOGIN',
        resource: 'User',
        resourceId: user.id,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        outcome: 'FAILURE',
        metadata: { email: input.email, reason: 'Incorrect password' }
      });
      throw new AppError('Invalid email or password.', 401);
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });

    const activeMembership = user.memberships[0];

    await AuditService.log({
      organizationId: activeMembership?.organizationId,
      userId: user.id,
      action: 'USER_LOGIN',
      resource: 'User',
      resourceId: user.id,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      outcome: 'SUCCESS'
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        systemRole: user.systemRole
      },
      organizations: user.memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role
      })),
      activeOrganization: activeMembership ? {
        id: activeMembership.organization.id,
        name: activeMembership.organization.name,
        slug: activeMembership.organization.slug,
        role: activeMembership.role
      } : null
    };
  }

  public static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        systemRole: true,
        createdAt: true,
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            organization: true
          }
        }
      }
    });

    if (!user) throw new AppError('User not found.', 404);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        systemRole: user.systemRole,
        createdAt: user.createdAt
      },
      organizations: user.memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role
      }))
    };
  }

  public static async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      // Do not leak whether user exists
      return { message: 'If an account exists with this email, password reset instructions have been dispatched.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires: resetExpires
      }
    });

    await AuditService.log({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      resource: 'User',
      resourceId: user.id,
      outcome: 'SUCCESS'
    });

    return {
      message: 'Password reset token generated.',
      // In development / demo environment, return the token so it can be tested directly
      resetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined
    };
  }

  public static async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() }
      }
    });

    if (!user) {
      throw new AppError('Password reset token is invalid or has expired.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null
      }
    });

    await AuditService.log({
      userId: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      resource: 'User',
      resourceId: user.id,
      outcome: 'SUCCESS'
    });

    return { message: 'Password has been successfully updated.' };
  }
}
