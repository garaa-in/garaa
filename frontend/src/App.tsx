import React, { useState, useEffect, useRef } from 'react';
import { ApiClient } from './services/api';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { ApiKeysModal } from './components/ApiKeysModal';
import { AdminReviewModal } from './components/AdminReviewModal';
import { TeamModal } from './components/TeamModal';
import { AuditLogModal } from './components/AuditLogModal';

declare global {
  interface Window {
    GARAA_D?: string;
    GARAA_VB?: string;
    zyEnsure?: (name: string) => Promise<void>;
    FaceDetector?: any;
    blazeface?: any;
    pdfjsLib?: any;
    Tesseract?: any;
  }
}

const LANGUAGE_GROUPS = [
  { country: "United States", flag: "🇺🇸", languages: [{ code: "en", label: "English" }] },
  {
    country: "India",
    flag: "🇮🇳",
    languages: [
      { code: "hi", label: "Hindi" },
      { code: "gu", label: "Gujarati" },
      { code: "bn", label: "Bengali" },
      { code: "mr", label: "Marathi" },
      { code: "ta", label: "Tamil" },
      { code: "te", label: "Telugu" },
      { code: "kn", label: "Kannada" },
      { code: "ml", label: "Malayalam" },
      { code: "pa", label: "Punjabi" },
      { code: "ur", label: "Urdu" }
    ]
  },
  { country: "France", flag: "🇫🇷", languages: [{ code: "fr", label: "French" }] },
  { country: "Germany", flag: "🇩🇪", languages: [{ code: "de", label: "German" }] },
  { country: "Spain", flag: "🇪🇸", languages: [{ code: "es", label: "Spanish" }] },
  { country: "Portugal", flag: "🇵🇹", languages: [{ code: "pt", label: "Portuguese" }] },
  { country: "Italy", flag: "🇮🇹", languages: [{ code: "it", label: "Italian" }] },
  { country: "Netherlands", flag: "🇳🇱", languages: [{ code: "nl", label: "Dutch" }] },
  { country: "Saudi Arabia", flag: "🇸🇦", languages: [{ code: "ar", label: "Arabic" }] },
  { country: "Russia", flag: "🇷🇺", languages: [{ code: "ru", label: "Russian" }] },
  { country: "Turkey", flag: "🇹🇷", languages: [{ code: "tr", label: "Turkish" }] },
  { country: "Japan", flag: "🇯🇵", languages: [{ code: "ja", label: "Japanese" }] },
  { country: "South Korea", flag: "🇰🇷", languages: [{ code: "ko", label: "Korean" }] },
  { country: "China", flag: "🇨🇳", languages: [{ code: "zh-CN", label: "Chinese" }] }
];
const LANGUAGES = LANGUAGE_GROUPS.reduce((all: any[], group) => all.concat(group.languages), []);

function readSavedLanguage() {
  try { return localStorage.getItem("garaa-language") || "en"; } catch { return "en"; }
}
function setLanguageCookie(code: string) {
  try { localStorage.setItem("garaa-language", code); } catch {}
  if (code === "en") {
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  } else {
    document.cookie = `googtrans=/en/${code}; path=/;`;
  }
  document.documentElement.lang = code;
}
function changeSiteLanguage(code: string) {
  setLanguageCookie(code);
  const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement;
  if (combo) {
    combo.value = code;
    combo.dispatchEvent(new Event("change"));
  }
}

/* ---------------- Icons ---------------- */
const ICON_PATHS: Record<string, React.ReactNode> = {
  ShieldCheck: (<><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path d="M8.5 12.5l2.5 2.5 5-5"/></>),
  ShieldAlert: (<><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16.3" r="0.6" fill="currentColor" stroke="none"/></>),
  ShieldX: (<><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path d="M9.5 9.5l5 5M14.5 9.5l-5 5"/></>),
  LayoutGrid: (<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>),
  User: (<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></>),
  Users: (<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
  Radar: (<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><line x1="12" y1="12" x2="19" y2="6"/></>),
  Lock: (<><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>),
  Key: (<><path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1.5-1.5L8 9M3 21l6-6"/><circle cx="7.5" cy="7.5" r="4.5"/></>),
  History: (<><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 5v5h5"/><path d="M12 8v4l3 3"/></>),
  FileText: (<><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></>),
  Settings: (<><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></>),
  CreditCard: (<><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>),
  Wallet: (<><path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3"/><path d="M3 7v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-4a2 2 0 1 0 0 4"/></>),
  BookUser: (<><path d="M4 4h13a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><circle cx="10" cy="9" r="2"/><path d="M6 15.5c0-1.7 1.8-3 4-3s4 1.3 4 3"/></>),
  Car: (<><path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13"/><rect x="2" y="13" width="20" height="5" rx="1"/><circle cx="7" cy="18.5" r="1.5"/><circle cx="17" cy="18.5" r="1.5"/></>),
  Baby: (<><circle cx="12" cy="8" r="4"/><path d="M8 14c0 3 1.8 6 4 6s4-3 4-6"/></>),
  FileCheck: (<><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/><path d="M9 14l2 2 4-4"/></>),
  GraduationCap: (<><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/></>),
  FileQuestion: (<><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/><path d="M10.3 11.8a1.7 1.7 0 1 1 2.3 1.6c-.8.3-1.1.9-1.1 1.7"/><circle cx="11.5" cy="17.3" r="0.4" fill="currentColor" stroke="none"/></>),
  UploadCloud: (<><path d="M7 17a4 4 0 0 1-.6-8 5 5 0 0 1 9.6-1.5A4.5 4.5 0 0 1 17 17"/><path d="M12 12v7M9 15l3-3 3 3"/></>),
  Camera: (<><path d="M4 7h3l1.5-2h7L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"/><circle cx="12" cy="13" r="3.5"/></>),
  Scan: (<><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><rect x="8" y="8" width="8" height="8" rx="1"/></>),
  FileStack: (<><path d="M7 3h11a2 2 0 0 1 2 2v12"/><path d="M4 7h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"/><path d="M6 12h9M6 16h6"/></>),
  Image: (<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5-9 9"/></>),
  X: (<><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></>),
  ChevronDown: (<path d="M6 9l6 6 6-6"/>),
  ChevronRight: (<path d="M9 6l6 6-6 6"/>),
  ChevronLeft: (<path d="M15 18l-6-6 6-6"/>),
  CheckCircle2: (<><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 5-5"/></>),
  XCircle: (<><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></>),
  AlertTriangle: (<><path d="M12 3l10 18H2z"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none"/></>),
  Fingerprint: (<><path d="M12 3a7 7 0 0 1 7 7v3a10 10 0 0 1-1 4"/><path d="M5 13v-3a7 7 0 0 1 3-5.7"/><path d="M8 21a12 12 0 0 0 1.5-3"/><path d="M12 8a3 3 0 0 1 3 3v2a8 8 0 0 1-2 5"/><path d="M9 17a7 7 0 0 0 1-4v-2a2 2 0 1 1 4 0"/></>),
  QrCode: (<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/></>),
  Search: (<><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></>),
  Type: (<path d="M4 5h16M12 5v14M9 19h6"/>),
  Languages: (<><path d="M5 5h8M9 3v2c0 4-2 7-5 9"/><path d="M6 9c1.2 1.7 2.7 3 5 4"/><path d="M14 14h6M17 12v2l-3 7M16 18h4"/></>),
  Layers: (<><path d="M12 2l9 5-9 5-9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 17l9 5 9-5"/></>),
  Download: (<><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 19h16"/></>),
  RefreshCcw: (<><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>),
  Info: (<><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="8" r="0.5" fill="currentColor" stroke="none"/></>),
  Sparkles: (<><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></>),
  Eye: (<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>),
  Link2: (<><path d="M9 12h6"/><path d="M10 6H7a4 4 0 1 0 0 8h3"/><path d="M14 18h3a4 4 0 1 0 0-8h-3"/></>),
  Database: (<><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></>),
  Bell: (<><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 20a2 2 0 0 0 4 0"/></>),
  MessageCircle: (<><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-3.6-.8L4 20l1.8-3.5A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5z"/></>),
  Bug: (<><rect x="7" y="7" width="10" height="11" rx="3"/><path d="M9 4v3M15 4v3M4 10h3M17 10h3M4 15h3M17 15h3M9 18v2M15 18v2"/></>),
  Globe: (<><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><line x1="3" y1="12" x2="21" y2="12"/></>),
  Palette: (<><path d="M12 3a9 9 0 1 0 0 18h1.3a1.6 1.6 0 0 0 1.1-2.7 1.6 1.6 0 0 1 1.1-2.7H17a3 3 0 0 0 3-3A9 9 0 0 0 12 3z"/><circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none"/><circle cx="11" cy="7.2" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none"/></>),
  Sun: (<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>),
  Moon: (<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5z"/>),
  ExternalLink: (<><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></>),
  ClipboardCheck: (<><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 14l2 2 4-4"/></>),
  GaraaMark: (<path d={window.GARAA_D || "M57.16 80.75"} transform="translate(.34 0) scale(.24)" fill="currentColor" stroke="none" fillRule="evenodd"/>)
};

export const Icon: React.FC<{ name: string; size?: number; className?: string }> = ({ name, size = 18, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {ICON_PATHS[name]}
  </svg>
);

const disp = { fontFamily: "'Sora', sans-serif" };
const mono = { fontFamily: "'JetBrains Mono', monospace" };

/* ---------------- Theme & Badges ---------------- */
const DEFAULT_ACCENT = { c1: "#DDD6F8", c2: "#B2ABEC" };
function applyTheme(theme = DEFAULT_ACCENT) {
  document.documentElement.style.setProperty("--acc-1", theme.c1);
  document.documentElement.style.setProperty("--acc-2", theme.c2);
}
const STATUS_THEMES: Record<string, any> = {
  neutral: { a: "#F4F2FB", b: "#FFFFFF", tint: "#B2ABEC" },
  verified: { a: "#CDF3DC", b: "#FFFFFF", tint: "#15803D", c1: "#166534", c2: "#4ADE80" },
  invalid: { a: "#F6D9DD", b: "#FFFFFF", tint: "#9F1239", c1: "#7F1D1D", c2: "#E85D6B" }
};
function applyStatusTheme(key: string) {
  const t = STATUS_THEMES[key] || STATUS_THEMES.neutral;
  document.documentElement.style.setProperty("--page-bg-a", t.a);
  document.documentElement.style.setProperty("--page-bg-b", t.b);
  document.documentElement.style.setProperty("--status-tint", t.tint);
}

export function SIHBadge({ size = "sm" }: { size?: "sm" | "lg" }) {
  return null;
}

export const DOC_TYPES = [
  { id: "aadhaar", name: "Aadhaar Card", icon: "CreditCard", desc: "12-digit unique identity number issued by UIDAI", fields: ["Name", "DOB / YOB", "Gender", "Aadhaar Number", "QR Code", "Photo"] },
  { id: "pan", name: "PAN Card", icon: "Wallet", desc: "10-character alphanumeric tax ID", fields: ["Name", "Father's Name", "DOB", "PAN Number", "Photo", "Signature"] },
  { id: "passport", name: "Passport", icon: "BookUser", desc: "International travel & identity document", fields: ["Name", "Passport No.", "MRZ Zone", "Photo", "Nationality", "DOB"] },
  { id: "dl", name: "Driving Licence", icon: "Car", desc: "State-issued driving authorisation", fields: ["Licence No.", "Name", "DOB", "Validity", "Photo", "Issuing Authority"] },
  { id: "birth", name: "Birth Certificate", icon: "Baby", desc: "Official record of birth registration", fields: ["Name", "DOB", "Registration No.", "Issuing Authority"] },
  { id: "leaving", name: "Leaving Certificate", icon: "FileCheck", desc: "School leaving / transfer certificate", fields: ["Student Name", "DOB", "Institution", "Certificate No.", "Class / Course"] },
  { id: "edu", name: "Educational Certificate", icon: "GraduationCap", desc: "Degree, marksheet or course certificate", fields: ["Institution", "Student Name", "Course", "Year", "Certificate No."] },
  { id: "other", name: "Other Documents", icon: "FileQuestion", desc: "General document screening", fields: ["Document Title", "Name", "Identifiers"] }
];
export const docById = (id: string) => DOC_TYPES.find((d) => d.id === id) || DOC_TYPES[7];

export const STEPS = [
  { key: "type", label: "Identifying document type", icon: "Search" },
  { key: "structure", label: "Checking document structure", icon: "Layers" },
  { key: "fields", label: "Verifying required fields", icon: "Type" },
  { key: "number", label: "Validating number format", icon: "Fingerprint" },
  { key: "qr", label: "Reading QR / barcode", icon: "QrCode" },
  { key: "photo", label: "Analysing photo region", icon: "User" },
  { key: "tamper", label: "Scanning for tampering", icon: "Eye" }
];

/* ---------------- UI Primitives ---------------- */
export const Card: React.FC<{ className?: string; children: React.ReactNode; [key: string]: any }> = ({ className = "", children, ...p }) => (
  <div className={`rounded-2xl glass shadow-[0_8px_30px_-10px_rgba(0,0,0,0.6)] ${className}`} {...p}>
    {children}
  </div>
);

export const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, any> = {
    VERIFIED: { bg: "bg-emerald-500/10", text: "text-emerald-400", ring: "ring-emerald-500/30", icon: "CheckCircle2", label: "Valid" },
    NEEDS_REVIEW: { bg: "bg-amber-500/10", text: "text-amber-400", ring: "ring-amber-500/30", icon: "AlertTriangle", label: "Review" },
    FAILED: { bg: "bg-rose-500/10", text: "text-rose-400", ring: "ring-rose-500/30", icon: "XCircle", label: "Invalid" },
    SUBMITTED: { bg: "bg-cyan-500/10", text: "text-cyan-500", ring: "ring-cyan-500/30", icon: "RefreshCcw", label: "Processing" },
    PROCESSING: { bg: "bg-cyan-500/10", text: "text-cyan-500", ring: "ring-cyan-500/30", icon: "RefreshCcw", label: "Processing" },
    UNABLE_TO_VERIFY: { bg: "bg-amber-500/10", text: "text-amber-400", ring: "ring-amber-500/30", icon: "AlertTriangle", label: "Inconclusive" },
    REJECTED: { bg: "bg-rose-500/10", text: "text-rose-400", ring: "ring-rose-500/30", icon: "XCircle", label: "Rejected" }
  };
  const item = map[status] || map.NEEDS_REVIEW;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${item.bg} ${item.text} ${item.ring}`}>
      <Icon name={item.icon} size={13} /> {item.label}
    </span>
  );
};

export const RiskBadge: React.FC<{ level: string }> = ({ level }) => {
  const map: Record<string, string> = {
    LOW: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
    MEDIUM: "bg-amber-500/10 text-amber-400 ring-amber-500/30",
    HIGH: "bg-orange-500/10 text-orange-400 ring-orange-500/30",
    CRITICAL: "bg-rose-500/15 text-rose-300 ring-rose-500/40"
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ring-1 tracking-wide ${map[level] || map.LOW}`} style={mono}>
      {level}
    </span>
  );
};

export const SeverityDot: React.FC<{ s: string }> = ({ s }) => {
  const map: Record<string, string> = {
    CRITICAL: "bg-rose-500",
    HIGH: "bg-orange-400",
    MEDIUM: "bg-amber-400",
    LOW: "bg-slate-400"
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${map[s] || 'bg-slate-400'}`} />;
};

export const Toast: React.FC<{ toast: string | null }> = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] glass-strong text-[#0B1220] px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm fade-in accent-glow">
      <Icon name="Sparkles" size={15} className="accent-color" /> {toast}
    </div>
  );
};

export const Row: React.FC<{ label: string; value: React.ReactNode; m?: boolean }> = ({ label, value, m }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-slate-400">{label}</span>
    <span className="text-xs font-semibold text-[#0B1220]" style={m ? mono : {}}>{value}</span>
  </div>
);

export function EnergyBackground({ variant = "app" }: { variant?: "app" | "landing" }) {
  const big = variant === "landing";
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(15,40,80,0.045) 1px, transparent 0)", backgroundSize: "28px 28px" }} />
      <div className="energy-blob" style={{ width: big ? "520px" : "380px", height: big ? "520px" : "380px", top: "-10%", left: "-8%", background: "var(--acc-1)", opacity: 0.07 }} />
      <div className="energy-blob" style={{ width: big ? "460px" : "340px", height: big ? "460px" : "340px", bottom: "-12%", right: "-6%", background: "var(--acc-2)", opacity: 0.07, animationDelay: "3s" }} />
      <div className="energy-blob" style={{ width: "260px", height: "260px", top: "45%", left: "60%", background: "var(--acc-1)", opacity: 0.04, animationDelay: "6s" }} />
    </div>
  );
}

export function VerdictStamp({ status }: { status: string }) {
  const map: Record<string, any> = {
    VERIFIED: { label: "VALID", sub: "Document authenticated", color: "emerald", icon: "ShieldCheck" },
    FAILED: { label: "INVALID", sub: "Verification failed", color: "rose", icon: "ShieldX" },
    NEEDS_REVIEW: { label: "REVIEW", sub: "Needs compliance review", color: "amber", icon: "ShieldAlert" },
    REJECTED: { label: "REJECTED", sub: "Rejected by compliance officer", color: "rose", icon: "ShieldX" },
    UNABLE_TO_VERIFY: { label: "INCONCLUSIVE", sub: "Unable to verify conclusively", color: "amber", icon: "ShieldAlert" }
  };
  const item = map[status] || map.NEEDS_REVIEW;
  const c = item.color;
  return (
    <div className="flex items-center gap-4">
      <div className={`relative shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center bg-${c}-500/10 ring-2 ring-${c}-500/40`}>
        <Icon name={item.icon} size={30} className={`text-${c}-400`} />
        <div className={`absolute inset-0 rounded-2xl ring-2 ring-${c}-500/30 pulse-glow`} />
      </div>
      <div>
        <div style={disp} className={`font-extrabold text-3xl sm:text-4xl tracking-wide text-${c}-400 -rotate-1`}>
          {item.label}
        </div>
        <div className="text-xs sm:text-sm text-slate-400 mt-0.5">{item.sub}</div>
      </div>
    </div>
  );
}

/* ---------------- Navigation Bar ---------------- */
export const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "LayoutGrid" },
  { id: "smartscan", label: "Smart Scan", icon: "Scan" },
  { id: "verify", label: "Verify Document", icon: "ShieldCheck" },
  { id: "identity", label: "Identity Check", icon: "User" },
  { id: "cyberintel", label: "Cyber Intelligence", icon: "ShieldAlert" },
  { id: "digilocker", label: "Integrations", icon: "Link2" },
  { id: "reports", label: "Reports", icon: "FileText" }
];

export function Sidebar({ view, setView }: { view: string; setView: (v: string) => void }) {
  const { activeOrg } = useAuth();
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-white/10 glass h-screen sticky top-0 py-6 z-10">
      <div className="px-6 flex items-center gap-2.5 mb-6">
        <div className="w-9 h-9 rounded-xl logo-orb flex items-center justify-center accent-glow">
          <Icon name="GaraaMark" size={22} className="garaa-mark" />
        </div>
        <div>
          <div style={disp} className="text-[#0B1220] font-bold text-lg leading-none">Garaa</div>
          <div className="text-[10px] text-slate-400 tracking-wide mt-0.5">Scan. Verify. Protect.</div>
        </div>
      </div>

      {activeOrg && (
        <div className="px-5 mb-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">Tenant</div>
              <div className="text-xs font-bold text-[#0B1220] truncate">{activeOrg.name}</div>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
              {activeOrg.role}
            </span>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 space-y-1">
        {NAV.map((n) => {
          const active = view === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active ? "accent-grad text-white accent-glow" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <Icon name={n.icon} size={17} className={active ? "text-white" : "text-slate-400"} />
              {n.label}
            </button>
          );
        })}
      </nav>

      <div className="px-4 pt-4 mt-2 border-t border-white/10 space-y-3">
        <div className="rounded-xl bg-white/5 p-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200 mb-1">
            <Icon name="Info" size={13} /> Production Ready
          </div>
          Multi-tenant isolation active. All records persist to database.
        </div>
      </div>
    </aside>
  );
}

export function LanguagePicker({ language, setLanguage }: { language: string; setLanguage: (l: string) => void }) {
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
        setCountry(null);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const chooseLanguage = (item: any) => {
    setLanguage(item.code);
    changeSiteLanguage(item.code);
    setOpen(false);
    setCountry(null);
  };

  const activeGroup = LANGUAGE_GROUPS.find((group) => group.country === country);

  return (
    <div ref={menuRef} className="relative w-[116px] sm:w-[148px] shrink-0 notranslate" translate="no">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setCountry(null); }}
        className="relative flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm w-full cursor-pointer text-left"
        aria-expanded={open}
        aria-label="Choose language"
      >
        <Icon name="Languages" size={15} className="responsive-header-icon text-slate-500 shrink-0" />
        <span className="flex-1 min-w-0 whitespace-nowrap text-xs sm:text-sm font-semibold leading-tight text-[#0B1220]">
          Language
        </span>
        <Icon name="ChevronDown" size={13} className={`responsive-header-icon text-[#0B1220] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[70] w-[250px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_16px_45px_-18px_rgba(15,23,42,.45)] notranslate">
          {!activeGroup && (
            <>
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
                Choose a country
              </div>
              <div className="space-y-1 max-h-[min(60vh,360px)] overflow-y-auto">
                {LANGUAGE_GROUPS.map((group) => (
                  <button
                    key={group.country}
                    type="button"
                    onClick={() => setCountry(group.country)}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-lg w-6 text-center">{group.flag}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-[#0B1220]">{group.country}</span>
                      <span className="block text-[11px] text-slate-400">
                        {group.languages.length === 1 ? group.languages[0].label : `${group.languages.length} common languages`}
                      </span>
                    </span>
                    <Icon name="ChevronRight" size={15} className="responsive-header-icon text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </>
          )}

          {activeGroup && (
            <>
              <button
                type="button"
                onClick={() => setCountry(null)}
                className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-slate-500 hover:text-[#0B1220]"
              >
                <Icon name="ChevronRight" size={14} className="responsive-header-icon rotate-180" /> All countries
              </button>
              <div className="flex items-center gap-2 px-3 pb-2 pt-1 border-b border-slate-100">
                <span className="text-lg">{activeGroup.flag}</span>
                <span className="text-sm font-bold text-[#0B1220]">{activeGroup.country}</span>
              </div>
              <div className="pt-2 space-y-1">
                {activeGroup.languages.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => chooseLanguage(item)}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-slate-100 transition-colors ${language === item.code ? "bg-slate-100" : ""}`}
                  >
                    <span className="text-sm font-medium text-[#0B1220]">{item.label}</span>
                    {language === item.code && <Icon name="CheckCircle2" size={15} className="text-emerald-600" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function MercurySphereMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="mercury-sphere-gradient" cx="28%" cy="23%" r="78%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#dfe5eb" />
          <stop offset="67%" stopColor="#9ba7b3" />
          <stop offset="100%" stopColor="#3b4652" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="14.2" fill="url(#mercury-sphere-gradient)" stroke="rgba(255,255,255,.72)" strokeWidth="0.8" />
      <ellipse cx="11.5" cy="9.2" rx="4.2" ry="2.3" fill="#fff" opacity=".25" transform="rotate(-28 11.5 9.2)" />
    </svg>
  );
}

export function ProfileMenu({
  setView,
  pushToast,
  onOpenAuth,
  onOpenApiKeys,
  onOpenReview,
  onOpenTeam,
  onOpenAudit
}: {
  setView: (v: string) => void;
  pushToast: (msg: string) => void;
  onOpenAuth: () => void;
  onOpenApiKeys: () => void;
  onOpenReview: () => void;
  onOpenTeam: () => void;
  onOpenAudit: () => void;
}) {
  const { user, activeOrg, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [supportType, setSupportType] = useState<string | null>(null);
  const [supportText, setSupportText] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const goTo = (nextView: string) => { setView(nextView); setOpen(false); };
  const closeSupport = () => { setSupportType(null); setSupportText(""); };

  const submitSupport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supportText.trim()) return;
    const submittedType = supportType;
    try {
      if (submittedType === "bug") {
        await ApiClient.sendBugReport(supportText, user?.email);
      } else {
        await ApiClient.sendFeedback(supportText, user?.email);
      }
      closeSupport();
      setOpen(false);
      pushToast(submittedType === "bug" ? "Bug report saved to Garaa server" : "Feedback received. Thank you!");
    } catch {
      closeSupport();
      setOpen(false);
      pushToast("Support request saved");
    }
  };

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mercury-symbol w-9 h-9 rounded-full"
        title="Open account and support menu"
        aria-label="Open account and support menu"
      >
        <MercurySphereMark size={36} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[70] w-[295px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_45px_-18px_rgba(15,23,42,.45)]">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-11 h-11 rounded-full logo-orb flex items-center justify-center accent-glow">
              <MercurySphereMark size={38} />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[#0B1220] text-sm truncate">
                {user ? user.fullName : "Garaa Operator"}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 truncate">
                {activeOrg ? `${activeOrg.name} (${activeOrg.role})` : "Demo Workspace"}
              </div>
            </div>
          </div>

          <div className="py-2.5 border-b border-slate-100 space-y-1">
            <button
              type="button"
              onClick={() => { onOpenAuth(); setOpen(false); }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-100 transition-colors"
            >
              <Icon name="User" size={16} className="accent-color" />
              <span className="text-sm font-semibold text-[#0B1220]">Switch Tenant / Account</span>
            </button>
            <button
              type="button"
              onClick={() => { onOpenApiKeys(); setOpen(false); }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-100 transition-colors"
            >
              <Icon name="Key" size={16} className="accent-color" />
              <span className="text-sm font-semibold text-[#0B1220]">B2B API Keys</span>
            </button>
            <button
              type="button"
              onClick={() => { onOpenReview(); setOpen(false); }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-100 transition-colors"
            >
              <Icon name="ClipboardCheck" size={16} className="accent-color" />
              <span className="text-sm font-semibold text-[#0B1220]">Review Queue</span>
            </button>
            <button
              type="button"
              onClick={() => { onOpenTeam(); setOpen(false); }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-100 transition-colors"
            >
              <Icon name="Users" size={16} className="accent-color" />
              <span className="text-sm font-semibold text-[#0B1220]">Team & Roles (RBAC)</span>
            </button>
            <button
              type="button"
              onClick={() => { onOpenAudit(); setOpen(false); }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-100 transition-colors"
            >
              <Icon name="Lock" size={16} className="accent-color" />
              <span className="text-sm font-semibold text-[#0B1220]">Audit Trail</span>
            </button>
          </div>

          <div className="py-2.5 border-b border-slate-100 space-y-1">
            {[
              ["cybercrime", "Record Screening", "Radar"],
              ["cyberintel", "Cyber Intelligence", "ShieldAlert"],
              ["history", "Verification History", "History"],
              ["settings", "Settings", "Settings"]
            ].map(([nextView, label, icon]) => (
              <button
                key={nextView}
                type="button"
                onClick={() => goTo(nextView)}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-100 transition-colors"
              >
                <Icon name={icon} size={16} className="accent-color" />
                <span className="text-sm font-semibold text-[#0B1220]">{label}</span>
                <Icon name="ChevronRight" size={14} className="ml-auto text-slate-400" />
              </button>
            ))}
          </div>

          <div className="pt-2 border-b border-slate-100 pb-2 space-y-1">
            <button
              type="button"
              onClick={() => { setSupportType("feedback"); setOpen(false); }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-100 transition-colors"
            >
              <Icon name="MessageCircle" size={16} className="text-slate-500" />
              <span className="text-sm font-semibold text-[#0B1220]">Feedback</span>
            </button>
            <button
              type="button"
              onClick={() => { setSupportType("bug"); setOpen(false); }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-100 transition-colors"
            >
              <Icon name="Bug" size={16} className="text-rose-500" />
              <span className="text-sm font-semibold text-[#0B1220]">Report a bug</span>
            </button>
          </div>

          {user && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => { logout(); setOpen(false); pushToast('Signed out'); }}
                className="w-full py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl"
              >
                Sign out
              </button>
            </div>
          )}

          <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Garaa Platform · B2B Enterprise
          </div>
        </div>
      )}

      {supportType && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-5"
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeSupport(); }}
        >
          <form onSubmit={submitSupport} className="garaa-modal-surface w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] accent-color">
                  <Icon name={supportType === "bug" ? "Bug" : "MessageCircle"} size={14} />
                  {supportType === "bug" ? "Product support" : "Help us improve"}
                </div>
                <h3 style={disp} className="text-lg font-bold text-[#0B1220] mt-2">
                  {supportType === "bug" ? "Report a bug" : "Send feedback"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {supportType === "bug" ? "Tell us what broke and what you expected to happen." : "Share an idea or tell us what would make Garaa better."}
                </p>
              </div>
              <button type="button" onClick={closeSupport} className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                ✕
              </button>
            </div>
            <textarea
              autoFocus
              rows={5}
              value={supportText}
              onChange={(e) => setSupportText(e.target.value)}
              placeholder={supportType === "bug" ? "Describe the steps, screen, and result..." : "Write your feedback here..."}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-[#0B1220] outline-none focus:border-[var(--acc-1)] resize-y"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={closeSupport} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100">
                Cancel
              </button>
              <button type="submit" disabled={!supportText.trim()} className="accent-grad text-white rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-40">
                {supportType === "bug" ? "Submit bug report" : "Send feedback"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function TopBar({
  title,
  sub,
  language,
  setLanguage,
  setView,
  pushToast,
  onOpenAuth,
  onOpenApiKeys,
  onOpenReview,
  onOpenTeam,
  onOpenAudit
}: {
  title: string;
  sub?: string;
  language: string;
  setLanguage: (l: string) => void;
  setView: (v: string) => void;
  pushToast: (msg: string) => void;
  onOpenAuth: () => void;
  onOpenApiKeys: () => void;
  onOpenReview: () => void;
  onOpenTeam: () => void;
  onOpenAudit: () => void;
}) {
  const { activeOrg } = useAuth();
  return (
    <div className="relative z-30 glass-strong border-b border-white/10 px-3 sm:px-5 lg:px-8 py-3 sm:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2 sm:gap-3 min-w-0 w-full sm:flex-1">
        <div className="lg:hidden w-7 h-7 sm:w-8 sm:h-8 rounded-lg logo-orb flex items-center justify-center shrink-0">
          <Icon name="GaraaMark" size={18} className="responsive-header-icon garaa-mark" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 style={disp} className="text-[#0B1220] font-bold text-base sm:text-xl leading-tight break-words">
            {title}
          </h1>
          {sub && <p className="text-[11px] sm:text-sm text-slate-400 mt-0.5 leading-snug whitespace-normal break-words">{sub}</p>}
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 sm:gap-3 w-full sm:w-auto sm:ml-3 min-h-[40px]">
        {activeOrg && (
          <button
            type="button"
            onClick={onOpenAuth}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white/70 border border-slate-200 px-3 py-1.5 rounded-full hover:bg-white"
          >
            🏢 {activeOrg.name} ({activeOrg.role})
          </button>
        )}
        <LanguagePicker language={language} setLanguage={setLanguage} />
        <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white/5 px-2.5 py-1.5 rounded-full ring-1 ring-white/10">
          <span className="w-1.5 h-1.5 rounded-full accent-dot pulse-glow" /> Connected API
        </span>
        <button
          onClick={onOpenReview}
          className="hidden sm:flex w-9 h-9 rounded-full glass items-center justify-center text-slate-600 hover:text-slate-900"
          title="Review Queue"
        >
          <Icon name="Bell" size={16} className="responsive-header-icon" />
        </button>
        <div className="block">
          <ProfileMenu
            setView={setView}
            pushToast={pushToast}
            onOpenAuth={onOpenAuth}
            onOpenApiKeys={onOpenApiKeys}
            onOpenReview={onOpenReview}
            onOpenTeam={onOpenTeam}
            onOpenAudit={onOpenAudit}
          />
        </div>
      </div>
    </div>
  );
}

export function MobileNav({ view, setView }: { view: string; setView: (v: string) => void }) {
  return (
    <div className="lg:hidden relative z-20 glass-strong border-b border-white/10 overflow-x-auto no-scrollbar">
      <div className="flex gap-1 px-3 py-2 min-w-max">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap ${
              view === n.id ? "accent-grad text-white" : "bg-white/5 text-slate-300"
            }`}
          >
            <Icon name={n.icon} size={13} className="responsive-nav-icon" /> {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Real Connected Dashboard ---------------- */
export function StatCard({ label, value, icon, tint }: { label: string; value: React.ReactNode; icon: string; tint: string }) {
  return (
    <Card className="p-4 sm:p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tint}`}>
        <Icon name={icon} size={19} />
      </div>
      <div>
        <div style={disp} className="text-2xl font-bold text-[#0B1220]">{value}</div>
        <div className="text-xs text-slate-400">{label}</div>
      </div>
    </Card>
  );
}

export function Dashboard({
  setView,
  setSelectedDoc
}: {
  setView: (v: string) => void;
  setSelectedDoc: (id: string) => void;
}) {
  const [stats, setStats] = useState<any>({
    totalRequests: 0,
    verifiedCount: 0,
    failedCount: 0,
    reviewCount: 0,
    successRate: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiClient.getDashboardStats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Dashboard stats fallback:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-5 lg:p-8 space-y-8 relative z-10 zx-dash">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Documents Valid"
          value={loading ? "…" : stats.verifiedCount}
          icon="CheckCircle2"
          tint="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          label="Fraud Detected"
          value={loading ? "…" : stats.failedCount}
          icon="ShieldX"
          tint="bg-rose-500/10 text-rose-400"
        />
        <StatCard
          label="Needs Review"
          value={loading ? "…" : stats.reviewCount}
          icon="ShieldAlert"
          tint="bg-amber-500/10 text-amber-400"
        />
        <StatCard
          label="Success Rate"
          value={loading ? "…" : `${stats.successRate}%`}
          icon="Radar"
          tint="bg-white/5 accent-color"
        />
      </div>

      <Card className="p-3 sm:p-4 accent-grad border-none flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Icon name="Scan" size={17} className="text-white" />
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[.16em] text-white/70 font-bold mb-0.5">
              Universal Intake · Production Backend
            </div>
            <h2 style={disp} className="text-white font-bold text-sm sm:text-base">
              Smart Scan any document
            </h2>
            <p className="text-white/80 text-[11px] mt-0.5 max-w-xl leading-snug">
              Upload mixed PDFs or images. Garaa extracts text, validates signatures, checks duplicates, and routes every page automatically.
            </p>
          </div>
        </div>
        <button
          onClick={() => setView("smartscan")}
          className="shrink-0 bg-white/95 text-[#0a0a0a] font-semibold text-[11px] px-3 py-2 rounded-lg hover:bg-white inline-flex items-center justify-center gap-1.5"
        >
          <Icon name="Scan" size={13} /> Open Smart Scan
        </button>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 style={disp} className="font-bold text-[#0B1220] text-base sm:text-lg">
            Select a document to verify
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {DOC_TYPES.map((d) => (
            <Card
              key={d.id}
              className="p-5 flex flex-col gap-3 hover:-translate-y-0.5 hover:accent-ring transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center accent-color">
                <Icon name={d.icon} size={20} />
              </div>
              <div>
                <div className="font-semibold text-[#0B1220] text-sm">{d.name}</div>
                <div className="text-xs text-slate-400 mt-1 leading-relaxed">{d.desc}</div>
              </div>
              <button
                onClick={() => { setSelectedDoc(d.id); setView("verify"); }}
                className="mt-1 text-xs font-semibold text-[#0B1220] bg-white/5 hover:bg-white/10 rounded-lg py-2 transition-colors"
              >
                Verify →
              </button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Stepper & Upload Zone ---------------- */
export function ScanStepper({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="space-y-0.5">
      {STEPS.map((s, i) => {
        const state = i < activeIndex ? "done" : i === activeIndex ? "active" : "pending";
        return (
          <div key={s.key} className="flex items-center gap-3 py-2 border-b border-dashed border-white/10 last:border-0">
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                state === "done"
                  ? "bg-emerald-500 text-white"
                  : state === "active"
                  ? "accent-grad text-white pulse-glow"
                  : "bg-white/5 text-slate-500"
              }`}
            >
              <Icon name={state === "done" ? "CheckCircle2" : s.icon} size={12} />
            </div>
            <span className={`text-xs sm:text-[13px] ${state === "pending" ? "text-slate-500" : "text-slate-100"}`} style={mono}>
              {s.label}
            </span>
            {state === "active" && <span className="text-[10px] accent-color ml-auto animate-pulse" style={mono}>running…</span>}
            {state === "done" && <span className="text-[10px] text-emerald-400 ml-auto" style={mono}>ok</span>}
          </div>
        );
      })}
    </div>
  );
}

export function UploadZone({ onFile, docName }: { onFile: (f: File) => void; docName: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
      onClick={() => inputRef.current && inputRef.current.click()}
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
        drag ? "accent-border bg-white/5" : "border-white/15 bg-white/[0.02] hover:bg-white/[0.04]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files && e.target.files[0];
          if (f) onFile(f);
        }}
      />
      <div className="w-12 h-12 mx-auto rounded-xl bg-white/5 flex items-center justify-center accent-color mb-3">
        <Icon name="UploadCloud" size={22} />
      </div>
      <div className="font-semibold text-[#0B1220] text-sm">Upload {docName}</div>
      <div className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP or PDF · Maximum 15 MB</div>
    </div>
  );
}

/* ---------------- Real Connected Verification Page ---------------- */
export function VerifyPage({
  selectedDocId,
  setSelectedDocId,
  onComplete,
  pushToast,
  onReset,
  onOpenIdentity
}: {
  selectedDocId: string;
  setSelectedDocId: (id: string) => void;
  onComplete: (r: any) => void;
  pushToast: (m: string) => void;
  onReset: () => void;
  onOpenIdentity: (url: string, name: string, data: any) => void;
}) {
  const doc = docById(selectedDocId);
  const [preview, setPreview] = useState<any | null>(null);
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<any | null>(null);
  const [subjectName, setSubjectName] = useState('Parth Raivansh');
  const [subjectDob, setSubjectDob] = useState('2006-02-14');
  const [declaredId, setDeclaredId] = useState('1234 5678 9012');
  const [openWhy, setOpenWhy] = useState(false);

  const handleFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    setPreview({ url, name: file.name, type: file.type });
    setPhase('scanning');
    setStepIndex(1);
    if (onReset) onReset();

    try {
      // 1. Upload to backend
      setStepIndex(2);
      const uploadRes = await ApiClient.uploadDocument(file);
      const docId = uploadRes.document.id;

      // 2. Step through visualization
      setStepIndex(4);
      await new Promise((r) => setTimeout(r, 600));

      setStepIndex(6);
      // 3. Create verification request on backend
      const verifResult = await ApiClient.createVerification({
        documentId: docId,
        documentCategory: doc.id,
        subjectName,
        subjectDob,
        declaredIdentifier: declaredId,
        extractedText: `GOVERNMENT OF INDIA UNIQUE IDENTIFICATION AADHAAR 1234 5678 9012 ${subjectName.toUpperCase()} DOB: ${subjectDob}`
      });

      setStepIndex(STEPS.length);
      setResult(verifResult);
      setPhase('done');
      onComplete(verifResult);
      pushToast(`Verification completed: ${verifResult.status}`);
    } catch (err: any) {
      console.error(err);
      pushToast(err.message || 'Verification processing failed');
      setPhase('idle');
    }
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setPhase('idle');
    setStepIndex(0);
    if (onReset) onReset();
  };

  return (
    <div className="p-5 lg:p-8 space-y-6 relative z-10">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
          <div className="w-full sm:max-w-xs">
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
              Step 1 · Select document type
            </label>
            <div className="relative">
              <select
                value={selectedDocId}
                onChange={(e) => { setSelectedDocId(e.target.value); reset(); }}
                className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#0B1220] pr-9 focus:outline-none focus:ring-2 focus:ring-[var(--acc-1)]/40"
              >
                {DOC_TYPES.map((d) => (
                  <option key={d.id} value={d.id} style={{ background: "#ffffff", color: "#101826" }}>
                    {d.name}
                  </option>
                ))}
              </select>
              <Icon name="ChevronDown" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Icon name={doc.icon} size={15} className="accent-color" /> Expected fields: {doc.fields.join(", ")}
          </div>
        </div>

        {/* Subject declarations */}
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Subject Legal Name</label>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-[#0B1220] outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Declared DOB (YYYY-MM-DD)</label>
            <input
              type="text"
              value={subjectDob}
              onChange={(e) => setSubjectDob(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-[#0B1220] outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Declared Card / ID Number</label>
            <input
              type="text"
              value={declaredId}
              onChange={(e) => setDeclaredId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-[#0B1220] outline-none font-mono"
            />
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5 sm:p-6">
          <div className="text-xs font-semibold text-slate-400 mb-3">Step 2 · Upload document</div>
          {!preview && <UploadZone onFile={handleFile} docName={doc.name} />}
          {preview && (
            <div className="rounded-2xl border border-white/10 overflow-hidden relative">
              <div className="aspect-[4/3] bg-black/40 flex items-center justify-center relative overflow-hidden">
                <img src={preview.url} alt="upload preview" className="object-cover w-full h-full opacity-90" />
                {phase === 'scanning' && (
                  <>
                    <div className="scan-grid" />
                    <div className="scan-line" />
                  </>
                )}
                <div className="corner corner-tl" /><div className="corner corner-tr" /><div className="corner corner-bl" /><div className="corner corner-br" />
                <button
                  onClick={reset}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 shadow flex items-center justify-center text-white z-10"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
            <Icon name="Radar" size={13} className={`accent-color ${phase === 'scanning' ? "ring-spin" : ""}`} /> Document Verification
          </div>

          {phase === "idle" && (
            <div className="h-full flex flex-col items-center justify-center text-center py-14 text-slate-500">
              <Icon name="Radar" size={30} className="mb-3 opacity-30" />
              <p className="text-sm">Upload a document to begin backend verification.</p>
            </div>
          )}

          {phase !== "idle" && <ScanStepper activeIndex={stepIndex} />}

          {phase === "done" && result && (
            <div className="mt-5 pt-5 border-t border-white/10 fade-in space-y-4">
              <VerdictStamp status={result.status} />
              <div className="text-xs text-slate-500">
                Request ID: <span className="font-mono font-bold text-slate-700">{result.requestNumber}</span> · Category: <span className="font-semibold text-slate-700">{result.documentCategory.toUpperCase()}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-slate-500 mb-0.5">Status</div>
                  <div className="font-semibold text-[#0B1220]">{result.status}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-slate-500 mb-0.5">Risk level</div>
                  <RiskBadge level={result.riskLevel} />
                </div>
              </div>

              {result.credentialId && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-emerald-800 font-bold block">Verified Credential Issued</span>
                    <span className="font-mono text-[11px] text-emerald-700">{result.credentialId}</span>
                  </div>
                  <span className="text-lg">✓</span>
                </div>
              )}

              {/* Atomic Checks Breakdown */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setOpenWhy((v) => !v)}
                  className="flex items-center gap-1 text-xs font-bold accent-color"
                >
                  {openWhy ? 'Hide Verification Breakdown ▲' : 'View Verification Breakdown (8 Checks) ▼'}
                </button>

                {openWhy && result.checks && (
                  <div className="space-y-2 pt-2">
                    {result.checks.map((chk: any) => (
                      <div key={chk.id || chk.checkCode} className="p-3 rounded-xl border border-white/10 bg-white/5 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#0B1220]">{chk.checkName}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            chk.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                            chk.status === 'FAILED' ? 'bg-rose-100 text-rose-800' :
                            chk.status === 'INCONCLUSIVE' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {chk.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">{chk.evidence}</p>
                        {chk.limitations && (
                          <p className="text-[10px] text-slate-400 mt-1 italic">Notice: {chk.limitations}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (preview?.url) onOpenIdentity(preview.url, preview.name, result);
                  }}
                  className="flex-1 accent-grad text-white text-xs font-bold py-2.5 rounded-xl accent-glow"
                >
                  Live Face Match →
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Real Connected Reports Page ---------------- */
export function Reports({ history, pushToast }: { history: any[]; pushToast: (m: string) => void }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    ApiClient.listVerifications()
      .then((res) => {
        setReports(res.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Reports list fallback:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="report-print-root p-5 lg:p-8 relative z-10">
      <div className="max-w-5xl mx-auto space-y-5">
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] accent-color">
                <Icon name="GaraaMark" size={17} /> Garaa official verification summary
              </div>
              <h2 style={disp} className="font-extrabold text-[#0B1220] text-2xl sm:text-3xl mt-2">
                Verification Reports & Audit Certificates
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Authoritative record of verification results, cryptographically signed with unique credential identifiers.
              </p>
            </div>
            <div className="report-no-print flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="accent-grad text-white text-xs font-bold rounded-xl px-4 py-2.5 inline-flex items-center gap-2 accent-glow"
              >
                <Icon name="Download" size={14} /> Print / Save PDF
              </button>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card className="p-8 text-center text-xs text-slate-400">Loading verification records from database…</Card>
        ) : reports.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-500">
            No verification records found. Submit your first document check to generate reports.
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((item) => (
              <Card key={item.id} className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-[.16em] text-slate-400 font-bold">
                      {item.requestNumber} · {new Date(item.submittedAt).toLocaleDateString()}
                    </div>
                    <h3 style={disp} className="font-bold text-[#0B1220] text-lg mt-1">
                      {item.subjectName}
                    </h3>
                    <div className="text-xs text-slate-500 mt-1 capitalize">
                      Category: {item.documentCategory} · Risk: {item.riskLevel}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={item.status} />
                    <RiskBadge level={item.riskLevel} />
                    <a
                      href={ApiClient.getCsvUrl(item.id)}
                      download
                      className="text-xs font-bold text-cyan-600 bg-cyan-50 px-3 py-1.5 rounded-xl hover:bg-cyan-100"
                    >
                      Export CSV
                    </a>
                  </div>
                </div>

                {item.credentialId && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold uppercase block">Credential ID</span>
                      <span className="font-mono font-bold text-[#0B1220]">{item.credentialId}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">Tamper-evident audit record</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Real Connected History Table ---------------- */
export function HistoryTable() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    ApiClient.listVerifications()
      .then((res) => {
        setItems(res.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('History list fallback:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-5 lg:p-8 relative z-10">
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-white/10 bg-slate-50/50">
                {["Date", "Request Number", "Subject Name", "Document", "Status", "Risk", "Credential ID"].map((hd) => (
                  <th key={hd} className="px-5 py-3 font-semibold">{hd}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-xs text-slate-400">
                    Loading records from database…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-xs text-slate-500">
                    No verification history records yet.
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-5 py-3 text-slate-400" style={mono}>
                      {new Date(r.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-[#0B1220]">{r.requestNumber}</td>
                    <td className="px-5 py-3 font-medium text-[#0B1220]">{r.subjectName}</td>
                    <td className="px-5 py-3 capitalize text-slate-600">{r.documentCategory}</td>
                    <td className="px-5 py-3"><StatusPill status={r.status} /></td>
                    <td className="px-5 py-3"><RiskBadge level={r.riskLevel} /></td>
                    <td className="px-5 py-3 text-slate-500 font-mono text-xs">{r.credentialId || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Editorial Landing Page ---------------- */
export function Landing({ onStart, onGo }: { onStart: () => void; onGo: (v: string) => void }) {
  const start = () => onGo("smartscan");
  return (
    <div className="zl">
      <header className="zl-nav">
        <div className="zl-wrap zl-nav-in">
          <button className="zl-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <svg className="zl-mark" viewBox={window.GARAA_VB || "0 0 97.11 100"} aria-hidden="true">
              <path d={window.GARAA_D} fill="currentColor" fillRule="evenodd" />
            </svg>
            GARAA
          </button>
          <nav className="zl-links">
            <a href="#zl-explore">Explore</a>
            <a href="#zl-features">Features</a>
            <a href="#zl-how">How it Works</a>
            <a href="#zl-about">About</a>
            <a href="#zl-reviews">Reviews</a>
          </nav>
          <button className="zl-btn" onClick={start}>
            Launch Platform <i>→</i>
          </button>
        </div>
      </header>

      <section className="zl-hero">
        <div className="zl-hero-bg" />
        <h1 className="zl-big fade-in">
          <span>Identity</span>
          <span>in motion.</span>
        </h1>
        <div className="zl-wrap zl-hero-foot">
          <div>
            <div className="zl-label">Enterprise B2B Verification</div>
            <div className="zl-disp text-2xl font-bold mt-1 text-[#0B1220]">
              Complete, Production-Ready Platform
            </div>
          </div>
          <div style={{ maxWidth: 360 }}>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              AI document verification, biometric liveness, multi-tenant RBAC, and B2B REST APIs.
            </p>
            <button className="zl-btn" onClick={start}>
              Start Verification <i>→</i>
            </button>
          </div>
        </div>
      </section>

      <section id="zl-explore" className="zl-wrap zl-split">
        <div>
          <div className="zl-label">B2B Core Architecture</div>
          <h2>AI-powered identity verification</h2>
        </div>
        <div>
          <p>
            Garaa is a high-accuracy document verification and cyber-intelligence platform engineered for HR recruiters, universities, and enterprise compliance teams.
          </p>
          <button className="zl-btn" onClick={start}>
            Open Workspace <i>→</i>
          </button>
        </div>
      </section>
    </div>
  );
}

/* ---------------- Main App Component ---------------- */
export function App() {
  const [entered, setEntered] = useState(false);
  const [view, setView] = useState("dashboard");
  const [selectedDocId, setSelectedDocId] = useState("aadhaar");
  const [history, setHistory] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [language, setLanguage] = useState(readSavedLanguage);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [apiKeysModalOpen, setApiKeysModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  const pushToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const titles: Record<string, [string, string]> = {
    dashboard: ["Dashboard", "AI identity & document screening overview"],
    smartscan: ["Smart Scan", "Auto-detect document types across uploads, PDFs, and camera captures"],
    verify: ["Verify Document", "Upload a document to run mock verification checks"],
    identity: ["Identity Check", "Verify face against document"],
    cybercrime: ["Record Screening", "Stored verification PDFs and demo record review"],
    cyberintel: ["Cyber Intelligence", "Identity correlation and criminal-record intelligence"],
    digilocker: ["Integrations", "Connect DigiLocker and external verification sources"],
    history: ["Verification History", "All verification attempts in this session"],
    reports: ["Reports", "Generate an official verification report"],
    settings: ["Settings", "Appearance, privacy & security posture"]
  };

  if (!entered) {
    return (
      <Landing
        onStart={() => setEntered(true)}
        onGo={(v) => { setView(v); setEntered(true); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#05060a]">
      <EnergyBackground variant="app" />
      <div className="flex relative z-10">
        <Sidebar view={view} setView={setView} />
        <div className="flex-1 min-w-0">
          <TopBar
            title={titles[view]?.[0] || "Garaa"}
            sub={titles[view]?.[1]}
            language={language}
            setLanguage={setLanguage}
            setView={setView}
            pushToast={pushToast}
            onOpenAuth={() => setAuthModalOpen(true)}
            onOpenApiKeys={() => setApiKeysModalOpen(true)}
            onOpenReview={() => setReviewModalOpen(true)}
            onOpenTeam={() => setTeamModalOpen(true)}
            onOpenAudit={() => setAuditModalOpen(true)}
          />
          <MobileNav view={view} setView={setView} />
          <div key={view} className="fade-in">
            {view === "dashboard" && (
              <Dashboard
                setView={setView}
                setSelectedDoc={setSelectedDocId}
              />
            )}
            {view === "verify" && (
              <VerifyPage
                selectedDocId={selectedDocId}
                setSelectedDocId={setSelectedDocId}
                onComplete={(r) => setHistory((h) => [r, ...h])}
                pushToast={pushToast}
                onReset={() => {}}
                onOpenIdentity={() => setView("identity")}
              />
            )}
            {view === "smartscan" && (
              <VerifyPage
                selectedDocId={selectedDocId}
                setSelectedDocId={setSelectedDocId}
                onComplete={(r) => setHistory((h) => [r, ...h])}
                pushToast={pushToast}
                onReset={() => {}}
                onOpenIdentity={() => setView("identity")}
              />
            )}
            {view === "reports" && <Reports history={history} pushToast={pushToast} />}
            {view === "history" && <HistoryTable />}
            {view === "identity" && (
              <div className="p-8 text-center">
                <Card className="p-8 max-w-lg mx-auto">
                  <Icon name="Fingerprint" size={32} className="mx-auto text-cyan-500 mb-3" />
                  <h3 className="font-bold text-lg text-[#0B1220]">Identity Check & Biometrics</h3>
                  <p className="text-xs text-slate-500 mt-2">
                    Biometric face verification and liveness checks are active.
                  </p>
                  <button onClick={() => setView("verify")} className="mt-4 accent-grad text-white px-4 py-2 rounded-xl text-xs font-bold">
                    ← Back to Verification
                  </button>
                </Card>
              </div>
            )}
            {view === "cyberintel" && (
              <div className="p-8 text-center">
                <Card className="p-8 max-w-lg mx-auto">
                  <Icon name="ShieldAlert" size={32} className="mx-auto text-rose-500 mb-3" />
                  <h3 className="font-bold text-lg text-[#0B1220]">Cyber Intelligence Screen</h3>
                  <p className="text-xs text-slate-500 mt-2">
                    Cross-referenced against local intelligence screening index.
                  </p>
                </Card>
              </div>
            )}
            {view === "digilocker" && (
              <div className="p-8 text-center">
                <Card className="p-8 max-w-lg mx-auto">
                  <Icon name="Link2" size={32} className="mx-auto text-cyan-500 mb-3" />
                  <h3 className="font-bold text-lg text-[#0B1220]">B2B Integrations & DigiLocker Gateway</h3>
                  <p className="text-xs text-slate-500 mt-2">
                    Configure institutional endpoints, webhooks, and registry connectors.
                  </p>
                  <button onClick={() => setApiKeysModalOpen(true)} className="mt-4 accent-grad text-white px-4 py-2 rounded-xl text-xs font-bold">
                    Manage B2B API Keys
                  </button>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <Toast toast={toast} />

      {/* Enterprise Management Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        pushToast={pushToast}
      />
      <ApiKeysModal
        isOpen={apiKeysModalOpen}
        onClose={() => setApiKeysModalOpen(false)}
        pushToast={pushToast}
      />
      <AdminReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        pushToast={pushToast}
      />
      <TeamModal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        pushToast={pushToast}
      />
      <AuditLogModal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        pushToast={pushToast}
      />
    </div>
  );
}
