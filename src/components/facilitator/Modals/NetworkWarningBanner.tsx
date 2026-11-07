import React from 'react';
import { AlertTriangle, Wifi, ArrowRight, X } from 'lucide-react';

interface NetworkWarningDialogProps {
  isOpen: boolean;
  missingAddress?: string;
  missingInterfaceName?: string;
  onOpenNetworkHelper: () => void;
  onDismiss: () => void;
}

export const NetworkWarningDialog: React.FC<NetworkWarningDialogProps> = ({
  isOpen,
  missingAddress,
  missingInterfaceName,
  onOpenNetworkHelper,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Network Change Detected
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                Stored Network Connection Unavailable
              </h3>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Your previously stored network connection{' '}
            <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 font-mono font-bold text-amber-800 dark:text-amber-300">
              {missingAddress || missingInterfaceName || 'Previously Saved IP'}
            </code>{' '}
            is no longer active on this computer.
          </p>

          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200 space-y-1.5">
            <div className="font-bold">Why did this happen?</div>
            <ul className="list-disc list-inside space-y-0.5 text-amber-800/90 dark:text-amber-300/90">
              <li>Your computer may have connected to a different venue or room Wi-Fi network.</li>
              <li>The router may have renewed or reassigned your IP address via DHCP.</li>
              <li>A physical Ethernet cable or Wi-Fi adapter may have been toggled.</li>
            </ul>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Until reconfigured, AirAct will automatically fallback to the best auto-detected interface so presentations can proceed.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end space-x-3">
          <button
            onClick={onDismiss}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Use Auto Fallback
          </button>

          <button
            onClick={() => {
              onDismiss();
              onOpenNetworkHelper();
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Open Network Settings Helper</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
