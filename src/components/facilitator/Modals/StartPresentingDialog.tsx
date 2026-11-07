import React, { useState, useEffect } from 'react';
import { usePresenter } from '../../../context/PresenterContext.js';
import { Play, X, Users, Globe, ShieldCheck, Zap, Settings as SettingsIcon, Save } from 'lucide-react';
import { JoinMode } from '../../../types/activity.js';

interface StartPresentingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StartPresentingDialog: React.FC<StartPresentingDialogProps> = ({ isOpen, onClose }) => {
  const {
    activity,
    selectedSlideIndex,
    startPresenting,
    updateActivitySettings,
    networkStatus,
    setIsNetworkModalOpen,
  } = usePresenter();

  const [startPoint, setStartPoint] = useState<'beginning' | 'selected'>('beginning');
  const [joinMode, setJoinMode] = useState<JoinMode>('display_name');
  const [limit, setLimit] = useState<number>(200);
  const [speedBonus, setSpeedBonus] = useState<boolean>(true);
  const [quizPreset, setQuizPreset] = useState<'learning' | 'competitive' | 'custom'>('learning');
  const [isLoading, setIsLoading] = useState(false);

  // Sync state from stored activity settings whenever dialog opens
  useEffect(() => {
    if (activity?.settings && isOpen) {
      if (activity.settings.start_point) setStartPoint(activity.settings.start_point);
      if (activity.settings.join_mode) setJoinMode(activity.settings.join_mode);
      if (activity.settings.participant_limit) setLimit(activity.settings.participant_limit);
      if (activity.settings.speed_bonus_enabled !== undefined) {
        setSpeedBonus(activity.settings.speed_bonus_enabled);
      }
      if (activity.settings.quiz_preset) setQuizPreset(activity.settings.quiz_preset);
    }
  }, [activity?.settings, isOpen]);

  if (!isOpen || !activity) return null;

  const saveSettingsToActivity = () => {
    updateActivitySettings({
      start_point: startPoint,
      join_mode: joinMode,
      participant_limit: limit,
      speed_bonus_enabled: speedBonus,
      quiz_preset: quizPreset,
    });
  };

  const handleStart = async () => {
    setIsLoading(true);
    // Store settings in activity permanently so they persist unless changed
    saveSettingsToActivity();

    const startIdx = startPoint === 'beginning' ? 0 : selectedSlideIndex;
    const code = await startPresenting(startIdx, joinMode, limit);
    setIsLoading(false);
    if (code) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 select-none max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                General Activity Setup & Go Live
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure session parameters before presenting. Settings are saved to this activity.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Start Point */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Starting Slide
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStartPoint('beginning')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  startPoint === 'beginning'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                First Slide (Slide 1)
              </button>
              <button
                type="button"
                onClick={() => setStartPoint('selected')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  startPoint === 'selected'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Current Slide ({selectedSlideIndex + 1})
              </button>
            </div>
          </div>

          {/* Join Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Participant Join Mode
            </label>
            <div className="space-y-2">
              <label
                onClick={() => setJoinMode('display_name')}
                className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  joinMode === 'display_name'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Display Name (Recommended)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Participants enter a display name. Perfect for live quizzes, leaderboards, and Q&A.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setJoinMode('anonymous')}
                className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  joinMode === 'anonymous'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Completely Anonymous
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    No names collected. Fastest joining for anonymous team check-ins or sensitive polls.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setJoinMode('roster')}
                className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  joinMode === 'roster'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Roster Login (Participant ID + 8-Character PIN)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Enforces registered roster IDs and PINs (4 letters + 4 digits). Official workshop attendance.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Participant Capacity Limit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Participant Capacity Limit
              </label>
              <input
                type="number"
                min={1}
                max={2000}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quiz Preset
              </label>
              <select
                value={quizPreset}
                onChange={(e) => setQuizPreset(e.target.value as any)}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="learning">Learning (Reveals & stats shown)</option>
                <option value="competitive">Competitive (Strict timer & podium)</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          {/* Speed Bonus Toggle */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Quiz Speed Bonus
                </div>
                <div className="text-[10px] text-slate-400">
                  Awards bonus score points to participants who submit correct answers faster.
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={speedBonus}
              onChange={(e) => setSpeedBonus(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>

          <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-300 flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="truncate">
                <span>Join URL: </span>
                <span className="font-mono font-bold">{networkStatus?.appUrl || 'Auto-detected Network'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsNetworkModalOpen(true);
              }}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 ml-2 cursor-pointer"
            >
              Network Helper →
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              saveSettingsToActivity();
              onClose();
            }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Save these settings without starting yet"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings Only</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStart}
              disabled={isLoading}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isLoading ? 'Starting...' : 'Start Presenting Live'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
