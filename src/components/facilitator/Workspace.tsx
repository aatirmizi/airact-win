import React, { useState, useEffect } from 'react';
import { usePresenter, FacilitatorActiveView } from '../../context/PresenterContext.js';
import { SlideSidebar } from './SlideSidebar.js';
import { SlideCanvas } from './SlideCanvas.js';
import { Inspector } from './Inspector.js';
import { LivePanel } from './LivePanel.js';
import { PreviewPane } from './PreviewPane.js';
import { StartPresentingDialog } from './Modals/StartPresentingDialog.js';
import { EndPresentingDialog } from './Modals/EndPresentingDialog.js';
import { ResetConfirmDialog } from './Modals/ResetConfirmDialog.js';
import { HostSecurityView } from './views/HostSecurityView.js';
import { RosterView } from './views/RosterView.js';
import { SessionDefaultsView } from './views/SessionDefaultsView.js';
import { TemplateGalleryView } from './views/TemplateGalleryView.js';
import { OpenRecentView } from './views/OpenRecentView.js';
import { FacilitatorHub } from './FacilitatorHub.js';
import { EditorContextBar } from './EditorContextBar.js';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface WorkspaceProps {
  previewOpen: boolean;
  setPreviewOpen: (open: boolean) => void;
  startModalOpen: boolean;
  setStartModalOpen: (open: boolean) => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  previewOpen,
  setPreviewOpen,
  startModalOpen,
  setStartModalOpen,
}) => {
  const {
    activity,
    liveState,
    saveActivity,
    undo,
    redo,
    nextStep,
    prevStep,
    setBlanked,
    setFrozen,
    activeView,
    setActiveView,
    isActivityOpen,
  } = usePresenter();

  const [endModalOpen, setEndModalOpen] = useState(false);
  const [resetModalSlideId, setResetModalSlideId] = useState<string | null>(null);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in input or textarea, only allow Escape to unfocus or return
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        if (e.key === 'Escape' && activeView !== 'slides') {
          (e.target as HTMLElement).blur();
          setActiveView('slides');
        }
        return;
      }

      if (e.key === 'Escape') {
        if (activeView !== 'slides') {
          e.preventDefault();
          setActiveView('slides');
        } else if (previewOpen) {
          e.preventDefault();
          setPreviewOpen(false);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveActivity();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key === 'F5') {
        e.preventDefault();
        if (e.shiftKey) setPreviewOpen(!previewOpen);
        else if (!liveState?.is_live) setStartModalOpen(true);
      } else if (liveState?.is_live) {
        if (
          e.key === 'ArrowRight' ||
          e.key === 'PageDown' ||
          e.key === ' ' ||
          e.key === 'Enter' ||
          e.key.toLowerCase() === 'n'
        ) {
          e.preventDefault();
          nextStep();
        } else if (
          e.key === 'ArrowLeft' ||
          e.key === 'PageUp' ||
          e.key === 'Backspace' ||
          e.key.toLowerCase() === 'p'
        ) {
          e.preventDefault();
          prevStep();
        } else if (e.key.toLowerCase() === 'b') {
          e.preventDefault();
          setBlanked(!liveState.is_blanked);
        } else if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          setFrozen(!liveState.is_frozen);
        } else if (e.key.toLowerCase() === 'q') {
          e.preventDefault();
          try {
            const bc = new BroadcastChannel('airact_channel');
            bc.postMessage({ type: 'toggle_qr' });
            bc.close();
          } catch {}
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    saveActivity,
    undo,
    redo,
    previewOpen,
    liveState,
    nextStep,
    prevStep,
    setBlanked,
    setFrozen,
    activeView,
    setActiveView,
    setPreviewOpen,
    setStartModalOpen
  ]);

  const [showSlowNotice, setShowSlowNotice] = useState(false);

  useEffect(() => {
    if (activity) return;
    const timer = setTimeout(() => {
      setShowSlowNotice(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, [activity]);

  if (!activity) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500 gap-4 p-8 select-none">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <div className="text-center">
          <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Connecting to AirAct Workspace...
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Loading interactive workshop presentation and slides
          </p>
        </div>

        {showSlowNotice && (
          <div className="mt-2 flex flex-col items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-sm text-center animate-in fade-in">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Taking longer than expected? You can reload or re-authenticate your Host session:
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Reload
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem('airact_host_token');
                  window.dispatchEvent(new CustomEvent('airact_host_unauthorized'));
                  window.location.reload();
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm cursor-pointer"
              >
                Re-enter Host PIN
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const isLive = liveState?.is_live;

  // Breadcrumb metadata for in-canvas views
  const getBreadcrumbTitle = (view: FacilitatorActiveView) => {
    switch (view) {
      case 'host_security':
        return { category: 'Settings', title: 'Host Security & PIN' };
      case 'roster':
        return { category: 'Settings', title: 'Attendees Roster' };
      case 'session_defaults':
        return { category: 'Settings', title: 'Session Defaults & Configuration' };
      case 'templates':
        return { category: 'File', title: 'Template Gallery & Sample Workshops' };
      case 'open_recent':
        return { category: 'File', title: 'Open Presentation & Activity Library' };
      default:
        return { category: 'Workspace', title: 'Slide Editor' };
    }
  };

  const breadcrumb = getBreadcrumbTitle(activeView);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* ─────────────────────────────────────────────────────────────
          IN-CANVAS VIEWS (Replacing Floating Modals)
          When activeView !== 'slides', hide SlideSidebar & Inspector
          ───────────────────────────────────────────────────────────── */}
      {activeView !== 'slides' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Subtle Contextual Breadcrumb Bar */}
          <div className="h-10 px-6 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800/90 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={() => setActiveView('slides')}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-colors cursor-pointer group"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>Back to Slides</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono ml-1 font-normal">[Esc]</span>
              </button>

              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
              <span className="text-slate-400 dark:text-slate-500 font-medium">{breadcrumb.category}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
              <span className="font-bold text-slate-800 dark:text-slate-200">{breadcrumb.title}</span>
            </div>
          </div>

          {/* Active In-Canvas View Component */}
          {activeView === 'host_security' && <HostSecurityView onBackToSlides={() => setActiveView('slides')} />}
          {activeView === 'roster' && <RosterView />}
          {activeView === 'session_defaults' && <SessionDefaultsView />}
          {activeView === 'templates' && <TemplateGalleryView />}
          {activeView === 'open_recent' && <OpenRecentView />}
        </div>
      ) : isLive ? (
        /* ─────────────────────────────────────────────────────────────
            PRESENT / LIVE SESSION INTERFACE (60/40 Split)
            ───────────────────────────────────────────────────────────── */
        <LivePanel
          onEndPresenting={() => setEndModalOpen(true)}
          onResetSlide={(slideId) => setResetModalSlideId(slideId)}
        />
      ) : !isActivityOpen ? (
        /* ─────────────────────────────────────────────────────────────
            FACILITATOR HUB (Initial Landing Screen)
            ───────────────────────────────────────────────────────────── */
        <FacilitatorHub onOpenStartModal={() => setStartModalOpen(true)} />
      ) : (
        /* ─────────────────────────────────────────────────────────────
            SLIDE AUTHORING WORKSPACE (Editor View)
            ───────────────────────────────────────────────────────────── */
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Editor Context Sub-Header Bar: Slides (n), Undo/Redo, + Add Slide, Activity: Name, Theme: Name */}
          <EditorContextBar />

          <div className="flex-1 flex overflow-hidden relative">
            {/* 1. Slide Sidebar (Always visible on left in slides editor) */}
            <SlideSidebar />

            {/* 2. Main Content Area */}
            <SlideCanvas />
            <Inspector />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PREVIEW PANE (Rendered below persistent Navbar at all times)
          ───────────────────────────────────────────────────────────── */}
      {previewOpen && <PreviewPane onClose={() => setPreviewOpen(false)} />}

      {/* ─────────────────────────────────────────────────────────────
          TRULY TRANSIENT DIALOGS (Live Start, Live End, Reset confirmation)
          ───────────────────────────────────────────────────────────── */}
      <StartPresentingDialog
        isOpen={startModalOpen}
        onClose={() => setStartModalOpen(false)}
      />

      <EndPresentingDialog
        isOpen={endModalOpen}
        onClose={() => setEndModalOpen(false)}
      />

      <ResetConfirmDialog
        isOpen={Boolean(resetModalSlideId)}
        slideId={resetModalSlideId}
        onClose={() => setResetModalSlideId(null)}
      />
    </div>
  );
};
