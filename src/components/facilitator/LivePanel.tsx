import React, { useState, useEffect, useRef } from 'react';
import { usePresenter } from '../../context/PresenterContext.js';
import {
  Radio,
  Tv,
  ChevronLeft,
  ChevronRight,
  FastForward,
  Play,
  Pause,
  Plus,
  Eye,
  EyeOff,
  Square,
  Users,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  UserX,
  EyeOff as HideIcon,
  Clock,
  MessageSquare,
  Sparkles,
  BarChart3,
  Shield,
  HelpCircle,
  FileText,
  Sliders,
  ExternalLink,
  Wifi,
  ChevronDown,
} from 'lucide-react';
import { LiveSlideDisplay } from './LiveSlideDisplay.js';
import { AspectRatioType } from '../common/AspectScaledCanvas.js';

interface LivePanelProps {
  onEndPresenting: () => void;
  onResetSlide: (slideId: string) => void;
}

export const LivePanel: React.FC<LivePanelProps> = ({ onEndPresenting, onResetSlide }) => {
  const {
    activity,
    liveState,
    nextStep,
    prevStep,
    nextSlide: handleNextSlide,
    prevSlide,
    toggleAccepting,
    closeNow,
    pauseTimer,
    resumeTimer,
    setTimer,
    resetTimer,
    clearTimer,
    extendTimer,
    toggleResultsVisibility,
    setBlanked,
    setFrozen,
    removeParticipant,
    hideParticipantName,
    updateQAStatus,
    aspectRatio,
    setAspectRatio,
    updateSlideNotes,
    saveActivity,
    setIsNetworkModalOpen,
    setActiveView,
    networkStatus,
  } = usePresenter();

  const [copiedLink, setCopiedLink] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'data' | 'moderation'>('data');
  const [initialTimerSeconds, setInitialTimerSeconds] = useState<number>(30);
  const [notesDraft, setNotesDraft] = useState<string>('');
  const [notesSavedNotice, setNotesSavedNotice] = useState<string>('Saved');
  const [aspectMenuOpen, setAspectMenuOpen] = useState(false);
  const notesSaveTimeoutRef = useRef<any>(null);

  const slides = activity?.slides || [];
  const currentSlideIndex = liveState?.current_slide_index ?? 0;
  const currentSlide = slides[currentSlideIndex] || liveState?.current_slide || null;
  const upcomingSlide = slides[currentSlideIndex + 1] || null;

  const aggregates = liveState?.current_slide_aggregates;
  const responses = liveState?.current_slide_responses || [];
  const joinUrl = `${window.location.origin}/j/${liveState?.join_code || ''}`;

  // Sync notes draft when switching slides
  useEffect(() => {
    if (currentSlide) {
      setNotesDraft(currentSlide.notes || '');
      setNotesSavedNotice('Saved');
    }
  }, [currentSlide?.id, currentSlideIndex]);

  // Handle in-place presenter notes edit & debounced auto-save
  const handleNotesChange = (val: string) => {
    setNotesDraft(val);
    setNotesSavedNotice('Typing...');
    if (notesSaveTimeoutRef.current) {
      clearTimeout(notesSaveTimeoutRef.current);
    }
    notesSaveTimeoutRef.current = setTimeout(() => {
      updateSlideNotes(val);
      saveActivity();
      setNotesSavedNotice('Saved');
    }, 800);
  };

  const handleNotesBlur = () => {
    if (notesSaveTimeoutRef.current) {
      clearTimeout(notesSaveTimeoutRef.current);
    }
    updateSlideNotes(notesDraft);
    saveActivity();
    setNotesSavedNotice('Saved');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenProjector = () => {
    window.open('/projector', '_blank');
  };

  const handleOpenPhoneWindow = () => {
    window.open('/p', 'AirActPhone', 'width=420,height=800,menubar=no,toolbar=no,location=no,status=no');
  };

  if (!liveState || !liveState.is_live || !currentSlide) return null;

  // Determine if there is a next step
  const hasNextStep =
    liveState.has_next_step !== undefined
      ? Boolean(liveState.has_next_step)
      : currentSlide.type_id === 'poll'
      ? liveState.current_step === 'question'
      : currentSlide.type_id === 'quiz'
      ? liveState.current_step === 'question' || liveState.current_step === 'reveal'
      : currentSlide.type_id === 'open' ||
        currentSlide.type_id === 'wordcloud' ||
        currentSlide.type_id === 'qa'
      ? liveState.current_step === 'collect'
      : false;

  const isTimerApplicable =
    liveState.is_timer_applicable !== undefined
      ? Boolean(liveState.is_timer_applicable)
      : currentSlide.type_id !== 'content' &&
        currentSlide.type_id !== 'leaderboard' &&
        ((currentSlide.type_id === 'poll' && liveState.current_step === 'question') ||
          (currentSlide.type_id === 'quiz' && liveState.current_step === 'question') ||
          ((currentSlide.type_id === 'open' ||
            currentSlide.type_id === 'wordcloud' ||
            currentSlide.type_id === 'qa') &&
            liveState.current_step === 'collect'));

  const isLastSlide = currentSlideIndex >= slides.length - 1;

  // Next step button label
  const getNextStepLabel = () => {
    if (currentSlide.type_id === 'quiz') {
      if (liveState.current_step === 'question') return 'Reveal Correct Answer';
      if (liveState.current_step === 'reveal') return 'Show Stats & Leaderboard';
      return 'Next Slide';
    }
    if (currentSlide.type_id === 'poll') {
      if (liveState.current_step === 'question') return 'Reveal Results';
      return 'Next Slide';
    }
    if (
      currentSlide.type_id === 'wordcloud' ||
      currentSlide.type_id === 'open' ||
      currentSlide.type_id === 'qa'
    ) {
      if (liveState.current_step === 'collect') return 'Display Wall';
      return 'Next Slide';
    }
    return 'Next Slide';
  };

  // Word count of speaker notes
  const notesWordCount = notesDraft.trim() ? notesDraft.trim().split(/\s+/).length : 0;

  return (
    <div className="w-[100vw] h-[100vh] flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      {/* ─────────────────────────────────────────────────────────────────
          GLOBAL LAYOUT BOUNDARY 1:
          NavBar / Top Banner: Width 100vw, Height 15vh (Offset from top: 0)
          ───────────────────────────────────────────────────────────────── */}
      <div className="w-[100vw] h-[15vh] max-h-[15vh] shrink-0 bg-slate-900/95 border-b border-slate-800 flex flex-col justify-between px-6 py-2.5 z-30 shadow-lg">
        {/* Row 1: Brand Logo, Presentation Title, Quick Menus, Network Indicator & End Session */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Brand & Title */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="flex items-center space-x-2">
              <img
                src="/assets/aistudio/AirAct_Community_Learning_Logo_44a129c1.png"
                alt="AirAct"
                className="h-7 w-auto object-contain"
              />
              <span className="font-black text-sm text-white tracking-tight hidden sm:inline">
                AirAct
              </span>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-extrabold tracking-wider animate-pulse shrink-0">
              <Radio className="w-3.5 h-3.5" />
              <span>LIVE</span>
            </div>

            <span className="text-slate-600">|</span>

            <span
              className="font-extrabold text-sm text-slate-200 truncate max-w-[260px]"
              title={activity?.manifest.meta.name || liveState.activity_name}
            >
              {activity?.manifest.meta.name || liveState.activity_name || 'Active Presentation'}
            </span>
          </div>

          {/* Center: Facilitator Dropdown Shortcuts */}
          <div className="hidden md:flex items-center space-x-2 text-xs">
            <button
              onClick={() => setIsNetworkModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Open Network Settings Helper"
            >
              <Wifi className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] font-semibold">Network Helper</span>
            </button>

            <button
              onClick={handleOpenPhoneWindow}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Launch Participant Phone Test Window"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-semibold">Phone Window</span>
            </button>

            <button
              onClick={() => setActiveView('host_security')}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Host PIN & Security"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] font-semibold">Host Security</span>
            </button>
          </div>

          {/* Right: Dual Screen Actions & End Live Session */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={handleOpenProjector}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              title="Open dedicated projector window (/projector)"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Open Projector</span>
            </button>

            <button
              onClick={onEndPresenting}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-md shadow-red-600/30 transition-all cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>End Session</span>
            </button>
          </div>
        </div>

        {/* Row 2: Live Status Line (Slide Index, Join Info, Audience Counters, Blank/Freeze status) */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5 text-xs">
          {/* Left: Slide and Step Status */}
          <div className="flex items-center space-x-2 text-xs truncate">
            <span className="text-indigo-400 font-bold shrink-0">
              Slide {currentSlideIndex + 1} of {slides.length}
            </span>
            <span className="capitalize text-slate-300 shrink-0 font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px]">
              {currentSlide.type_id}
            </span>
            <span className="text-slate-600">·</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700 text-[10px] font-mono font-bold uppercase shrink-0">
              Step: {liveState.current_step}
            </span>
          </div>

          {/* Center: Live Join Info with Copy Button */}
          <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700/80 px-3 py-0.5 rounded-xl text-xs">
            <span className="text-slate-400">Join:</span>
            <span className="font-mono font-bold text-indigo-400">{joinUrl}</span>
            <span className="text-slate-500">·</span>
            <span className="font-mono font-black text-white">Code: {liveState.join_code}</span>
            <button
              onClick={handleCopyLink}
              className="p-1 hover:text-indigo-400 text-slate-400 transition-colors cursor-pointer"
              title="Copy Join Link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Right: Live Audience Counters & Output Indicators */}
          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700/80 px-2.5 py-0.5 rounded-xl text-[11px]">
              <span className="text-slate-300 flex items-center space-x-1">
                <Users className="w-3 h-3 text-indigo-400" />
                <span>{liveState.active_participants} Active</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-bold">{liveState.answered_count} Votes</span>
            </div>

            {liveState.is_blanked ? (
              <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-red-950/80 text-red-400 border border-red-800 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span>Blanked</span>
              </span>
            ) : liveState.is_frozen ? (
              <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Frozen</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Projector Normal</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          GLOBAL LAYOUT BOUNDARY 2:
          Main Workspace: Width 100vw, Height 85vh (Offset from top: 15vh)
          ───────────────────────────────────────────────────────────────── */}
      <div className="w-[100vw] h-[85vh] max-h-[85vh] flex flex-row overflow-hidden shrink-0">
        {/* ═════════════════════════════════════════════════════════════════
            LEFT PANE (Main Workspace): Width 60vw, Height 85vh
            ═════════════════════════════════════════════════════════════════ */}
        <div className="w-[60vw] h-[85vh] max-h-[85vh] flex flex-col overflow-hidden border-r border-slate-800 shrink-0">
          {/* ─────────────────────────────────────────────────────────────
              SUB-PANE 1: Main Slide Frame (Top Left): Width 60vw, Height 60vh
              Aspect-Locked Visual Replica of /projector
              ───────────────────────────────────────────────────────────── */}
          <div className="w-[60vw] h-[60vh] max-h-[60vh] flex flex-col shrink-0 overflow-hidden bg-slate-950 p-2.5 relative">
            {/* Sub-Header Strip */}
            <div className="h-7 flex items-center justify-between px-2 pb-1.5 border-b border-slate-800/80 shrink-0 text-xs">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
                <Tv className="w-3.5 h-3.5" />
                <span>Current Slide · Live Projector Replica</span>
              </div>

              {/* Aspect Ratio Switcher Dropdown & Indicator */}
              <div className="flex items-center space-x-2.5">
                <span className="text-[10px] text-slate-400 font-mono">
                  Slide {currentSlideIndex + 1}/{slides.length}
                </span>

                <div className="relative">
                  <button
                    onClick={() => setAspectMenuOpen(!aspectMenuOpen)}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer"
                    title="Change presentation aspect ratio"
                  >
                    <span>Aspect: {aspectRatio}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {aspectMenuOpen && (
                    <div className="absolute right-0 mt-1 w-28 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
                      {(['16:9', '16:10', '4:3'] as AspectRatioType[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => {
                            setAspectRatio(r);
                            setAspectMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1 text-xs font-mono font-bold flex items-center justify-between hover:bg-slate-800 cursor-pointer ${
                            aspectRatio === r ? 'text-indigo-400 bg-slate-800/60' : 'text-slate-300'
                          }`}
                        >
                          <span>{r}</span>
                          {aspectRatio === r && <Check className="w-3 h-3 text-indigo-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live Visual Replica scaled inside AspectScaledCanvas */}
            <div className="flex-1 w-full h-[calc(60vh-28px)] overflow-hidden flex items-center justify-center relative">
              <LiveSlideDisplay
                slide={currentSlide}
                theme={activity?.theme}
                aggregates={aggregates}
                step={liveState.current_step}
                isResultsVisible={liveState.results_visible_on_projector}
                aspectRatio={aspectRatio}
                joinCode={liveState.join_code}
                joinUrl={joinUrl}
                qrCodeUrl={liveState.qr_code}
                isBlanked={liveState.is_blanked}
                isFrozen={liveState.is_frozen}
                activeParticipants={liveState.active_participants}
              />
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SUB-PANE 2: Presentation Controls (Bottom Left): Width 60vw, Height 25vh
              Navigation, Step Advances, Results & Countdown Clocks
              ───────────────────────────────────────────────────────────── */}
          <div className="w-[60vw] h-[25vh] max-h-[25vh] flex flex-col shrink-0 overflow-y-auto bg-slate-900/90 border-t border-slate-800 p-3 space-y-2.5">
            {/* Row 1: Primary Navigation Buttons */}
            <div className="grid grid-cols-3 gap-2.5 shrink-0">
              <button
                onClick={prevSlide}
                disabled={currentSlideIndex === 0}
                className="flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl border border-slate-700 bg-slate-800/90 text-slate-200 text-xs font-semibold hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Previous Slide (PageUp)"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev Slide</span>
              </button>

              {/* Dynamic Next Step / Reveal Action */}
              {hasNextStep ? (
                <button
                  onClick={nextStep}
                  className="flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-md transition-all cursor-pointer"
                  title="Advance slide step or reveal answer (Space / Right Arrow)"
                >
                  <span>{getNextStepLabel()}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  disabled={true}
                  className="flex items-center justify-center space-x-1 py-1.5 px-3 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-500 text-xs font-medium opacity-40 cursor-not-allowed select-none"
                >
                  <span>No Next Step</span>
                </button>
              )}

              <button
                onClick={handleNextSlide}
                disabled={isLastSlide}
                className={`flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer ${
                  !hasNextStep
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                    : 'border border-slate-700 bg-slate-800/90 text-slate-200 font-semibold hover:bg-slate-700'
                }`}
                title="Next Slide (PageDown)"
              >
                <span>Next Slide</span>
                <FastForward className="w-4 h-4" />
              </button>
            </div>

            {/* Row 2: Secondary Controls (Responses, Projector Bars, Blank, Freeze, Timer) */}
            <div className="grid grid-cols-4 gap-2 text-xs shrink-0">
              {/* Accepting Responses */}
              <div className="p-2 rounded-xl border border-slate-800 bg-slate-800/40 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-300">Responses</div>
                  <div className="text-[9px] text-slate-400">
                    {liveState.accepting_responses ? 'Accepting' : 'Closed'}
                  </div>
                </div>
                {liveState.accepting_responses ? (
                  <button
                    onClick={closeNow}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                ) : (
                  <button
                    onClick={() => toggleAccepting(true)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                  >
                    Open
                  </button>
                )}
              </div>

              {/* Projector Bars */}
              <div className="p-2 rounded-xl border border-slate-800 bg-slate-800/40 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-300">Projector Bars</div>
                  <div className="text-[9px] text-slate-400">
                    {liveState.results_visible_on_projector ? 'Visible' : 'Hidden'}
                  </div>
                </div>
                <button
                  onClick={() => toggleResultsVisibility(!liveState.results_visible_on_projector)}
                  className={`p-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    liveState.results_visible_on_projector
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Toggle live results visibility on projector screen"
                >
                  {liveState.results_visible_on_projector ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Blank & Freeze */}
              <div className="p-2 rounded-xl border border-slate-800 bg-slate-800/40 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-300">Display</div>
                  <div className="text-[9px] text-slate-400">
                    {liveState.is_blanked ? 'Blanked' : liveState.is_frozen ? 'Frozen' : 'Normal'}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setBlanked(!liveState.is_blanked)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                      liveState.is_blanked
                        ? 'bg-red-600 text-white border-red-500'
                        : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                    }`}
                  >
                    Blank
                  </button>
                  <button
                    onClick={() => setFrozen(!liveState.is_frozen)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                      liveState.is_frozen
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                    }`}
                  >
                    Freeze
                  </button>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="p-2 rounded-xl border border-slate-800 bg-slate-800/40 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-300 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    <span>Timer</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-400">
                    {liveState.timer_active
                      ? `${liveState.remaining_seconds}s`
                      : 'Inactive'}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {liveState.timer_active ? (
                    <button
                      onClick={liveState.timer_paused ? resumeTimer : pauseTimer}
                      className="px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-[9px] font-bold"
                    >
                      {liveState.timer_paused ? 'Resume' : 'Pause'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setTimer(initialTimerSeconds, true)}
                      className="px-1.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold"
                    >
                      Start
                    </button>
                  )}
                  <button
                    onClick={() => extendTimer(30)}
                    className="px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-[9px] font-bold"
                    title="+30s"
                  >
                    +30s
                  </button>
                </div>
              </div>
            </div>

            {/* Row 3: Current Slide Data Breakdown & Response Stream */}
            <div className="flex-1 bg-slate-950/60 rounded-xl border border-slate-800 p-2.5 overflow-hidden flex flex-col justify-between text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 shrink-0">
                <span className="font-bold text-[11px] text-slate-300">
                  Slide Response Insights
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  {responses.length} Submissions recorded
                </span>
              </div>

              <div className="flex-1 overflow-y-auto py-1">
                {/* Poll / Quiz votes */}
                {(currentSlide.type_id === 'poll' || currentSlide.type_id === 'quiz') && aggregates?.options && (
                  <div className="space-y-1">
                    {aggregates.options.map((opt: any, idx: number) => {
                      const optText =
                        (currentSlide.content as any)?.options?.find((o: any) => o.id === opt.option_id)?.text ||
                        `Option ${idx + 1}`;
                      const isCorrect = (currentSlide.content as any)?.correct_option_id === opt.option_id;
                      return (
                        <div key={opt.option_id} className="flex justify-between items-center py-0.5 text-xs">
                          <div className="flex items-center space-x-1.5 truncate pr-2">
                            <span className="font-bold text-slate-400">{String.fromCharCode(65 + idx)}.</span>
                            <span className="truncate text-slate-200">{optText}</span>
                            {isCorrect && (
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950 px-1 rounded">
                                CORRECT
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-slate-300 shrink-0">
                            {opt.count} votes ({opt.percentage}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Word Cloud frequencies */}
                {currentSlide.type_id === 'wordcloud' && aggregates?.words && (
                  <div className="space-y-1">
                    {aggregates.words.slice(0, 8).map((w: any) => (
                      <div key={w.text} className="flex justify-between items-center py-0.5 text-xs">
                        <span className="font-semibold text-slate-200">"{w.text}"</span>
                        <span className="font-mono font-bold text-indigo-400 bg-indigo-950/60 px-1.5 rounded">
                          {w.count} submission{w.count > 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Open Ended & QA Stream */}
                {(currentSlide.type_id === 'open' || currentSlide.type_id === 'qa') && (
                  <div className="space-y-1">
                    {responses.slice(0, 4).map((r: any) => (
                      <div key={r.id} className="flex justify-between items-center text-xs text-slate-300">
                        <span className="truncate pr-2">"{r.payload}"</span>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {r.participant_name || `Participant ${r.participant_number}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            RIGHT PANE (Preview Workspace): Width 40vw, Height 85vh
            ═════════════════════════════════════════════════════════════════ */}
        <div className="w-[40vw] h-[85vh] max-h-[85vh] flex flex-col overflow-hidden shrink-0">
          {/* ─────────────────────────────────────────────────────────────
              SUB-PANE 3: Next Slide Frame (Top Right): Width 40vw, Height 40vh
              Aspect-Locked Visual Replica of Upcoming Slide
              ───────────────────────────────────────────────────────────── */}
          <div className="w-[40vw] h-[40vh] max-h-[40vh] flex flex-col shrink-0 overflow-hidden bg-slate-950 p-2.5 relative">
            {/* Header */}
            <div className="h-7 flex items-center justify-between px-2 pb-1.5 border-b border-slate-800/80 shrink-0 text-xs">
              <div className="flex items-center space-x-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                <FastForward className="w-3.5 h-3.5" />
                <span>Next Slide · Upcoming Preview</span>
              </div>
              <div>
                {upcomingSlide ? (
                  <span className="text-[10px] text-slate-300 font-semibold font-mono">
                    Slide {currentSlideIndex + 2} of {slides.length} · <span className="capitalize">{upcomingSlide.type_id}</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">Final Slide</span>
                )}
              </div>
            </div>

            {/* Next Slide Preview or End Presentation Placeholder */}
            <div className="flex-1 w-full h-[calc(40vh-28px)] overflow-hidden flex items-center justify-center relative">
              {upcomingSlide ? (
                <LiveSlideDisplay
                  slide={upcomingSlide}
                  theme={activity?.theme}
                  step="question"
                  isResultsVisible={false}
                  aspectRatio={aspectRatio}
                  joinCode={liveState.join_code}
                  joinUrl={joinUrl}
                  isNextPreview={true}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  <div className="text-sm font-bold text-slate-300">Presentation Complete</div>
                  <p className="text-xs text-slate-500">You are on the final slide of this activity.</p>
                </div>
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SUB-PANE 4: Speaker Notes Frame (Bottom Right): Width 40vw, Height 45vh
              Presenter Cue Cards with in-place debounced autosave
              ───────────────────────────────────────────────────────────── */}
          <div className="w-[40vw] h-[45vh] max-h-[45vh] flex flex-col shrink-0 overflow-y-auto bg-slate-900/90 border-t border-slate-800 p-3.5 space-y-2.5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Speaker Notes & Cue Cards
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[10px]">
                <span className="text-slate-400">{notesWordCount} words</span>
                <span className="text-slate-600">·</span>
                <span className={notesSavedNotice === 'Saved' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {notesSavedNotice}
                </span>
              </div>
            </div>

            {/* Interactive Notes Editor */}
            <div className="flex-1 flex flex-col min-h-0 space-y-2">
              <textarea
                value={notesDraft}
                onChange={(e) => handleNotesChange(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Type your presenter cue notes, talking points, questions to ask, or timing reminders for this slide here... (Auto-saves continuously)"
                className="flex-1 w-full p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-sans resize-none leading-relaxed min-h-[120px]"
              />

              {/* Facilitator Contextual Tips Card */}
              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-300">Facilitator Guidance:</strong>{' '}
                  {currentSlide.type_id === 'welcome' &&
                    'Allow 2-3 minutes for participants to connect via QR code or short join link before advancing.'}
                  {currentSlide.type_id === 'quiz' &&
                    'Read the question aloud, start the 30-second timer, and give participants 5 seconds before revealing the correct answer.'}
                  {currentSlide.type_id === 'poll' &&
                    'Watch live vote counts rise before toggling results visibility onto the projector screen.'}
                  {currentSlide.type_id === 'wordcloud' &&
                    'Ask participants to submit 1-2 concise keywords to optimize word clustering visualization.'}
                  {currentSlide.type_id === 'open' &&
                    'Highlight thoughtful participant ideas from the response stream as they arrive.'}
                  {currentSlide.type_id === 'leaderboard' &&
                    'Celebrate the Top 5 podium winners with applause before moving to the next section.'}
                  {currentSlide.type_id === 'content' &&
                    'Focus attendee attention on key principles and takeaway insights.'}
                  {currentSlide.type_id === 'qa' &&
                    'Address the top-upvoted audience questions first.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
