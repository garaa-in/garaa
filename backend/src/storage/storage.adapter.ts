import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler.middleware';

export interface StoredFileMetadata {
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  sha256Hash: string;
  storagePath: string;
}

export class StorageAdapter {
  private baseDir: string;

  constructor() {
    this.baseDir = config.storageDir;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  public async saveFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    organizationId: string
  ): Promise<StoredFileMetadata> {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimes.includes(mimeType.toLowerCase())) {
      throw new AppError(`Unsupported file type: ${mimeType}. Allowed formats are JPEG, PNG, WEBP, and PDF.`, 400);
    }

    const maxSizeBytes = 15 * 1024 * 1024; // 15MB limit
    if (fileBuffer.length > maxSizeBytes) {
      throw new AppError(`File size exceeds 15MB limit (provided ${Math.round(fileBuffer.length / 1024 / 1024)}MB).`, 400);
    }

    const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Tenant-isolated directory partition
    const orgFolder = path.join(this.baseDir, organizationId);
    if (!fs.existsSync(orgFolder)) {
      fs.mkdirSync(orgFolder, { recursive: true });
    }

    const sanitizedBase = path.basename(originalName).replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const storedFileName = `${uniqueSuffix}-${sanitizedBase}`;
    const targetPath = path.join(orgFolder, storedFileName);

    await fs.promises.writeFile(targetPath, fileBuffer);

    return {
      fileName: storedFileName,
      originalName,
      mimeType,
      fileSize: fileBuffer.length,
      sha256Hash,
      storagePath: targetPath
    };
  }

  public getFilePath(storagePath: string, organizationId?: string): string {
    const resolvedPath = path.resolve(storagePath);
    // Security check: Must reside within baseDir
    if (!resolvedPath.startsWith(this.baseDir)) {
      throw new AppError('Access denied: Invalid file path traversal detected.', 403);
    }
    if (organizationId) {
      const orgDir = path.resolve(path.join(this.baseDir, organizationId));
      if (!resolvedPath.startsWith(orgDir)) {
        throw new AppError('Access denied: File does not belong to your organization.', 403);
      }
    }
    if (!fs.existsSync(resolvedPath)) {
      throw new AppError('File not found in storage.', 404);
    }
    return resolvedPath;
  }

  public async readFile(storagePath: string, organizationId?: string): Promise<Buffer> {
    const verifiedPath = this.getFilePath(storagePath, organizationId);
    return fs.promises.readFile(verifiedPath);
  }

  public async deleteFile(storagePath: string, organizationId?: string): Promise<void> {
    const verifiedPath = this.getFilePath(storagePath, organizationId);
    if (fs.existsSync(verifiedPath)) {
      await fs.promises.unlink(verifiedPath);
    }
  }
}

export const storageAdapter = new StorageAdapter();
