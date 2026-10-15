import { prisma } from '../../prisma';
import { storageAdapter } from '../../storage/storage.adapter';
import { AppError } from '../../middleware/errorHandler.middleware';
import { AuditService } from '../audit/audit.service';

export class DocumentService {
  public static async uploadDocument(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    organizationId: string,
    actorUserId?: string
  ) {
    const stored = await storageAdapter.saveFile(fileBuffer, originalName, mimeType, organizationId);

    // Check for existing duplicates with this SHA-256
    const duplicates = await prisma.document.findMany({
      where: {
        organizationId,
        sha256Hash: stored.sha256Hash
      },
      select: { id: true, fileName: true, originalName: true, createdAt: true }
    });

    const doc = await prisma.document.create({
      data: {
        organizationId,
        fileName: stored.fileName,
        originalName: stored.originalName,
        mimeType: stored.mimeType,
        fileSize: stored.fileSize,
        sha256Hash: stored.sha256Hash,
        storagePath: stored.storagePath
      }
    });

    await AuditService.log({
      organizationId,
      userId: actorUserId,
      action: 'DOCUMENT_UPLOADED',
      resource: 'Document',
      resourceId: doc.id,
      outcome: 'SUCCESS',
      metadata: {
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        sha256Hash: doc.sha256Hash,
        hasDuplicates: duplicates.length > 0
      }
    });

    return {
      document: doc,
      duplicates: duplicates.map((d) => d.id)
    };
  }

  public static async getDocument(documentId: string, organizationId: string) {
    const doc = await prisma.document.findFirst({
      where: { id: documentId, organizationId }
    });

    if (!doc) throw new AppError('Document not found or access denied.', 404);
    return doc;
  }

  public static async getFileStream(documentId: string, organizationId: string) {
    const doc = await this.getDocument(documentId, organizationId);
    const filePath = storageAdapter.getFilePath(doc.storagePath, organizationId);
    return {
      doc,
      filePath
    };
  }
}
