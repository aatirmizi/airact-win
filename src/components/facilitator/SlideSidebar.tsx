import React, { useState } from 'react';
import { usePresenter } from '../../context/PresenterContext.js';
import { SlideTypeId } from '../../types/activity.js';
import {
  BarChart2,
  HelpCircle,
  Trophy,
  Cloud,
  MessageSquare,
  MessagesSquare,
  FileText,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Lock,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  RotateCw,
} from 'lucide-react';

export const SlideSidebar: React.FC = () => {
  const {
    activity,
    selectedSlideIndex,
    setSelectedSlideIndex,
    addSlide,
    deleteSlide,
    duplicateSlide,
    reorderSlides,
    liveState,
    canUndo,
    canRedo,
    undo,
    redo,
  } = usePresenter();

  const [addDropdownOpen, setAddDropdownOpen] = useState(false);

  if (!activity) return null;

  const isLive = liveState?.is_live;

  const getSlideIcon = (type: SlideTypeId) => {
    switch (type) {
      case 'welcome':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'poll':
        return <BarChart2 className="w-4 h-4 text-indigo-500" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-emerald-500" />;
      case 'leaderboard':
        return <Trophy className="w-4 h-4 text-amber-500" />;
      case 'wordcloud':
        return <Cloud className="w-4 h-4 text-sky-500" />;
      case 'open':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'qa':
        return <MessagesSquare className="w-4 h-4 text-pink-500" />;
      case 'content':
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  const checkSlideCompleteness = (slide: any): { ready: boolean; error?: string } => {
    if (slide.type_id === 'poll' || slide.type_id === 'quiz') {
      const q = slide.content.question?.trim();
      if (!q) return { ready: false, error: 'Missing question' };
      const opts = slide.content.options || [];
      if (opts.length < 2) return { ready: false, error: 'Need at least 2 options' };
      for (let i = 0; i < opts.length; i++) {
        if (!opts[i].text?.trim()) return { ready: false, error: `Option ${i + 1} text empty` };
      }
      if (slide.type_id === 'quiz' && !slide.content.correct_option_id) {
        return { ready: false, error: 'Select correct option' };
      }
    } else if (slide.type_id === 'content' || slide.type_id === 'welcome') {
      if (!slide.content.title?.trim()) return { ready: false, error: 'Missing title' };
    }
    return { ready: true };
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
    <aside className="w-64 bg-slate-50 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full select-none shrink-0">
      {/* Slide Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activity.slides.map((slide, index) => {
          const isSelected = selectedSlideIndex === index;
          const status = checkSlideCompleteness(slide);
          const title =
            (slide.content as any).question || (slide.content as any).title || `Slide ${index + 1}`;

          // Find stored count if liveState available
          const summaryItem = liveState?.slides_summary?.find((s: any) => s.id === slide.id);
          const storedResponses = summaryItem?.stored_responses || 0;

          return (
            <div
              key={slide.id}
              onClick={() => setSelectedSlideIndex(index)}
              className="group relative flex items-start space-x-2.5 cursor-pointer"
            >
              {/* Slide Index Number */}
              <div className="w-5 pt-1 text-right shrink-0">
                <span className={`text-xs font-mono font-bold tabular-nums transition-colors ${
                  isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {index + 1}
                </span>
              </div>

              {/* 16:9 Slide Thumbnail Box */}
              <div
                className={`flex-1 rounded-xl border p-2.5 transition-all flex flex-col justify-between aspect-16/10 relative overflow-hidden ${
                  isSelected
                    ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-sm ring-2 ring-indigo-500/30'
                    : 'bg-white/75 dark:bg-slate-800/50 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                {/* Thumbnail Header: Type Badge & Status */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <div className="p-0.5 rounded bg-slate-100 dark:bg-slate-700/80 shrink-0">
                      {getSlideIcon(slide.type_id)}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                      {slide.type_id}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {storedResponses > 0 && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800">
                        {storedResponses}
                      </span>
                    )}
                    {status.ready ? (
                      <span title="Ready to present">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      </span>
                    ) : (
                      <span title={status.error}>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Thumbnail Title / Question */}
                <div className="flex-1 my-1">
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">
                    {title}
                  </p>
                </div>

                {/* Incomplete warning banner */}
                {!status.ready && (
                  <div className="text-[9px] font-medium text-amber-600 dark:text-amber-400 truncate">
                    {status.error}
                  </div>
                )}

                {/* Hidden on phones indicator */}
                {slide.settings.participant_visibility === false && (
                  <div className="text-[9px] text-slate-400 font-medium">
                    Screen-only
                  </div>
                )}

                {/* Hover Action Strip */}
                {!isLive && (
                  <div className="absolute right-1.5 top-1.5 hidden group-hover:flex items-center space-x-0.5 bg-white/95 dark:bg-slate-900/95 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-md backdrop-blur-xs z-10 animate-in fade-in-50 zoom-in-95">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (index > 0) reorderSlides(index, index - 1);
                      }}
                      disabled={index === 0}
                      className="p-1 text-slate-500 hover:text-indigo-600 disabled:opacity-20 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Move slide up"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (index < activity.slides.length - 1) reorderSlides(index, index + 1);
                      }}
                      disabled={index === activity.slides.length - 1}
                      className="p-1 text-slate-500 hover:text-indigo-600 disabled:opacity-20 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Move slide down"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateSlide(index);
                      }}
                      className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Duplicate slide"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSlide(index);
                      }}
                      disabled={activity.slides.length <= 1}
                      className="p-1 text-slate-500 hover:text-red-600 disabled:opacity-20 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Delete slide"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Select to edit</span>
        {isLive && (
          <span className="flex items-center space-x-1 text-amber-500 font-medium">
            <Lock className="w-3 h-3" />
            <span>Live locked</span>
          </span>
        )}
      </div>
    </aside>
  );
};
