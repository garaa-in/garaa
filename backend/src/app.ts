import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { prisma } from './prisma';
import { errorHandler } from './middleware/errorHandler.middleware';
import { standardRateLimiter } from './middleware/rateLimit.middleware';
import { openApiSpec } from './docs/swagger';

import { authRouter } from './modules/auth/auth.controller';
import { orgRouter } from './modules/organizations/org.controller';
import { documentRouter } from './modules/documents/document.controller';
import { verificationRouter } from './modules/verification/verification.controller';
import { dashboardRouter } from './modules/dashboard/dashboard.controller';
import { reportRouter } from './modules/reports/report.controller';
import path from 'path';
import fs from 'fs';
import { apiKeyRouter } from './modules/apiKeys/apiKey.controller';
import { webhookRouter } from './modules/webhooks/webhook.controller';
import { auditRouter } from './modules/audit/audit.controller';
import { adminRouter } from './modules/admin/admin.controller';
import { adminScansRouter } from './modules/adminScans/adminScans.controller';

export const app = express();

app.use(helmet({
  contentSecurityPolicy: false // Allow Swagger UI inline scripts & demo embeds
}));

app.use(cors({
  origin: config.corsOrigin === '*' ? true : [config.corsOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check Endpoint
const healthHandler = async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'HEALTHY',
      service: 'Garaa Verification Platform API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'CONNECTED',
      environment: config.nodeEnv
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'DEGRADED',
      database: 'DISCONNECTED',
      error: err.message
    });
  }
};

app.get('/health', healthHandler);
app.get('/api/v1/health', healthHandler);

// Interactive Swagger API Documentation
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// General Support Endpoints (connected directly to Frontend ProfileMenu Modals)
app.post('/api/v1/support/feedback', (req: Request, res: Response) => {
  const { feedback, userEmail } = req.body;
  console.log(`[USER_FEEDBACK] From ${userEmail || 'Anonymous'}: ${feedback}`);
  res.json({ success: true, message: 'Thank you. Your feedback has been logged.' });
});

app.post('/api/v1/support/bug', (req: Request, res: Response) => {
  const { report, userEmail } = req.body;
  console.log(`[BUG_REPORT] From ${userEmail || 'Anonymous'}: ${report}`);
  res.json({ success: true, message: 'Bug report received and queued for investigation.' });
});

// Demo Intelligence Screening Endpoint
app.post('/api/v1/intelligence/screen', (req: Request, res: Response) => {
  const { subjectName, documentIdentifier } = req.body;
  const name = (subjectName || '').toLowerCase().trim();

  // Synthetic local intelligence index matching the client demo profiles
  const matches = [
    { name: 'parth raivansh', serial: 'DEMO-SERIAL-9201', caseNo: 'ZY-DEMO-CASE-3101' },
    { name: 'sanchi veyra', serial: 'DEMO-SERIAL-9202', caseNo: 'ZY-DEMO-CASE-3102' },
    { name: 'avishkar kairav', serial: 'DEMO-SERIAL-9203', caseNo: 'ZY-DEMO-CASE-3103' },
    { name: 'arbeena zayra', serial: 'DEMO-SERIAL-9204', caseNo: 'ZY-DEMO-CASE-3104' },
    { name: 'karan reyansh', serial: 'DEMO-SERIAL-9205', caseNo: 'ZY-DEMO-CASE-3105' },
    { name: 'ayush vihaan', serial: 'DEMO-SERIAL-9206', caseNo: 'ZY-DEMO-CASE-3106' }
  ];

  const match = matches.find((m) => name.includes(m.name) || (documentIdentifier && documentIdentifier.includes(m.serial)));

  res.json({
    success: true,
    data: {
      matched: Boolean(match),
      record: match || null,
      signalPercent: match ? 92 : 3,
      jurisdiction: 'Local Demo Screening Index',
      limitations: 'Screened against local test records only. Authoritative police database access requires verified statutory authorization.'
    }
  });
});

// Mount Versioned B2B API Endpoints
const apiRouter = express.Router();
apiRouter.use(standardRateLimiter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/organizations', orgRouter);
apiRouter.use('/documents', documentRouter);
apiRouter.use('/verifications', verificationRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/reports', reportRouter);
apiRouter.use('/api-keys', apiKeyRouter);
apiRouter.use('/webhooks', webhookRouter);
apiRouter.use('/audit-logs', auditRouter);
apiRouter.use('/audit', auditRouter);
apiRouter.use('/admin/scans', adminScansRouter);
apiRouter.use('/admin-scans', adminScansRouter);
apiRouter.use('/admin', adminRouter);

app.use('/api/v1', apiRouter);

// Serve Static Frontend if built in production or multi-device LAN mode
const candidateDistDirs = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), 'dist')
];
for (const distDir of candidateDistDirs) {
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    break;
  }
}

// Centralized Error Handling
app.use(errorHandler);
