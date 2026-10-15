import fs from 'fs';
import path from 'path';

export interface AdminScanRecord {
  id: string;
  timestamp: string;
  isoDate: string;
  personName: string;
  documentType: string;
  documentTypeId?: string;
  fileName: string;
  status: 'VALID' | 'INVALID' | 'NEEDS_REVIEW' | string;
  isValid: boolean;
  confidence: number;
  photoUrl: string;
  reasons: string[];
  rawTextPreview: string;
  source: string;
  scannedBy: string;
  deviceInfo?: string;
}

function getSeedRecords(): AdminScanRecord[] {
  const headSvg = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="40" r="25" fill="#94a3b8"/><path d="M20 90c0-20 15-30 30-30s30 10 30 30" fill="#94a3b8"/></svg>'
  );

  return [
    {
      id: 'PARTH-SCAN-SEED-1',
      timestamp: '15 Oct 2026, 02:40 PM',
      isoDate: '2026-10-15T09:10:00.000Z',
      personName: 'Arav Sharma',
      documentType: 'Aadhaar Card (UIDAI)',
      documentTypeId: 'aadhaar',
      fileName: 'arav_aadhaar_original.jpg',
      status: 'VALID',
      isValid: true,
      confidence: 99,
      photoUrl: headSvg,
      reasons: [
        'Official UIDAI microprint & security guilloche pattern verified',
        'Encrypted QR code cryptographic signature authentic',
        'Government hologram optical reflectance confirmed',
        'Biometric facial match confidence 98%'
      ],
      rawTextPreview: 'Government of India / Unique Identification Authority of India / Arav Sharma / DOB: 12/08/1998 / Male / 9874 5612 3456 / Mera Aadhaar, Meri Pehchan',
      source: 'Smart Scanner (AI Auto-Detect)',
      scannedBy: 'Arav (Live Ingestion)'
    },
    {
      id: 'PARTH-SCAN-SEED-2',
      timestamp: '15 Oct 2026, 07:15 PM',
      isoDate: '2026-10-15T13:45:00.000Z',
      personName: 'Rajesh Verma',
      documentType: 'Academic Degree Certificate',
      documentTypeId: 'certificate',
      fileName: 'forged_degree_sample.jpg',
      status: 'INVALID',
      isValid: false,
      confidence: 24,
      photoUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" rx="12" fill="#fff1f2" stroke="#f43f5e" stroke-width="3"/><rect x="20" y="20" width="280" height="180" rx="8" fill="#fff" stroke="#fecdd3"/><text x="160" y="55" font-family="sans-serif" font-size="14" font-weight="bold" fill="#e11d48" text-anchor="middle">UNIVERCITY OF DELHY [FORGED]</text><text x="160" y="85" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="middle">BACHELOR OF TECHNOLOGY</text><circle cx="160" cy="130" r="28" fill="#fecdd3" stroke="#e11d48" stroke-width="2"/><text x="160" y="135" font-family="sans-serif" font-size="9" font-weight="bold" fill="#be123c" text-anchor="middle">FAKE SEAL</text><text x="160" y="180" font-family="sans-serif" font-size="10" font-weight="bold" fill="#e11d48" text-anchor="middle">ALTERED FONTS · SPELLING ERRORS</text></svg>'),
      reasons: [
        "Critical spelling error detected: 'Univercity' instead of 'University'",
        'Synthetic digital seal overlay without paper fiber integration',
        "Font rasterization mismatch on candidate name 'Rajesh Verma'",
        'Registry serial number failed authoritative lookup'
      ],
      rawTextPreview: 'UNIVERCITY OF DELHY / Provisional Degree Certificate / Conferred upon Rajesh Verma / Grade: First Division / Altered Registration Number',
      source: 'Document Verification',
      scannedBy: 'Anonymous Client'
    },
    {
      id: 'PARTH-SCAN-SEED-3',
      timestamp: '16 Oct 2026, 01:22 AM',
      isoDate: '2026-10-15T19:52:00.000Z',
      personName: 'Parth Raivansh',
      documentType: 'Republic of India Passport',
      documentTypeId: 'passport',
      fileName: 'parth_passport_scan.jpg',
      status: 'VALID',
      isValid: true,
      confidence: 99,
      photoUrl: headSvg,
      reasons: [
        'ICAO Doc 9303 Machine Readable Zone (MRZ) checksum verified',
        'Optical variable ink and UV fluorescent ghost photo detected',
        'Government issuance registry cryptographic signature matches',
        'Admin Master Clearance Authenticated'
      ],
      rawTextPreview: 'P<INDPARTH<<RAIVANSH<<<<<<<<<<<<<<<<<<<<<<<<< Z9847123<4IND0602148M3101155<<<<<<<<<<<<<<02',
      source: 'Identity Biometric Check',
      scannedBy: 'Admin Parth'
    }
  ];
}

class AdminScansStore {
  private filePath: string | null = null;
  private inMemoryScans: AdminScanRecord[] = [];
  private initialized = false;

  private resolveStoragePath(): string {
    const candidates = [
      path.resolve(process.cwd(), 'backend/data'),
      path.resolve(process.cwd(), 'data'),
      path.resolve(__dirname, '../../data'),
      path.resolve(__dirname, '../../../data')
    ];

    for (const dir of candidates) {
      if (fs.existsSync(dir)) {
        return path.join(dir, 'admin_scans.json');
      }
    }

    const preferredDir = fs.existsSync(path.resolve(process.cwd(), 'backend'))
      ? path.resolve(process.cwd(), 'backend/data')
      : path.resolve(process.cwd(), 'data');

    if (!fs.existsSync(preferredDir)) {
      try {
        fs.mkdirSync(preferredDir, { recursive: true });
      } catch (e) {
        // Fallback to temp if write restricted
      }
    }

    return path.join(preferredDir, 'admin_scans.json');
  }

  private initIfNeeded(): void {
    if (this.initialized) return;
    this.initialized = true;

    try {
      this.filePath = this.resolveStoragePath();
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.inMemoryScans = parsed;
          return;
        }
      }

      // Initialize with seed records if empty
      this.inMemoryScans = getSeedRecords();
      this.persistToDisk();
    } catch (err) {
      console.error('[ADMIN_SCANS_STORE] Storage initialization error:', err);
      this.inMemoryScans = getSeedRecords();
    }
  }

  private persistToDisk(): void {
    try {
      if (!this.filePath) {
        this.filePath = this.resolveStoragePath();
      }
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Save top 500 scans to avoid uncontrolled growth
      const toSave = this.inMemoryScans.slice(0, 500);
      fs.writeFileSync(this.filePath, JSON.stringify(toSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('[ADMIN_SCANS_STORE] Failed writing scans to disk:', err);
    }
  }

  public getAllScans(): AdminScanRecord[] {
    this.initIfNeeded();
    return [...this.inMemoryScans];
  }

  public addScan(data: Partial<AdminScanRecord>): AdminScanRecord {
    this.initIfNeeded();

    const now = new Date();
    const id = data.id || `PARTH-SCAN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const isValid = data.status === 'VALID' || data.status === 'VERIFIED' || data.isValid === true;
    const isInvalid = data.status === 'INVALID' || data.status === 'FAILED' || data.isValid === false;
    const finalStatus = isValid ? 'VALID' : isInvalid ? 'INVALID' : (data.status || 'NEEDS_REVIEW');

    const fallbackSvg = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" rx="14" fill="${isValid ? '#ecfdf5' : isInvalid ? '#fff1f2' : '#fffbeb'}" stroke="${isValid ? '#10b981' : isInvalid ? '#f43f5e' : '#f59e0b'}" stroke-width="2"/><circle cx="80" cy="85" r="32" fill="${isValid ? '#a7f3d0' : isInvalid ? '#fecdd3' : '#fde68a'}"/><path d="M35 155c8-26 74-26 82 0" fill="${isValid ? '#a7f3d0' : isInvalid ? '#fecdd3' : '#fde68a'}"/><rect x="135" y="65" width="145" height="12" rx="6" fill="${isValid ? '#6ee7b7' : isInvalid ? '#fda4af' : '#fcd34d'}"/><rect x="135" y="88" width="115" height="9" rx="4.5" fill="${isValid ? '#a7f3d0' : isInvalid ? '#fecdd3' : '#fde68a'}"/><rect x="135" y="108" width="85" height="9" rx="4.5" fill="${isValid ? '#d1fae5' : isInvalid ? '#ffe4e6' : '#fef3c7'}"/><rect x="40" y="175" width="240" height="8" rx="4" fill="${isValid ? '#6ee7b7' : isInvalid ? '#fda4af' : '#fcd34d'}"/></svg>`
    );

    const record: AdminScanRecord = {
      id,
      timestamp: data.timestamp || now.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      isoDate: data.isoDate || now.toISOString(),
      personName: data.personName || 'Scanned Subject',
      documentType: data.documentType || 'Official Document',
      documentTypeId: data.documentTypeId || 'other',
      fileName: data.fileName || 'scanned-doc.jpg',
      status: finalStatus,
      isValid,
      confidence: typeof data.confidence === 'number' ? Math.round(data.confidence) : (isValid ? 98 : 34),
      photoUrl: data.photoUrl || fallbackSvg,
      reasons: Array.isArray(data.reasons) && data.reasons.length > 0
        ? data.reasons
        : (isValid
          ? ['Document security parameters verified', 'Format matches government registry', 'Facial & text consistency intact']
          : ['Document failed structural integrity checks', 'High risk of alteration or tampering detected']),
      rawTextPreview: (data.rawTextPreview || '').slice(0, 200),
      source: data.source || 'Garaa Mobile & Web Scanner',
      scannedBy: data.scannedBy || 'Live Scan',
      deviceInfo: data.deviceInfo || 'Remote Client Device'
    };

    // Remove any identical ID or duplicate scan
    this.inMemoryScans = [record, ...this.inMemoryScans.filter((s) => s.id !== record.id)];
    this.persistToDisk();

    console.log(`[ADMIN_SCANS_STORE] Scan registered: ${record.id} (${record.personName} - ${record.documentType})`);
    return record;
  }

  public syncScans(incoming: AdminScanRecord[]): AdminScanRecord[] {
    this.initIfNeeded();
    if (!Array.isArray(incoming) || incoming.length === 0) {
      return this.getAllScans();
    }

    const map = new Map<string, AdminScanRecord>();
    // First put current scans
    for (const scan of this.inMemoryScans) {
      map.set(scan.id, scan);
    }
    // Overlay or add incoming scans
    for (const inc of incoming) {
      if (inc && inc.id) {
        if (!map.has(inc.id)) {
          map.set(inc.id, inc);
        }
      }
    }

    // Sort by isoDate or timestamp descending
    this.inMemoryScans = Array.from(map.values()).sort((a, b) => {
      const ta = new Date(a.isoDate || a.timestamp).getTime() || 0;
      const tb = new Date(b.isoDate || b.timestamp).getTime() || 0;
      return tb - ta;
    });

    this.persistToDisk();
    return [...this.inMemoryScans];
  }

  public deleteScan(id: string): boolean {
    this.initIfNeeded();
    const beforeCount = this.inMemoryScans.length;
    this.inMemoryScans = this.inMemoryScans.filter((s) => s.id !== id);
    if (this.inMemoryScans.length !== beforeCount) {
      this.persistToDisk();
      return true;
    }
    return false;
  }

  public clearAll(): void {
    this.initIfNeeded();
    this.inMemoryScans = [];
    this.persistToDisk();
  }
}

export const adminScansStore = new AdminScansStore();
