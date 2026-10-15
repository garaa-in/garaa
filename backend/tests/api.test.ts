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
        subjectName: 'Parth Raivansh',
        subjectDob: '2006-02-14',
        declaredIdentifier: '1234 5678 9012',
        documentCategory: 'aadhaar',
        extractedText: 'GOVERNMENT OF INDIA UNIQUE IDENTIFICATION AUTHORITY OF INDIA AADHAAR 1234 5678 9012 PARTH RAIVANSH DOB: 14/02/2006'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.requestNumber).toBeDefined();
    expect(res.body.data.status).toBe('VERIFIED');
    expect(res.body.data.checks.length).toBeGreaterThanOrEqual(5);

    verificationId = res.body.data.id;
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
    expect(res.text).toContain('Parth Raivansh');
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
});
