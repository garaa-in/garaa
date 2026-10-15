import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';

interface AdminReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pushToast: (msg: string) => void;
  onReviewed?: () => void;
}

export const AdminReviewModal: React.FC<AdminReviewModalProps> = ({ isOpen, onClose, pushToast, onReviewed }) => {
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [decision, setDecision] = useState<'VERIFIED' | 'REJECTED' | 'UNABLE_TO_VERIFY'>('VERIFIED');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.listVerifications({ status: 'NEEDS_REVIEW' });
      setQueue(res.items || []);
      if (res.items && res.items.length > 0) {
        setSelectedCase(res.items[0]);
      } else {
        setSelectedCase(null);
      }
    } catch (err: any) {
      pushToast(err.message || 'Failed to fetch review queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQueue();
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !notes.trim()) return;

    setSubmitting(true);
    try {
      await ApiClient.submitReviewDecision(selectedCase.id, decision, notes);
      pushToast(`Case ${selectedCase.requestNumber} marked as ${decision}`);
      setNotes('');
      fetchQueue();
      if (onReviewed) onReviewed();
    } catch (err: any) {
      pushToast(err.message || 'Failed to submit decision');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="garaa-modal-surface w-full max-w-4xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto fade-in">
        <div className="flex items-start justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-[.18em] accent-color">Authorized Reviewer Queue</div>
            <h3 style={{ fontFamily: "'Sora', sans-serif" }} className="text-xl font-bold text-[#0B1220] mt-1">
              Human Review & Compliance Decider
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Cases with inconclusive automated signals or anomalous features routed for certified reviewer adjudication.
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
          <div className="text-xs text-slate-500 py-8 text-center">Loading review cases…</div>
        ) : queue.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-2xl p-6">
            <div className="text-2xl mb-2">✓</div>
            <div className="text-sm font-bold text-[#0B1220]">Review queue is empty</div>
            <p className="text-xs text-slate-500 mt-1">All verification requests have been processed cleanly.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-[1fr_1.3fr] gap-6">
            {/* Case List */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {queue.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedCase(item)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${selectedCase?.id === item.id ? 'border-amber-400 bg-amber-50/50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0B1220]">{item.requestNumber}</span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      NEEDS REVIEW
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 mt-1">{item.subjectName}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 capitalize">
                    {item.documentCategory} · {new Date(item.submittedAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Case Inspection & Decision */}
            {selectedCase && (
              <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Case Details</div>
                  <div className="text-base font-bold text-[#0B1220] mt-0.5">{selectedCase.subjectName}</div>
                  <div className="text-xs font-mono text-slate-500">
                    {selectedCase.requestNumber} · Category: {selectedCase.documentCategory.toUpperCase()}
                  </div>
                </div>

                <div className="rounded-xl bg-white border border-slate-200 p-3 space-y-2 text-xs">
                  <div className="font-semibold text-slate-700">Automated Inspection Findings:</div>
                  <div className="text-[11px] text-slate-500 leading-relaxed">
                    {selectedCase.recommendation || 'Discrepancy identified during automated engine check.'}
                  </div>
                  {selectedCase.checks && selectedCase.checks.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-slate-100">
                      {selectedCase.checks.map((chk: any) => (
                        <div key={chk.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600">{chk.checkName}</span>
                          <span className={`font-bold ${chk.status === 'VERIFIED' ? 'text-emerald-600' : chk.status === 'FAILED' ? 'text-rose-600' : 'text-amber-600'}`}>
                            {chk.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reviewer Adjudication</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 'VERIFIED', label: 'Approve (Valid)', color: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
                      { val: 'REJECTED', label: 'Reject (Fraud)', color: 'border-rose-500 text-rose-700 bg-rose-50' },
                      { val: 'UNABLE_TO_VERIFY', label: 'Inconclusive', color: 'border-amber-500 text-amber-700 bg-amber-50' }
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setDecision(opt.val as any)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all ${decision === opt.val ? opt.color + ' ring-2 ring-offset-1' : 'border-slate-200 bg-white text-slate-600'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Compliance & Reviewer Notes (Audit Required)
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="State reason for adjudication, e.g. 'Manual inspection of photo and hologram confirmed compliance.'"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-[#0B1220] outline-none focus:border-[var(--acc-1)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full accent-grad text-white text-xs font-bold py-2.5 rounded-xl disabled:opacity-60 accent-glow"
                >
                  {submitting ? 'Recording decision…' : 'Submit Review Decision & Sign Off'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
