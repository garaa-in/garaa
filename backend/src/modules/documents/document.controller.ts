import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { DocumentService } from './document.service';
import { authenticateFlexible } from '../../middleware/apiKey.middleware';
import { AppError } from '../../middleware/errorHandler.middleware';

export const documentRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

documentRouter.use(authenticateFlexible('write:verifications'));

documentRouter.post('/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('No file provided in form field "file".', 400);
    }

    const result = await DocumentService.uploadDocument(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      req.organizationId!,
      req.user?.id
    );

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

documentRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await DocumentService.getDocument(req.params.id, req.organizationId!);
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

documentRouter.get('/:id/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { doc, filePath } = await DocumentService.getFileStream(req.params.id, req.organizationId!);
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.originalName}"`);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});
