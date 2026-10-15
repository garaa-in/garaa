# Garaa (Formerly ZyID) — B2B Document Verification & Intelligence Platform

> **Scan. Verify. Protect.**  
> Production-ready, multi-tenant B2B document verification, identity intelligence, and fraud prevention platform with strict tenant isolation, modular verification engine, B2B REST APIs, and 100% UI preservation.

---

## 1. Executive Summary & UI Preservation Guarantee

Garaa transforms an initial interactive single-file prototype into a complete, enterprise-grade B2B web application.

- **100% Visual Preservation**: Every color, gradient, glassmorphism border, hover state, animated canvas, font pairing (`Sora`, `Inter`, `JetBrains Mono`), and the signature mercury logo orb from the original design have been preserved.
- **Architectural Transformation**: Powered by a decoupled, production-grade architecture featuring a **React 18 + TypeScript + Vite** frontend, a **Node.js + Express + TypeScript** backend, and a relational schema managed via **Prisma ORM** (zero-config SQLite for immediate local development; PostgreSQL for production).
- **Security & Integrity Commitment**: Strict zero-fabrication verification logic. The platform never fakes government or law-enforcement database checks and clearly distinguishes between `VERIFIED`, `FAILED`, `INCONCLUSIVE`, and `NOT_CHECKED`.

---

## 2. Platform Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │               Client Browser                 │
                    │   React 18 + TypeScript + Vite (Port 5173)   │
                    │   Original Glassmorphism UI & Canvas Engine  │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           │ Proxied /api/v1/*
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │            Garaa Express API Server          │
                    │          Node.js + TypeScript (Port 4000)    │
                    ├──────────────────────────────────────────────┤
                    │  - Rate Limiting & Helmet Security Headers   │
                    │  - JWT Bearer & B2B API Key (SHA-256) Auth   │
                    │  - Multi-Tenant Isolation Middleware         │
                    │  - Role-Based Access Control (RBAC)          │
                    │  - Modular Document Verification Engine      │
                    │  - Webhook Dispatcher (HMAC-SHA256 Signatures│
                    │  - Tamper-Evident Audit Logging              │
                    └──────────────┬───────────────────────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
    ┌────────────────────────┐          ┌────────────────────────┐
    │     Relational DB      │          │ Private Storage Adapter│
    │  Prisma ORM (SQLite /  │          │ Tenant-Partitioned     │
    │      PostgreSQL)       │          │ SHA-256 Deduplication  │
    └────────────────────────┘          └────────────────────────┘
```

---

## 3. Core Modules & Capabilities

### A. Authentication & Multi-Tenant Organization Management
- **Company Registration & Domain Scoping**: Self-service company onboarding with auto-slug generation.
- **Strict Tenant Isolation**: Enforced at both the middleware layer (`requireTenant`) and in every Prisma query (`where: { organizationId }`). Cross-tenant access attempts return HTTP 404/403.
- **Role-Based Access Control (RBAC)**:
  - `OWNER`: Full organization control, billing, member role delegation, API key creation/revocation.
  - `ADMIN`: Verification management, member invitations, webhook configuration.
  - `REVIEWER`: Authorized compliance reviewer for human sign-off on flagged documents.
  - `MEMBER`: Document submission and report viewing.
  - `PLATFORM_ADMIN`: Global system oversight across all organizations.
- **Security Credentials**: Passwords hashed using `bcrypt` (10 rounds); expiring JWT sessions; secure password reset workflow.

### B. Secure Document Storage Adapter
- **Tenant Partitioning**: Files are isolated in private directories on disk (`./uploads/{organizationId}/{uniqueSuffix}-{fileName}`).
- **Directory Traversal Protection**: Canonical path resolution guarantees no requests escape the authorized storage root.
- **Streaming Secure Delivery**: Original documents are never exposed via static URLs. Authorized downloads require active tenant credentials and are streamed on demand.
- **Format & Size Validation**: Enforces whitelist (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`) and maximum 15MB file size limit.
- **Cryptographic Deduplication**: Calculates SHA-256 bitstream hashes upon ingestion to detect duplicate or resubmitted files.

### C. Modular Verification Engine
Each submitted document runs through 8 atomic, independent verification checks:
1. `FILE_INTEGRITY`: Container header, magic bytes, and stream consistency check.
2. `CRYPTOGRAPHIC_HASH`: Duplicate detection against the organization's prior submissions.
3. `STRUCTURE_VALIDATION`: Visual layout, geometry, and category-specific terminology analysis.
4. `FIELD_CORRELATION`: Cross-correlation between declared subject details and document text extracted via OCR.
5. `IDENTIFIER_FORMAT`: Strict syntax check for standard document numbers (e.g., Passport, Aadhaar, PAN, Driver's License, Academic Certificate).
6. `DATE_CONSISTENCY`: Validates issue and expiration dates against temporal constraints.
7. `DIGITAL_SIGNATURE_QR`: Detects high-density 2D barcodes, QR matrices, and digital signature stamps.
8. `ISSUER_RECORD_CHECK`: Honest external registry status. External integrations remain disabled by default and return `NOT_CHECKED` until authentic production credentials are configured.

**Engine Result Classification**:
- `VERIFIED`: Low risk; all executed checks passed; confidence score ≥ 85.
- `NEEDS_REVIEW`: Moderate risk; human review queue required; confidence score 40–84.
- `FAILED`: High risk; critical anomaly or failed syntax/integrity; confidence score < 40.
- `UNABLE_TO_VERIFY`: Inconclusive file scan or insufficient readable data.

### D. Live Company Dashboard & Reports
- **Real Metrics**: Total requests, verified rate, pending checks, flagged reviews, category distribution, and recent activity calculated directly from the database (clean empty state for new organizations).
- **Report Generation**: Tamper-evident verification certificates with unique Credential IDs (`ZYC-2026-XXXX-...`).
- **Data Export**:
  - Individual Report CSV: `GET /api/v1/reports/:id/csv`
  - Organization Summary CSV: `GET /api/v1/reports/export/summary-csv`

### E. B2B Developer REST API & Webhooks
- **Key Hashing**: API keys use the format `gk_live_<32_random_bytes>`. The raw secret is returned **only once** upon creation; only the SHA-256 hash is persisted.
- **Granular Scopes**: `read:verifications`, `write:verifications`, `read:reports`, `write:documents`.
- **Immediate Revocation**: Revoked keys are instantly rejected by the middleware.
- **Signed Webhooks**: Dispatches `verification.completed`, `verification.flagged`, and `document.uploaded` events with `X-Garaa-Signature: sha256=<hmac>` using the organization's webhook signing secret.

---

## 4. Synthetic Personas & Demo Accounts

All synthetic test accounts share the demo password: `Garaa@2026!`

| Role | Synthetic Email | Organization | Capabilities |
| :--- | :--- | :--- | :--- |
| **Org Owner** | `sarah.owner@acmeglobal.example` | Acme Global Recruiting | Full tenant admin, API keys, team invitations |
| **Org Admin** | `david.admin@acmeglobal.example` | Acme Global Recruiting | Verification creation, team management |
| **Reviewer** | `reviewer@acmeglobal.example` | Acme Global Recruiting | Human review sign-off (`VERIFIED` / `REJECTED`) |
| **Org Member** | `member@acmeglobal.example` | Acme Global Recruiting | Document submission & report viewing |
| **Platform Admin**| `admin@garaa.internal` | Garaa Internal | System-wide audit log & multi-tenant queue |
| **Isolated Org** | `owner@pacific.edu.example` | Pacific University | Separate tenant proving cross-org data isolation |

### Pre-Seeded B2B API Key (Acme Global Recruiting)
```
gk_live_8f3a9e2c4b7d1059a6c8e3f2d1b09482
```
*Scopes: `read:verifications`, `write:verifications`, `read:reports`, `write:documents`*

---

## 5. Quickstart & Installation Guide

### Prerequisites
- **Node.js**: v18 or v20+
- **npm**: v9 or v10+
- *(Optional)* **Docker & Docker Compose** for containerized deployment

### Option A: Local Development (Default Zero-Config SQLite)

1. **Clone & Setup**:
   ```bash
   cd garaa
   npm run setup
   ```
   *(This installs dependencies in `/backend` and `/frontend`, pushes the Prisma schema to `backend/dev.db`, and seeds synthetic organizations and verification records).*

2. **Start Backend Server**:
   ```bash
   npm run dev:backend
   ```
   *The API will be available at `http://localhost:4000` (Swagger docs at `http://localhost:4000/api/v1/docs`).*

3. **Start Frontend Client**:
   ```bash
   npm run dev:frontend
   ```
   *The Garaa web app will open at `http://localhost:5173` (with `/api` automatically proxied to port 4000).*

4. **Run Automated Test Suite**:
   ```bash
   npm run test
   ```
   *Executes 14 Vitest integration tests verifying all 9 core journeys.*

---

### Option B: Containerized Production Deployment (Docker Compose)

To run with **PostgreSQL 16**, backend, and Nginx frontend in Docker:

1. **Build and Launch**:
   ```bash
   docker-compose up --build -d
   ```
2. **Access Services**:
   - **Frontend App**: `http://localhost`
   - **Backend API**: `http://localhost:4000/api/v1`
   - **Swagger Docs**: `http://localhost:4000/api/v1/docs`
   - **PostgreSQL**: `localhost:5432` (`garaa_db`)

---

## 6. B2B REST API Usage Examples

### 1. Health Check
```bash
curl -X GET http://localhost:4000/health
```

### 2. Query Verifications Using B2B API Key
```bash
curl -X GET http://localhost:4000/api/v1/verifications \
  -H "X-API-Key: gk_live_8f3a9e2c4b7d1059a6c8e3f2d1b09482"
```

### 3. Upload a Document
```bash
curl -X POST http://localhost:4000/api/v1/documents/upload \
  -H "X-API-Key: gk_live_8f3a9e2c4b7d1059a6c8e3f2d1b09482" \
  -F "file=@/path/to/document.png"
```

### 4. Create and Trigger a Verification Request
```bash
curl -X POST http://localhost:4000/api/v1/verifications \
  -H "X-API-Key: gk_live_8f3a9e2c4b7d1059a6c8e3f2d1b09482" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "<DOCUMENT_ID_FROM_UPLOAD>",
    "subjectName": "Priya Patel",
    "documentCategory": "passport",
    "declaredIdentifier": "Z7890123",
    "subjectDob": "1995-04-12"
  }'
```

### 5. Export Summary CSV Report
```bash
curl -X GET http://localhost:4000/api/v1/reports/export/summary-csv \
  -H "X-API-Key: gk_live_8f3a9e2c4b7d1059a6c8e3f2d1b09482" \
  -o "garaa_verifications_export.csv"
```

---

## 7. Verification Journey Test Matrix

| # | User Journey | Verification Test | Result |
| :- | :--- | :--- | :--- |
| **J1** | Company Onboarding | Register Acme Global & generate tenant ID | Passed |
| **J2** | Authentication | Password hash verification & JWT issuance | Passed |
| **J3** | Document Ingestion | Tenant-partitioned storage & SHA-256 hash calculation | Passed |
| **J4** | Verification Engine | Execute 8 modular checks & return honest statuses | Passed |
| **J5** | Report Generation | Create tamper-evident seal & structured report | Passed |
| **J6** | Tenant Isolation | Block Pacific University from viewing Acme documents & records | Passed |
| **J7** | Path Traversal Defense | Reject `../../` traversal attempts with HTTP 403 | Passed |
| **J8** | B2B API Key Lifecycle | Authenticate via `X-API-Key`, check scopes, enforce revocation | Passed |
| **J9** | Human Review Queue | Reviewer sign-off transition from `NEEDS_REVIEW` to `VERIFIED` | Passed |

---

## 8. Security & Compliance Checklist

- [x] **Strict Tenant Isolation**: Enforced at middleware and database query boundaries.
- [x] **No Hardcoded Secrets**: Configurable via `.env` / environment variables.
- [x] **API Key Security**: Raw keys never saved in plaintext; hashed using SHA-256.
- [x] **Audit Trail**: Append-only log recording actor, IP, timestamp, action, and resource.
- [x] **Rate Limiting**: Applied to authentication and public API endpoints.
- [x] **No Fabricated Data**: External integrations return explicit `NOT_CHECKED` when disabled.
- [x] **File Ingestion Safety**: Filename sanitization, MIME whitelist, and size caps enforced.

---

## 9. File Tree Overview

```
garaa/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Multi-tenant relational schema
│   │   └── seed.ts                # Synthetic personas, orgs & verification seeds
│   ├── src/
│   │   ├── middleware/            # Auth, tenant, RBAC, API key, error handler
│   │   ├── modules/
│   │   │   ├── admin/             # Platform Admin & Review Queue
│   │   │   ├── apiKeys/           # B2B API Key provisioning & revocation
│   │   │   ├── audit/             # Tamper-evident compliance audit trail
│   │   │   ├── auth/              # Registration, login, profile, reset password
│   │   │   ├── dashboard/         # Live metrics calculated from DB
│   │   │   ├── documents/         # Secure tenant file upload & streaming download
│   │   │   ├── organizations/     # Tenant membership & details
│   │   │   ├── reports/           # Verification reports & CSV export
│   │   │   ├── verification/      # Modular verification engine (8 checks)
│   │   │   └── webhooks/          # Webhook delivery with HMAC signatures
│   │   ├── storage/               # Tenant-partitioned storage adapter
│   │   ├── docs/                  # OpenAPI 3.0 / Swagger specification
│   │   ├── app.ts                 # Express app configuration
│   │   └── server.ts              # HTTP server & database connection
│   ├── tests/
│   │   └── api.test.ts            # 14 Vitest integration tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.tsx    # Multi-tenant auth & quick persona switching
│   │   ├── services/
│   │   │   └── api.ts             # Typed API client with JWT & org headers
│   │   ├── index.css              # 100% preserved visual design & animations
│   │   ├── App.tsx                # Main view controller (Dashboard, Scan, Reports)
│   │   └── main.tsx
│   ├── index.html                 # Garaa head scripts, fonts, and root container
│   ├── vite.config.ts             # Vite configuration with API proxy
│   └── package.json
├── docker-compose.yml             # PostgreSQL, backend & frontend multi-container
├── .env.example                   # Environment variable template
├── package.json                   # Root orchestration scripts
└── README.md                      # Comprehensive documentation
```

---

*Garaa Systems Engineering — 2026*
