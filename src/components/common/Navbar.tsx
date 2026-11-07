import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext.js';
import { usePresenter, FacilitatorActiveView } from '../../context/PresenterContext.js';
import {
  Sun,
  Moon,
  Monitor,
  Play,
  Square,
  Tv,
  Smartphone,
  Save,
  RotateCcw,
  RotateCw,
  Download,
  Upload,
  Radio,
  Wifi,
  ExternalLink,
  Users,
  LayoutTemplate,
  ShieldCheck,
  FilePlus,
  FolderOpen,
  Sliders,
  ChevronDown,
  Check,
  Eye,
  EyeOff,
  Edit3,
  Clock,
  LogOut,
  Sparkles,
  X
} from 'lucide-react';

interface NavbarProps {
  onOpenStartModal?: () => void;
  onOpenPreview?: () => void;
  previewOpen?: boolean;
}

type MenuKey = 'file' | 'present' | 'display' | 'settings' | null;

export const Navbar: React.FC<NavbarProps> = ({
  onOpenStartModal,
  onOpenPreview,
  previewOpen,
}) => {
  const { theme, setTheme } = useTheme();
  const {
    activity,
    isDirty,
    saveActivity,
    newActivity,
    liveState,
    canUndo,
    canRedo,
    undo,
    redo,
    exportActvtyFile,
    importActvtyFile,
    activeView,
    setActiveView,
    endPresenting,
    nextStep,
    prevStep,
    setBlanked,
    setFrozen,
    updateActivitySettings,
    isActivityOpen,
    closeActivity,
    setIsNetworkModalOpen,
  } = usePresenter();

  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown menu on outside click or Esc
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openMenu) {
        setOpenMenu(null);
      }
    };

    if (openMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenu]);

  const handleTitleSubmit = () => {
    if (activity && titleDraft.trim() && titleDraft !== activity.manifest.meta.name) {
      activity.manifest.meta.name = titleDraft.trim();
      activity.manifest.meta.modified_at = new Date().toISOString();
      saveActivity();
    }
    setIsEditingTitle(false);
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    await saveActivity();
    setIsSaving(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      importActvtyFile(e.target.files[0]);
      setActiveView('slides');
    }
  };

  const handleNewPresentation = async () => {
    setOpenMenu(null);
    if (isDirty) {
      if (!window.confirm('You have unsaved changes in your presentation. Create a new blank presentation anyway?')) {
        return;
      }
    }
    await newActivity();
    setActiveView('slides');
  };

  const handleOpenProjectorWindow = () => {
    setOpenMenu(null);
    window.open(
      '/projector',
      'AirActProjector',
      'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no'
    );
  };

  const handleOpenPhoneWindow = () => {
    setOpenMenu(null);
    window.open(
      '/p',
      'AirActPhone',
      'width=420,height=800,menubar=no,toolbar=no,location=no,status=no'
    );
  };

  const isLive = liveState?.is_live;
  const connectedCount = liveState?.connected_count || 0;

  return (
    <header
      ref={navRef}
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.05) 1px, transparent 0)',
        backgroundSize: '16px 16px',
      }}
      className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/90 dark:border-slate-800 flex flex-col z-40 select-none transition-colors shrink-0 shadow-md shadow-slate-900/5 dark:shadow-black/25 backdrop-blur-xs"
    >
      {/* ─────────────────────────────────────────────────────────────
          PROMINENT DESKTOP BANNER: Larger Logo, App Name, Office-Style Menu Bar, Utilities
          ───────────────────────────────────────────────────────────── */}
      <div className="h-15 sm:h-16 px-4 flex items-center justify-between">
        {/* Left: Brand Identity + Top-line Menus */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Brand Logo & Spaced AirAct Title with by SkillUpgrade Network */}
          <div
            onClick={() => setActiveView('slides')}
            className="flex items-center space-x-3 cursor-pointer group py-1 select-none"
            title="AirAct Facilitator Workspace"
          >
            <img
              src="/assets/aistudio/AirAct_Community_Learning_Logo_44a129c1.png"
              alt="AirAct Logo"
              className="h-12 sm:h-13.5 w-auto object-contain shrink-0 drop-shadow-md transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col justify-center">
              <span className="font-black text-slate-900 dark:text-white text-base sm:text-lg tracking-[0.24em] uppercase leading-none font-sans">
                AirAct
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider mt-1 uppercase leading-none whitespace-nowrap">
                by SkillUpgrade Network
              </span>
            </div>
          </div>

          <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Desktop Office-Style Menu Bar: File, Present, Display, Settings */}
          <nav className="flex items-center space-x-1">
            {/* 1. FILE MENU */}
            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}
                className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  openMenu === 'file'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>File</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openMenu === 'file' ? 'rotate-180' : ''}`} />
              </button>

              {openMenu === 'file' && (
                <div className="absolute left-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                  <button
                    onClick={handleNewPresentation}
                    className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <FilePlus className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">New Presentation</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Ctrl+N</span>
                  </button>

                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      setActiveView('templates');
                    }}
                    className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <LayoutTemplate className="w-4 h-4 text-indigo-500" />
                      <span className="font-medium">New from Template...</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      setActiveView('open_recent');
                    }}
                    className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <FolderOpen className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">Open Recent...</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Ctrl+O</span>
                  </button>

                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      fileInputRef.current?.click();
                    }}
                    className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">Open from Device/Media...</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">.actvty</span>
                  </button>

                  <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      setTitleDraft(activity?.manifest.meta.name || '');
                      setIsEditingTitle(true);
                    }}
                    className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Edit3 className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">Rename Presentation...</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">F2</span>
                  </button>

                  <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

                  {/* Quick Undo / Redo in File Menu */}
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      if (canUndo) undo();
                    }}
                    disabled={!canUndo}
                    className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <RotateCcw className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">Undo</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Ctrl+Z</span>
                  </button>

                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      if (canRedo) redo();
                    }}
                    disabled={!canRedo}
                    className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <RotateCw className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">Redo</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Ctrl+Y</span>
                  </button>

                  <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      handleManualSave();
                    }}
                    className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Save className="w-4 h-4 text-emerald-500" />
                      <span className="font-medium">Save Changes</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Ctrl+S</span>
                  </button>

                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      exportActvtyFile();
                    }}
                    className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Download className="w-4 h-4 text-indigo-500" />
                      <span className="font-medium">Save As / Download (.actvty)</span>
                    </div>
                  </button>

                  <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      if (isActivityOpen) {
                        closeActivity();
                      }
                    }}
                    disabled={!isActivityOpen}
                    className={`w-full px-3.5 py-2 flex items-center justify-between text-xs transition-colors text-left ${
                      isActivityOpen
                        ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer'
                        : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <X className="w-4 h-4" />
                      <span className="font-semibold">Close Presentation</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Hub</span>
                  </button>

                  <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      if (isDirty && !window.confirm('You have unsaved changes. Quit anyway?')) return;
                      (window as any).clik8?.quit?.();
                    }}
                    className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <LogOut className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">Quit</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 2. PRESENT MENU */}
            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === 'present' ? null : 'present')}
                className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  openMenu === 'present'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Present</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openMenu === 'present' ? 'rotate-180' : ''}`} />
              </button>

              {openMenu === 'present' && (
                <div className="absolute left-0 mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      onOpenPreview?.();
                    }}
                    className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Eye className="w-4 h-4 text-indigo-500" />
                      <span className="font-medium">
                        {previewOpen ? 'Close Preview Pane' : 'Preview / Rehearse'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Shift+F5</span>
                  </button>

                  {!isLive ? (
                    <button
                      onClick={() => {
                        setOpenMenu(null);
                        onOpenStartModal?.();
                      }}
                      className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Play className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                        <span className="font-bold">Present / Live Session...</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">F5</span>
                    </button>
                  ) : (
                    <>
                      <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />
                      <button
                        onClick={() => {
                          setOpenMenu(null);
                          nextStep();
                        }}
                        className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                      >
                        <span className="font-medium">Next Step / Slide</span>
                        <span className="text-[10px] font-mono text-slate-400">Space</span>
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenu(null);
                          prevStep();
                        }}
                        className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                      >
                        <span className="font-medium">Previous Step</span>
                        <span className="text-[10px] font-mono text-slate-400">←</span>
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenu(null);
                          setBlanked(!liveState?.is_blanked);
                        }}
                        className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                      >
                        <span className="font-medium">Toggle Blank Screen</span>
                        <span className="text-[10px] font-mono text-slate-400">B</span>
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenu(null);
                          setFrozen(!liveState?.is_frozen);
                        }}
                        className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                      >
                        <span className="font-medium">Toggle Freeze</span>
                        <span className="text-[10px] font-mono text-slate-400">F</span>
                      </button>
                      <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />
                      <button
                        onClick={() => {
                          setOpenMenu(null);
                          endPresenting();
                        }}
                        className="w-full px-3.5 py-2 flex items-center space-x-2.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left cursor-pointer font-bold"
                      >
                        <Square className="w-4 h-4 fill-red-500 text-red-500" />
                        <span>End Live Session</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 3. DISPLAY MENU (Projector Screen & Phone Window relocated here) */}
            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === 'display' ? null : 'display')}
                className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  openMenu === 'display'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Display</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openMenu === 'display' ? 'rotate-180' : ''}`} />
              </button>

              {openMenu === 'display' && (
                <div className="absolute left-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Dual Screen Windows
                  </div>

                  <button
                    onClick={handleOpenProjectorWindow}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer group"
                    title="Launch high-resolution Projector presentation window"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1 rounded bg-indigo-50 dark:bg-slate-800 text-indigo-500 group-hover:scale-105 transition-transform">
                        <Tv className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">Projector Screen</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Dual monitor / TV display window</div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500" />
                  </button>

                  <button
                    onClick={handleOpenPhoneWindow}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left cursor-pointer group"
                    title="Launch mobile participant simulation window"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1 rounded bg-emerald-50 dark:bg-slate-800 text-emerald-500 group-hover:scale-105 transition-transform">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">Phone Window</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Mobile participant test client</div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
                  </button>
                </div>
              )}
            </div>

            {/* 4. SETTINGS MENU */}
            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === 'settings' ? null : 'settings')}
                className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  openMenu === 'settings'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Settings</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openMenu === 'settings' ? 'rotate-180' : ''}`} />
              </button>

              {openMenu === 'settings' && (
                <div className="absolute left-0 mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      setActiveView('host_security');
                    }}
                    className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span className="font-medium">Host Security & PIN</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      setActiveView('roster');
                    }}
                    className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <span className="font-medium">Attendees Roster</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      setActiveView('session_defaults');
                    }}
                    className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Sliders className="w-4 h-4 text-amber-500" />
                      <span className="font-medium">Session Defaults</span>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      setIsNetworkModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Wifi className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">Network Settings Helper...</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300">
                      Intranet
                    </span>
                  </button>
                </div>
              )}
            </div>
          </nav>


        </div>

        {/* Hidden File Input for .actvty import */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".actvty"
          className="hidden"
        />

        {/* Right: Quick Tools (Undo/Redo/Save Status, Live Badge, Theme Switcher) */}
        <div className="flex items-center space-x-2.5">
          {/* Live broadcast badge if active */}
          {isLive && (
            <div className="flex items-center space-x-1.5 bg-red-500/10 dark:bg-red-950/40 border border-red-500/30 px-2.5 py-1 rounded-lg text-red-600 dark:text-red-400 text-xs font-bold animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              <span>LIVE ({connectedCount})</span>
            </div>
          )}


          {/* Quick Save Status Button */}
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
              isDirty
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100/60'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
            title="Save changes to server (Ctrl+S)"
          >
            {isSaving ? (
              <svg className="w-3.5 h-3.5 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : justSaved ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Save className={`w-3.5 h-3.5 ${isDirty ? 'text-amber-500' : 'text-slate-400'}`} />
            )}
            <span className="hidden sm:inline">
              {isSaving ? 'Saving...' : justSaved ? 'Saved' : isDirty ? 'Save*' : 'Saved'}
            </span>
          </button>

          {/* Light / Dark / System Theme Switcher */}
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-800">
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                theme === 'light'
                  ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Light theme"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'bg-white dark:bg-slate-700 text-indigo-400 shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Dark theme"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                theme === 'system'
                  ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="System theme"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
