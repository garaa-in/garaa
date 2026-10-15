import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  pushToast: (msg: string) => void;
}

export const ApiKeysModal: React.FC<ApiKeysModalProps> = ({ isOpen, onClose, pushToast }) => {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>(['read:verifications', 'write:verifications', 'read:reports']);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.listApiKeys();
      setKeys(data);
    } catch (err: any) {
      pushToast(err.message || 'Failed to fetch API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchKeys();
      setGeneratedSecret(null);
      setName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const result = await ApiClient.createApiKey(name, scopes);
      setGeneratedSecret(result.secretKey);
      setName('');
      pushToast('API Key generated successfully');
      fetchKeys();
    } catch (err: any) {
      pushToast(err.message || 'Failed to generate key');
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This will immediately prevent integrations from accessing the API.')) {
      return;
    }
    try {
      await ApiClient.revokeApiKey(id);
      pushToast('API Key revoked');
      fetchKeys();
    } catch (err: any) {
      pushToast(err.message || 'Failed to revoke key');
    }
  };

  const copyToClipboard = () => {
    if (generatedSecret) {
      navigator.clipboard.writeText(generatedSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      pushToast('Copied to clipboard');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="garaa-modal-surface w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto fade-in">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-[.18em] accent-color">B2B Developer Integration</div>
            <h3 style={{ fontFamily: "'Sora', sans-serif" }} className="text-xl font-bold text-[#0B1220] mt-1">
              API Keys & Credentials
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Authenticate programmatic verification requests and webhook delivery via the REST API.
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

        {/* Newly Generated Secret Banner */}
        {generatedSecret && (
          <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-300 p-4">
            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              ⚠️ Copy your secret key now — it will never be displayed again:
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedSecret}
                className="flex-1 bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 select-all"
              />
              <button
                type="button"
                onClick={copyToClipboard}
                className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
              >
                {copied ? 'Copied ✓' : 'Copy Key'}
              </button>
            </div>
            <div className="text-[11px] text-amber-800 mt-2">
              Pass this key in HTTP requests as the header: <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">X-API-Key: {generatedSecret.slice(0, 16)}...</code>
            </div>
          </div>
        )}

        {/* Create API Key Form */}
        <form onSubmit={handleCreate} className="mb-6 rounded-2xl bg-slate-50 border border-slate-200 p-4">
          <div className="text-xs font-bold text-[#0B1220] mb-2">Generate New API Key</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production Recruiter Portal"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-[#0B1220] outline-none focus:border-[var(--acc-1)]"
            />
            <button
              type="submit"
              className="accent-grad text-white text-xs font-bold px-4 py-2 rounded-xl accent-glow"
            >
              Generate Key
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
            {['read:verifications', 'write:verifications', 'read:reports'].map((scope) => (
              <label key={scope} className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scopes.includes(scope)}
                  onChange={(e) => {
                    if (e.target.checked) setScopes([...scopes, scope]);
                    else setScopes(scopes.filter((s) => s !== scope));
                  }}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span className="font-mono text-[11px]">{scope}</span>
              </label>
            ))}
          </div>
        </form>

        {/* Existing Keys List */}
        <div>
          <div className="text-xs font-bold text-[#0B1220] mb-3">Active API Keys</div>
          {loading ? (
            <div className="text-xs text-slate-500 py-4 text-center">Loading API credentials…</div>
          ) : keys.length === 0 ? (
            <div className="text-xs text-slate-500 py-4 text-center bg-slate-50 rounded-xl">
              No API keys configured yet.
            </div>
          ) : (
            <div className="space-y-2">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="rounded-xl border border-slate-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0B1220]">{k.name}</span>
                      {k.revokedAt ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          REVOKED
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-slate-500 mt-1">
                      {k.keyPrefix}••••••••••••
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Scopes: {k.scopes} · Created: {new Date(k.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {!k.revokedAt && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(k.id)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 self-end sm:self-center"
                    >
                      Revoke
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
