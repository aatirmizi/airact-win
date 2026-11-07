import React, { useState } from 'react';
import { usePresenter } from '../../context/PresenterContext.js';
import {
  Sparkles,
  BarChart2,
  Trophy,
  Cloud,
  MessagesSquare,
  LayoutTemplate,
  Tv,
  Radio,
  Play,
  Sliders,
  ShieldCheck,
  Users,
  Edit3,
  ExternalLink,
  CheckCircle2,
  Wifi,
  FilePlus,
  QrCode,
  Smartphone,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';

interface FacilitatorHubProps {
  onOpenStartModal?: () => void;
}

export const FacilitatorHub: React.FC<FacilitatorHubProps> = ({ onOpenStartModal }) => {
  const {
    activity,
    openActivityForEditing,
    newActivity,
    setActiveView,
    liveState,
    isConnected,
    setIsNetworkModalOpen,
  } = usePresenter();

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [networkLatency, setNetworkLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const handleOpenProjectorTest = () => {
    window.open(
      '/projector?test=true',
      'AirActProjector',
      'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no'
    );
  };

  const handleOpenPhoneTest = () => {
    window.open(
      '/p',
      'AirActPhone',
      'width=420,height=800,menubar=no,toolbar=no,location=no,status=no'
    );
  };

  const runNetworkCheck = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      await fetch('/api/activity');
      const diff = Math.round(performance.now() - start);
      setNetworkLatency(diff);
    } catch {
      setNetworkLatency(-1);
    } finally {
      setIsPinging(false);
    }
  };

  const activityName = activity?.manifest?.meta?.name || 'Untitled Activity';
  const slideCount = activity?.slides?.length || 0;
  const isLive = liveState?.is_live;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 lg:p-8 xl:p-10 select-none">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 xl:gap-10 items-stretch">
        
        {/* ─────────────────────────────────────────────────────────────
            LEFT SECTION (~60%): App Capabilities & Feature Showcase
            ───────────────────────────────────────────────────────────── */}
        <div className="lg:w-3/5 flex flex-col justify-between space-y-6">
          
          {/* Hero Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-md">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Presentation & Learning Suite</span>
            </div>

            <h1 className="text-2xl sm:text-3xl xl:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Captivate Your Audience With Real-Time Live Interactivity
            </h1>

            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              AirAct empowers presenters and educators to transform static talks into vibrant, two-way community learning sessions. Collect instant votes, spark debates, run competitive quizzes, and crowdsource questions—streamed synchronously across projectors and mobile participant devices without any app installation.
            </p>

            {/* Current Open Deck Snapshot */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/10 dark:bg-indigo-400/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                    Current Presentation
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {activityName}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200">
                  {slideCount} {slideCount === 1 ? 'Slide' : 'Slides'}
                </span>
                <button
                  onClick={openActivityForEditing}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Open Editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Key Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. Polls & Word Clouds */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Audience Polls & Word Clouds
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Single-choice votes with immediate percentage feedback, plus automated keyword clustering that dynamically expands prominent thoughts.
              </p>
            </div>

            {/* 2. Quizzes & Podiums */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Quizzes & Leaderboards
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Gamified questions with countdown clocks, speed scoring bonuses, instant explanation reveals, and dramatic Top 5 medal podiums.
              </p>
            </div>

            {/* 3. Upvoted Q&A */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:border-pink-300 dark:hover:border-pink-700 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-3">
                <MessagesSquare className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Crowdsourced Upvoted Q&A
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Let audience members ask questions anonymously or with their names. Attendees upvote priority topics to surface the most critical queries.
              </p>
            </div>

            {/* 4. Multi-Display Sync */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:border-sky-300 dark:hover:border-sky-700 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
                <Tv className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Multi-Display Live Sync
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Presenter console, full-screen projector stage (`/projector`), and participant phones (`/p`) stay synchronized via low-latency WebSockets.
              </p>
            </div>
          </div>

          {/* Pre-Flight Session Readiness Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Gateway: {isConnected ? 'Online & Synchronized' : 'Connecting...'}
              </span>
            </div>

            <div className="flex items-center space-x-4 text-slate-500 dark:text-slate-400">
              <span className="font-mono">Port: 3000</span>
              <span>·</span>
              <span>Join Route: <code className="text-indigo-600 dark:text-indigo-400 font-bold">/j/[CODE]</code></span>
              <span>·</span>
              <span>Host PIN Protected</span>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            RIGHT SECTION (~40%): Action Cards with Soft Drop Shadows
            ───────────────────────────────────────────────────────────── */}
        <div className="lg:w-2/5 flex flex-col space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Common Facilitator Actions
            </h2>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
              Ready to Launch
            </span>
          </div>

          {/* Card 1: Start Designing / Edit Activity */}
          <div
            onClick={openActivityForEditing}
            className="group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 p-4.5 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-start space-x-4"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <Edit3 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Design & Edit Activity
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  Slide Editor
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Edit slides, reorder questions, adjust timers, or add new polls, quizzes, and word clouds to your current presentation.
              </p>
            </div>
          </div>

          {/* Card 2: New from Template */}
          <div
            onClick={() => setActiveView('templates')}
            className="group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 p-4.5 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-start space-x-4"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  New from Template Gallery
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  Pre-Built
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Quick-start with verified templates: Corporate All-Hands, High-Stakes Quiz Tournament, Training Workshop, or Sprint Review.
              </p>
            </div>
          </div>

          {/* Card 3: Test & Adjust Projector Placement */}
          <div
            onClick={handleOpenProjectorTest}
            className="group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 p-4.5 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-start space-x-4"
          >
            <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <Tv className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Test Projector Placement
                </h3>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500" />
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Launch the projector display (`/projector`) in a clean second window to test screen alignment, zoom, and venue display aspect ratios.
              </p>
            </div>
          </div>

          {/* Card 4: Network Settings Helper & Participant Device Setup */}
          <div
            onClick={() => setIsNetworkModalOpen(true)}
            className="group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 p-4.5 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-start space-x-4"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <Radio className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Network Settings Helper
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  Wi-Fi & QR Test
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Select your room Wi-Fi or Ethernet adapter, generate real-time participant test QR codes, and verify phone connectivity.
              </p>
            </div>
          </div>

          {/* Card 5: Start Presenting Live */}
          <div
            onClick={() => {
              if (onOpenStartModal) onOpenStartModal();
            }}
            className="group bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 dark:from-emerald-950/40 dark:to-indigo-950/40 border border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 p-4.5 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-start space-x-4"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300">
                  Start Presenting Live
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                  Live Mode
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Generate an active session code, unlock participant voting, and lead the live workshop from your facilitator controls.
              </p>
            </div>
          </div>

          {/* Card 6: Session Defaults & Host Security */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => setActiveView('session_defaults')}
              className="p-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 rounded-xl shadow-xs hover:shadow-sm text-left transition-all cursor-pointer flex items-center space-x-2.5"
            >
              <Sliders className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Session Defaults</div>
                <div className="text-[10px] text-slate-400">Timers & Rules</div>
              </div>
            </button>

            <button
              onClick={() => setActiveView('host_security')}
              className="p-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 rounded-xl shadow-xs hover:shadow-sm text-left transition-all cursor-pointer flex items-center space-x-2.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Host Security</div>
                <div className="text-[10px] text-slate-400">PIN & Tokens</div>
              </div>
            </button>
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          NETWORK & PARTICIPANT DIAGNOSTIC MODAL
          ───────────────────────────────────────────────────────────── */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Radio className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Participant Network Diagnostic
                </h3>
              </div>
              <button
                onClick={() => setTestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Ensure venue participant devices can connect seamlessly before initiating live votes.
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Server Latency</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {isPinging
                      ? 'Probing…'
                      : networkLatency !== null
                      ? networkLatency < 0
                        ? 'Connection Failed'
                        : `${networkLatency} ms (Excellent)`
                      : 'Not tested yet'}
                  </div>
                </div>
                <button
                  onClick={runNetworkCheck}
                  disabled={isPinging}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {isPinging ? 'Checking…' : 'Ping Server'}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Test Phone Window</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Launch simulated participant client</div>
                </div>
                <button
                  onClick={handleOpenPhoneTest}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Open Phone</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setTestModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close Diagnostic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
