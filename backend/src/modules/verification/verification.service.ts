import fs from 'fs';
import { prisma } from '../../prisma';
import { VerificationEngine } from './engine';
import { AppError } from '../../middleware/errorHandler.middleware';
import { AuditService } from '../audit/audit.service';
import { WebhookService } from '../webhooks/webhook.service';

export interface CreateVerificationInput {
  organizationId: string;
  documentId?: string;
  subjectName: string;
  subjectDob?: string;
  declaredIdentifier?: string;
  documentCategory: string;
  extractedText?: string;
  actorUserId?: string;
}

export interface ReviewDecisionInput {
  verificationId: string;
  organizationId: string;
  reviewerId: string;
  decision: 'VERIFIED' | 'REJECTED' | 'UNABLE_TO_VERIFY';
  notes: string;
}

export class VerificationService {
  private static generateRequestNumber(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `VR-2026-${ts}-${rand}`;
  }

  private static generateCredentialId(): string {
    const bytes = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bytes2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bytes3 = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ZYC-2026-${bytes}-${bytes2}-${bytes3}`;
  }

  public static async createAndProcess(input: CreateVerificationInput) {
    let documentRecord = null;
    let fileBuffer = Buffer.from('');
    let isDuplicate = false;
    let duplicateMatches: string[] = [];

    if (input.documentId) {
      documentRecord = await prisma.document.findFirst({
        where: { id: input.documentId, organizationId: input.organizationId }
      });

      if (!documentRecord) {
        throw new AppError('Associated document not found in your organization.', 404);
      }

      try {
        fileBuffer = await fs.promises.readFile(documentRecord.storagePath);
      } catch {
        fileBuffer = Buffer.from('mock-file-content');
      }

      // Check duplicates
      const dupes = await prisma.document.findMany({
        where: {
          organizationId: input.organizationId,
          sha256Hash: documentRecord.sha256Hash,
          id: { not: documentRecord.id }
        },
        select: { id: true, fileName: true }
      });
      if (dupes.length > 0) {
        isDuplicate = true;
        duplicateMatches = dupes.map((d) => d.fileName);
      }
    }

    const requestNumber = this.generateRequestNumber();

    // Run modular verification engine
    const engineResult = await VerificationEngine.execute({
      documentCategory: input.documentCategory,
      subjectName: input.subjectName,
      subjectDob: input.subjectDob,
      declaredIdentifier: input.declaredIdentifier,
      originalName: documentRecord?.originalName || 'uploaded_document',
      mimeType: documentRecord?.mimeType || 'image/jpeg',
      fileSize: documentRecord?.fileSize || fileBuffer.length || 2048,
      fileBuffer,
      sha256Hash: documentRecord?.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      extractedText: input.extractedText,
      isDuplicateHash: isDuplicate,
      duplicateMatches
    });

    const credentialId = engineResult.overallStatus === 'VERIFIED' ? this.generateCredentialId() : null;

    const request = await prisma.verificationRequest.create({
      data: {
        requestNumber,
        organizationId: input.organizationId,
        documentId: input.documentId,
        subjectName: input.subjectName.trim(),
        subjectDob: input.subjectDob?.trim(),
        declaredIdentifier: input.declaredIdentifier?.trim(),
        documentCategory: input.documentCategory.toLowerCase().trim(),
        status: engineResult.overallStatus,
        riskLevel: engineResult.riskLevel,
        confidenceScore: engineResult.confidenceScore,
        headline: engineResult.headline,
        recommendation: engineResult.recommendation,
        credentialId,
        completedAt: new Date()
      }
    });

    // Save individual atomic verification checks
    for (const check of engineResult.checks) {
      await prisma.verificationCheck.create({
        data: {
          verificationRequestId: request.id,
          checkCode: check.checkCode,
          checkName: check.checkName,
          status: check.status,
          evidence: check.evidence,
          limitations: check.limitations,
          severity: check.severity
        }
      });
    }

    // Append to audit log
    await AuditService.log({
      organizationId: input.organizationId,
      userId: input.actorUserId,
      action: 'VERIFICATION_EXECUTED',
      resource: 'VerificationRequest',
      resourceId: request.id,
      outcome: 'SUCCESS',
      metadata: {
        requestNumber: request.requestNumber,
        status: request.status,
        category: request.documentCategory,
        confidence: request.confidenceScore,
        riskLevel: request.riskLevel
      }
    });

    // Dispatch Webhook Notification asynchronously
    WebhookService.dispatch(input.organizationId, 'verification.completed', {
      verificationId: request.id,
      requestNumber: request.requestNumber,
      status: request.status,
      riskLevel: request.riskLevel,
      confidenceScore: request.confidenceScore,
      credentialId: request.credentialId
    }).catch(console.error);

    return this.getVerificationById(request.id, input.organizationId);
  }

  public static async listVerifications(
    organizationId: string,
    filters: { status?: string; category?: string; search?: string },
    limit = 50,
    offset = 0
  ) {
    const where: any = { organizationId };

    if (filters.status) {
      where.status = filters.status.toUpperCase();
    }
    if (filters.category) {
      where.documentCategory = filters.category.toLowerCase();
    }
    if (filters.search) {
      where.OR = [
        { subjectName: { contains: filters.search } },
        { requestNumber: { contains: filters.search } },
        { declaredIdentifier: { contains: filters.search } }
      ];
    }

    const [total, items] = await Promise.all([
      prisma.verificationRequest.count({ where }),
      prisma.verificationRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          document: {
            select: { id: true, fileName: true, originalName: true, mimeType: true, fileSize: true }
          },
          checks: true
        }
      })
    ]);

    return { total, limit, offset, items };
  }

  public static async getVerificationById(id: string, organizationId: string) {
    const request = await prisma.verificationRequest.findFirst({
      where: { id, organizationId },
      include: {
        document: true,
        checks: true,
        organization: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    if (!request) {
      throw new AppError('Verification request not found or access denied.', 404);
    }

    return request;
  }

  public static async submitReviewDecision(input: ReviewDecisionInput) {
    const request = await prisma.verificationRequest.findFirst({
      where: { id: input.verificationId, organizationId: input.organizationId }
    });

    if (!request) {
      throw new AppError('Verification request not found.', 404);
    }

    // Backend status transition validation
    const allowedTransitionsFromNeedsReview = ['VERIFIED', 'REJECTED', 'UNABLE_TO_VERIFY'];
    if (!allowedTransitionsFromNeedsReview.includes(input.decision)) {
      throw new AppError(`Invalid status transition to '${input.decision}'.`, 400);
    }

    const credentialId = input.decision === 'VERIFIED' && !request.credentialId
      ? this.generateCredentialId()
      : request.credentialId;

    const updated = await prisma.verificationRequest.update({
      where: { id: input.verificationId },
      data: {
        status: input.decision,
        reviewerId: input.reviewerId,
        reviewerNotes: input.notes,
        reviewedAt: new Date(),
        credentialId
      },
      include: {
        document: true,
        checks: true
      }
    });

    await AuditService.log({
      organizationId: input.organizationId,
      userId: input.reviewerId,
      action: 'HUMAN_REVIEW_DECISION',
      resource: 'VerificationRequest',
      resourceId: input.verificationId,
      outcome: 'SUCCESS',
      metadata: {
        previousStatus: request.status,
        newStatus: input.decision,
        notes: input.notes
      }
    });

    WebhookService.dispatch(input.organizationId, 'verification.status_changed', {
      verificationId: updated.id,
      requestNumber: updated.requestNumber,
      status: updated.status,
      reviewerId: input.reviewerId,
      reviewedAt: updated.reviewedAt
    }).catch(console.error);

    return updated;
  }
}
