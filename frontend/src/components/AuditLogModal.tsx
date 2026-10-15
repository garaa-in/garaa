import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  pushToast: (msg: string) => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose, pushToast }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.listAuditLogs();
      setLogs(data);
    } catch (err: any) {
      pushToast(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchLogs();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="garaa-modal-surface w-full max-w-3xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto fade-in">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-[.18em] accent-color">Security & Compliance</div>
            <h3 style={{ fontFamily: "'Sora', sans-serif" }} className="text-xl font-bold text-[#0B1220] mt-1">
              Append-Only Audit Trail
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Immutable log tracking all sensitive verification submissions, authentication events, API keys, and decisions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-xs text-slate-500 py-8 text-center">Loading audit records…</div>
        ) : logs.length === 0 ? (
          <div className="py-10 text-center bg-slate-50 rounded-2xl text-xs text-slate-500">
            No audit records found.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-slate-200 p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800">{log.action}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.outcome === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}
                    >
                      {log.outcome}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Actor: {log.user?.fullName || log.user?.email || 'API Service'} · Resource: {log.resource} {log.resourceId ? `(${log.resourceId.slice(0, 8)}...)` : ''}
                  </div>
                </div>
                <div className="text-[11px] font-mono text-slate-400 shrink-0 sm:text-right">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
