import React, { useState } from 'react';
import { usePresenter } from '../../../context/PresenterContext.js';
import { activityTemplates, ActivityTemplate } from '../../../utils/templates.js';
import {
  LayoutTemplate,
  Check,
  ArrowRight,
  Sparkles,
  Layers,
  FilePlus,
  AlertTriangle,
  ChevronRight,
  BarChart2,
  HelpCircle,
  Trophy,
  Cloud,
  MessageSquare,
  MessagesSquare,
  FileText
} from 'lucide-react';

export const TemplateGalleryView: React.FC = () => {
  const { loadTemplate, newActivity, liveState, isDirty, setActiveView } = usePresenter();
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate>(activityTemplates[0]);
  const [confirmReplace, setConfirmReplace] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Candidate categories to check against templates
  const allCandidateCategories = ['Workshop', 'Training', 'Meeting', 'Education', 'Feedback', 'Quiz'];
  
  // Only display categories for which we currently have templates
  const categories = [
    'all',
    ...allCandidateCategories.filter((cat) =>
      activityTemplates.some((t) =>
        (t.categories || [t.category]).some((c) => c.toLowerCase() === cat.toLowerCase())
      )
    ),
  ];

  // Filter templates: matches if 'all' or if template categories include the selected category
  const filteredTemplates =
    selectedCategory === 'all'
      ? activityTemplates
      : activityTemplates.filter((t) =>
          (t.categories || [t.category]).some(
            (c) => c.toLowerCase() === selectedCategory.toLowerCase()
          )
        );

  const handleApplyTemplate = async () => {
    if (liveState?.is_live) return;
    await loadTemplate(selectedTemplate.createActivity());
    setConfirmReplace(false);
    setActiveView('slides');
  };

  const handleBlankSlate = async () => {
    if (liveState?.is_live) return;
    if (isDirty) {
      if (!window.confirm('You have unsaved changes in your current presentation. Create a new blank activity anyway?')) {
        return;
      }
    }
    await newActivity();
    setActiveView('slides');
  };

  const getSlideIcon = (typeId: string) => {
    switch (typeId) {
      case 'welcome': return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
      case 'poll': return <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />;
      case 'quiz': return <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />;
      case 'leaderboard': return <Trophy className="w-3.5 h-3.5 text-amber-500" />;
      case 'wordcloud': return <Cloud className="w-3.5 h-3.5 text-sky-500" />;
      case 'open': return <MessageSquare className="w-3.5 h-3.5 text-purple-500" />;
      case 'qa': return <MessagesSquare className="w-3.5 h-3.5 text-pink-500" />;
      default: return <FileText className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  // Generate preview of slides for selected template
  const previewActivity = selectedTemplate.createActivity();

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Left Main Scrollable Area: Filters & Template Cards */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 border-r border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                <LayoutTemplate className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white">Template Gallery & Sample Workshops</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80">
                    {activityTemplates.length} Ready Decks
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select a template to view details in the preview sidebar, or start from scratch.
                </p>
              </div>
            </div>

            <button
              onClick={handleBlankSlate}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 text-xs font-bold text-indigo-700 dark:text-indigo-300 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>New Blank Activity</span>
            </button>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {categories.map((cat) => {
              const count = cat === 'all'
                ? activityTemplates.length
                : activityTemplates.filter((t) =>
                    (t.categories || [t.category]).some((c) => c.toLowerCase() === cat.toLowerCase())
                  ).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer flex items-center space-x-1.5 ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedCategory === cat
                      ? 'bg-indigo-500/80 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((tmpl) => {
              const isSelected = selectedTemplate.id === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    setSelectedTemplate(tmpl);
                    setConfirmReplace(false);
                  }}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'border-indigo-600 bg-white dark:bg-slate-900 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: tmpl.color?.startsWith('from-') ? undefined : tmpl.color }}
                        />
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                          {tmpl.name}
                        </h3>
                      </div>
                      {isSelected && (
                        <span className="p-1 rounded-full bg-indigo-600 text-white shrink-0">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap gap-1">
                      {(tmpl.categories || [tmpl.category]).map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold"
                        >
                          {c}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <span className="flex items-center space-x-1 font-mono">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>{tmpl.slideCount} slides</span>
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center space-x-0.5">
                        <span>Preview in sidebar</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Sidebar: Dedicated Sticky Template Preview */}
      <aside className="w-96 md:w-[420px] bg-white dark:bg-slate-900 flex flex-col h-full shrink-0 shadow-lg select-none">
        {/* Preview Sidebar Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Template Preview
            </span>
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
              {selectedTemplate.slideCount} slides
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
            {selectedTemplate.name}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
            {selectedTemplate.description}
          </p>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {(selectedTemplate.categories || [selectedTemplate.category]).map((c) => (
              <span
                key={c}
                className="px-2 py-0.5 rounded-md bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200/60 dark:border-indigo-800/60"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Slide Structure Breakdown */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Included Slides Breakdown</span>
            <span className="font-mono text-[11px]">{previewActivity.slides.length} Steps</span>
          </div>

          <div className="space-y-2">
            {previewActivity.slides.map((s, idx) => {
              const slideTitle =
                (s.content as any).question || (s.content as any).title || `Slide ${idx + 1}`;
              return (
                <div
                  key={s.id || idx}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-start space-x-2.5"
                >
                  <span className="w-5 text-right font-mono text-xs font-bold text-slate-400 pt-0.5">
                    {idx + 1}
                  </span>
                  <div className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                    {getSlideIcon(s.type_id)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {s.type_id}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                      {slideTitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Features in this Deck
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {selectedTemplate.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          {confirmReplace ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-3 animate-in fade-in">
              <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Replace Current Presentation?</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-snug">
                Loading this template will replace your active slides. Your previous activity will be preserved in undo history.
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={handleApplyTemplate}
                  className="flex-1 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Yes, Load Template
                </button>
                <button
                  onClick={() => setConfirmReplace(false)}
                  className="py-2 px-3 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                if (isDirty) setConfirmReplace(true);
                else handleApplyTemplate();
              }}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition-all shadow-sm hover:shadow flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Apply Template to Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};
