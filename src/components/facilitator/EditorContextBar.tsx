import React, { useState } from 'react';
import { usePresenter } from '../../context/PresenterContext.js';
import { SlideTypeId } from '../../types/activity.js';
import {
  RotateCcw,
  RotateCw,
  Plus,
  Palette,
  Check,
  Edit3,
  BarChart2,
  HelpCircle,
  Trophy,
  Cloud,
  MessageSquare,
  MessagesSquare,
  FileText,
  Sparkles,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';

export const EditorContextBar: React.FC = () => {
  const {
    activity,
    undo,
    redo,
    canUndo,
    canRedo,
    addSlide,
    liveState,
    inspectorTab,
    setInspectorTab,
    saveActivity,
  } = usePresenter();

  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  if (!activity) return null;

  const isLive = liveState?.is_live;
  const slideCount = activity.slides.length;
  const activityName = activity.manifest?.meta?.name || 'Untitled Presentation';
  const themeName = activity.theme?.name || 'Default Theme';

  const handleTitleSubmit = () => {
    if (!titleDraft.trim()) {
      setIsEditingTitle(false);
      return;
    }
    activity.manifest.meta.name = titleDraft.trim();
    saveActivity();
    setIsEditingTitle(false);
  };

  const slideTypes: Array<{ id: SlideTypeId; label: string; icon: any; desc: string }> = [
    { id: 'welcome', label: 'Welcome / Join Slide', icon: Sparkles, desc: 'Title, presenter info, QR & branding' },
    { id: 'poll', label: 'Multiple Choice Poll', icon: BarChart2, desc: 'Single choice audience poll' },
    { id: 'quiz', label: 'Quiz Question', icon: HelpCircle, desc: 'Correct option & points' },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, desc: 'Scores & podium rank' },
    { id: 'wordcloud', label: 'Word Cloud', icon: Cloud, desc: 'Live keyword aggregation' },
    { id: 'open', label: 'Open Question', icon: MessageSquare, desc: 'Audience free text' },
    { id: 'qa', label: 'Audience Q&A', icon: MessagesSquare, desc: 'Upvoted questions' },
    { id: 'content', label: 'Content Slide', icon: FileText, desc: 'Informational layouts' },
  ];

  return (
    <div className="h-11 px-4 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between shrink-0 select-none text-xs">
      {/* Left: Slides count, Undo/Redo, Add Slide */}
      <div className="flex items-center space-x-3">
        {/* SLIDES (n) */}
        <div className="flex items-center space-x-1.5 font-bold text-slate-700 dark:text-slate-300">
          <span className="uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400">
            Slides
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-mono">
            {slideCount}
          </span>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center bg-white dark:bg-slate-800 rounded-md p-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-1 rounded transition-colors ${
              canUndo
                ? 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer'
                : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-1 rounded transition-colors ${
              canRedo
                ? 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer'
                : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* + Add Slide Dropdown */}
        <div className="relative">
          <button
            onClick={() => setAddDropdownOpen(!addDropdownOpen)}
            disabled={isLive}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title={isLive ? 'Locked while live' : 'Add new slide'}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Slide</span>
            <ChevronDown className="w-3 h-3 text-indigo-200 ml-0.5" />
          </button>

          {addDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-60 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 py-1.5 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Slide Type
              </div>
              {slideTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    addSlide(t.id);
                    setAddDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                >
                  <t.icon className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">{t.label}</div>
                    <div className="text-[10px] text-slate-400">{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Suitable distance separator */}
        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Activity: [Name] Editable Box in Arial Font */}
        <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1 rounded-lg shadow-2xs group">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 select-none">
            Activity:
          </span>
          {isEditingTitle ? (
            <div className="flex items-center space-x-1">
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                autoFocus
                style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                className="bg-transparent text-slate-900 dark:text-white px-1.5 py-0.5 rounded border border-indigo-500 text-xs font-bold outline-none w-44 tracking-tight"
              />
              <button
                onClick={handleTitleSubmit}
                className="p-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                title="Save title"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => {
                if (!isLive) {
                  setTitleDraft(activityName);
                  setIsEditingTitle(true);
                }
              }}
              className={`flex items-center space-x-1.5 text-slate-800 dark:text-slate-100 max-w-[240px] truncate ${
                !isLive ? 'cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400' : ''
              }`}
              title={!isLive ? 'Click to rename activity' : undefined}
            >
              <span
                style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                className="font-bold text-xs truncate"
              >
                {activityName}
              </span>
              {!isLive && (
                <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
              )}
            </div>
          )}
        </div>

        {/* Theme Applied Pill OR Back to Slide Configuration Button */}
        {inspectorTab === 'theme' ? (
          <button
            onClick={() => setInspectorTab('slide')}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer animate-in fade-in"
            title="Click to return to Slide Configuration"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Slide Configuration</span>
          </button>
        ) : (
          <button
            onClick={() => setInspectorTab('theme')}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-2xs cursor-pointer group"
            title="Click to change activity theme & styling in sidebar"
          >
            <Palette className="w-3.5 h-3.5 text-indigo-500 group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] uppercase font-bold text-indigo-500 dark:text-indigo-400">Theme:</span>
            <span className="font-bold text-xs truncate max-w-[140px]">{themeName}</span>
          </button>
        )}
      </div>

      {/* Right side helper info */}
      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
        {inspectorTab === 'theme' ? (
          <span className="text-indigo-500 font-semibold">Customizing Theme & Style</span>
        ) : (
          <span>Click theme to customize</span>
        )}
      </div>
    </div>
  );
};
