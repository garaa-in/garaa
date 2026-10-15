import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Garaa Synthetic B2B Database ---');

  // Password for synthetic accounts: "Garaa@2026!"
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Garaa@2026!', salt);

  // 1. Create Default Organizations
  const acmeCorp = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Global Recruiting',
      slug: 'acme-corp',
      domain: 'acmeglobal.example',
      tier: 'ENTERPRISE',
      settings: JSON.stringify({
        autoVerifyThreshold: 85,
        webhookUrl: 'https://webhook.site/demo-acme',
        enforceLiveness: true
      })
    }
  });

  const pacificTech = await prisma.organization.upsert({
    where: { slug: 'pacific-tech' },
    update: {},
    create: {
      name: 'Pacific University Credentials',
      slug: 'pacific-tech',
      domain: 'pacific.edu.example',
      tier: 'ENTERPRISE',
      settings: JSON.stringify({
        autoVerifyThreshold: 90,
        enforceLiveness: false
      })
    }
  });

  // 2. Create Synthetic Users with Distinct Roles
  // Platform Admin
  const platformAdmin = await prisma.user.upsert({
    where: { email: 'admin@garaa.internal' },
    update: {},
    create: {
      email: 'admin@garaa.internal',
      fullName: 'Garaa System Admin',
      passwordHash,
      systemRole: 'PLATFORM_ADMIN'
    }
  });

  // Organization Owner for Acme
  const acmeOwner = await prisma.user.upsert({
    where: { email: 'sarah.owner@acmeglobal.example' },
    update: {},
    create: {
      email: 'sarah.owner@acmeglobal.example',
      fullName: 'Sarah Chen (Org Owner)',
      passwordHash,
      systemRole: 'USER'
    }
  });

  // Organization Admin for Acme
  const acmeAdmin = await prisma.user.upsert({
    where: { email: 'david.admin@acmeglobal.example' },
    update: {},
    create: {
      email: 'david.admin@acmeglobal.example',
      fullName: 'David Patel (Org Admin)',
      passwordHash,
      systemRole: 'USER'
    }
  });

  // Authorized Verification Reviewer for Acme
  const acmeReviewer = await prisma.user.upsert({
    where: { email: 'reviewer@acmeglobal.example' },
    update: {},
    create: {
      email: 'reviewer@acmeglobal.example',
      fullName: 'Elena Rostova (Compliance Reviewer)',
      passwordHash,
      systemRole: 'USER'
    }
  });

  // Regular Member
  const acmeMember = await prisma.user.upsert({
    where: { email: 'member@acmeglobal.example' },
    update: {},
    create: {
      email: 'member@acmeglobal.example',
      fullName: 'James Wilson (HR Recruiter)',
      passwordHash,
      systemRole: 'USER'
    }
  });

  // Separate tenant user for Pacific Tech
  const pacificOwner = await prisma.user.upsert({
    where: { email: 'dean.registrar@pacific.edu.example' },
    update: {},
    create: {
      email: 'dean.registrar@pacific.edu.example',
      fullName: 'Dr. Arthur Vance (Registrar)',
      passwordHash,
      systemRole: 'USER'
    }
  });

  // 3. Link Memberships
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: acmeCorp.id, userId: acmeOwner.id } },
    update: {},
    create: { organizationId: acmeCorp.id, userId: acmeOwner.id, role: 'OWNER', status: 'ACTIVE' }
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: acmeCorp.id, userId: acmeAdmin.id } },
    update: {},
    create: { organizationId: acmeCorp.id, userId: acmeAdmin.id, role: 'ADMIN', status: 'ACTIVE' }
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: acmeCorp.id, userId: acmeReviewer.id } },
    update: {},
    create: { organizationId: acmeCorp.id, userId: acmeReviewer.id, role: 'REVIEWER', status: 'ACTIVE' }
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: acmeCorp.id, userId: acmeMember.id } },
    update: {},
    create: { organizationId: acmeCorp.id, userId: acmeMember.id, role: 'MEMBER', status: 'ACTIVE' }
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: pacificTech.id, userId: pacificOwner.id } },
    update: {},
    create: { organizationId: pacificTech.id, userId: pacificOwner.id, role: 'OWNER', status: 'ACTIVE' }
  });

  // 4. Create Initial B2B API Key for Acme
  const sampleRawKey = 'gk_live_8f3a9e2c4b7d1059a6c8e3f2d1b09482';
  const sampleKeyHash = crypto.createHash('sha256').update(sampleRawKey).digest('hex');

  await prisma.apiKey.upsert({
    where: { keyHash: sampleKeyHash },
    update: {},
    create: {
      organizationId: acmeCorp.id,
      name: 'Acme Production HR Backend Key',
      keyPrefix: 'gk_live_8f3a9e2c',
      keyHash: sampleKeyHash,
      scopes: 'read:verifications,write:verifications,read:reports',
      lastUsedAt: new Date()
    }
  });

  // 5. Seed Synthetic Verification Records with Structured Checks
  const vr1 = await prisma.verificationRequest.upsert({
    where: { requestNumber: 'VR-2026-1042' },
    update: {},
    create: {
      requestNumber: 'VR-2026-1042',
      organizationId: acmeCorp.id,
      subjectName: 'Aarav Mehta',
      subjectDob: '1997-02-14',
      declaredIdentifier: 'MH-01-2026-9037',
      documentCategory: 'dl',
      status: 'VERIFIED',
      riskLevel: 'LOW',
      confidenceScore: 96,
      headline: 'VERIFIED — Standard Driving Licence',
      recommendation: 'Document meets all structural, typographical, and format criteria.',
      credentialId: 'ZYC-2026-4B8F-9A10-E2D4-0192',
      completedAt: new Date()
    }
  });

  await prisma.verificationCheck.createMany({
    data: [
      {
        verificationRequestId: vr1.id,
        checkCode: 'FILE_INTEGRITY',
        checkName: 'Digital Container & File Integrity',
        status: 'VERIFIED',
        evidence: 'Container JPEG stream is valid and within parameters (412 KB).',
        severity: 'LOW'
      },
      {
        verificationRequestId: vr1.id,
        checkCode: 'STRUCTURE_VALIDATION',
        checkName: 'Official Layout & Nomenclature Check',
        status: 'VERIFIED',
        evidence: 'State transport department structural headers matched.',
        severity: 'LOW'
      },
      {
        verificationRequestId: vr1.id,
        checkCode: 'FIELD_CORRELATION',
        checkName: 'Subject Identity Data Correlation',
        status: 'VERIFIED',
        evidence: 'Declared name "Aarav Mehta" matches document OCR exactly.',
        severity: 'LOW'
      },
      {
        verificationRequestId: vr1.id,
        checkCode: 'ISSUER_RECORD_CHECK',
        checkName: 'Direct Government Registry Lookup',
        status: 'NOT_CHECKED',
        evidence: 'Live issuer lookup requires active DigiLocker gateway credentials.',
        severity: 'LOW'
      }
    ]
  });

  // Synthetic High-Risk / Needs Review Request
  const vr2 = await prisma.verificationRequest.upsert({
    where: { requestNumber: 'VR-2026-1043' },
    update: {},
    create: {
      requestNumber: 'VR-2026-1043',
      organizationId: acmeCorp.id,
      subjectName: 'Rohan Sharma',
      subjectDob: '1992-05-20',
      declaredIdentifier: 'ABCDE1234F',
      documentCategory: 'pan',
      status: 'NEEDS_REVIEW',
      riskLevel: 'HIGH',
      confidenceScore: 42,
      headline: 'SUSPECTED NOMENCLATURE ANOMALY',
      recommendation: 'Typography on header differs from standard Income Tax Department template.',
      completedAt: new Date()
    }
  });

  await prisma.verificationCheck.createMany({
    data: [
      {
        verificationRequestId: vr2.id,
        checkCode: 'STRUCTURE_VALIDATION',
        checkName: 'Official Layout & Nomenclature Check',
        status: 'FAILED',
        evidence: 'Header variation detected: expected "INCOME TAX DEPARTMENT", found variant layout.',
        severity: 'HIGH'
      },
      {
        verificationRequestId: vr2.id,
        checkCode: 'IDENTIFIER_FORMAT',
        checkName: 'Official Identifier Syntax Validation',
        status: 'VERIFIED',
        evidence: 'Syntax matches standard 10-character PAN layout.',
        severity: 'LOW'
      }
    ]
  });

  // 6. Audit Log
  await prisma.auditLog.create({
    data: {
      organizationId: acmeCorp.id,
      userId: acmeOwner.id,
      action: 'ORGANIZATION_INITIALIZED',
      resource: 'Organization',
      resourceId: acmeCorp.id,
      ipAddress: '127.0.0.1',
      outcome: 'SUCCESS',
      metadata: JSON.stringify({ seed: true })
    }
  });

  console.log('--- Database seeding completed successfully ---');
  console.log('Credentials:');
  console.log('  Admin: admin@garaa.internal / Garaa@2026!');
  console.log('  Acme Owner: sarah.owner@acmeglobal.example / Garaa@2026!');
  console.log('  Reviewer: reviewer@acmeglobal.example / Garaa@2026!');
  console.log('  API Key (Acme): gk_live_8f3a9e2c4b7d1059a6c8e3f2d1b09482');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
