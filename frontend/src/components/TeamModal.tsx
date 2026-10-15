import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  pushToast: (msg: string) => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose, pushToast }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER' | 'REVIEWER'>('MEMBER');
  const [inviting, setInviting] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.listMembers();
      setMembers(data);
    } catch (err: any) {
      pushToast(err.message || 'Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
      setEmail('');
      setFullName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) return;

    setInviting(true);
    try {
      await ApiClient.inviteMember({ email, fullName, role });
      pushToast(`Invited ${fullName} as ${role}`);
      setEmail('');
      setFullName('');
      fetchMembers();
    } catch (err: any) {
      pushToast(err.message || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this organization?`)) return;
    try {
      await ApiClient.removeMember(id);
      pushToast('Member removed');
      fetchMembers();
    } catch (err: any) {
      pushToast(err.message || 'Failed to remove member');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="garaa-modal-surface w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto fade-in">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-[.18em] accent-color">Organization Governance</div>
            <h3 style={{ fontFamily: "'Sora', sans-serif" }} className="text-xl font-bold text-[#0B1220] mt-1">
              Team & Role-Based Access
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Manage organization memberships, invite recruitment personnel, and assign reviewer permissions.
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

        {/* Invite Form */}
        <form onSubmit={handleInvite} className="mb-6 rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
          <div className="text-xs font-bold text-[#0B1220]">Invite Team Member</div>
          <div className="grid sm:grid-cols-2 gap-2">
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#0B1220] outline-none focus:border-[var(--acc-1)]"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="work.email@company.com"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#0B1220] outline-none focus:border-[var(--acc-1)]"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Role:</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-[#0B1220]"
              >
                <option value="MEMBER">Member (Intake Submissions)</option>
                <option value="REVIEWER">Reviewer (Manual Queue Decisions)</option>
                <option value="ADMIN">Admin (Full Team & API Access)</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={inviting}
              className="accent-grad text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-60 accent-glow"
            >
              {inviting ? 'Inviting…' : 'Send Invite'}
            </button>
          </div>
        </form>

        {/* Current Members */}
        <div>
          <div className="text-xs font-bold text-[#0B1220] mb-3">Organization Members</div>
          {loading ? (
            <div className="text-xs text-slate-500 py-4 text-center">Loading members…</div>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-slate-200 p-3 flex items-center justify-between gap-3 bg-white"
                >
                  <div>
                    <div className="text-xs font-bold text-[#0B1220] flex items-center gap-2">
                      {m.user?.fullName}
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {m.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{m.user?.email}</div>
                  </div>
                  {m.role !== 'OWNER' && (
                    <button
                      type="button"
                      onClick={() => handleRemove(m.id, m.user?.fullName)}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
