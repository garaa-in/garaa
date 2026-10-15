import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  pushToast: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, pushToast }) => {
  const { login, registerCompany, demoLogin } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'demo'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      pushToast('Successfully logged in');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerCompany({ companyName, fullName, email, password });
      pushToast('Organization registered successfully');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (demoEmail: string, roleName: string) => {
    setError('');
    setLoading(true);
    try {
      await demoLogin(demoEmail);
      pushToast(`Signed in as ${roleName}`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="garaa-modal-surface w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 fade-in">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl logo-orb flex items-center justify-center accent-glow">
              <svg className="w-6 h-6 text-[#141a3a]" viewBox={window.GARAA_VB || '0 0 97.11 100'} fill="currentColor">
                <path fillRule="evenodd" d={window.GARAA_D} />
              </svg>
            </div>
            <div>
              <h3 style={{ fontFamily: "'Sora', sans-serif" }} className="text-xl font-bold text-[#0B1220]">
                {tab === 'login' ? 'Sign in to Garaa' : tab === 'register' ? 'Register your company' : 'Quick demo accounts'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Enterprise B2B Document Verification Platform</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); }}
            className={`pb-3 px-3 transition-colors ${tab === 'login' ? 'border-b-2 border-cyan-500 text-[#0B1220] font-bold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); }}
            className={`pb-3 px-3 transition-colors ${tab === 'register' ? 'border-b-2 border-cyan-500 text-[#0B1220] font-bold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Register Company
          </button>
          <button
            type="button"
            onClick={() => { setTab('demo'); setError(''); }}
            className={`pb-3 px-3 transition-colors ${tab === 'demo' ? 'border-b-2 border-cyan-500 text-[#0B1220] font-bold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Demo Accounts (RBAC)
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        {/* Tab: Log In */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#0B1220] outline-none focus:border-[var(--acc-1)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#0B1220] outline-none focus:border-[var(--acc-1)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full accent-grad text-white font-bold text-sm py-3 rounded-xl disabled:opacity-60 accent-glow mt-2"
            >
              {loading ? 'Authenticating…' : 'Sign in to workspace'}
            </button>
          </form>
        )}

        {/* Tab: Register Company */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Organization / Company Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Global Corporation"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#0B1220] outline-none focus:border-[var(--acc-1)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Your Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#0B1220] outline-none focus:border-[var(--acc-1)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@acmeglobal.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#0B1220] outline-none focus:border-[var(--acc-1)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Create Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#0B1220] outline-none focus:border-[var(--acc-1)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full accent-grad text-white font-bold text-sm py-3 rounded-xl disabled:opacity-60 accent-glow mt-2"
            >
              {loading ? 'Setting up organization…' : 'Create Organization Account'}
            </button>
          </form>
        )}

        {/* Tab: Demo Accounts */}
        {tab === 'demo' && (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            <p className="text-xs text-slate-500 mb-2">
              Select any pre-seeded persona to test multi-tenancy, RBAC permissions, and review queues:
            </p>
            {[
              { email: 'sarah.owner@acmeglobal.example', name: 'Sarah Chen', role: 'Organization Owner', org: 'Acme Global Recruiting', desc: 'Full control, API keys, member management & billing' },
              { email: 'david.admin@acmeglobal.example', name: 'David Patel', role: 'Organization Admin', org: 'Acme Global Recruiting', desc: 'Can invite team members & configure webhooks' },
              { email: 'reviewer@acmeglobal.example', name: 'Elena Rostova', role: 'Compliance Reviewer', org: 'Acme Global Recruiting', desc: 'Authorized to review high-risk cases in review queue' },
              { email: 'member@acmeglobal.example', name: 'James Wilson', role: 'HR Recruiter (Member)', org: 'Acme Global Recruiting', desc: 'Standard intake verification submission permissions' },
              { email: 'dean.registrar@pacific.edu.example', name: 'Dr. Arthur Vance', role: 'Tenant B Owner', org: 'Pacific University Credentials', desc: 'Completely isolated university tenant' },
              { email: 'admin@garaa.internal', name: 'Garaa System Admin', role: 'Platform Admin', org: 'Garaa Global System', desc: 'Platform-level governance & cross-tenant overview' }
            ].map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => handleDemoSignIn(account.email, account.name)}
                disabled={loading}
                className="w-full text-left rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 p-3 transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-[#0B1220] flex items-center gap-2">
                    {account.name}
                    <span className="text-[10px] font-semibold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full">
                      {account.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{account.org} · {account.desc}</div>
                </div>
                <span className="text-xs font-bold accent-color shrink-0">Sign in →</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
