import { prisma } from '../../prisma';
import { AppError } from '../../middleware/errorHandler.middleware';

export class ReportService {
  public static async getReportData(verificationId: string, organizationId: string) {
    const vr = await prisma.verificationRequest.findFirst({
      where: { id: verificationId, organizationId },
      include: {
        document: true,
        checks: {
          orderBy: { createdAt: 'asc' }
        },
        organization: {
          select: { id: true, name: true, slug: true, domain: true }
        }
      }
    });

    if (!vr) throw new AppError('Verification report not found or access denied.', 404);
    return vr;
  }

  public static async generateCsv(verificationId: string, organizationId: string): Promise<string> {
    const report = await this.getReportData(verificationId, organizationId);

    const headers = [
      'Report_ID',
      'Request_Number',
      'Organization',
      'Subject_Name',
      'Subject_DOB',
      'Declared_ID',
      'Document_Category',
      'Overall_Status',
      'Risk_Level',
      'Confidence_Score',
      'Credential_ID',
      'Check_Code',
      'Check_Name',
      'Check_Status',
      'Evidence',
      'Limitations',
      'Submitted_At',
      'Completed_At'
    ];

    const rows: string[] = [];

    for (const check of report.checks) {
      const escape = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
      rows.push([
        escape(report.id),
        escape(report.requestNumber),
        escape(report.organization.name),
        escape(report.subjectName),
        escape(report.subjectDob),
        escape(report.declaredIdentifier),
        escape(report.documentCategory),
        escape(report.status),
        escape(report.riskLevel),
        escape(report.confidenceScore),
        escape(report.credentialId),
        escape(check.checkCode),
        escape(check.checkName),
        escape(check.status),
        escape(check.evidence),
        escape(check.limitations),
        escape(report.submittedAt.toISOString()),
        escape(report.completedAt ? report.completedAt.toISOString() : '')
      ].join(','));
    }

    return [headers.join(','), ...rows].join('\n');
  }

  public static async generateOrgSummaryCsv(organizationId: string): Promise<string> {
    const list = await prisma.verificationRequest.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });

    const headers = [
      'Request_Number',
      'Subject_Name',
      'Subject_DOB',
      'Declared_ID',
      'Category',
      'Status',
      'Risk_Level',
      'Confidence_Score',
      'Credential_ID',
      'Submitted_At',
      'Completed_At'
    ];

    const escape = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
    const rows = list.map(item => [
      escape(item.requestNumber),
      escape(item.subjectName),
      escape(item.subjectDob),
      escape(item.declaredIdentifier),
      escape(item.documentCategory),
      escape(item.status),
      escape(item.riskLevel),
      escape(item.confidenceScore),
      escape(item.credentialId),
      escape(item.submittedAt.toISOString()),
      escape(item.completedAt ? item.completedAt.toISOString() : '')
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  }
}
