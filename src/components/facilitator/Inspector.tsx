import React, { useState } from 'react';
import { usePresenter } from '../../context/PresenterContext.js';
import {
  Clock,
  Eye,
  Smartphone,
  Shield,
  FileText,
  Palette,
  Check,
  Zap,
  Sparkles,
  HelpCircle,
  BarChart2,
  Cloud,
  MessageSquare,
  MessagesSquare,
  Trophy,
  RotateCcw,
  RotateCw,
  ArrowLeft,
  QrCode
} from 'lucide-react';
import { availableThemes } from '../../utils/themes.js';

export const Inspector: React.FC = () => {
  const {
    activity,
    selectedSlide,
    updateSlideSettings,
    updateSlideContent,
    updateSlideNotes,
    updateTheme,
    liveState,
    canUndo,
    canRedo,
    undo,
    redo,
    inspectorTab,
    setInspectorTab,
  } = usePresenter();

  const [themeFilter, setThemeFilter] = useState<'all' | 'light' | 'dark' | 'textured'>('all');

  if (!activity) return null;

  const isLive = liveState?.is_live;

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. THEME & STYLE MODE (When user clicked Theme button on the top line)
  // ─────────────────────────────────────────────────────────────────────────────
  if (inspectorTab === 'theme') {
    return (
      <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden select-none shrink-0 shadow-lg animate-in fade-in">
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
              <Palette className="w-3 h-3" />
              <span>Theme & Style Settings</span>
            </span>

            <button
              onClick={() => setInspectorTab('slide')}
              className="flex items-center space-x-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              title="Return to Slide Configuration"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Slide</span>
            </button>
          </div>

          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Activity Presentation Theme
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Applied uniformly to projector slides, live poll walls, and participant devices.
          </p>

          {/* Theme Category Filter Tabs */}
          <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-200/80 dark:bg-slate-800 rounded-lg text-[10px] font-semibold text-slate-600 dark:text-slate-400 mt-3">
            {(['all', 'light', 'dark', 'textured'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setThemeFilter(tab)}
                className={`py-1 rounded-md capitalize transition-all cursor-pointer ${
                  themeFilter === tab
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Themes Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {availableThemes
            .filter((th) => {
              if (themeFilter === 'light') return th.category === 'light';
              if (themeFilter === 'dark') return th.category === 'dark';
              if (themeFilter === 'textured') return th.texture && th.texture !== 'none';
              return true;
            })
            .map((th) => {
              const isSelected = activity.theme?.name === th.name;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() =>
                    updateTheme({
                      name: th.name,
                      palette: th.palette,
                      texture: th.texture,
                      is_light: th.is_light,
                      fonts: th.fonts,
                    })
                  }
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850 hover:shadow-2xs'
                  }`}
                  title={`${th.name}: ${th.description}`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Visual Color Preview Box */}
                    <div
                      className="w-8 h-8 rounded-lg border border-black/10 dark:border-white/20 shadow-xs shrink-0 flex items-center justify-center relative overflow-hidden"
                      style={{ backgroundColor: th.palette.background }}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-2xs"
                        style={{ backgroundColor: th.palette.accent }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {th.name}
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-bold tracking-wider shrink-0">
                          {th.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {th.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isSelected ? (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : th.texture && th.texture !== 'none' ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold">
                        {th.texture}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/40 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
          <span>Active: <strong className="text-slate-800 dark:text-slate-200">{activity.theme?.name}</strong></span>
          <button
            onClick={() => setInspectorTab('slide')}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
          >
            Done
          </button>
        </div>
      </aside>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. SLIDE CONFIGURATION MODE (Standard mode for all slides)
  // ─────────────────────────────────────────────────────────────────────────────
  if (!selectedSlide) return null;

  const typeId = selectedSlide.type_id;
  const settings = selectedSlide.settings || {};
  const content = selectedSlide.content as any;

  const isWelcome = typeId === 'welcome';
  const isPoll = typeId === 'poll';
  const isQuiz = typeId === 'quiz';
  const isWordCloud = typeId === 'wordcloud';
  const isOpen = typeId === 'open';
  const isQA = typeId === 'qa';
  const isLeaderboard = typeId === 'leaderboard';
  const isContent = typeId === 'content';

  const hasResponseMode = isPoll || isQuiz || isWordCloud || isOpen;
  const hasClosePolicy = isPoll || isQuiz || isWordCloud || isOpen || isQA;
  const hasTimer = isPoll || isQuiz || isWordCloud || isOpen || isQA;

  return (
    <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-y-auto p-4 space-y-5 select-none shrink-0">
      {/* Header & Slide Type Badge */}
      <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Slide Configuration
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize flex items-center space-x-1.5 mt-0.5">
            {typeId === 'welcome' && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            {typeId === 'poll' && <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />}
            {typeId === 'quiz' && <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />}
            {typeId === 'wordcloud' && <Cloud className="w-3.5 h-3.5 text-sky-500" />}
            {typeId === 'open' && <MessageSquare className="w-3.5 h-3.5 text-purple-500" />}
            {typeId === 'qa' && <MessagesSquare className="w-3.5 h-3.5 text-pink-500" />}
            {typeId === 'leaderboard' && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
            {typeId === 'content' && <FileText className="w-3.5 h-3.5 text-slate-500" />}
            <span>{typeId === 'welcome' ? 'Welcome & Join Screen' : `${typeId} Slide`}</span>
          </span>
        </div>

        {/* Undo / Redo in Inspector */}
        <div className="flex items-center space-x-1.5">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-md p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`p-1 rounded transition-colors ${
                canUndo
                  ? 'hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs'
                  : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`p-1 rounded transition-colors ${
                canRedo
                  ? 'hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs'
                  : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <RotateCw className="w-3 h-3" />
            </button>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
            v1.0
          </span>
        </div>
      </div>

      {/* 1. Welcome Slide Specific Settings */}
      {isWelcome && (
        <div className="space-y-3">
          <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2">
            <QrCode className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              This welcome slide presents the QR code, title, presenter name, and join URL. Participants can join the session here.
            </p>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Show Join Instructions on Screen
              </span>
              <span className="text-[10px] text-slate-400">
                Displays live QR code and room web address
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.participant_visibility !== false}
              onChange={(e) => updateSlideSettings({ participant_visibility: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* 2. Informational Slide Banner (Content) */}
      {isContent && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-start space-x-2">
          <FileText className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            Informational slide for presentation key points. Content is displayed clearly on the big screen.
          </p>
        </div>
      )}

      {/* 3. Leaderboard Info Banner */}
      {isLeaderboard && (
        <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2">
          <Trophy className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            Leaderboard accumulates scores and speed bonuses from all quiz questions in this activity.
          </p>
        </div>
      )}

      {/* 4. Response Mode (Only on interactive slides: Poll, Quiz, Word Cloud, Open) */}
      {hasResponseMode && (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-500" />
            <span>Response Mode</span>
          </label>
          <select
            value={settings.response_mode || (isQuiz ? 'identified' : 'anonymous')}
            onChange={(e) => updateSlideSettings({ response_mode: e.target.value })}
            disabled={isLive}
            className="w-full text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-50"
          >
            <option value="anonymous">Anonymous (No attendee name linked)</option>
            <option value="identified">Identified (Display name attached)</option>
          </select>
          {isQuiz && settings.response_mode === 'anonymous' && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400">
              Note: Identified mode is recommended for quizzes to track scores on the leaderboard.
            </p>
          )}

          {/* Response Rule for Poll */}
          {isPoll && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Voting Rule
              </label>
              <select
                value={settings.response_rule || 'one_per_participant'}
                onChange={(e) => updateSlideSettings({ response_rule: e.target.value })}
                disabled={isLive}
                className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-50"
              >
                <option value="one_per_participant">One vote per participant (Locked)</option>
                <option value="replace_until_closed">Replace vote until closed</option>
              </select>
            </div>
          )}

          {/* Response Rule for Open Question */}
          {isOpen && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Submission Limit
              </label>
              <select
                value={settings.response_rule || 'multiple'}
                onChange={(e) => updateSlideSettings({ response_rule: e.target.value })}
                disabled={isLive}
                className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-50"
              >
                <option value="multiple">Allow multiple thoughts per participant</option>
                <option value="one_per_participant">Single submission per participant</option>
              </select>
            </div>
          )}

          {/* Max Entries for Word Cloud */}
          {isWordCloud && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Words per Participant
              </label>
              <select
                value={content.max_entries_per_user || 3}
                onChange={(e) => updateSlideContent({ max_entries_per_user: Number(e.target.value) })}
                disabled={isLive}
                className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-50"
              >
                <option value={1}>1 word / phrase</option>
                <option value={2}>Up to 2 words</option>
                <option value={3}>Up to 3 words (Default)</option>
                <option value={5}>Up to 5 words</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* 5. Audience Q&A specific settings */}
      {isQA && (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <MessagesSquare className="w-3.5 h-3.5 text-pink-500" />
            <span>Q&A Settings</span>
          </label>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block">
                Allow Anonymous Questions
              </span>
              <span className="text-[10px] text-slate-400">
                Attendees can submit without their name
              </span>
            </div>
            <input
              type="checkbox"
              checked={content.allow_anonymous !== false}
              onChange={(e) => updateSlideContent({ allow_anonymous: e.target.checked })}
              disabled={isLive}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* 6. Speed Bonus (Quiz Question only) */}
      {isQuiz && (
        <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-900/40 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Speed Bonus</span>
            </label>
            <input
              type="checkbox"
              checked={settings.speed_bonus !== false}
              onChange={(e) => updateSlideSettings({ speed_bonus: e.target.checked })}
              disabled={isLive}
              className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
            />
          </div>
          <p className="text-[10px] text-amber-700/80 dark:text-amber-300/80">
            Faster correct answers earn up to 50% extra points based on remaining timer.
          </p>
        </div>
      )}

      {/* 7. Close Policy */}
      {hasClosePolicy && (
        <div className="space-y-3 pt-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Close Policy</span>
          </label>
          <select
            value={settings.close_policy?.mode || 'immediate'}
            onChange={(e) =>
              updateSlideSettings({
                close_policy: {
                  mode: e.target.value,
                  grace_seconds:
                    e.target.value === 'grace' ? settings.close_policy?.grace_seconds || 5 : undefined,
                },
              })
            }
            disabled={isLive}
            className="w-full text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-50"
          >
            <option value="immediate">Immediate Cutoff (Instant lock)</option>
            <option value="grace">Grace Period (Closing countdown)</option>
          </select>

          {settings.close_policy?.mode === 'grace' && (
            <div className="flex items-center space-x-2 pt-1">
              <span className="text-xs text-slate-500">Grace duration:</span>
              <input
                type="number"
                min={1}
                max={10}
                value={settings.close_policy.grace_seconds || 5}
                onChange={(e) =>
                  updateSlideSettings({
                    close_policy: { mode: 'grace', grace_seconds: Number(e.target.value) },
                  })
                }
                disabled={isLive}
                className="w-16 px-2 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <span className="text-xs text-slate-400">sec</span>
            </div>
          )}
        </div>
      )}

      {/* 8. Slide Timer */}
      {hasTimer && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Slide Response Timer
            </label>
            <input
              type="checkbox"
              checked={Boolean(settings.timer_seconds && settings.timer_seconds > 0)}
              onChange={(e) =>
                updateSlideSettings({ timer_seconds: e.target.checked ? (isQuiz ? 20 : 30) : null })
              }
              disabled={isLive}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
          {settings.timer_seconds && settings.timer_seconds > 0 ? (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min={5}
                max={600}
                step={5}
                value={settings.timer_seconds}
                onChange={(e) => updateSlideSettings({ timer_seconds: Number(e.target.value) })}
                disabled={isLive}
                className="w-24 px-2 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <span className="text-xs text-slate-400">seconds</span>
            </div>
          ) : null}
        </div>
      )}

      {/* 9. Visibility Settings */}
      {!isWelcome && (
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                <span>Show on Phones</span>
              </label>
              <input
                type="checkbox"
                checked={settings.participant_visibility !== false}
                onChange={(e) => updateSlideSettings({ participant_visibility: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              When unchecked, attendee phones show "Look at the main screen".
            </p>
          </div>

          {(isPoll || isQuiz || isWordCloud || isOpen) && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Results on Projector</span>
                </label>
                <select
                  value={settings.results_visibility || 'live'}
                  onChange={(e) => updateSlideSettings({ results_visibility: e.target.value })}
                  className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="live">Live (as audience votes)</option>
                  <option value="hidden">Hidden until revealed</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-400">
                Hide results to prevent audience herd voting bias.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 10. Speaker Notes */}
      <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Speaker Notes</span>
          </label>
          <span className="text-[10px] text-slate-400">
            {(selectedSlide.notes || '').length} / 5000
          </span>
        </div>
        <textarea
          value={selectedSlide.notes || ''}
          onChange={(e) => updateSlideNotes(e.target.value.slice(0, 5000))}
          rows={3}
          placeholder="Private facilitator notes for this slide..."
          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
    </aside>
  );
};
