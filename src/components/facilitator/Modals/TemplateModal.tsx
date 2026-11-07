import React, { useState } from 'react';
import { usePresenter } from '../../../context/PresenterContext.js';
import { activityTemplates, ActivityTemplate } from '../../../utils/templates.js';
import { LayoutTemplate, X, Check, ArrowRight, Sparkles, Layers, AlertCircle } from 'lucide-react';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose }) => {
  const { loadTemplate, liveState, isDirty } = usePresenter();
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate>(activityTemplates[0]);
  const [confirmReplace, setConfirmReplace] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleApply = async () => {
    if (liveState?.is_live) return;
    await loadTemplate(selectedTemplate.createActivity());
    setConfirmReplace(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full p-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <LayoutTemplate className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Activity Templates & Sample Workshops
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose a pre-built interactive presentation template to reload into your workspace.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="py-4 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {activityTemplates.map((tmpl) => {
            const isSelected = selectedTemplate.id === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => {
                  setSelectedTemplate(tmpl);
                  setConfirmReplace(false);
                }}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-md ring-1 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {tmpl.category}
                    </span>
                    <span className="text-xs text-slate-400 font-medium flex items-center space-x-1">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{tmpl.slideCount} slides</span>
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                    {tmpl.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 mb-3">
                    {tmpl.description}
                  </p>
                </div>

                <div>
                  {/* Slide pills */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {tmpl.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
                      <span>Includes SUN Logo Welcome</span>
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Warning if replacing current changes */}
        {confirmReplace ? (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 shrink-0 mb-2">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Loading <strong>{selectedTemplate.name}</strong> will replace the current slides. You can undo if needed. Continue?
              </span>
            </div>
            <div className="flex items-center space-x-2 shrink-0 ml-4">
              <button
                type="button"
                onClick={() => setConfirmReplace(false)}
                className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200"
              >
                No, Keep
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                Yes, Load Template
              </button>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Selected: <span className="font-bold text-slate-700 dark:text-slate-200">{selectedTemplate.name}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (isDirty) {
                  setConfirmReplace(true);
                } else {
                  handleApply();
                }
              }}
              disabled={liveState?.is_live}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              <span>Load Template</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
