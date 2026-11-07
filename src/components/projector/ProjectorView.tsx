import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ProjectorView as IProjectorView } from '../../types/activity.js';
import {
  QrCode,
  Clock,
  Trophy,
  Users,
  CheckCircle2,
  Pause,
  Sparkles,
  MessageSquare,
  Maximize,
  Minimize,
  X,
} from 'lucide-react';
import { D3WordCloud } from '../common/D3WordCloud.js';
import { getThemeTextureStyle, isThemeLight, getFieldTextStyle } from '../../utils/themes.js';
import { AspectScaledCanvas, AspectRatioType } from '../common/AspectScaledCanvas.js';

export const ProjectorView: React.FC = () => {
  const [view, setView] = useState<IProjectorView | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQrSplit, setShowQrSplit] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const lastLeaderboardRef = useRef<string>('');
  const isTestParam = typeof window !== 'undefined' && window.location.search.includes('test=true');
  const [showTestPattern, setShowTestPattern] = useState<boolean>(isTestParam);

  useEffect(() => {
    // Initial fetch
    fetch('/api/projector/view')
      .then((r) => r.json())
      .then((data) => setView(data))
      .catch(() => {});

    // WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/projector`;
    let ws: WebSocket;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        ws.send(JSON.stringify({ type: 'hello', audience: 'projector' }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'view') {
            setView(data);
          }
        } catch {}
      };

      ws.onclose = () => {
        setIsConnected(false);
        setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const [networkInfo, setNetworkInfo] = useState<{
    appUrl?: string;
    localIps?: string[];
    port?: number;
    isCloud?: boolean;
  } | null>(null);

  useEffect(() => {
    fetch('/api/system/network-info')
      .then((r) => r.json())
      .then((data) => setNetworkInfo(data))
      .catch(() => {});
  }, []);

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const joinCode = view?.join?.code || '';

  // Determine the primary join URL:
  // If we are on a real cloud domain (or non-localhost), use the current browser's origin.
  // If we are on localhost and an intranet LAN IP was detected, prefer the LAN IP for attendees on WiFi.
  const activeJoinUrl = React.useMemo(() => {
    if (!joinCode) return '';
    if (!isLocalhost) {
      return `${window.location.origin}/j/${joinCode}`;
    }
    const lanIp = networkInfo?.localIps?.find((ip) => !ip.startsWith('169.254.'));
    if (lanIp) {
      const port = window.location.port ? `:${window.location.port}` : ':3000';
      return `http://${lanIp}${port}/j/${joinCode}`;
    }
    return `${window.location.origin}/j/${joinCode}`;
  }, [joinCode, isLocalhost, networkInfo]);

  const altLocalUrl = React.useMemo(() => {
    if (!joinCode || !isLocalhost) return null;
    return `${window.location.origin}/j/${joinCode}`;
  }, [joinCode, isLocalhost]);

  // Generate QR code data URL when active join URL changes
  useEffect(() => {
    if (activeJoinUrl) {
      import('qrcode').then((QRCode) => {
        QRCode.toDataURL(activeJoinUrl, {
          margin: 1,
          width: 360,
          color: { dark: '#000000', light: '#ffffff' },
        })
          .then(setQrCodeUrl)
          .catch(() => {});
      });
    }
  }, [activeJoinUrl]);

  // Trigger confetti when leaderboard is shown
  useEffect(() => {
    if (view?.slide?.type_id === 'leaderboard') {
      const topName = view.slide.aggregates?.leaderboard?.[0]?.name;
      if (topName && topName !== lastLeaderboardRef.current) {
        lastLeaderboardRef.current = topName;
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  }, [view?.slide]);

  // Fullscreen tracking
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Listen to cross-window broadcast commands (e.g. from Facilitator)
  useEffect(() => {
    try {
      const bc = new BroadcastChannel('airact_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'toggle_qr') {
          setShowQrSplit((prev) => !prev);
        }
      };
      return () => {
        bc.close();
      };
    } catch {}
  }, []);

  // Keyboard navigation when keyboard/mouse focus is on the projector window (Requirement 1 & 2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = e.key;
      const lower = key.toLowerCase();

      // Next step / next slide: ArrowRight, PageDown, Space, Enter, N
      if (
        key === 'ArrowRight' ||
        key === 'PageDown' ||
        key === ' ' ||
        key === 'Enter' ||
        lower === 'n'
      ) {
        e.preventDefault();
        fetch('/api/presentation/next-step', { method: 'POST' }).catch(() => {});
      }
      // Previous step / previous slide: ArrowLeft, PageUp, Backspace, P
      else if (
        key === 'ArrowLeft' ||
        key === 'PageUp' ||
        key === 'Backspace' ||
        lower === 'p'
      ) {
        e.preventDefault();
        fetch('/api/presentation/prev-step', { method: 'POST' }).catch(() => {});
      }
      // Freeze toggle: F (matching facilitator screen behaviour)
      else if (lower === 'f') {
        e.preventDefault();
        const currentFrozen = view?.presentation.state === 'frozen';
        fetch('/api/presentation/freeze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ frozen: !currentFrozen }),
        }).catch(() => {});
      }
      // Blank toggle: B
      else if (lower === 'b') {
        e.preventDefault();
        const currentBlanked = view?.presentation.state === 'blank';
        fetch('/api/presentation/blank', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blanked: !currentBlanked }),
        }).catch(() => {});
      }
      // On-demand QR reveal / toggle: Q (Requirement 2)
      else if (lower === 'q') {
        e.preventDefault();
        setShowQrSplit((prev) => !prev);
      }
      // Projector alignment test pattern: T
      else if (lower === 't') {
        e.preventDefault();
        setShowTestPattern((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view]);

  // Projector Alignment & Calibration Test Pattern
  if (showTestPattern) {
    const targetAspect = (view?.presentation as any)?.settings?.aspect_ratio || '16:9';
    return (
      <div className="w-screen h-screen bg-slate-950 text-white flex flex-col justify-between p-8 relative overflow-hidden select-none font-mono">
        {/* Safe Area 90% Box */}
        <div className="absolute inset-8 border border-dashed border-emerald-500/40 pointer-events-none flex items-start justify-between p-2 text-[10px] text-emerald-400">
          <span>90% Safe Title Area</span>
          <span>90% Safe Title Area</span>
        </div>

        {/* Safe Area 95% Box */}
        <div className="absolute inset-4 border border-slate-700/60 pointer-events-none flex items-start justify-between p-2 text-[10px] text-slate-500">
          <span>95% Action Safe Area</span>
          <span>95% Action Safe Area</span>
        </div>

        {/* Center Crosshairs */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-full h-px bg-indigo-500/30" />
          <div className="h-full w-px bg-indigo-500/30 absolute" />
          <div className="w-32 h-32 rounded-full border border-indigo-400/50 absolute flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border border-dashed border-emerald-400/50" />
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
          </div>
        </div>

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center space-x-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold text-sm text-white">AirAct Projector Alignment & Calibration</span>
          </div>
          <div className="flex items-center space-x-4 text-xs text-slate-300">
            <span>Aspect Ratio Target: <strong className="text-indigo-400">{targetAspect}</strong></span>
            <span>Display Resolution: <strong className="text-emerald-400">{typeof window !== 'undefined' ? `${window.innerWidth} × ${window.innerHeight}` : '1920 × 1080'}</strong></span>
          </div>
          <button
            onClick={() => setShowTestPattern(false)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold cursor-pointer"
          >
            Exit Test Pattern (T)
          </button>
        </div>

        {/* Center Calibration Readout */}
        <div className="relative z-10 my-auto text-center space-y-4">
          <div className="inline-block p-6 rounded-2xl bg-slate-900/90 border border-slate-700 shadow-2xl backdrop-blur-md max-w-lg">
            <h2 className="text-xl font-bold font-sans text-white mb-2">Projector Calibration Grid</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans mb-4">
              Align the dotted green box to the venue projection canvas edges. Ensure all 4 corners are visible without keystoning or clipping.
            </p>
            {/* Color Calibration Bars */}
            <div className="flex h-10 rounded-lg overflow-hidden border border-slate-700">
              <div className="flex-1 bg-white" title="100% White" />
              <div className="flex-1 bg-yellow-400" title="Yellow" />
              <div className="flex-1 bg-cyan-400" title="Cyan" />
              <div className="flex-1 bg-emerald-500" title="Green" />
              <div className="flex-1 bg-fuchsia-500" title="Magenta" />
              <div className="flex-1 bg-red-500" title="Red" />
              <div className="flex-1 bg-blue-600" title="Blue" />
              <div className="flex-1 bg-black" title="0% Black" />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800 pt-3">
          <span>Shortcuts: F11 Fullscreen · T Toggle Test · Q QR Code · Space Next</span>
          <span>AirAct Community Learning</span>
        </div>
      </div>
    );
  }

  if (!view) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-white text-xl">
        Connecting to Presentation...
      </div>
    );
  }

  const { presentation, slide, counters, join, theme } = view;
  const isLight = isThemeLight(theme);
  const activeAspectRatio: AspectRatioType =
    (presentation as any)?.aspect_ratio ||
    (presentation as any)?.settings?.aspect_ratio ||
    '16:9';

  // 1. Blank state
  if (presentation.state === 'blank') {
    return (
      <div className="w-screen h-screen bg-black text-white flex flex-col justify-between p-12 select-none">
        <div />
        <div className="text-center text-slate-500 text-xl font-medium tracking-wide">
          Screen blanked by presenter
        </div>
        <div className="text-right text-xs text-slate-600 font-mono">
          Press B to unblank · Press F to freeze
        </div>
      </div>
    );
  }

  // 2. Ended state
  if (presentation.state === 'ended') {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden select-none">
        <AspectScaledCanvas
          aspectRatio={activeAspectRatio}
          containerClassName="w-full h-full bg-black flex items-center justify-center"
          wrapperClassName="overflow-hidden shadow-2xl relative"
        >
          <div className="w-full h-full bg-slate-950 text-white flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-extrabold mb-3 tracking-tight">The presentation has ended</h1>
            <p className="text-lg text-slate-400 max-w-md">
              Thank you for your active participation!
            </p>
          </div>
        </AspectScaledCanvas>
      </div>
    );
  }

  // 3. Lobby (before starting)
  if (presentation.state === 'lobby' || !slide) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden select-none">
        <AspectScaledCanvas
          aspectRatio={activeAspectRatio}
          containerClassName="w-full h-full bg-black flex items-center justify-center"
          wrapperClassName="overflow-hidden shadow-2xl relative"
        >
          <div
            style={getThemeTextureStyle(theme)}
            className="w-full h-full flex flex-col justify-between p-12 select-none transition-all relative"
          >
        <div className="text-center max-w-3xl mx-auto pt-8">
          <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            AirAct Interactive
          </span>
          <h1 className="text-5xl font-extrabold mt-4 mb-2 tracking-tight leading-tight">
            {presentation.title}
          </h1>
          <p className="text-lg text-slate-400">
            Join on your phone or laptop to participate
          </p>
        </div>

        {/* Center QR & Join Code */}
        <div className="flex flex-col items-center justify-center my-auto">
          <div className="p-6 bg-white rounded-3xl shadow-2xl border-4 border-indigo-500/30">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="Join QR Code" className="w-64 h-64 rounded-xl" />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-slate-100 rounded-xl">
                <QrCode className="w-32 h-32 text-slate-400" />
              </div>
            )}
          </div>

          <div className="mt-8 text-center space-y-2">
            <div className="text-lg font-medium text-slate-300">
              Go to <span className="text-white font-bold underline underline-offset-4">{activeJoinUrl || join.url}</span>
            </div>
            {altLocalUrl && altLocalUrl !== activeJoinUrl && (
              <div className="text-xs text-slate-400 font-mono">
                On this machine: <span className="text-slate-300 underline">{altLocalUrl}</span>
              </div>
            )}
            <div className="text-3xl font-mono font-extrabold text-indigo-400 tracking-wider pt-1">
              Join Code: {join.code}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Active participants */}
        <div className="flex items-center justify-between text-slate-400 text-sm border-t border-slate-800/80 pt-6">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Waiting for participants to join...</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Toggle Fullscreen (F11)"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
            <div className="flex items-center space-x-2 font-semibold text-slate-300">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>{counters.active} joined</span>
            </div>
          </div>
        </div>
      </div>
        </AspectScaledCanvas>
      </div>
    );
  }

  // 4. Dedicated First Default Slide: Welcome / Join Slide (Requirement 3)
  if (slide.type_id === 'welcome') {
    const content = slide.content as any;
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden select-none">
        <AspectScaledCanvas
          aspectRatio={activeAspectRatio}
          containerClassName="w-full h-full bg-black flex items-center justify-center"
          wrapperClassName="overflow-hidden shadow-2xl relative"
        >
          <div
            style={getThemeTextureStyle(theme)}
            className="w-full h-full flex flex-col justify-between p-10 overflow-hidden relative select-none transition-all"
          >
        {/* Top Left Logo (AirAct by SkillUpgrade Network) */}
        <div
          className={`absolute top-8 left-10 z-20 flex items-center space-x-3 px-4 py-2 rounded-2xl border transition-colors ${
            isLight
              ? 'bg-white/90 border-slate-200/90 shadow-md backdrop-blur-md'
              : 'bg-white/5 border-white/10 shadow-lg backdrop-blur-xs'
          }`}
        >
          <img
            src="/assets/aistudio/AirAct_Community_Learning_Logo_44a129c1.png"
            alt="AirAct"
            className="h-10 w-auto object-contain"
          />
          <div className="flex flex-col">
            <span
              className={`font-black text-base tracking-[0.25em] uppercase leading-none font-sans ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}
            >
              AirAct
            </span>
            <span
              className={`text-[10px] font-bold tracking-wider mt-0.5 uppercase ${
                isLight ? 'text-emerald-700' : 'text-emerald-400'
              }`}
            >
              by SkillUpgrade Network
            </span>
          </div>
        </div>

        {/* Top Right Logo (Skill Upgrade Network) - Requirement 3 */}
        <div
          className={`absolute top-8 right-10 z-20 flex items-center px-5 py-2.5 rounded-2xl border transition-colors ${
            isLight
              ? 'bg-white/90 border-slate-200/90 shadow-md backdrop-blur-md'
              : 'bg-white/5 border-white/10 shadow-lg backdrop-blur-xs'
          }`}
        >
          <img
            src="/assets/aistudio/AirAct_Community_Learning_Logo_44a129c1.png"
            alt="AirAct Community Learning"
            className="h-14 lg:h-16 w-auto object-contain drop-shadow"
          />
        </div>

        {/* Freeze indicator banner */}
        {presentation.state === 'frozen' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-lg">
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>PROJECTOR PAUSED</span>
          </div>
        )}

        {/* Main Welcome Presentation Area */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-between gap-12 my-auto max-w-6xl w-full mx-auto px-4">
          {/* Left Column: Title, Presenter Name & Info, Join message */}
          <div className="flex-1 space-y-6 text-left pr-4">
            <div
              className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${
                isLight
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Workshop Session</span>
            </div>

            <h1
              style={getFieldTextStyle(content.styles, 'title')}
              className={`text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight ${
                !content.styles?.title?.color ? (isLight ? 'text-slate-950 font-black' : 'text-white') : ''
              }`}
            >
              {content.title || presentation.title || 'Interactive Workshop'}
            </h1>

            {/* Presenter Name and Info (Optional) */}
            {(content.presenter_name || content.presenter_info) && (
              <div
                className={`p-4 rounded-2xl max-w-lg space-y-1 border ${
                  isLight
                    ? 'bg-white/95 border-slate-200/90 shadow-md text-slate-900'
                    : 'bg-slate-900/80 border-slate-800 text-white'
                }`}
              >
                {content.presenter_name && (
                  <div
                    className={`text-xl font-bold flex items-center space-x-2 ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    <span className={isLight ? 'text-slate-500 font-medium text-base' : 'text-slate-400 font-medium text-base'}>
                      Presented by
                    </span>
                    <span
                      style={getFieldTextStyle(content.styles, 'presenter_name')}
                      className={!content.styles?.presenter_name?.color ? (isLight ? 'text-indigo-600 font-extrabold' : 'text-indigo-400 font-extrabold') : 'font-extrabold'}
                    >
                      {content.presenter_name}
                    </span>
                  </div>
                )}
                {content.presenter_info && (
                  <div
                    style={getFieldTextStyle(content.styles, 'presenter_info')}
                    className={`text-sm font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}
                  >
                    {content.presenter_info}
                  </div>
                )}
              </div>
            )}

            {/* Join Message & URL Box */}
            <div className="space-y-4 pt-2">
              <p
                style={getFieldTextStyle(content.styles, 'join_message')}
                className={`text-lg font-medium leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
              >
                {content.join_message ||
                  'Join the live interactive presentation on your phone or laptop to vote and participate:'}
              </p>

              <div
                className={`flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl max-w-lg border ${
                  isLight
                    ? 'bg-white/95 border-slate-200/90 shadow-md text-slate-900'
                    : 'bg-slate-900/90 border-slate-800 shadow-md text-white'
                }`}
              >
                <div>
                  <div className={`text-[11px] uppercase tracking-wider font-semibold mb-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Web Link
                  </div>
                  <div className={`text-lg font-mono font-bold underline underline-offset-4 ${isLight ? 'text-slate-950' : 'text-white'}`}>
                    {activeJoinUrl || join.url}
                  </div>
                  {altLocalUrl && altLocalUrl !== activeJoinUrl && (
                    <div className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Local: {altLocalUrl}
                    </div>
                  )}
                </div>
                <div className={`sm:border-l sm:pl-5 ${isLight ? 'sm:border-slate-200' : 'sm:border-slate-800'}`}>
                  <div className={`text-[11px] uppercase tracking-wider font-semibold mb-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Session Code
                  </div>
                  <div className={`text-3xl font-mono font-extrabold tracking-wider ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                    {join.code}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Larger QR Code */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className={`p-6 bg-white rounded-3xl ${isLight ? 'shadow-xl border-4 border-slate-200/90' : 'shadow-2xl border-4 border-indigo-500/30'}`}>
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Join QR Code"
                  className="w-64 h-64 lg:w-72 lg:h-72 rounded-xl object-contain"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-slate-100 rounded-xl">
                  <QrCode className="w-32 h-32 text-slate-400" />
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <span className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Scan with phone camera to participate
              </span>
            </div>
          </div>
        </div>

        {/* App Branding at the bottom (Requirement 3) */}
        <div className={`flex items-center justify-between pt-5 border-t text-xs font-medium ${isLight ? 'border-slate-200/90 text-slate-600' : 'border-slate-800/80 text-slate-400'}`}>
          <div className="flex items-center space-x-2.5">
            <img
              src="/assets/aistudio/AirAct_Community_Learning_Logo_44a129c1.png"
              alt="AirAct"
              className="h-7 w-auto object-contain"
            />
            <span className={`font-extrabold text-sm ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>AirAct</span>
            <span className={`font-semibold text-xs px-2 py-0.5 rounded ${isLight ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60'}`}>
              by SkillUpgrade Network
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleFullscreen}
              className={`p-1 rounded transition-colors ${isLight ? 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-950 border border-slate-200 shadow-2xs' : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white'}`}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            </button>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{counters.active} joined</span>
            </div>
          </div>
        </div>
      </div>
      </AspectScaledCanvas>
    </div>
  );
}

  // 5. Normal Live Presentation Slides (Poll, Quiz, Word Cloud, Open, QA, Leaderboard, Content)
  // Requirement 2:
  // - QR code should NOT be visible otherwise on normal slides during projection screen!
  // - Pressing Q anytime reveals a larger QR code towards the left (~1/3) and slide adjusts (~2/3 right).
  // - Pressing Q again restores normal layout.
  const isResultsVisible = slide.results_visible;
  const aggregates = slide.aggregates;
  const content = slide.content as any;
  const remainingSecs = slide.remaining_ms !== null ? Math.ceil(slide.remaining_ms / 1000) : null;

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden select-none">
      <AspectScaledCanvas
        aspectRatio={activeAspectRatio}
        containerClassName="w-full h-full bg-black flex items-center justify-center"
        wrapperClassName="overflow-hidden shadow-2xl relative"
      >
        <div
          style={getThemeTextureStyle(theme)}
          className="w-full h-full flex overflow-hidden relative select-none transition-all"
        >
      {/* Freeze indicator banner */}
      {presentation.state === 'frozen' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-lg">
          <Pause className="w-3.5 h-3.5 fill-current" />
          <span>PROJECTOR PAUSED</span>
        </div>
      )}

      {/* On-Demand Left QR Code Split Panel (~1/3 width when Q is toggled) - Requirement 2 */}
      {showQrSplit && (
        <div
          className={`w-[32%] min-w-[320px] max-w-[420px] border-r flex flex-col justify-between p-8 z-40 animate-in slide-in-from-left duration-200 shadow-2xl ${
            isLight
              ? 'bg-white/95 border-slate-200/90 text-slate-900 backdrop-blur-md'
              : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          {/* Top Panel Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                Join Presentation
              </span>
            </div>
            <button
              onClick={() => setShowQrSplit(false)}
              className={`p-1.5 rounded-lg transition-colors ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Close QR panel (or press Q)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Large QR Code & Join Information */}
          <div className="flex flex-col items-center justify-center my-auto text-center space-y-6">
            <div className={`p-5 bg-white rounded-3xl ${isLight ? 'shadow-xl border-4 border-slate-200/90' : 'shadow-2xl border-4 border-indigo-500/30'}`}>
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Join QR Code"
                  className="w-56 h-56 lg:w-64 lg:h-64 rounded-xl object-contain"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center bg-slate-100 rounded-xl">
                  <QrCode className="w-28 h-28 text-slate-400" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className={`text-xs uppercase tracking-wider font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Scan or browse to
              </div>
              <div className={`text-base font-mono font-bold underline underline-offset-4 break-all ${isLight ? 'text-slate-950' : 'text-white'}`}>
                {activeJoinUrl || join.url}
              </div>
              {altLocalUrl && altLocalUrl !== activeJoinUrl && (
                <div className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Local: {altLocalUrl}
                </div>
              )}
              <div className={`text-3xl font-mono font-extrabold tracking-wider pt-2 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                Code: {join.code}
              </div>
            </div>
          </div>

          {/* Bottom dismiss helper */}
          <div className={`border-t pt-4 flex items-center justify-between text-xs ${isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'}`}>
            <span className="flex items-center space-x-1">
              <Users className={`w-3.5 h-3.5 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
              <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{counters.active} active</span>
            </span>
            <span className={`px-2 py-0.5 rounded font-mono text-[11px] ${isLight ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-slate-800 text-slate-300'}`}>
              Press Q to hide
            </span>
          </div>
        </div>
      )}

      {/* Main Slide Presentation Content Area (~2/3 when Q is split, or Full 100% width normally) */}
      <div className={`flex-1 flex flex-col justify-between ${showQrSplit ? 'p-8' : 'p-10'} overflow-hidden min-w-0 transition-all`}>
        {/* Top Header: Slide Question Prompt & Countdown Timer */}
        <div className="flex items-start justify-between gap-8 mb-6">
          <div className="flex-1 min-w-0">
            <span className={`text-xs font-bold uppercase tracking-widest block mb-2 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
              {slide.type_id}
            </span>
            <h1
              style={getFieldTextStyle(content.styles, content.question !== undefined ? 'question' : 'title')}
              className={`text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight ${
                !content.styles?.[content.question !== undefined ? 'question' : 'title']?.color
                  ? isLight
                    ? 'text-slate-950 font-black'
                    : 'text-white'
                  : ''
              }`}
            >
              {content.question || content.title}
            </h1>
          </div>

          {/* Live Countdown Timer Badge */}
          {remainingSecs !== null && (
            <div
              className={`px-5 py-3 rounded-2xl flex items-center space-x-3 border shrink-0 transition-colors ${
                slide.timer_paused
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-500'
                  : remainingSecs <= 5
                  ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse'
                  : isLight
                  ? 'bg-white/95 border-slate-200/90 text-indigo-700 shadow-sm'
                  : 'bg-slate-900 border-slate-700 text-indigo-400'
              }`}
            >
              {slide.timer_paused ? (
                <Pause className="w-6 h-6 fill-current text-amber-500" />
              ) : (
                <Clock className="w-6 h-6" />
              )}
              <div className="flex flex-col items-start leading-none">
                <span className="font-mono text-3xl font-extrabold">{remainingSecs}s</span>
                {slide.timer_paused && (
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-500 mt-0.5">
                    PAUSED
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Center Body: Visual Slide Rendering */}
        <div className="flex-1 flex flex-col justify-center my-4 overflow-hidden">
          {/* A. Poll / Quiz Results */}
          {(slide.type_id === 'poll' || slide.type_id === 'quiz') && (
            <div className="space-y-4 max-w-4xl w-full mx-auto">
              {content.options?.map((opt: any, idx: number) => {
                const aggOpt = aggregates?.options?.find((o: any) => o.option_id === opt.id);
                const percentage = aggOpt?.percentage || 0;
                const count = aggOpt?.count || 0;
                const isCorrect = slide.step !== 'question' && content.correct_option_id === opt.id;

                return (
                  <div key={opt.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <div className="flex items-center space-x-3">
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            isLight
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : 'bg-indigo-500/20 text-indigo-400'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span
                          style={getFieldTextStyle(content.styles, 'options')}
                          className={`text-xl font-bold ${
                            !content.styles?.options?.color ? (isLight ? 'text-slate-950' : 'text-white') : ''
                          }`}
                        >
                          {opt.text}
                        </span>
                        {isCorrect && (
                          <span
                            className={`flex items-center space-x-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              isLight
                                ? 'text-emerald-800 bg-emerald-100 border border-emerald-300'
                                : 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>CORRECT</span>
                          </span>
                        )}
                      </div>

                      {isResultsVisible && (
                        <span className={`font-mono text-xl font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                          {count} votes ({percentage}%)
                        </span>
                      )}
                    </div>

                    {/* Percentage Bar */}
                    <div
                      className={`h-6 w-full rounded-xl overflow-hidden p-0.5 ${
                        isLight
                          ? 'bg-slate-200/80 border border-slate-300 shadow-2xs'
                          : 'bg-slate-900 border border-slate-800'
                      }`}
                    >
                      <div
                        className={`h-full rounded-lg transition-all duration-700 ease-out ${
                          isCorrect
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-indigo-600 to-violet-500'
                        }`}
                        style={{ width: isResultsVisible ? `${Math.max(percentage, 2)}%` : '0%' }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Quiz Explanation Reveal */}
              {slide.type_id === 'quiz' && slide.step !== 'question' && content.explanation && (
                <div
                  className={`mt-6 p-4 rounded-xl text-base leading-relaxed animate-in fade-in border ${
                    isLight
                      ? 'bg-white/95 border-emerald-400/70 text-slate-800 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                  style={getFieldTextStyle(content.styles, 'explanation')}
                >
                  <span className={`font-bold block mb-1 ${isLight ? 'text-emerald-700' : 'text-indigo-400'}`}>Explanation:</span>
                  {content.explanation}
                </div>
              )}
            </div>
          )}

          {/* B. Quiz Leaderboard */}
          {slide.type_id === 'leaderboard' && aggregates?.leaderboard && (
            <div className="max-w-3xl w-full mx-auto space-y-4">
              {aggregates.leaderboard.map((entry: any, idx: number) => {
                const medalColor =
                  idx === 0
                    ? 'bg-amber-400 text-slate-950'
                    : idx === 1
                    ? 'bg-slate-300 text-slate-950'
                    : idx === 2
                    ? 'bg-amber-700 text-white'
                    : isLight
                    ? 'bg-slate-100 text-slate-700 border border-slate-200'
                    : 'bg-slate-800 text-slate-300';

                return (
                  <div
                    key={entry.participant_id}
                    className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${
                      idx === 0
                        ? isLight
                          ? 'bg-amber-100/90 border-amber-300 shadow-md scale-102 text-slate-950'
                          : 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/10 scale-102 text-white'
                        : isLight
                        ? 'bg-white/95 border-slate-200/90 shadow-sm text-slate-900'
                        : 'bg-slate-900/80 border-slate-800 text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <span
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-lg ${medalColor}`}
                      >
                        {idx + 1}
                      </span>
                      <span className={`text-2xl font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>{entry.name}</span>
                    </div>

                    <div className="flex items-center space-x-6">
                      <span className={`text-sm ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                        {entry.correct_count} correct
                      </span>
                      <span className={`font-mono text-2xl font-black ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                        {entry.total_score} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* C. Word Cloud */}
          {slide.type_id === 'wordcloud' && aggregates?.words && (
            <div className="max-w-5xl w-full h-[54vh] mx-auto flex items-center justify-center p-4">
              <D3WordCloud words={aggregates.words} className="w-full h-full" />
            </div>
          )}

          {/* D. Open Question Card Wall */}
          {slide.type_id === 'open' && aggregates?.answers && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl w-full mx-auto overflow-y-auto max-h-[50vh] p-2">
              {aggregates.answers.length === 0 ? (
                <div className={`col-span-full text-center py-12 text-lg ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  Audience responses will appear here live...
                </div>
              ) : (
                aggregates.answers.map((ans: any) => (
                  <div
                    key={ans.id}
                    className={`p-5 rounded-2xl flex flex-col justify-between border ${
                      isLight
                        ? 'bg-white/95 border-slate-200/90 shadow-sm text-slate-900'
                        : 'bg-slate-900 border-slate-800 shadow-md text-white'
                    }`}
                  >
                    <p className={`text-lg font-medium leading-relaxed mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      "{ans.text}"
                    </p>
                    <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      — {ans.author}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* E. Audience Q&A Board */}
          {slide.type_id === 'qa' && aggregates?.questions && (
            <div className="space-y-3 max-w-4xl w-full mx-auto overflow-y-auto max-h-[50vh] p-2">
              {aggregates.questions.length === 0 ? (
                <div className={`text-center py-12 text-lg ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  Audience questions and upvotes will appear here live...
                </div>
              ) : (
                aggregates.questions.map((q: any) => (
                  <div
                    key={q.id}
                    className={`p-5 rounded-2xl flex items-center justify-between border ${
                      isLight
                        ? 'bg-white/95 border-slate-200/90 shadow-sm text-slate-900'
                        : 'bg-slate-900 border-slate-800 shadow-md text-white'
                    }`}
                  >
                    <div>
                      <h3 className={`text-xl font-bold mb-1 ${isLight ? 'text-slate-950' : 'text-white'}`}>{q.question}</h3>
                      <span className={`text-xs ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>Asked by {q.author_name}</span>
                    </div>

                    <div
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-xl border ${
                        isLight
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                      }`}
                    >
                      <span>▲</span>
                      <span>{q.upvotes}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* F. Content Slide */}
          {slide.type_id === 'content' && (
            <div className="max-w-4xl mx-auto text-center space-y-6">
              {content.body && (
                <p
                  className={`text-2xl font-normal leading-relaxed whitespace-pre-wrap ${isLight ? 'text-slate-800' : 'text-slate-300'}`}
                  style={getFieldTextStyle(content.styles, 'body')}
                >
                  {content.body}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bottom Bar: Clean status & Counters (NO QR CODE on normal slides unless Q is pressed - Requirement 2) */}
        <div className={`flex items-end justify-between pt-6 border-t ${isLight ? 'border-slate-200/90 text-slate-600' : 'border-slate-800/80 text-slate-400'}`}>
          {/* Clean minimal join info strip (QR code is strictly hidden unless Q is pressed) */}
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs border ${
                isLight
                  ? 'bg-white/95 border-slate-200/90 shadow-xs text-slate-700'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <span>Join:</span>
              <span className={`font-mono font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>{activeJoinUrl || join.url}</span>
              <span className={isLight ? 'text-slate-400' : 'text-slate-600'}>|</span>
              <span className={`font-mono font-bold ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>Code: {join.code}</span>
            </div>

            {/* Q Key helper badge / button */}
            {!showQrSplit && (
              <button
                onClick={() => setShowQrSplit(true)}
                className={`px-2.5 py-1 rounded-lg border text-xs transition-colors flex items-center space-x-1.5 ${
                  isLight
                    ? 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 shadow-xs'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Show QR Code (press Q)"
              >
                <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${isLight ? 'bg-slate-100 text-slate-800 border border-slate-200' : 'bg-slate-800 border border-slate-700 text-slate-200'}`}>
                  Q
                </span>
                <span>QR Code</span>
              </button>
            )}
          </div>

          {/* Bottom Counters & Fullscreen */}
          <div className="flex items-center space-x-5 text-sm font-medium">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className={`font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>{counters.active}</span>
              <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>active</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className={`font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>{counters.answered}</span>
              <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>answered</span>
            </div>

            <button
              onClick={toggleFullscreen}
              className={`p-1 rounded transition-colors ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-950 border border-slate-200 shadow-2xs'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Toggle Fullscreen (F11)"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
        </div>
      </AspectScaledCanvas>
    </div>
  );
};
