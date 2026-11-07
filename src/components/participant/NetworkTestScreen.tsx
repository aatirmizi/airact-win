import React, { useState, useEffect } from 'react';
import { Wifi, CheckCircle2, ShieldCheck, Smartphone, RefreshCw, ArrowRight, AlertTriangle } from 'lucide-react';

export const NetworkTestScreen: React.FC = () => {
  const [pingStatus, setPingStatus] = useState<'probing' | 'connected' | 'error'>('probing');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [clientIp, setClientIp] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get('session') || 'direct_test';

  const sendPing = async () => {
    setPingStatus('probing');
    const startTime = performance.now();
    try {
      const res = await fetch('/api/system/network-test/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userAgent: navigator.userAgent,
        }),
      });

      const elapsed = Math.round(performance.now() - startTime);
      setLatencyMs(elapsed);

      if (res.ok) {
        const data = await res.json();
        setClientIp(data.clientIp || window.location.hostname);
        setPingStatus('connected');
      } else {
        setPingStatus('error');
        setErrorMessage('Server returned error response');
      }
    } catch (err: any) {
      setPingStatus('error');
      setErrorMessage(err.message || 'Unable to communicate with presentation server');
    }
  };

  useEffect(() => {
    sendPing();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950 text-white flex flex-col justify-between p-6 sm:p-8 font-sans">
      {/* Top Branding */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Wifi className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white">AirAct Intranet Test</div>
            <div className="text-[11px] text-slate-400">Participant Network Verification</div>
          </div>
        </div>

        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
          Device Test
        </span>
      </div>

      {/* Main Connection Status Card */}
      <div className="my-auto py-8 max-w-sm w-full mx-auto">
        {pingStatus === 'probing' && (
          <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/80 rounded-3xl p-8 text-center shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white">Testing Connection…</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verifying two-way communication between your smartphone and the facilitator's local server.
            </p>
          </div>
        )}

        {pingStatus === 'connected' && (
          <div className="bg-slate-800/90 backdrop-blur-md border border-emerald-500/40 rounded-3xl p-7 text-center shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mb-2">
                Connection Verified
              </span>
              <h2 className="text-2xl font-black text-white">Success!</h2>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                Your device is connected directly to the AirAct presentation server on this network.
              </p>
            </div>

            {/* Diagnostic stats */}
            <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-700/60 text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Latency</span>
                <span className="font-mono font-bold text-emerald-400">
                  {latencyMs !== null ? `${latencyMs} ms` : '< 15 ms'} (Instant)
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Server Host</span>
                <span className="font-mono text-white font-medium truncate max-w-[170px]">
                  {window.location.host}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Your Device IP</span>
                <span className="font-mono text-slate-300">
                  {clientIp || 'Assigned by Wi-Fi'}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href="/"
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <span>Go to Participant Join Page</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                onClick={sendPing}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retest Connection</span>
              </button>
            </div>
          </div>
        )}

        {pingStatus === 'error' && (
          <div className="bg-slate-800/90 backdrop-blur-md border border-amber-500/40 rounded-3xl p-7 text-center shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40">
              <AlertTriangle className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block mb-2">
                Network Check Needed
              </span>
              <h2 className="text-xl font-black text-white">Connection Unreachable</h2>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                {errorMessage || 'Your device could not reach the presentation server.'}
              </p>
            </div>

            <div className="bg-amber-950/40 rounded-2xl p-4 border border-amber-800/50 text-left text-xs text-amber-200/90 space-y-1.5">
              <div className="font-bold flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Wi-Fi Troubleshooting:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-100/80">
                <li>Make sure phone and presenter laptop are on the <strong>same Wi-Fi network</strong>.</li>
                <li>On hotel or guest Wi-Fi, "AP Client Isolation" may block devices from seeing each other. Try using a mobile phone hotspot.</li>
              </ul>
            </div>

            <button
              onClick={sendPing}
              className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              Retry Connection Test
            </button>
          </div>
        )}
      </div>

      {/* Bottom Footer Note */}
      <div className="text-center text-[11px] text-slate-500 space-y-1">
        <div>Keep your phone on this Wi-Fi network throughout the session.</div>
        <div className="font-mono text-slate-600">AirAct Local Presentation Engine</div>
      </div>
    </div>
  );
};
