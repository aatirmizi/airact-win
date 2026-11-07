import React from 'react';
import { usePresenter } from '../../../context/PresenterContext.js';
import { AlertTriangle, Download, RefreshCw } from 'lucide-react';

interface ResetConfirmDialogProps {
  isOpen: boolean;
  slideId: string | null;
  onClose: () => void;
}

export const ResetConfirmDialog: React.FC<ResetConfirmDialogProps> = ({ isOpen, slideId, onClose }) => {
  const { activity, resetSlideData, exportActvtyFile } = usePresenter();

  if (!isOpen || !slideId || !activity) return null;

  const targetSlide = activity.slides.find((s) => s.id === slideId);
  const slideTitle =
    (targetSlide?.content as any)?.question ||
    (targetSlide?.content as any)?.title ||
    'Selected slide';

  const handleConfirmReset = async () => {
    await resetSlideData(slideId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 select-none">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reset this slide's data?
            </h3>
            <p className="text-xs text-slate-500">
              {slideTitle}
            </p>
          </div>
        </div>

        <div className="py-3 text-xs text-slate-600 dark:text-slate-300 space-y-2">
          <p>
            This deletes all stored responses for this slide. If this is a Quiz Question, points earned from this question will be removed from the leaderboard.
          </p>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500">
            🛡️ An automatic safety copy of the database will be created in your backups folder before any records are cleared.
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={exportActvtyFile}
            className="flex items-center space-x-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export backup first</span>
          </button>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              autoFocus
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReset}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
            >
              Delete Responses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
