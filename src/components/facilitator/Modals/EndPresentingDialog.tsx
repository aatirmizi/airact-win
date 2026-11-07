import React from 'react';
import { usePresenter } from '../../../context/PresenterContext.js';
import { AlertCircle, Square } from 'lucide-react';

interface EndPresentingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EndPresentingDialog: React.FC<EndPresentingDialogProps> = ({ isOpen, onClose }) => {
  const { liveState, endPresenting } = usePresenter();

  if (!isOpen || !liveState) return null;

  const handleConfirmEnd = async () => {
    await endPresenting();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 select-none">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              End this presentation?
            </h3>
            <p className="text-xs text-slate-500">
              Audience participant connections will close.
            </p>
          </div>
        </div>

        <div className="py-3 space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between">
            <span>Active participants:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {liveState.active_participants}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total responses stored:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {liveState.stored_count}
            </span>
          </div>
          <p className="pt-2 text-[11px] text-slate-400 border-t border-slate-200 dark:border-slate-700">
            The Activity and all collected audience responses will be saved automatically.
          </p>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          {/* Safe default choice */}
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
          >
            Keep Presenting
          </button>
          <button
            type="button"
            onClick={handleConfirmEnd}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold flex items-center space-x-1"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>End Presenting</span>
          </button>
        </div>
      </div>
    </div>
  );
};
