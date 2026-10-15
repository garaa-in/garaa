import { Router, Request, Response, NextFunction } from 'express';
import { adminScansStore } from './adminScans.service';

export const adminScansRouter = Router();

const verifyAdminPassword = (req: Request, res: Response, next: NextFunction) => {
  const headerPass = req.headers['x-admin-password'];
  const queryPass = req.query.password;
  const provided = (headerPass || queryPass || '').toString().trim();

  if (provided === 'garaa916') {
    return next();
  }

  res.status(401).json({
    success: false,
    error: 'Unauthorized: Invalid Admin Password'
  });
};

// 1. GET /api/v1/admin/scans - Retrieve all scans from central database (Admin Parth Only)
adminScansRouter.get('/', verifyAdminPassword, (req: Request, res: Response) => {
  const scans = adminScansStore.getAllScans();
  res.json({
    success: true,
    count: scans.length,
    data: scans,
    syncedAt: new Date().toISOString()
  });
});

// 2. POST /api/v1/admin/scans - Ingest scanned document photo & verification result from ANY device
adminScansRouter.post('/', (req: Request, res: Response) => {
  try {
    const rawData = req.body || {};
    // Extract client device or IP hint if available
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    const isMobile = /mobile|iphone|android|ipad/i.test(userAgent.toString());
    const deviceInfo = isMobile ? 'Mobile Device' : 'Desktop / Laptop';

    const saved = adminScansStore.addScan({
      ...rawData,
      deviceInfo: `${deviceInfo} (${ip})`
    });

    res.status(201).json({
      success: true,
      message: 'Scanned document successfully saved to central admin database',
      data: saved
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to save scanned document'
    });
  }
});

// 3. POST /api/v1/admin/scans/sync - Merge client cache with central server scans
adminScansRouter.post('/sync', (req: Request, res: Response) => {
  try {
    const incoming = Array.isArray(req.body) ? req.body : (req.body?.scans || []);
    const merged = adminScansStore.syncScans(incoming);
    res.json({
      success: true,
      count: merged.length,
      data: merged
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to sync scans'
    });
  }
});

// 4. DELETE /api/v1/admin/scans/:id - Delete specific scan record (Admin Parth Only)
adminScansRouter.delete('/:id', verifyAdminPassword, (req: Request, res: Response) => {
  const deleted = adminScansStore.deleteScan(req.params.id);
  res.json({
    success: true,
    deleted,
    message: deleted ? 'Scanned document record deleted' : 'Record not found'
  });
});

// 5. DELETE /api/v1/admin/scans - Clear all scanned records (Admin Parth Only)
adminScansRouter.delete('/', verifyAdminPassword, (_req: Request, res: Response) => {
  adminScansStore.clearAll();
  res.json({
    success: true,
    message: 'All scanned document records cleared from central database'
  });
});
