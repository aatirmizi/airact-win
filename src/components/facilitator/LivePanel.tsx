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
} from 'lucide-react';
import { LiveSlideDisplay } from './LiveSlideDisplay.js';

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
    updateSlideNotes,
    saveActivity,
  } = usePresenter();

  const [copiedLink, setCopiedLink] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'data' | 'moderation'>('data');
  const [initialTimerSeconds, setInitialTimerSeconds] = useState<number>(30);
  const [notesDraft, setNotesDraft] = useState<string>('');
  const [notesSavedNotice, setNotesSavedNotice] = useState<string>('Saved');
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

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      {/* ─────────────────────────────────────────────────────────────────
          1. TOP STATUS LINE: Important Information for Current Activity & Slide State
          ───────────────────────────────────────────────────────────────── */}
      <div className="h-14 px-5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-lg z-20 gap-4">
        {/* Left: Active Activity & Slide State */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white text-xs font-bold tracking-wider animate-pulse shrink-0">
            <Radio className="w-3.5 h-3.5" />
            <span>LIVE</span>
          </div>

          <div className="flex items-center space-x-2 text-xs truncate">
            <span className="font-extrabold text-slate-200 truncate max-w-[200px]" title={activity?.manifest.meta.name || liveState.activity_name}>
              {activity?.manifest.meta.name || liveState.activity_name || 'Active Activity'}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-indigo-400 font-bold shrink-0">
              Slide {currentSlideIndex + 1} of {slides.length}
            </span>
            <span className="capitalize text-slate-400 shrink-0 font-medium">({currentSlide.type_id})</span>
            <span className="text-slate-600">|</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-semibold uppercase shrink-0">
              Step: {liveState.current_step}
            </span>
          </div>
        </div>

        {/* Center: Live Join Link & Participant Counters */}
        <div className="hidden lg:flex items-center space-x-4 shrink-0 text-xs">
          {/* Join Info */}
          <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1 rounded-xl">
            <span className="text-slate-400">Join:</span>
            <span className="font-mono font-bold text-indigo-400">{joinUrl}</span>
            <span className="text-slate-500">·</span>
            <span className="font-mono font-extrabold text-white">Code: {liveState.join_code}</span>
            <button
              onClick={handleCopyLink}
              className="p-1 hover:text-indigo-400 text-slate-400 transition-colors cursor-pointer"
              title="Copy Join Link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Audience Counters */}
          <div className="flex items-center space-x-3 bg-slate-800/90 border border-slate-700/80 px-3 py-1 rounded-xl font-mono text-[11px]">
            <span className="flex items-center space-x-1 text-slate-300">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>{liveState.active_participants} Active</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold">{liveState.answered_count} Answered</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{liveState.stored_count} Stored</span>
          </div>
        </div>

        {/* Right: Screen Status, Open Projector & End Session */}
        <div className="flex items-center space-x-2.5 shrink-0">
          {/* Screen Status Badge */}
          {liveState.is_blanked ? (
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-950/80 text-red-400 border border-red-800 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Projector Blanked</span>
            </span>
          ) : liveState.is_frozen ? (
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-950/80 text-amber-400 border border-amber-800 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Projector Frozen</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="hidden sm:inline">Projecting Live</span>
            </span>
          )}

          <button
            onClick={handleOpenProjector}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors shadow-xs cursor-pointer"
            title="Open dedicated projector window"
          >
            <Tv className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Open Projector</span>
          </button>

          <button
            onClick={onEndPresenting}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>End Session</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          2. MAIN TWO-PANE VIEW: 60% / 40% SPLIT
          ───────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row p-3 gap-3 overflow-hidden bg-slate-950">
        {/* ═════════════════════════════════════════════════════════════════
            LEFT PANE (60%): Left-Top (Current Slide Replica) & Left-Bottom (Controls & Data)
            ═════════════════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-[60%] flex flex-col gap-3 h-full overflow-hidden min-w-0">
          {/* FRAME 1: Left-Top (Live Replica of Current Slide in Correct Aspect Ratio) */}
          <div className="h-[48%] min-h-[250px] bg-slate-900/90 rounded-2xl border border-slate-800 p-2.5 flex flex-col justify-between overflow-hidden shadow-xl relative">
            {/* Frame Sub-Header */}
            <div className="flex items-center justify-between pb-1 px-1 border-b border-slate-800/80 shrink-0">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <Tv className="w-3.5 h-3.5" />
                <span>Current Slide · Live Projector Replica</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                  {aspectRatio}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Slide {currentSlideIndex + 1}/{slides.length}
                </span>
              </div>
            </div>

            {/* Live Visual Replica of Current Slide */}
            <div className="flex-1 flex items-center justify-center overflow-hidden my-auto">
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

          {/* FRAME 2: Left-Bottom (Presenter Controls & Detailed Slide Data) */}
          <div className="h-[52%] min-h-[270px] bg-slate-900/95 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between overflow-y-auto shadow-xl space-y-3.5">
            {/* A. Primary Navigation Bar: Prev Slide, Next Step, Next Slide */}
            <div className="grid grid-cols-3 gap-2.5 shrink-0">
              <button
                onClick={prevSlide}
                disabled={currentSlideIndex === 0}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border border-slate-700 bg-slate-800/90 text-slate-200 text-xs font-semibold hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Previous Slide (PageUp)"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev Slide</span>
              </button>

              {/* Next Step / Reveal action */}
              {hasNextStep ? (
                <button
                  onClick={nextStep}
                  className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-md transition-all cursor-pointer"
                  title="Advance slide step or reveal answer (Space / Right Arrow)"
                >
                  <span>{getNextStepLabel()}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  disabled={true}
                  className="flex items-center justify-center space-x-1 py-2 px-3 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-500 text-xs font-medium opacity-40 cursor-not-allowed select-none"
                >
                  <span>No Next Step</span>
                </button>
              )}

              <button
                onClick={handleNextSlide}
                disabled={isLastSlide}
                className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer ${
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

            {/* B. Live Response, Display & Screen Controls Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {/* Accepting Responses */}
              <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-800/40 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-300">Responses</div>
                  <div className="text-[10px] text-slate-400">
                    {liveState.accepting_responses ? 'Accepting votes' : 'Closed'}
                  </div>
                </div>
                {liveState.accepting_responses ? (
                  <button
                    onClick={closeNow}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-600/90 hover:bg-amber-600 text-white transition-colors cursor-pointer"
                    title="Close responses now"
                  >
                    Close now
                  </button>
                ) : (
                  <button
                    onClick={() => toggleAccepting(true)}
                    disabled={currentSlide.type_id === 'quiz' && liveState.current_step !== 'question'}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600/90 hover:bg-emerald-600 text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Open responses again"
                  >
                    Open again
                  </button>
                )}
              </div>

              {/* Results on Projector */}
              <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-800/40 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-300">Projector Bars</div>
                  <div className="text-[10px] text-slate-400">
                    {liveState.results_visible_on_projector ? 'Showing results' : 'Hidden'}
                  </div>
                </div>
                <button
                  onClick={() => toggleResultsVisibility(!liveState.results_visible_on_projector)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    liveState.results_visible_on_projector
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                  title="Toggle live results visibility on projector screen"
                >
                  {liveState.results_visible_on_projector ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{liveState.results_visible_on_projector ? 'Live' : 'Hidden'}</span>
                </button>
              </div>

              {/* Blank & Freeze Buttons */}
              <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-800/40 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-300">Screen Output</div>
                  <div className="text-[10px] text-slate-400">
                    {liveState.is_blanked ? 'Blanked (B)' : liveState.is_frozen ? 'Frozen (F)' : 'Normal'}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setBlanked(!liveState.is_blanked)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                      liveState.is_blanked
                        ? 'bg-red-600 text-white border-red-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                    title="Blank Screen (B)"
                  >
                    Blank
                  </button>
                  <button
                    onClick={() => setFrozen(!liveState.is_frozen)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                      liveState.is_frozen
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                    title="Freeze Screen (F)"
                  >
                    Freeze
                  </button>
                </div>
              </div>
            </div>

            {/* C. Countdown Timer Controls */}
            <div className={`p-3 rounded-xl border border-slate-800 bg-slate-800/30 space-y-2 ${!isTimerApplicable ? 'opacity-40 select-none' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200">Countdown Timer</span>
                  {!isTimerApplicable && (
                    <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800">
                      Disabled on this slide
                    </span>
                  )}
                  {isTimerApplicable && liveState.remaining_seconds !== null && (
                    <span className={`text-xs font-mono font-extrabold ${liveState.timer_paused ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {liveState.remaining_seconds}s {liveState.timer_paused ? '(PAUSED)' : '(ACTIVE)'}
                    </span>
                  )}
                </div>

                {isTimerApplicable && (
                  <div className="flex items-center space-x-1.5">
                    {liveState.timer_active ? (
                      <button
                        onClick={pauseTimer}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                      >
                        <Pause className="w-3 h-3 fill-current" />
                        <span>Pause</span>
                      </button>
                    ) : liveState.timer_paused && liveState.remaining_seconds !== null && liveState.remaining_seconds > 0 ? (
                      <button
                        onClick={resumeTimer}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Resume</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setTimer(initialTimerSeconds, true)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start ({initialTimerSeconds}s)</span>
                      </button>
                    )}

                    {liveState.remaining_seconds !== null && (
                      <button
                        onClick={() => resetTimer(initialTimerSeconds)}
                        className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold cursor-pointer"
                        title="Reset timer"
                      >
                        Reset
                      </button>
                    )}

                    <button
                      onClick={() => extendTimer(30)}
                      className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold cursor-pointer flex items-center space-x-0.5"
                      title="Add 30s"
                    >
                      <Plus className="w-3 h-3" />
                      <span>30s</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Timer Duration Slider & Preset Chips */}
              {isTimerApplicable && (
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400">Duration:</span>
                    {[15, 30, 45, 60, 90].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setInitialTimerSeconds(sec)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                          initialTimerSeconds === sec
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min={5}
                      max={180}
                      step={5}
                      value={initialTimerSeconds}
                      onChange={(e) => setInitialTimerSeconds(Number(e.target.value))}
                      className="w-24 accent-indigo-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                    />
                    <span className="font-mono text-[11px] text-slate-300 font-bold">{initialTimerSeconds}s</span>
                  </div>
                </div>
              )}
            </div>

            {/* D. Deep Slide Data & Moderation Section (Data not directly shown on visual slide) */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveBottomTab('data')}
                    className={`text-xs font-bold pb-1 border-b-2 transition-colors cursor-pointer flex items-center space-x-1 ${
                      activeBottomTab === 'data'
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Detailed Slide Data & Breakdown</span>
                  </button>

                  <button
                    onClick={() => setActiveBottomTab('moderation')}
                    className={`text-xs font-bold pb-1 border-b-2 transition-colors cursor-pointer flex items-center space-x-1 ${
                      activeBottomTab === 'moderation'
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Attendees & Moderation ({responses.length})</span>
                  </button>
                </div>

                {!liveState.accepting_responses && (
                  <button
                    onClick={() => onResetSlide(currentSlide.id)}
                    className="flex items-center space-x-1 text-[11px] text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                    title="Clear responses for this slide"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Data</span>
                  </button>
                )}
              </div>

              {/* Tab 1 Content: Deep Data / Frequency Breakdown */}
              {activeBottomTab === 'data' && (
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  {/* Word Cloud Frequency Table */}
                  {currentSlide.type_id === 'wordcloud' && aggregates?.words && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1">
                        <span>Submitted Word</span>
                        <span>Frequency Count</span>
                      </div>
                      {aggregates.words.length === 0 ? (
                        <div className="text-center py-3 text-slate-500 text-xs">No words submitted yet.</div>
                      ) : (
                        <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                          {aggregates.words.map((w: any) => (
                            <div key={w.text} className="flex justify-between items-center py-0.5 text-xs">
                              <span className="font-semibold text-slate-200">"{w.text}"</span>
                              <span className="font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60">
                                {w.count} submission{w.count > 1 ? 's' : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Poll & Quiz Vote Breakdown */}
                  {(currentSlide.type_id === 'poll' || currentSlide.type_id === 'quiz') && aggregates?.options && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1">
                        <span>Option</span>
                        <span>Votes & Share</span>
                      </div>
                      <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
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
                                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950 px-1.5 rounded">
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
                    </div>
                  )}

                  {/* Open Questions Stream */}
                  {currentSlide.type_id === 'open' && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1">
                        Audience Thoughts Stream ({responses.length})
                      </div>
                      {responses.length === 0 ? (
                        <div className="text-center py-3 text-slate-500 text-xs">No responses received yet.</div>
                      ) : (
                        <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                          {responses.map((r: any) => (
                            <div key={r.id} className="p-1.5 rounded bg-slate-800/60 border border-slate-700/60 text-xs flex justify-between items-center">
                              <span className="text-slate-200 truncate pr-2">"{r.payload}"</span>
                              <span className="text-[10px] text-indigo-400 font-semibold shrink-0">
                                {r.participant_name || `Participant ${r.participant_number}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Q&A Questions List */}
                  {currentSlide.type_id === 'qa' && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1">
                        Ranked Q&A Questions
                      </div>
                      {(!aggregates?.questions || aggregates.questions.length === 0) ? (
                        <div className="text-center py-3 text-slate-500 text-xs">No audience questions yet.</div>
                      ) : (
                        <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                          {aggregates.questions.map((q: any) => (
                            <div key={q.id} className="p-1.5 rounded bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
                              <div className="truncate pr-2">
                                <span className="text-slate-200 font-semibold truncate block">{q.question}</span>
                                <span className="text-[10px] text-slate-400">by {q.author_name}</span>
                              </div>
                              <span className="font-bold text-indigo-400 text-xs shrink-0">▲ {q.upvotes}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Welcome / Content / Leaderboard Generic Data */}
                  {(currentSlide.type_id === 'welcome' || currentSlide.type_id === 'content' || currentSlide.type_id === 'leaderboard') && (
                    <div className="text-slate-400 text-xs py-1 space-y-1">
                      <div>Active Session Code: <span className="font-mono font-bold text-indigo-400">{liveState.join_code}</span></div>
                      <div>Connected Attendees: <span className="font-mono font-bold text-white">{liveState.active_participants} active</span></div>
                      <div>Total Responses Stored: <span className="font-mono font-bold text-emerald-400">{liveState.stored_count}</span></div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2 Content: Attendees & Moderation */}
              {activeBottomTab === 'moderation' && (
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  {responses.length === 0 ? (
                    <div className="text-center py-3 text-slate-500 text-xs">
                      No attendee responses submitted for this slide yet.
                    </div>
                  ) : (
                    <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                      {responses.map((resp: any) => (
                        <div
                          key={resp.id}
                          className="p-1.5 rounded border border-slate-800 bg-slate-800/40 flex items-center justify-between text-xs"
                        >
                          <div className="truncate pr-2">
                            <span className="font-semibold text-slate-200">
                              {resp.is_name_hidden ? `Participant ${resp.participant_number} (Hidden)` : (resp.participant_name || `Participant ${resp.participant_number}`)}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {resp.payload}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              onClick={() => hideParticipantName(resp.participant_id, !resp.is_name_hidden)}
                              className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                              title={resp.is_name_hidden ? 'Show Name on Screen' : 'Hide Name on Screen'}
                            >
                              <HideIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeParticipant(resp.participant_id)}
                              className="p-1 text-slate-400 hover:text-red-400 rounded cursor-pointer"
                              title="Remove Participant"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            RIGHT PANE (40%): Right-Top (Next Slide Replica) & Right-Bottom (Presenter Notes)
            ═════════════════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-[40%] flex flex-col gap-3 h-full overflow-hidden min-w-0">
          {/* FRAME 3: Right-Top (Next Slide Visual Replica) */}
          <div className="h-[48%] min-h-[250px] bg-slate-900/90 rounded-2xl border border-slate-800 p-2.5 flex flex-col justify-between overflow-hidden shadow-xl relative">
            {/* Header */}
            <div className="flex items-center justify-between pb-1 px-1 border-b border-slate-800/80 shrink-0">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <FastForward className="w-3.5 h-3.5" />
                <span>Next Slide · Upcoming</span>
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

            {/* Next Slide Preview or End Presentation Card */}
            <div className="flex-1 flex items-center justify-center overflow-hidden my-auto">
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
                <div className="my-auto flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">End of Presentation</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      This is the final slide of this activity.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FRAME 4: Right-Bottom (Presenter Notes with In-Place Editing & Cues) */}
          <div className="h-[52%] min-h-[270px] bg-slate-900/95 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between shadow-xl overflow-hidden space-y-3">
            {/* Notes Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Presenter Notes · Speaking Points</span>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                <FileText className="w-3 h-3 text-slate-500" />
                <span>{notesSavedNotice}</span>
              </div>
            </div>

            {/* In-Place Editable Notes Area */}
            <div className="flex-1 flex flex-col min-h-0">
              <textarea
                value={notesDraft}
                onChange={(e) => handleNotesChange(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Type speaker notes, talking points, key discussion questions, or reminders for this slide..."
                className="w-full flex-1 bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/60 leading-relaxed resize-none shadow-inner font-sans"
              />
            </div>

            {/* Facilitator Timing & Guidance Cues */}
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] space-y-1.5 shrink-0">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold text-slate-300">Slide Guidance Cues</span>
                <span className="font-mono text-[10px]">
                  Target time: {currentSlide.settings?.timer_seconds || 30}s
                </span>
              </div>
              <p className="text-slate-400 leading-snug">
                {currentSlide.type_id === 'welcome'
                  ? 'Warm up attendees, ensure everyone scans the QR code or opens the web link, then proceed to the opening poll.'
                  : currentSlide.type_id === 'quiz'
                  ? 'Give participants time to submit answers before clicking "Reveal Correct Answer" to build engagement.'
                  : currentSlide.type_id === 'wordcloud'
                  ? 'Highlight recurring themes as words scale up dynamically in the visual cloud.'
                  : currentSlide.type_id === 'leaderboard'
                  ? 'Celebrate top performers and recognize speedy correct submissions.'
                  : 'Encourage audience questions and discussion before stepping forward.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
