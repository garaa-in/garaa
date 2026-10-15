import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Admin Parth Central Scanned Documents Database API', () => {
  const testScan = {
    id: `TEST-SCAN-DEVICE-A-${Date.now()}`,
    personName: 'Rohan Mehra',
    documentType: 'Republic of India Passport',
    documentTypeId: 'passport',
    fileName: 'rohan_passport.jpg',
    status: 'VALID',
    isValid: true,
    confidence: 97,
    photoUrl: 'data:image/svg+xml;charset=UTF-8,<svg></svg>',
    reasons: ['MRZ checksum verified', 'Cryptographic signature authentic'],
    rawTextPreview: 'P<INDROHAN<<MEHRA<<<<<<<<<<<',
    source: 'Smart Scanner',
    scannedBy: 'Rohan (Mobile Device)'
  };

  it('1. GET /api/v1/admin/scans should reject unauthorized request without password', async () => {
    const res = await request(app).get('/api/v1/admin/scans');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('2. POST /api/v1/admin/scans should ingest scan from any device without admin password', async () => {
    const res = await request(app)
      .post('/api/v1/admin/scans')
      .send(testScan);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(testScan.id);
    expect(res.body.data.personName).toBe('Rohan Mehra');
  });

  it('3. GET /api/v1/admin/scans with header x-admin-password should return all scans including test scan', async () => {
    const res = await request(app)
      .get('/api/v1/admin/scans')
      .set('x-admin-password', 'garaa916');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((s: any) => s.id === testScan.id);
    expect(found).toBeDefined();
    expect(found.personName).toBe('Rohan Mehra');
  });

  it('4. POST /api/v1/admin/scans/sync should merge scans across different devices', async () => {
    const deviceBScan = {
      id: `TEST-SCAN-DEVICE-B-${Date.now()}`,
      personName: 'Ananya Roy',
      documentType: 'Aadhaar Card (UIDAI)',
      documentTypeId: 'aadhaar',
      fileName: 'ananya_aadhaar.jpg',
      status: 'VALID',
      isValid: true,
      confidence: 99,
      photoUrl: 'data:image/svg+xml;charset=UTF-8,<svg></svg>',
      reasons: ['UIDAI QR authentic'],
      rawTextPreview: 'Aadhaar / Ananya Roy',
      source: 'Identity Biometric Check',
      scannedBy: 'Ananya (iPad Device)'
    };

    const res = await request(app)
      .post('/api/v1/admin/scans/sync')
      .send({ scans: [deviceBScan] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const foundB = res.body.data.find((s: any) => s.id === deviceBScan.id);
    expect(foundB).toBeDefined();
  });

  it('5. DELETE /api/v1/admin/scans/:id should delete scan with admin password', async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/scans/${testScan.id}`)
      .set('x-admin-password', 'garaa916');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify deletion
    const verifyRes = await request(app)
      .get('/api/v1/admin/scans')
      .set('x-admin-password', 'garaa916');
    const stillFound = verifyRes.body.data.find((s: any) => s.id === testScan.id);
    expect(stillFound).toBeUndefined();
  });
});
