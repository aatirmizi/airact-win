import React, { useState, useEffect } from 'react';
import { usePresenter } from '../../../context/PresenterContext.js';
import { JoinMode, Settings } from '../../../types/activity.js';
import {
  Sliders,
  Users,
  Shield,
  Trophy,
  Zap,
  Globe,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Save
} from 'lucide-react';

export const SessionDefaultsView: React.FC = () => {
  const { activity, updateActivitySettings, saveActivity, setActiveView } = usePresenter();
  const currentSettings = activity?.settings || {
    content_language: 'en',
    quiz_preset: 'learning',
    speed_bonus_enabled: true,
    show_correct_to_participants: true,
    show_explanation_to_participants: true,
    show_score_to_participants: true,
    join_mode: 'anonymous',
    participant_limit: 200,
    start_point: 'beginning',
  };

  const [settings, setSettings] = useState<Settings>(currentSettings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (activity?.settings) {
      setSettings(activity.settings);
    }
  }, [activity?.settings]);

  const handleChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    updateActivitySettings({ [key]: value });
  };

  const handleSave = async () => {
    updateActivitySettings(settings);
    await saveActivity();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Session Defaults & Configuration</h1>
                {savedSuccess && (
                  <span className="flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Saved</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure global defaults for participant admission, quiz scoring, and presentation behaviors
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveView('slides')}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Slides</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Defaults</span>
            </button>
          </div>
        </div>

        {/* 1. Admission & Join Mode Card */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Participant Admission & Join Mode</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Control how audience members enter live sessions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Anonymous */}
            <div
              onClick={() => handleChange('join_mode', 'anonymous')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                settings.join_mode === 'anonymous'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Anonymous Join</span>
                  {settings.join_mode === 'anonymous' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Fastest entry. Participants join instantly with zero login or setup. Ideal for quick surveys and town halls.
                </p>
              </div>
            </div>

            {/* Display Name */}
            <div
              onClick={() => handleChange('join_mode', 'display_name')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                settings.join_mode === 'display_name'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Display Name</span>
                  {settings.join_mode === 'display_name' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Participants type their name or handle when joining. Names appear on leaderboards and Q&A boards.
                </p>
              </div>
            </div>

            {/* Roster Only */}
            <div
              onClick={() => handleChange('join_mode', 'roster')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                settings.join_mode === 'roster'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Roster PIN Required</span>
                  {settings.join_mode === 'roster' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Highest security. Participants must enter their pre-assigned ID and 8-character PIN matching the session roster.
                </p>
              </div>
            </div>
          </div>

          {/* Participant limit & start point */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Participant Capacity Limit
              </label>
              <select
                value={settings.participant_limit || 200}
                onChange={(e) => handleChange('participant_limit', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value={50}>50 attendees</option>
                <option value={100}>100 attendees</option>
                <option value={200}>200 attendees (Standard)</option>
                <option value={500}>500 attendees</option>
                <option value={1000}>1,000 attendees</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Live Broadcast Starting Slide
              </label>
              <select
                value={settings.start_point || 'beginning'}
                onChange={(e) => handleChange('start_point', e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="beginning">Always start from Slide 1 (Welcome)</option>
                <option value="selected">Start from currently selected slide</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Quiz & Polling Rules Card */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quiz Scoring & Participant Feedback</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Defaults for gamification, speed bonuses, and result displays</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Speed bonus */}
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-900 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Speed Bonus Points</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Awards up to +200 additional points to participants who submit correct answers rapidly
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.speed_bonus_enabled ?? true}
                onChange={(e) => handleChange('speed_bonus_enabled', e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </label>

            {/* Show correct answers */}
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-900 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Show Correct Answer to Participants</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Displays whether their choice was correct immediately upon slide reveal
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.show_correct_to_participants ?? true}
                onChange={(e) => handleChange('show_correct_to_participants', e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </label>

            {/* Show explanations */}
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-900 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Show Explanations to Participants</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Transmits educational explanations directly to mobile phone screens after answers are locked
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.show_explanation_to_participants ?? true}
                onChange={(e) => handleChange('show_explanation_to_participants', e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* 3. Language & Internationalization */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Language & Localization</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Set content language for activity metadata</p>
            </div>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Default Content Language
            </label>
            <select
              value={settings.content_language || 'en'}
              onChange={(e) => handleChange('content_language', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="en">English (US/UK)</option>
              <option value="es">Español (Spanish)</option>
              <option value="fr">Français (French)</option>
              <option value="de">Deutsch (German)</option>
              <option value="ar">العربية (Arabic)</option>
              <option value="zh">中文 (Chinese)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
