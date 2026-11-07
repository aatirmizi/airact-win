import React, { useRef, useState } from 'react';
import { usePresenter } from '../../../context/PresenterContext.js';
import { activityTemplates } from '../../../utils/templates.js';
import {
  FolderOpen,
  Upload,
  Download,
  FilePlus,
  ArrowLeft,
  Sparkles,
  Layers,
  Clock,
  HardDrive,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const OpenRecentView: React.FC = () => {
  const {
    activity,
    exportActvtyFile,
    importActvtyFile,
    loadTemplate,
    newActivity,
    isDirty,
    setActiveView
  } = usePresenter();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; msg?: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importActvtyFile(file);
      setImportStatus({ success: true, msg: `Successfully imported "${file.name}"` });
      setTimeout(() => {
        setImportStatus(null);
        setActiveView('slides');
      }, 1200);
    } catch {
      setImportStatus({ success: false, msg: 'Error importing .actvty file. Please ensure it is a valid package.' });
    }
  };

  const handleOpenTemplate = async (tmpl: typeof activityTemplates[0]) => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes in your current presentation. Load template anyway?')) {
        return;
      }
    }
    await loadTemplate(tmpl.createActivity());
    setActiveView('slides');
  };

  const handleCreateNew = async () => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes in your current presentation. Create new presentation anyway?')) {
        return;
      }
    }
    await newActivity();
    setActiveView('slides');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Open Presentation & Library</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Load presentations from your device or start fresh from pre-built activity decks
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
              onClick={handleCreateNew}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 text-xs font-bold text-indigo-700 dark:text-indigo-300 transition-colors shadow-2xs cursor-pointer"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>New Blank</span>
            </button>
          </div>
        </div>

        {importStatus && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center space-x-2.5 ${
              importStatus.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300'
            }`}
          >
            {importStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span>{importStatus.msg}</span>
          </div>
        )}

        {/* Current Active Presentation Card */}
        {activity && (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Currently Loaded Presentation
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activity.manifest.meta.name || 'Untitled Presentation'}
              </h3>
              <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 font-mono pt-1">
                <span className="flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{activity.slides.length} slides</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(activity.manifest.meta.modified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
                {isDirty && (
                  <>
                    <span>•</span>
                    <span className="text-amber-500 font-semibold font-sans">Unsaved changes</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                onClick={exportActvtyFile}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
                title="Download current presentation as portable .actvty file"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                <span>Save As .actvty</span>
              </button>
              <button
                onClick={() => setActiveView('slides')}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>Edit Current Slides</span>
              </button>
            </div>
          </div>
        )}

        {/* Open from Media / Device Upload Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl bg-white dark:bg-slate-900/60 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all cursor-pointer text-center space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center group-hover:scale-105 transition-transform">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Open from Device / Media
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Click to browse and upload an existing <code className="text-indigo-600 dark:text-indigo-400 font-semibold font-mono">.actvty</code> file package
            </p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".actvty"
            className="hidden"
          />
        </div>

        {/* Quick Sample Activities Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sample Decks & Standard Activities
            </h3>
            <button
              onClick={() => setActiveView('templates')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Browse Full Template Gallery →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activityTemplates.slice(0, 3).map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => handleOpenTemplate(tmpl)}
                className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: tmpl.color || '#6366f1' }}
                    />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {tmpl.name}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {tmpl.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-mono">
                  <span>{tmpl.slideCount} slides</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold font-sans group-hover:translate-x-0.5 transition-transform">
                    Load →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
