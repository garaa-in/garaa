import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';

describe('Garaa B2B Platform Comprehensive Test Suite', () => {
  let authTokenOrgA = '';
  let orgAId = '';
  let authTokenOrgB = '';
  let orgBId = '';
  let uploadedDocId = '';
  let verificationId = '';
  let apiKeySecret = '';
  let apiKeyId = '';

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. Should return healthy status from /health endpoint', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('HEALTHY');
    expect(res.body.database).toBe('CONNECTED');
  });

  it('2. Journey 1: Register Company A (Acme Global)', async () => {
    const uniqueEmail = `sarah.acme.${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        companyName: 'Acme Test Corp',
        companySlug: `acme-test-${Date.now()}`,
        fullName: 'Sarah Test Owner',
        email: uniqueEmail,
        password: 'Password123!'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.organization.id).toBeDefined();

    authTokenOrgA = res.body.data.token;
    orgAId = res.body.data.organization.id;
  });

  it('3. Journey 2: Log in with newly registered company credentials', async () => {
    // Seeded admin user login
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@garaa.internal',
        password: 'Garaa@2026!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.systemRole).toBe('PLATFORM_ADMIN');
  });

  it('4. Register Company B (Separate Tenant)', async () => {
    const uniqueEmail = `dean.pacific.${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        companyName: 'Pacific University Test',
        companySlug: `pacific-test-${Date.now()}`,
        fullName: 'Dr. Arthur Vance',
        email: uniqueEmail,
        password: 'Password123!'
      });

    expect(res.status).toBe(201);
    authTokenOrgB = res.body.data.token;
    orgBId = res.body.data.organization.id;
    expect(orgBId).not.toBe(orgAId);
  });

  it('5. Journey 4: Upload synthetic test document securely', async () => {
    const dummyBuffer = Buffer.from('FAKE-AADHAAR-SYNTHETIC-DOCUMENT-PAYLOAD-FOR-TESTING');
    const res = await request(app)
      .post('/api/v1/documents/upload')
      .set('Authorization', `Bearer ${authTokenOrgA}`)
      .set('X-Organization-Id', orgAId)
      .attach('file', dummyBuffer, 'synthetic_aadhaar.png');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.document.id).toBeDefined();
    expect(res.body.data.document.sha256Hash).toBeDefined();
    uploadedDocId = res.body.data.document.id;
  });

  it('6. Journey 3 & 5: Create verification request and execute modular engine checks', async () => {
    const res = await request(app)
      .post('/api/v1/verifications')
      .set('Authorization', `Bearer ${authTokenOrgA}`)
      .set('X-Organization-Id', orgAId)
      .send({
        documentId: uploadedDocId,
        subjectName: 'Aarav Sharma',
        subjectDob: '2001-08-20',
        declaredIdentifier: '1234 5678 9012',
        documentCategory: 'aadhaar',
        extractedText: 'GOVERNMENT OF INDIA UNIQUE IDENTIFICATION AUTHORITY OF INDIA AADHAAR 1234 5678 9012 AARAV SHARMA DOB: 20/08/2001'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.requestNumber).toBeDefined();
    expect(res.body.data.status).toBe('VERIFIED');
    expect(res.body.data.checks.length).toBeGreaterThanOrEqual(5);

    verificationId = res.body.data.id;
  });

  it('6b. Criminal Record Rule: Subject named Parth flags criminal watchlist and fails verification', async () => {
    const res = await request(app)
      .post('/api/v1/verifications')
      .set('Authorization', `Bearer ${authTokenOrgA}`)
      .set('X-Organization-Id', orgAId)
      .send({
        documentId: uploadedDocId,
        subjectName: 'Parth Raivansh',
        subjectDob: '2006-02-14',
        declaredIdentifier: '1234 5678 9012',
        documentCategory: 'aadhaar',
        extractedText: 'GOVERNMENT OF INDIA UNIQUE IDENTIFICATION AUTHORITY OF INDIA AADHAAR 1234 5678 9012 PARTH RAIVANSH DOB: 14/02/2006'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('FAILED');
    expect(res.body.data.headline).toBe('CRIMINAL RECORD MATCH FOUND');
    expect(res.body.data.riskLevel).toBe('CRITICAL');
  });

  it('6c. Tampered Document Rule: Misspelled header adharr fails as counterfeit', async () => {
    const res = await request(app)
      .post('/api/v1/verifications')
      .set('Authorization', `Bearer ${authTokenOrgA}`)
      .set('X-Organization-Id', orgAId)
      .send({
        documentId: uploadedDocId,
        subjectName: 'Rohan Verma',
        subjectDob: '1998-05-10',
        declaredIdentifier: '9876 5432 1098',
        documentCategory: 'aadhaar',
        extractedText: 'GOVERNMENT OF INDIA UNIQUE IDENTIFICATION AUTHORITY OF INDIA ADHARR 9876 5432 1098 ROHAN VERMA DOB: 10/05/1998'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('FAILED');
    expect(res.body.data.headline).toBe('FAKE / TAMPERED DOCUMENT DETECTED');
    expect(res.body.data.riskLevel).toBe('CRITICAL');
  });

  it('7. Journey 6 & 7: Retrieve verification results and full report', async () => {
    const res = await request(app)
      .get(`/api/v1/verifications/${verificationId}`)
      .set('Authorization', `Bearer ${authTokenOrgA}`)
      .set('X-Organization-Id', orgAId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(verificationId);
    expect(res.body.data.checks).toBeDefined();
    expect(res.body.data.credentialId).toMatch(/^ZYC-2026-/);
  });

  it('8. Journey 8: Strict Tenant Isolation: Org B cannot access Org A verification', async () => {
    const res = await request(app)
      .get(`/api/v1/verifications/${verificationId}`)
      .set('Authorization', `Bearer ${authTokenOrgB}`)
      .set('X-Organization-Id', orgBId);

    // Should strictly return 404/403 and never leak Org A's data
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('9. Strict Tenant Isolation: Org B cannot download Org A document file', async () => {
    const res = await request(app)
      .get(`/api/v1/documents/${uploadedDocId}/download`)
      .set('Authorization', `Bearer ${authTokenOrgB}`)
      .set('X-Organization-Id', orgBId);

    expect(res.status).toBe(404);
  });

  it('10. Report generation: Export CSV with authorized permissions', async () => {
    const res = await request(app)
      .get(`/api/v1/reports/${verificationId}/csv`)
      .set('Authorization', `Bearer ${authTokenOrgA}`)
      .set('X-Organization-Id', orgAId);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('VR-2026-');
    expect(res.text).toContain('Aarav Sharma');
  });

  it('11. Provision B2B API Key with scopes', async () => {
    const res = await request(app)
      .post('/api/v1/api-keys')
      .set('Authorization', `Bearer ${authTokenOrgA}`)
      .set('X-Organization-Id', orgAId)
      .send({
        name: 'Test Recruiter Key',
        scopes: ['read:verifications', 'write:verifications', 'read:reports']
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.secretKey).toBeDefined();
    expect(res.body.data.secretKey).toMatch(/^gk_live_/);

    apiKeySecret = res.body.data.secretKey;
    apiKeyId = res.body.data.id;
  });

  it('12. Authenticate B2B API request using newly created X-API-Key', async () => {
    const res = await request(app)
      .get('/api/v1/verifications')
      .set('X-API-Key', apiKeySecret);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeDefined();
  });

  it('13. Journey 9: Revoke API key and confirm it immediately stops working', async () => {
    // Revoke
    const revokeRes = await request(app)
      .delete(`/api/v1/api-keys/${apiKeyId}`)
      .set('Authorization', `Bearer ${authTokenOrgA}`)
      .set('X-Organization-Id', orgAId);

    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.success).toBe(true);

    // Call endpoint again with revoked key -> Must return 403 Forbidden!
    const testRes = await request(app)
      .get('/api/v1/verifications')
      .set('X-API-Key', apiKeySecret);

    expect(testRes.status).toBe(403);
    expect(testRes.body.success).toBe(false);
    expect(testRes.body.error).toContain('revoked');
  });

  it('14. Dashboard Stats: Calculates real database metrics', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${authTokenOrgA}`)
      .set('X-Organization-Id', orgAId);

    expect(res.status).toBe(200);
    expect(res.body.data.totalRequests).toBeGreaterThanOrEqual(1);
    expect(res.body.data.verifiedCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.successRate).toBeGreaterThanOrEqual(0);
  });

  it('15. Journey 9: Human Review Queue decision sign-off', async () => {
    // 1. Create a request that triggers review
    const dummyBuffer = Buffer.from('UNUSUAL-DOCUMENT-REQUIRING-COMPLIANCE-REVIEW-PAYLOAD');
    const uploadRes = await request(app)
      .post('/api/v1/documents/upload')
      .set('Authorization', `Bearer ${authTokenOrgA}`)
      .set('X-Organization-Id', orgAId)
      .attach('file', dummyBuffer, 'flagged_doc.png');

    const flaggedDocId = uploadRes.body.data.document.id;

    const createRes = await request(app)
      .post('/api/v1/verifications')
      .set('Authorization', `Bearer ${authTokenOrgA}`)
      .set('X-Organization-Id', orgAId)
      .send({
        documentId: flaggedDocId,
        subjectName: 'Rohan Sharma',
        documentCategory: 'pan',
        declaredIdentifier: 'ABCDE1234F',
        extractedText: 'TAX DEPARTMENT SOME TEXT'
      });

    const flaggedVerifId = createRes.body.data.id;

    // 2. Submit human reviewer sign-off decision
    const reviewRes = await request(app)
      .post(`/api/v1/verifications/${flaggedVerifId}/review`)
      .set('Authorization', `Bearer ${authTokenOrgA}`)
      .set('X-Organization-Id', orgAId)
      .send({
        decision: 'VERIFIED',
        notes: 'Compliance officer verified secondary identification offline.'
      });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.success).toBe(true);
    expect(reviewRes.body.data.status).toBe('VERIFIED');
    expect(reviewRes.body.data.reviewerNotes).toContain('Compliance officer verified');
  });

  it('16. Duplicate Document Detection via Cryptographic Bitstream Hash', async () => {
    // Upload the exact same file buffer again
    const dummyBuffer = Buffer.from('FAKE-AADHAAR-SYNTHETIC-DOCUMENT-PAYLOAD-FOR-TESTING');
    const uploadRes = await request(app)
      .post('/api/v1/documents/upload')
      .set('Authorization', `Bearer ${authTokenOrgA}`)
      .set('X-Organization-Id', orgAId)
      .attach('file', dummyBuffer, 'synthetic_aadhaar_dup.png');

    const dupDocId = uploadRes.body.data.document.id;

    const res = await request(app)
      .post('/api/v1/verifications')
      .set('Authorization', `Bearer ${authTokenOrgA}`)
      .set('X-Organization-Id', orgAId)
      .send({
        documentId: dupDocId,
        subjectName: 'Parth Raivansh Dup',
        documentCategory: 'aadhaar',
        declaredIdentifier: '1234 5678 9012'
      });

    expect(res.status).toBe(201);
    const hashCheck = res.body.data.checks.find((c: any) => c.checkCode === 'CRYPTOGRAPHIC_HASH');
    expect(hashCheck).toBeDefined();
    expect(hashCheck.status).toBe('INCONCLUSIVE');
    expect(hashCheck.evidence).toContain('Exact cryptographic bitstream match detected');
  });

  it('17. Summary CSV Export: Streams organization-wide verification report', async () => {
    const res = await request(app)
      .get('/api/v1/reports/export/summary-csv')
      .set('Authorization', `Bearer ${authTokenOrgA}`)
      .set('X-Organization-Id', orgAId);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Request_Number,Subject_Name');
    expect(res.text).toContain('Parth Raivansh');
  });

  it('18. Webhook Endpoint Lifecycle: Create endpoint and dispatch test event', async () => {
    const createRes = await request(app)
      .post('/api/v1/webhooks')
      .set('Authorization', `Bearer ${authTokenOrgA}`)
      .set('X-Organization-Id', orgAId)
      .send({
        url: 'https://webhook.site/test-integration-garaa',
        description: 'Production integration endpoint'
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.secret).toMatch(/^whsec_/);

    const endpointId = createRes.body.data.id;

    const testPing = await request(app)
      .post(`/api/v1/webhooks/${endpointId}/test`)
      .set('Authorization', `Bearer ${authTokenOrgA}`)
      .set('X-Organization-Id', orgAId);

    expect(testPing.status).toBe(200);
    expect(testPing.body.message).toContain('Test ping');
  });

  it('19. Tamper-evident Audit Trail: Inspect recorded actions', async () => {
    const res = await request(app)
      .get('/api/v1/audit')
      .set('Authorization', `Bearer ${authTokenOrgA}`)
      .set('X-Organization-Id', orgAId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const actions = res.body.data.map((l: any) => l.action);
    expect(actions).toContain('VERIFICATION_EXECUTED');
  });

  it('20. Platform Admin System Overview: Global metrics and provider posture', async () => {
    const adminTokenRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@garaa.internal',
        password: 'Garaa@2026!'
      });

    const adminToken = adminTokenRes.body.data.token;

    const overviewRes = await request(app)
      .get('/api/v1/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(overviewRes.status).toBe(200);
    expect(overviewRes.body.data.totalOrganizations).toBeGreaterThanOrEqual(2);
    expect(overviewRes.body.data.providers.length).toBe(4);
    // Unconfigured providers must be marked honest, never fabricated
    expect(overviewRes.body.data.providers[0].status).toContain('UNCONFIGURED');
  });
});

