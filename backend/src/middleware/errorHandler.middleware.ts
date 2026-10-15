import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details
    });
    return;
  }

  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    res.status(400).json({
      success: false,
      error: 'Malformed JSON payload provided in request body.'
    });
    return;
  }

  if (err instanceof ZodError) {
    const issues = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));
    res.status(400).json({
      success: false,
      error: 'Validation failed for request parameters.',
      details: issues
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || ['Field'];
      res.status(409).json({
        success: false,
        error: `A resource with this ${target.join(', ')} already exists.`
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'The requested record was not found.'
      });
      return;
    }
  }

  console.error('[UNHANDLED_SERVER_ERROR]', err);
  res.status(500).json({
    success: false,
    error: 'An internal server error occurred. Please try again later or contact Garaa support.'
  });
};
