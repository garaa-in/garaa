import { Router, Request, Response, NextFunction } from 'express';
import { ReportService } from './report.service';
import { authenticateFlexible } from '../../middleware/apiKey.middleware';

export const reportRouter = Router();

reportRouter.use(authenticateFlexible('read:reports'));

reportRouter.get('/export/summary-csv', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const csvContent = await ReportService.generateOrgSummaryCsv(req.organizationId!);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="Garaa-Verifications-Summary.csv"');
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
});

reportRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await ReportService.getReportData(req.params.id, req.organizationId!);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

reportRouter.get('/:id/csv', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const csvContent = await ReportService.generateCsv(req.params.id, req.organizationId!);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Garaa-Report-${req.params.id}.csv"`);
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
});
