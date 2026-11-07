import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePresenter } from '../../context/PresenterContext.js';
import { TextStyle } from '../../types/activity.js';
import {
  RotateCcw,
  RotateCw,
  Clock,
  CheckCircle2,
  Sparkles,
  QrCode,
  Edit3,
  Plus,
  Trash2,
  Check,
  ThumbsUp,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown
} from 'lucide-react';
import QRCode from 'qrcode';
import { D3WordCloud } from '../common/D3WordCloud.js';
import { getThemeTextureStyle, isThemeLight, getFieldTextStyle } from '../../utils/themes.js';

// Available Font Families
const FONT_FAMILIES = [
  { label: 'Theme Default', value: '' },
  { label: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', sans-serif" },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Roboto', value: "'Roboto', sans-serif" },
  { label: 'Georgia', value: "'Georgia', serif" },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { label: 'Courier New (Mono)', value: "'Courier New', monospace" },
];

// Available Font Sizes (Steps for headings and body)
const FONT_SIZES = [
  { label: 'Small (18px)', value: '1.125rem' },
  { label: 'Medium (24px)', value: '1.5rem' },
  { label: 'Large (32px)', value: '2rem' },
  { label: 'X-Large (40px)', value: '2.5rem' },
  { label: '2X-Large (48px)', value: '3rem' },
  { label: 'Huge (56px)', value: '3.5rem' },
  { label: 'Display (64px)', value: '4rem' },
];

// Color Swatches
const COLOR_PRESETS = [
  { label: 'Default', value: '' },
  { label: 'Deep Slate', value: '#0f172a' },
  { label: 'White', value: '#ffffff' },
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Cyan / Sky', value: '#0284c7' },
  { label: 'Emerald', value: '#16a34a' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Rose Red', value: '#dc2626' },
  { label: 'Purple', value: '#9333ea' },
];

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING FORMATTING TOOLBAR FOR IN-PLACE EDITABLE TEXT
// ─────────────────────────────────────────────────────────────────────────────
interface TextFormatToolbarProps {
  style?: TextStyle;
  onUpdateStyle: (style: TextStyle) => void;
  allowSizeChange?: boolean;
  onClose: () => void;
}

const TextFormatToolbar: React.FC<TextFormatToolbarProps> = ({
  style = {},
  onUpdateStyle,
  allowSizeChange = true,
  onClose,
}) => {
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);

  return (
    <div
      onMouseDown={(e) => {
        // Prevent default so focus isn't stolen from the input/textarea, except when clicking the native color input
        if ((e.target as HTMLElement).tagName !== 'INPUT') {
          e.preventDefault();
        }
        e.stopPropagation();
      }}
      onClick={(e) => e.stopPropagation()}
      className="absolute -top-12 left-0 z-50 flex items-center space-x-1.5 bg-slate-900 text-white px-2 py-1.5 rounded-xl shadow-2xl border border-slate-700 text-xs select-none animate-in fade-in zoom-in-95"
    >
      {/* 1. Font Family Picker */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            setShowFontMenu(!showFontMenu);
            setShowColorMenu(false);
            setShowSizeMenu(false);
          }}
          className="flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
          title="Change Font Family"
        >
          <Type className="w-3.5 h-3.5 text-indigo-400" />
          <span className="truncate max-w-[90px]">
            {FONT_FAMILIES.find((f) => f.value === style.fontFamily)?.label || 'Font'}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {showFontMenu && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 mt-1.5 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 max-h-56 overflow-y-auto"
          >
            {FONT_FAMILIES.map((f) => (
              <button
                key={f.label}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStyle({ ...style, fontFamily: f.value || undefined });
                  setShowFontMenu(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-800 flex items-center justify-between cursor-pointer ${
                  style.fontFamily === f.value ? 'text-indigo-400 font-bold bg-slate-800/60' : 'text-slate-200'
                }`}
                style={{ fontFamily: f.value || undefined }}
              >
                <span>{f.label}</span>
                {style.fontFamily === f.value && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-slate-700" />

      {/* 2. Font Size Picker (Locked for options to maintain uniform size) */}
      {allowSizeChange ? (
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowSizeMenu(!showSizeMenu);
              setShowFontMenu(false);
              setShowColorMenu(false);
            }}
            className="flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
            title="Adjust Text Size"
          >
            <span className="font-mono text-xs font-bold text-amber-400">Size</span>
            <span className="text-[11px] font-mono text-slate-300">
              {FONT_SIZES.find((s) => s.value === style.fontSize)?.label.split(' ')[0] || 'Default'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showSizeMenu && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 mt-1.5 w-40 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 max-h-56 overflow-y-auto"
            >
              {FONT_SIZES.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStyle({ ...style, fontSize: s.value });
                    setShowSizeMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-800 flex items-center justify-between cursor-pointer ${
                    style.fontSize === s.value ? 'text-amber-400 font-bold bg-slate-800/60' : 'text-slate-200'
                  }`}
                >
                  <span>{s.label}</span>
                  {style.fontSize === s.value && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <span
          title="Option size is uniform across choices to preserve layout balance"
          className="text-[10px] text-slate-400 font-mono px-2 py-1 bg-slate-800/80 rounded-md select-none"
        >
          Size: Uniform
        </span>
      )}

      <div className="w-px h-4 bg-slate-700" />

      {/* 3. Text Color Picker */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            setShowColorMenu(!showColorMenu);
            setShowFontMenu(false);
            setShowSizeMenu(false);
          }}
          className="flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
          title="Change Text Color"
        >
          <div
            className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-xs shrink-0"
            style={{ backgroundColor: style.color || '#4f46e5' }}
          />
          <span className="text-[11px] text-slate-300">Color</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {showColorMenu && (
          <div
            onMouseDown={(e) => {
              if ((e.target as HTMLElement).tagName !== 'INPUT') {
                e.preventDefault();
              }
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 mt-1.5 p-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 space-y-2 w-48"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Color Palette
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStyle({ ...style, color: c.value || undefined });
                    setShowColorMenu(false);
                  }}
                  className={`w-6 h-6 rounded-lg border transition-transform hover:scale-110 flex items-center justify-center cursor-pointer ${
                    style.color === c.value ? 'ring-2 ring-white scale-105' : 'border-slate-700'
                  }`}
                  style={{ backgroundColor: c.value || '#334155' }}
                  title={c.label}
                >
                  {!c.value && <span className="text-[8px] text-white font-mono">D</span>}
                </button>
              ))}
            </div>

            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Custom HEX:</span>
              <input
                type="color"
                value={style.color || '#4f46e5'}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdateStyle({ ...style, color: e.target.value });
                }}
                className="w-6 h-6 rounded border-0 p-0 cursor-pointer bg-transparent"
              />
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-slate-700" />

      {/* 4. Placement / Text Alignment */}
      <div className="flex items-center space-x-0.5 bg-slate-800 rounded-lg p-0.5">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onUpdateStyle({ ...style, align: 'left' });
          }}
          className={`p-1 rounded transition-colors cursor-pointer ${
            style.align === 'left' || !style.align ? 'bg-slate-700 text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
          title="Align Left"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onUpdateStyle({ ...style, align: 'center' });
          }}
          className={`p-1 rounded transition-colors cursor-pointer ${
            style.align === 'center' ? 'bg-slate-700 text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
          title="Align Center"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onUpdateStyle({ ...style, align: 'right' });
          }}
          className={`p-1 rounded transition-colors cursor-pointer ${
            style.align === 'right' ? 'bg-slate-700 text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
          title="Align Right"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="w-px h-4 bg-slate-700" />

      {/* Done button */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] cursor-pointer flex items-center space-x-1"
        title="Finish formatting"
      >
        <Check className="w-3 h-3" />
        <span>Done</span>
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE IN-PLACE EDITABLE TEXT COMPONENT WITH HOVER TOOLTIP & TOOLBAR
// ─────────────────────────────────────────────────────────────────────────────
interface EditableTextProps {
  value: string;
  onSave: (newVal: string) => void;
  fieldKey: string;
  styles?: Record<string, TextStyle>;
  onUpdateStyle?: (style: TextStyle) => void;
  allowSizeChange?: boolean;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  as?: 'h1' | 'h2' | 'p' | 'span' | 'div';
  multiline?: boolean;
  disabled?: boolean;
}

const EditableText: React.FC<EditableTextProps> = ({
  value,
  onSave,
  fieldKey,
  styles = {},
  onUpdateStyle,
  allowSizeChange = true,
  className = '',
  style,
  placeholder = 'Click to edit...',
  as = 'span',
  multiline = false,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const fieldStyle = styles[fieldKey] || {};
  const customStyles = getFieldTextStyle(styles, fieldKey);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleCommit = useCallback(() => {
    setIsEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) {
      onSave(trimmed || value);
    }
  }, [draft, value, onSave]);

  // Handle clicking outside the container to commit changes cleanly
  useEffect(() => {
    if (!isEditing) return;

    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleCommit();
      }
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside);
    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
    };
  }, [isEditing, handleCommit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      setDraft(value);
      setIsEditing(false);
    }
  };

  const combinedStyles: React.CSSProperties = {
    ...style,
    ...customStyles,
  };

  if (disabled) {
    const Tag = as as any;
    return <Tag className={className} style={combinedStyles}>{value}</Tag>;
  }

  const Tag = as as any;

  return (
    <div
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
      className={`relative inline-block ${fieldStyle.align === 'center' ? 'text-center w-full' : fieldStyle.align === 'right' ? 'text-right w-full' : 'w-full'}`}
    >
      {/* Floating Formatting Toolbar shown when in active edit mode */}
      {isEditing && onUpdateStyle && (
        <TextFormatToolbar
          style={fieldStyle}
          onUpdateStyle={(newS) => onUpdateStyle(newS)}
          allowSizeChange={allowSizeChange}
          onClose={() => handleCommit()}
        />
      )}

      {isEditing ? (
        multiline ? (
          <textarea
            ref={inputRef as any}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`${className} bg-white/95 dark:bg-slate-900/95 ring-2 ring-indigo-500 rounded-lg p-2.5 outline-none w-full shadow-lg resize-y`}
            style={combinedStyles}
            rows={4}
          />
        ) : (
          <input
            ref={inputRef as any}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`${className} bg-white/95 dark:bg-slate-900/95 ring-2 ring-indigo-500 rounded-md px-2 py-0.5 outline-none shadow-md inline-block max-w-full`}
            style={combinedStyles}
          />
        )
      ) : (
        <Tag
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className={`group relative cursor-pointer hover:outline hover:outline-2 hover:outline-dashed hover:outline-indigo-400/80 hover:rounded-lg transition-all ${className}`}
          style={combinedStyles}
          title="Click to edit text, size, color and font"
        >
          {/* Floating Hover Tooltip */}
          <span className="absolute -top-7 left-2 hidden group-hover:flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold shadow-xl z-50 pointer-events-none whitespace-nowrap animate-in fade-in duration-100 border border-slate-700">
            <Edit3 className="w-2.5 h-2.5 text-indigo-400" />
            <span>Click to edit text & style</span>
          </span>

          {value || <span className="opacity-40 italic">{placeholder}</span>}
        </Tag>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE CANVAS COMPONENT (Exact Visual Replica with In-Place Editing & Formatting)
// ─────────────────────────────────────────────────────────────────────────────
export const SlideCanvas: React.FC = () => {
  const {
    activity,
    selectedSlide,
    updateSlideContent,
    liveState,
    canUndo,
    canRedo,
    undo,
    redo,
    aspectRatio,
    setAspectRatio,
  } = usePresenter();

  const [activeEditingOptionId, setActiveEditingOptionId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  if (!selectedSlide || !activity) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-400">
        Select a slide from the sidebar to edit.
      </div>
    );
  }

  const isLive = liveState?.is_live;
  const content = selectedSlide.content as any;
  const theme = activity.theme;
  const isLight = isThemeLight(theme);
  const typeId = selectedSlide.type_id;

  const isPoll = typeId === 'poll';
  const isQuiz = typeId === 'quiz';
  const isPollOrQuiz = isPoll || isQuiz;

  const slideStyles: Record<string, TextStyle> = content.styles || {};

  const handleUpdateFieldStyle = (fieldKey: string, newStyle: TextStyle) => {
    const updated = {
      ...slideStyles,
      [fieldKey]: newStyle,
    };
    updateSlideContent({ styles: updated });
  };

  // Generate QR code for the replica welcome slide
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const previewUrl = `${origin}/j/LIVE`;
    QRCode.toDataURL(previewUrl, {
      margin: 1,
      width: 320,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then(setQrCodeUrl)
      .catch(() => {});
  }, []);

  // Close active option edit when clicking outside options
  const handleCanvasClick = () => {
    if (activeEditingOptionId) {
      setActiveEditingOptionId(null);
    }
  };

  // Option modification handlers (Add above, Add below, Delete, Mark correct)
  const options = content.options || [];

  const handleAddOptionAbove = (idx: number) => {
    const newId = `opt_${Date.now()}`;
    const newOpts = [...options];
    newOpts.splice(idx, 0, { id: newId, text: `New Option` });
    updateSlideContent({ options: newOpts });
    setActiveEditingOptionId(newId);
  };

  const handleAddOptionBelow = (idx: number) => {
    const newId = `opt_${Date.now()}`;
    const newOpts = [...options];
    newOpts.splice(idx + 1, 0, { id: newId, text: `New Option` });
    updateSlideContent({ options: newOpts });
    setActiveEditingOptionId(newId);
  };

  const handleDeleteOption = (idx: number) => {
    if (options.length <= 2) return;
    const optToRemove = options[idx];
    const newOpts = options.filter((_: any, i: number) => i !== idx);
    const updates: any = { options: newOpts };
    if (content.correct_option_id === optToRemove.id && newOpts.length > 0) {
      updates.correct_option_id = newOpts[0].id;
    }
    updateSlideContent(updates);
    setActiveEditingOptionId(null);
  };

  const handleUpdateOptionText = (idx: number, newText: string) => {
    const newOpts = [...options];
    newOpts[idx] = { ...newOpts[idx], text: newText.slice(0, 100) };
    updateSlideContent({ options: newOpts });
  };

  return (
    <div
      onClick={handleCanvasClick}
      className="flex-1 min-w-[500px] overflow-y-auto p-6 lg:p-8 bg-slate-100/70 dark:bg-slate-950/80 flex flex-col items-center justify-start select-none"
    >
      {/* ─────────────────────────────────────────────────────────────────────
          TOP CONTROL BAR: Slide Type & Aspect Ratio Toggle (16:9 | 16:10 | 4:3)
          ───────────────────────────────────────────────────────────────────── */}
      <div
        className={`w-full flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400 px-1 ${
          aspectRatio === '4:3' ? 'max-w-4xl' : aspectRatio === '16:10' ? 'max-w-5xl' : 'max-w-6xl'
        }`}
      >
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-800 dark:text-slate-200 capitalize text-xs">
            {content.question || content.title || `${typeId.replace('_', ' ')} Slide`}
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
            {typeId}
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
            Click text to edit font, size, color & placement
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Canvas Undo / Redo */}
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`p-1 rounded-md transition-colors ${
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
              className={`p-1 rounded-md transition-colors ${
                canRedo
                  ? 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer'
                  : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Aspect Ratio Switcher */}
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 px-1.5 uppercase select-none">Aspect</span>
            {(['16:9', '16:10', '4:3'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  aspectRatio === ratio
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title={`Set display format to ${ratio}`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          EXACT VISUAL REPLICA SLIDE (Identical to Presenter & Preview Stage)
          ───────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          ...getThemeTextureStyle(theme),
          aspectRatio: aspectRatio === '4:3' ? '4/3' : aspectRatio === '16:10' ? '16/10' : '16/9',
        }}
        className={`w-full rounded-2xl border border-slate-300/80 dark:border-slate-800/80 p-8 sm:p-10 shadow-2xl relative transition-all flex flex-col justify-between ${
          aspectRatio === '4:3' ? 'max-w-4xl' : aspectRatio === '16:10' ? 'max-w-5xl' : 'max-w-6xl'
        }`}
      >
        {/* ═════════════════════════════════════════════════════════════════
            1. WELCOME SLIDE (Exact Replica of ProjectorView)
            ═════════════════════════════════════════════════════════════════ */}
        {typeId === 'welcome' && (
          <div className="flex-1 flex flex-col justify-between h-full">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-8 my-auto">
              {/* Left Column: Workshop Info */}
              <div className="flex-1 space-y-5 max-w-2xl">
                <div
                  className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold border ${
                    isLight
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Interactive Workshop Session</span>
                </div>

                <div className="block">
                  <EditableText
                    as="h1"
                    fieldKey="title"
                    value={content.title || 'Interactive Workshop'}
                    onSave={(val) => updateSlideContent({ title: val })}
                    styles={slideStyles}
                    onUpdateStyle={(s) => handleUpdateFieldStyle('title', s)}
                    className={`text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight block ${
                      isLight ? 'text-slate-950 font-black' : 'text-white'
                    }`}
                  />
                </div>

                {/* Presenter Box */}
                <div
                  className={`p-4 rounded-2xl max-w-lg space-y-1.5 border ${
                    isLight
                      ? 'bg-white/95 border-slate-200/90 shadow-md text-slate-900'
                      : 'bg-slate-900/80 border-slate-800 text-white'
                  }`}
                >
                  <div className={`text-lg font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <span className={isLight ? 'text-slate-500 font-medium text-sm' : 'text-slate-400 font-medium text-sm'}>
                      Presented by
                    </span>
                    <EditableText
                      as="span"
                      fieldKey="presenter_name"
                      value={content.presenter_name || 'Presenter Name'}
                      onSave={(val) => updateSlideContent({ presenter_name: val })}
                      styles={slideStyles}
                      onUpdateStyle={(s) => handleUpdateFieldStyle('presenter_name', s)}
                      className={isLight ? 'text-indigo-600 font-extrabold' : 'text-indigo-400 font-extrabold'}
                    />
                  </div>

                  <div className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    <EditableText
                      as="span"
                      fieldKey="presenter_info"
                      value={content.presenter_info || 'Skill Upgrade Network'}
                      onSave={(val) => updateSlideContent({ presenter_info: val })}
                      styles={slideStyles}
                      onUpdateStyle={(s) => handleUpdateFieldStyle('presenter_info', s)}
                    />
                  </div>
                </div>

                {/* Join Message */}
                <div className="space-y-3 pt-1">
                  <EditableText
                    as="p"
                    fieldKey="join_message"
                    value={
                      content.join_message ||
                      'Join the live interactive presentation on your phone or laptop to vote and participate:'
                    }
                    onSave={(val) => updateSlideContent({ join_message: val })}
                    styles={slideStyles}
                    onUpdateStyle={(s) => handleUpdateFieldStyle('join_message', s)}
                    className={`text-base font-medium leading-relaxed block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
                  />

                  {/* Read-Only Web Link & Code box (IP and code are not editable as requested) */}
                  <div
                    className={`flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl max-w-lg border select-none ${
                      isLight
                        ? 'bg-white/95 border-slate-200/90 shadow-md text-slate-900'
                        : 'bg-slate-900/90 border-slate-800 shadow-md text-white'
                    }`}
                  >
                    <div>
                      <div className={`text-[10px] uppercase tracking-wider font-semibold mb-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        Web Link
                      </div>
                      <div className={`text-base font-mono font-bold underline underline-offset-4 ${isLight ? 'text-slate-950' : 'text-white'}`}>
                        {typeof window !== 'undefined' ? `${window.location.origin}/j/LIVE` : 'http://localhost:3000/j/LIVE'}
                      </div>
                    </div>
                    <div className={`sm:border-l sm:pl-5 ${isLight ? 'sm:border-slate-200' : 'sm:border-slate-800'}`}>
                      <div className={`text-[10px] uppercase tracking-wider font-semibold mb-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        Session Code
                      </div>
                      <div className={`text-2xl font-mono font-extrabold tracking-wider ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                        LIVE
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: QR Code */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className={`p-5 bg-white rounded-3xl ${isLight ? 'shadow-xl border-4 border-slate-200/90' : 'shadow-2xl border-4 border-indigo-500/30'}`}>
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="Join QR Code"
                      className="w-56 h-56 lg:w-64 lg:h-64 rounded-xl object-contain"
                    />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center bg-slate-100 rounded-xl">
                      <QrCode className="w-28 h-28 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="mt-3 text-center">
                  <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Scan with phone camera to participate
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Bar: App Branding & Status */}
            <div className={`flex items-center justify-between pt-4 border-t text-xs font-medium ${isLight ? 'border-slate-200/90 text-slate-600' : 'border-slate-800/80 text-slate-400'}`}>
              <div className="flex items-center space-x-2.5">
                <img
                  src="/assets/aistudio/AirAct_Community_Learning_Logo_44a129c1.png"
                  alt="AirAct"
                  className="h-7 w-auto object-contain"
                />
                <span className={`font-extrabold text-sm ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>AirAct</span>
                <span className={`font-semibold text-xs px-2 py-0.5 rounded ${isLight ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60'}`}>
                  by SkillUpgrade Network
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>Active Room</span>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            2. NORMAL SLIDES (Poll, Quiz, Word Cloud, Open, QA, Leaderboard, Content)
            ═════════════════════════════════════════════════════════════════ */}
        {typeId !== 'welcome' && (
          <div className="flex-1 flex flex-col justify-between h-full">
            {/* Top Slide Header: Question / Title Prompt & Slide Timer */}
            <div className="flex items-start justify-between gap-6 mb-6">
              <div className="flex-1 min-w-0">
                <span className={`text-xs font-bold uppercase tracking-widest block mb-1.5 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                  {typeId}
                </span>

                <EditableText
                  as="h1"
                  fieldKey={content.question !== undefined ? 'question' : 'title'}
                  value={content.question || content.title || 'Slide Title'}
                  onSave={(val) => {
                    if (content.question !== undefined) {
                      updateSlideContent({ question: val });
                    } else {
                      updateSlideContent({ title: val });
                    }
                  }}
                  styles={slideStyles}
                  onUpdateStyle={(s) =>
                    handleUpdateFieldStyle(content.question !== undefined ? 'question' : 'title', s)
                  }
                  className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight block ${
                    isLight ? 'text-slate-950 font-black' : 'text-white'
                  }`}
                />
              </div>

              {/* Slide Response Timer Badge */}
              {selectedSlide.settings?.timer_seconds && (
                <div
                  className={`px-4 py-2.5 rounded-2xl flex items-center space-x-2.5 border shrink-0 ${
                    isLight
                      ? 'bg-white/95 border-slate-200/90 text-indigo-700 shadow-sm'
                      : 'bg-slate-900 border-slate-700 text-indigo-400'
                  }`}
                >
                  <Clock className="w-5 h-5 text-indigo-500" />
                  <span className="font-mono text-2xl font-extrabold">{selectedSlide.settings.timer_seconds}s</span>
                </div>
              )}
            </div>

            {/* Center Slide Body */}
            <div className="flex-1 flex flex-col justify-center my-4">
              {/* ───────────────────────────────────────────────────────────
                  A. POLL & QUIZ: Option Cards with In-Place Editing & Contextual Toolbar
                  ─────────────────────────────────────────────────────────── */}
              {isPollOrQuiz && (
                <div className="space-y-4 max-w-4xl w-full mx-auto">
                  {options.map((opt: any, idx: number) => {
                    const isEditingThisOption = activeEditingOptionId === opt.id;
                    const isCorrect = isQuiz && content.correct_option_id === opt.id;
                    const optCustomStyle = getFieldTextStyle(slideStyles, 'options');

                    return (
                      <div
                        key={opt.id || idx}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveEditingOptionId(opt.id);
                        }}
                        className={`space-y-1.5 relative group transition-all rounded-xl ${
                          isEditingThisOption
                            ? 'ring-2 ring-indigo-500 ring-offset-2'
                            : 'hover:outline hover:outline-2 hover:outline-dashed hover:outline-indigo-400/80 cursor-pointer'
                        }`}
                      >
                        {/* Hover Tooltip when not actively editing */}
                        {!isEditingThisOption && (
                          <span className="absolute -top-7 left-4 hidden group-hover:flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold shadow-xl z-50 pointer-events-none whitespace-nowrap animate-in fade-in duration-100 border border-slate-700">
                            <Edit3 className="w-2.5 h-2.5 text-indigo-400" />
                            <span>Click option to edit text, color & font</span>
                          </span>
                        )}

                        {/* ───────────────────────────────────────────────────
                            CONTEXTUAL TOOLBAR: Appears ONLY when option is clicked
                            Features: Add above, Add below, Color, Font, Delete, Mark correct, Done
                            (Note: Font size is intentionally uniform as requested)
                            ─────────────────────────────────────────────────── */}
                        {isEditingThisOption && (
                          <div
                            onMouseDown={(e) => {
                              if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'SELECT') {
                                e.preventDefault();
                              }
                              e.stopPropagation();
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute -top-11 left-3 z-50 flex items-center space-x-1 bg-slate-900 text-white p-1.5 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 text-xs select-none"
                          >
                            <button
                              type="button"
                              onClick={() => handleAddOptionAbove(idx)}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer font-semibold"
                              title="Add new option above"
                            >
                              <Plus className="w-3 h-3 text-indigo-400" />
                              <span className="text-[11px]">Add above</span>
                            </button>

                            <div className="w-px h-3.5 bg-slate-700" />

                            <button
                              type="button"
                              onClick={() => handleAddOptionBelow(idx)}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer font-semibold"
                              title="Add new option below"
                            >
                              <Plus className="w-3 h-3 text-emerald-400" />
                              <span className="text-[11px]">Add below</span>
                            </button>

                            {/* Color Selector for Options */}
                            <div className="w-px h-3.5 bg-slate-700" />
                            <div className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-slate-800">
                              <Palette className="w-3 h-3 text-indigo-400" />
                              <input
                                type="color"
                                value={slideStyles.options?.color || (isLight ? '#0f172a' : '#ffffff')}
                                onChange={(e) =>
                                  handleUpdateFieldStyle('options', {
                                    ...slideStyles.options,
                                    color: e.target.value,
                                  })
                                }
                                className="w-4 h-4 rounded border-0 p-0 cursor-pointer bg-transparent"
                                title="Change Options Text Color"
                              />
                            </div>

                            {/* Font Family Selector for Options */}
                            <select
                              value={slideStyles.options?.fontFamily || ''}
                              onChange={(e) =>
                                handleUpdateFieldStyle('options', {
                                  ...slideStyles.options,
                                  fontFamily: e.target.value || undefined,
                                })
                              }
                              className="bg-slate-800 text-slate-200 text-[10px] rounded px-1.5 py-1 border border-slate-700 outline-none cursor-pointer"
                              title="Change Options Font"
                            >
                              {FONT_FAMILIES.map((f) => (
                                <option key={f.label} value={f.value}>
                                  {f.label}
                                </option>
                              ))}
                            </select>

                            {isQuiz && (
                              <>
                                <div className="w-px h-3.5 bg-slate-700" />
                                <button
                                  type="button"
                                  onClick={() => updateSlideContent({ correct_option_id: opt.id })}
                                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-semibold ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'hover:bg-slate-800 text-slate-300'
                                  }`}
                                  title="Mark this option as correct answer"
                                >
                                  <Check className="w-3 h-3" />
                                  <span className="text-[11px]">
                                    {isCorrect ? 'Correct Answer' : 'Mark Correct'}
                                  </span>
                                </button>
                              </>
                            )}

                            {options.length > 2 && (
                              <>
                                <div className="w-px h-3.5 bg-slate-700" />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOption(idx)}
                                  className="flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-red-950/60 text-red-400 hover:text-red-300 transition-colors cursor-pointer font-semibold"
                                  title="Delete this option"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span className="text-[11px]">Delete</span>
                                </button>
                              </>
                            )}

                            <div className="w-px h-3.5 bg-slate-700" />
                            <button
                              type="button"
                              onClick={() => setActiveEditingOptionId(null)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] cursor-pointer"
                            >
                              Done
                            </button>
                          </div>
                        )}

                        {/* Option Card Body (Exact Visual Mirror of Presenter) */}
                        <div className="flex items-center justify-between text-base sm:text-lg font-semibold">
                          <div className="flex items-center space-x-3 flex-1 min-w-0 pr-4">
                            <span
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-500 text-white'
                                  : isLight
                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                  : 'bg-indigo-500/20 text-indigo-400'
                              }`}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>

                            {isEditingThisOption ? (
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => handleUpdateOptionText(idx, e.target.value)}
                                autoFocus
                                style={optCustomStyle}
                                className={`flex-1 text-xl font-bold bg-transparent border-b-2 border-indigo-500 outline-none pb-0.5 ${
                                  !optCustomStyle.color ? (isLight ? 'text-slate-950' : 'text-white') : ''
                                }`}
                                placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                              />
                            ) : (
                              <span
                                style={optCustomStyle}
                                className={`text-xl font-bold truncate ${
                                  !optCustomStyle.color ? (isLight ? 'text-slate-950' : 'text-white') : ''
                                }`}
                              >
                                {opt.text || `Option ${String.fromCharCode(65 + idx)}`}
                              </span>
                            )}

                            {isCorrect && (
                              <span
                                className={`flex items-center space-x-1 text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ml-2 ${
                                  isLight
                                    ? 'text-emerald-800 bg-emerald-100 border border-emerald-300'
                                    : 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>CORRECT</span>
                              </span>
                            )}
                          </div>

                          <span className={`font-mono text-base font-bold shrink-0 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                            {isCorrect ? '100 pts' : '0 votes (0%)'}
                          </span>
                        </div>

                        {/* Option Percentage Bar */}
                        <div
                          className={`h-5 w-full rounded-xl overflow-hidden p-0.5 ${
                            isLight
                              ? 'bg-slate-200/80 border border-slate-300 shadow-2xs'
                              : 'bg-slate-900 border border-slate-800'
                          }`}
                        >
                          <div
                            className={`h-full rounded-lg transition-all duration-500 ${
                              isCorrect
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : 'bg-gradient-to-r from-indigo-600 to-violet-500'
                            }`}
                            style={{ width: isCorrect ? '100%' : '8%' }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Quiz Explanation Reveal Box (In-Place Editable) */}
                  {isQuiz && (
                    <div
                      className={`mt-6 p-4 rounded-xl text-sm leading-relaxed border ${
                        isLight
                          ? 'bg-white/95 border-emerald-400/70 text-slate-800 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className={`font-bold block mb-1 ${isLight ? 'text-emerald-700' : 'text-indigo-400'}`}>
                        Explanation & Key Takeaway:
                      </span>
                      <EditableText
                        as="p"
                        multiline
                        fieldKey="explanation"
                        value={content.explanation || 'Click here to write an explanation revealed to participants after the question...'}
                        onSave={(val) => updateSlideContent({ explanation: val })}
                        styles={slideStyles}
                        onUpdateStyle={(s) => handleUpdateFieldStyle('explanation', s)}
                        className="block"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────
                  B. WORD CLOUD SLIDE: Word Cloud Display
                  ─────────────────────────────────────────────────────────── */}
              {typeId === 'wordcloud' && (
                <div className="max-w-5xl w-full h-[46vh] mx-auto flex items-center justify-center p-4">
                  <D3WordCloud
                    words={[
                      { text: 'Interactive', count: 20 },
                      { text: 'Engagement', count: 18 },
                      { text: 'Realtime', count: 15 },
                      { text: 'AirAct', count: 14 },
                      { text: 'Collaboration', count: 10 },
                      { text: 'Learning', count: 9 },
                      { text: 'Fast', count: 7 },
                    ]}
                    className="w-full h-full"
                  />
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────
                  C. OPEN QUESTION SLIDE: Thought Response Cards Wall
                  ─────────────────────────────────────────────────────────── */}
              {typeId === 'open' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl w-full mx-auto max-h-[46vh] overflow-y-auto p-2">
                  {[
                    { text: 'Live audience engagement keeps every participant focused and energized!', author: 'Participant 1' },
                    { text: 'Super clear projection screen layout and mobile voting experience.', author: 'Participant 2' },
                    { text: 'Loving the real-time speed bonuses and instant word aggregations.', author: 'Participant 3' },
                  ].map((ans, i) => (
                    <div
                      key={i}
                      className={`p-5 rounded-2xl flex flex-col justify-between border ${
                        isLight
                          ? 'bg-white/95 border-slate-200/90 shadow-sm text-slate-900'
                          : 'bg-slate-900 border-slate-800 shadow-md text-white'
                      }`}
                    >
                      <p className={`text-base font-medium leading-relaxed mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        "{ans.text}"
                      </p>
                      <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        — {ans.author}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────
                  D. AUDIENCE Q&A SLIDE: Upvoted Question Cards
                  ─────────────────────────────────────────────────────────── */}
              {typeId === 'qa' && (
                <div className="space-y-3 max-w-4xl w-full mx-auto max-h-[46vh] overflow-y-auto p-2">
                  {[
                    { question: 'Can attendees join from any mobile browser without installing an app?', author: 'Attendee 1', upvotes: 12 },
                    { question: 'How do offline intranet local IP presentations synchronize?', author: 'Attendee 2', upvotes: 8 },
                    { question: 'Will attendee scores persist across all quiz questions for leaderboard podium?', author: 'Attendee 3', upvotes: 5 },
                  ].map((q, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-2xl flex items-center justify-between border ${
                        isLight
                          ? 'bg-white/95 border-slate-200/90 shadow-sm text-slate-900'
                          : 'bg-slate-900 border-slate-800 shadow-md text-white'
                      }`}
                    >
                      <div>
                        <h3 className={`text-lg font-bold mb-0.5 ${isLight ? 'text-slate-950' : 'text-white'}`}>{q.question}</h3>
                        <span className={`text-xs ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>Asked by {q.author}</span>
                      </div>

                      <div
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-base border ${
                          isLight
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{q.upvotes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────
                  E. LEADERBOARD SLIDE: Top Podium Standings
                  ─────────────────────────────────────────────────────────── */}
              {typeId === 'leaderboard' && (
                <div className="max-w-3xl w-full mx-auto space-y-3.5">
                  {[
                    { rank: 1, name: 'Alex Rivera', score: 380, correct: '4/4' },
                    { rank: 2, name: 'Taylor Chen', score: 340, correct: '4/4' },
                    { rank: 3, name: 'Jordan Patel', score: 290, correct: '3/4' },
                    { rank: 4, name: 'Morgan Casey', score: 260, correct: '3/4' },
                    { rank: 5, name: 'Samira Khan', score: 220, correct: '2/4' },
                  ].map((lead) => {
                    const medalColor =
                      lead.rank === 1
                        ? 'bg-amber-400 text-slate-950'
                        : lead.rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : lead.rank === 3
                        ? 'bg-amber-700 text-white'
                        : isLight
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : 'bg-slate-800 text-slate-300';

                    return (
                      <div
                        key={lead.rank}
                        className={`p-3.5 rounded-2xl flex items-center justify-between border transition-all ${
                          lead.rank === 1
                            ? isLight
                              ? 'bg-amber-100/90 border-amber-300 shadow-md scale-102 text-slate-950'
                              : 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/10 scale-102 text-white'
                            : isLight
                            ? 'bg-white/95 border-slate-200/90 shadow-sm text-slate-900'
                            : 'bg-slate-900/80 border-slate-800 text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3.5">
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-base ${medalColor}`}>
                            {lead.rank}
                          </span>
                          <span className={`text-xl font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>{lead.name}</span>
                        </div>

                        <div className="flex items-center space-x-5">
                          <span className={`text-xs ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                            {lead.correct} correct
                          </span>
                          <span className={`font-mono text-xl font-black ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                            {lead.score} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────
                  F. CONTENT SLIDE: Formatted Body Text (In-Place Editable)
                  ─────────────────────────────────────────────────────────── */}
              {typeId === 'content' && (
                <div className="max-w-4xl mx-auto text-center space-y-6">
                  <EditableText
                    as="p"
                    multiline
                    fieldKey="body"
                    value={content.body || 'Click to edit your key presentation bullet points and discussion notes...'}
                    onSave={(val) => updateSlideContent({ body: val })}
                    styles={slideStyles}
                    onUpdateStyle={(s) => handleUpdateFieldStyle('body', s)}
                    className={`text-xl sm:text-2xl font-normal leading-relaxed whitespace-pre-wrap block ${
                      isLight ? 'text-slate-800' : 'text-slate-300'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Bottom Bar: Exact Replica of ProjectorView Bottom Bar */}
            <div className={`flex items-end justify-between pt-5 border-t ${isLight ? 'border-slate-200/90 text-slate-600' : 'border-slate-800/80 text-slate-400'}`}>
              <div className="flex items-center space-x-4">
                <div
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs border select-none ${
                    isLight
                      ? 'bg-white/95 border-slate-200/90 shadow-xs text-slate-700'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span>Join:</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>
                    {typeof window !== 'undefined' ? `${window.location.origin}/j/LIVE` : 'http://localhost:3000/j/LIVE'}
                  </span>
                  <span className={isLight ? 'text-slate-400' : 'text-slate-600'}>|</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>Code: LIVE</span>
                </div>
              </div>

              <div className="flex items-center space-x-5 text-xs font-medium select-none">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className={`font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>0</span>
                  <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>active</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className={`font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>0</span>
                  <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>answered</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
