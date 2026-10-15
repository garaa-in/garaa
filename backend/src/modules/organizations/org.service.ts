import bcrypt from 'bcryptjs';
import { prisma } from '../../prisma';
import { AppError } from '../../middleware/errorHandler.middleware';
import { AuditService } from '../audit/audit.service';

export interface InviteMemberInput {
  email: string;
  fullName: string;
  role: 'ADMIN' | 'MEMBER' | 'REVIEWER';
  organizationId: string;
  invitedByUserId: string;
}

export class OrgService {
  public static async getOrgDetails(organizationId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
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

    if (!org) throw new AppError('Organization not found', 404);
    return org;
  }

  public static async updateOrg(organizationId: string, data: { name?: string; domain?: string; settings?: string }, actorUserId: string) {
    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: data.name,
        domain: data.domain,
        settings: data.settings
      }
    });

    await AuditService.log({
      organizationId,
      userId: actorUserId,
      action: 'ORGANIZATION_UPDATED',
      resource: 'Organization',
      resourceId: organizationId,
      outcome: 'SUCCESS',
      metadata: data
    });

    return updated;
  }

  public static async listMembers(organizationId: string) {
    return prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            systemRole: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  public static async inviteMember(input: InviteMemberInput) {
    let user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() }
    });

    if (!user) {
      // Auto-provision user with placeholder password
      const salt = await bcrypt.genSalt(10);
      const defaultHash = await bcrypt.hash('GaraaWelcome@2026', salt);
      user = await prisma.user.create({
        data: {
          email: input.email.toLowerCase().trim(),
          fullName: input.fullName.trim(),
          passwordHash: defaultHash,
          systemRole: 'USER'
        }
      });
    }

    const existingMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: input.organizationId,
          userId: user.id
        }
      }
    });

    if (existingMembership) {
      throw new AppError('User is already a member of this organization.', 409);
    }

    const member = await prisma.organizationMember.create({
      data: {
        organizationId: input.organizationId,
        userId: user.id,
        role: input.role,
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        }
      }
    });

    await AuditService.log({
      organizationId: input.organizationId,
      userId: input.invitedByUserId,
      action: 'MEMBER_INVITED',
      resource: 'OrganizationMember',
      resourceId: member.id,
      outcome: 'SUCCESS',
      metadata: { targetEmail: input.email, assignedRole: input.role }
    });

    return member;
  }

  public static async updateMemberRole(organizationId: string, memberId: string, newRole: string, actorUserId: string) {
    const member = await prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId }
    });

    if (!member) throw new AppError('Member not found in this organization.', 404);
    if (member.role === 'OWNER' && newRole !== 'OWNER') {
      throw new AppError('Cannot demote Organization Owner directly. Ownership transfer required.', 400);
    }

    const updated = await prisma.organizationMember.update({
      where: { id: memberId },
      data: { role: newRole }
    });

    await AuditService.log({
      organizationId,
      userId: actorUserId,
      action: 'MEMBER_ROLE_UPDATED',
      resource: 'OrganizationMember',
      resourceId: memberId,
      outcome: 'SUCCESS',
      metadata: { newRole }
    });

    return updated;
  }

  public static async removeMember(organizationId: string, memberId: string, actorUserId: string) {
    const member = await prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId }
    });

    if (!member) throw new AppError('Member not found in this organization.', 404);
    if (member.role === 'OWNER') {
      throw new AppError('Cannot remove Organization Owner.', 400);
    }

    await prisma.organizationMember.delete({
      where: { id: memberId }
    });

    await AuditService.log({
      organizationId,
      userId: actorUserId,
      action: 'MEMBER_REMOVED',
      resource: 'OrganizationMember',
      resourceId: memberId,
      outcome: 'SUCCESS'
    });

    return { message: 'Member successfully removed.' };
  }
}
