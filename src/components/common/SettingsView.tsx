'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Download, Upload, Trash2, Info, LogOut, Share2, Copy, Check } from 'lucide-react';
import { useHabitStore } from '@/store/useHabitStore';
import { signOut } from 'next-auth/react';
import { useShallow } from 'zustand/react/shallow';
import { useAura } from '@/hooks/useAura';

export function SettingsView() {
  const [exportData, importData, resetAll] = useHabitStore(
    useShallow((s) => [s.exportData, s.importData, s.resetAll])
  );
  const [habitCount, logCount, level] = useHabitStore(
    useShallow((s) => [s.habits.length, s.logs.length, s.level])
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [shareId, setShareId] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  const [shareError, setShareError] = useState<string | null>(null);

  const { themePreference, setThemePreference } = useAura();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auratrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.habits && data.logs) {
          importData(data);
          setImportStatus('success');
          setTimeout(() => setImportStatus('idle'), 3000);
        } else {
          setImportStatus('error');
          setTimeout(() => setImportStatus('idle'), 3000);
        }
      } catch {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      resetAll();
    }
  };

  const handleGenerateShare = useCallback(async () => {
    setShareLoading(true);
    setShareError(null);
    console.log('Share: Attempting to generate share link...');
    
    try {
      const res = await fetch('/api/share', { 
        method: 'POST', 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Share API response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('Share API success:', data);
        setShareId(data.shareId);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setShareError(errorData.error || `Server error: ${res.status}`);
        console.error('Share API error:', res.status, errorData);
      }
    } catch (err) {
      setShareError('Network error - please try again');
      console.error('Share API fetch error:', err);
    }
    setShareLoading(false);
  }, []);

  const handleCopyShareLink = useCallback(() => {
    if (!shareId) return;
    const url = `${origin}/share/${shareId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareId, origin]);

  return (
    <div className="space-y-6 pb-8 lg:pb-4">
      <h2 className="text-2xl font-bold text-foreground">Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bento-card">
          <h3 className="text-sm font-semibold text-foreground/80 mb-4">Data Management</h3>
          <div className="space-y-3">
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all text-left"
            >
              <Download className="w-5 h-5 text-accent shrink-0" />
              <div>
                <p className="text-sm text-foreground/80 font-medium">Export Data</p>
                <p className="text-xs text-foreground/40">Download JSON backup</p>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all text-left"
            >
              <Upload className="w-5 h-5 text-success shrink-0" />
              <div>
                <p className="text-sm text-foreground/80 font-medium">Import Data</p>
                <p className="text-xs text-foreground/40">Restore from JSON</p>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />

            {importStatus === 'success' && (
              <p className="text-xs text-success text-center py-2">Data imported successfully!</p>
            )}
            {importStatus === 'error' && (
              <p className="text-xs text-danger text-center py-2">Invalid backup file</p>
            )}

            <button
              onClick={handleReset}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 hover:bg-danger/20 transition-all text-left"
            >
              <Trash2 className="w-5 h-5 text-danger shrink-0" />
              <div>
                <p className="text-sm text-danger font-medium">Reset All Data</p>
                <p className="text-xs text-foreground/40">Delete all habits and logs</p>
              </div>
            </button>
          </div>
        </div>

        <div className="bento-card">
          <h3 className="text-sm font-semibold text-foreground/80 mb-4">Share Progress</h3>
          {shareError && (
            <p className="text-xs text-danger mb-3">{shareError}</p>
          )}
          <div className="space-y-3">
            {!shareId ? (
              <button
                onClick={handleGenerateShare}
                disabled={shareLoading}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-all text-left disabled:opacity-50"
              >
                <Share2 className="w-5 h-5 text-accent shrink-0" />
                <div>
                  <p className="text-sm text-foreground/80 font-medium">{shareLoading ? 'Generating...' : 'Create Share Link'}</p>
                  <p className="text-xs text-foreground/40">Share your habits publicly</p>
                </div>
              </button>
            ) : (
              <>
                <button
                  onClick={handleCopyShareLink}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-all text-left"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-success shrink-0" />
                  ) : (
                    <Copy className="w-5 h-5 text-accent shrink-0" />
                  )}
                  <div>
                    <p className="text-sm text-foreground/80 font-medium">{copied ? 'Copied!' : 'Copy Link'}</p>
                    <p className="text-xs text-foreground/40 truncate">{origin}/share/{shareId}</p>
                  </div>
                </button>
                <button
                  onClick={handleGenerateShare}
                  disabled={shareLoading}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all text-left disabled:opacity-50"
                >
                  <Share2 className="w-5 h-5 text-foreground/40 shrink-0" />
                  <div>
                    <p className="text-sm text-foreground/80 font-medium">{shareLoading ? 'Refreshing...' : 'Regenerate Link'}</p>
                    <p className="text-xs text-foreground/40">Create a new share ID</p>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bento-card">
          <h3 className="text-sm font-semibold text-foreground/80 mb-4">About</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-foreground/30" />
                <span className="text-sm text-foreground/50">Version</span>
              </div>
              <span className="text-sm text-foreground/30 font-mono">1.0.0</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-foreground/30" />
                <span className="text-sm text-foreground/50">Habits</span>
              </div>
              <span className="text-sm text-foreground/30 font-mono">{habitCount}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-foreground/30" />
                <span className="text-sm text-foreground/50">Total Logs</span>
              </div>
              <span className="text-sm text-foreground/30 font-mono">{logCount}</span>
            </div>
          </div>
        </div>

        <div className="bento-card">
          <h3 className="text-sm font-semibold text-foreground/80 mb-4">Aura Theme Override</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'auto', label: 'Auto', desc: 'Syncs with time', icon: '✨' },
              { id: 'dawn', label: 'Dawn', desc: '5AM - 10AM', icon: '🌅' },
              { id: 'focus', label: 'Focus', desc: '10AM - 8PM', icon: '⚡' },
              { id: 'midnight', label: 'Midnight', desc: '8PM - 5AM', icon: '🌙' },
              ...(level >= 5 ? [{ id: 'cyberpunk', label: 'Cyberpunk', desc: 'Lvl 5 Unlocked', icon: '🧬' }] : []),
              ...(level >= 10 ? [{ id: 'cinematic', label: 'Cinematic', desc: 'Lvl 10 Unlocked', icon: '🎬' }] : []),
            ].map((theme) => {
              const isActive = themePreference === theme.id;
              // To use useAura, I need to call it inside the component. Wait, I haven't called it! I need another chunk.
              return (
                <button
                  key={theme.id}
                  onClick={() => setThemePreference(theme.id as 'auto' | 'dawn' | 'focus' | 'midnight' | 'cyberpunk' | 'cinematic')}
                  className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left ${
                    isActive 
                      ? 'bg-accent/20 border-accent/50 shadow-[0_0_15px_rgba(var(--aura-primary-rgb),0.3)]' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg mb-1">{theme.icon}</span>
                  <span className={`text-sm font-semibold ${isActive ? 'text-accent' : 'text-foreground/80'}`}>
                    {theme.label}
                  </span>
                  <span className="text-xs text-foreground/40">{theme.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bento-card">
        <button
          onClick={() => {
            localStorage.removeItem('auratrack-user-id');
            signOut({ callbackUrl: '/login' });
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 hover:bg-danger/20 transition-all"
        >
          <LogOut className="w-5 h-5 text-danger shrink-0" />
          <div className="text-left">
            <p className="text-sm text-danger font-medium">Sign Out</p>
            <p className="text-xs text-foreground/40">Your data is saved in the cloud</p>
          </div>
        </button>
      </div>
    </div>
  );
}
