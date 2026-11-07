import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, Eye, EyeOff, Users, Clock } from 'lucide-react';

interface HostAuthScreenProps {
  onAuthenticated: (token: string) => void;
}

export const HostAuthScreen: React.FC<HostAuthScreenProps> = ({ onAuthenticated }) => {
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || loading || lockoutSeconds > 0) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-host', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        sessionStorage.setItem('airact_host_token', data.token);
        onAuthenticated(data.token);
      } else {
        if (data.isLocked && data.waitSeconds) {
          setLockoutSeconds(data.waitSeconds);
        }
        setError(data.error || 'Authentication failed. Please verify your Host PIN.');
      }
    } catch {
      setError('Connection to AirAct server failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 select-none font-sans relative overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-indigo-600/15 via-blue-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Bar with Brand & SUN Logo */}
      <header className="relative z-10 max-w-5xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center space-x-3">
          <img
            src="/assets/aistudio/AirAct_Community_Learning_Logo_44a129c1.png"
            alt="AirAct"
            className="h-10 w-auto object-contain"
          />
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white block leading-none">
              AirAct
            </span>
            <span className="text-xs font-semibold text-emerald-400 tracking-wider">
              by Skillupgrade Network
            </span>
          </div>
        </div>

        {/* Skill Upgrade Network / AirAct Badge */}
        <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-300">AirAct</span>
          <span className="text-[10px] text-emerald-400 font-mono font-bold">Secure Host</span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">
          {/* Header Icon */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Host Authorization
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              This interface controls live presentations, questions, timers, and scoring. Enter your Host PIN to unlock presenter access.
            </p>
          </div>

          {/* Error / Lockout Notification */}
          {error && (
            <div className={`p-3.5 rounded-xl text-xs flex items-start space-x-2.5 ${
              lockoutSeconds > 0
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                : 'bg-red-500/10 border border-red-500/30 text-red-300'
            }`}>
              {lockoutSeconds > 0 ? (
                <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-400 animate-pulse" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              )}
              <div className="flex-1 font-medium leading-relaxed">
                {error}
                {lockoutSeconds > 0 && (
                  <span className="block mt-1 font-bold text-amber-400">
                    Locked for: {lockoutSeconds} seconds
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Host PIN / Passkey
                </label>
                <span className="text-[11px] text-slate-400">
                  Default: <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300 font-mono">8842</code>
                </span>
              </div>

              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    if (error && lockoutSeconds === 0) setError('');
                  }}
                  placeholder="Enter Host PIN"
                  autoFocus
                  disabled={loading || lockoutSeconds > 0}
                  className="w-full text-center text-2xl font-mono font-bold tracking-widest py-3 px-12 rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 transition-all placeholder:text-slate-600 uppercase"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                  tabIndex={-1}
                  title={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!pin.trim() || loading || lockoutSeconds > 0}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Unlock Presenter Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Server PIN recovery notice */}
          <div className="pt-2 border-t border-slate-800/80 text-center space-y-1">
            <p className="text-[11px] text-slate-400">
              PIN is safely stored on the server at <code className="text-slate-300 font-mono">data/host-security.json</code>
            </p>
            <p className="text-[10px] text-slate-400">
              (You can view or reset it on the server if forgotten, or change it in settings once unlocked)
            </p>
          </div>
        </div>

        {/* Quick redirect to Participant Join */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-slate-900"
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Not the presenter? Switch to Audience Join</span>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl w-full mx-auto text-center py-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/40">
        <span>AirAct Interactive Presentation System</span>
        <span>Secure Host Authorization Active</span>
      </footer>
    </div>
  );
};
