import { Theme } from '../types/activity.js';

export interface ThemeDefinition extends Theme {
  id: string;
  category: 'light' | 'dark';
  description: string;
}

export const availableThemes: ThemeDefinition[] = [
  // ─── LIGHT THEMES ────────────────────────────────────────────────
  {
    id: 'airact_pure_white',
    name: 'AirAct Studio White',
    category: 'light',
    is_light: true,
    texture: 'none',
    description: 'Crisp gallery white with AirAct blue & green accents',
    palette: {
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      accent: '#0284c7',
      positive: '#16a34a',
      negative: '#dc2626',
    },
    fonts: {
      heading: 'Plus Jakarta Sans',
      body: 'Plus Jakarta Sans',
    },
  },
  {
    id: 'nordic_frost_dots',
    name: 'Nordic Frost (Dots)',
    category: 'light',
    is_light: true,
    texture: 'dots',
    description: 'Cool icy background with subtle architectural micro-dot grid',
    palette: {
      background: '#f1f5f9',
      surface: '#ffffff',
      text: '#0f172a',
      accent: '#4f46e5',
      positive: '#10b981',
      negative: '#ef4444',
    },
    fonts: {
      heading: 'Plus Jakarta Sans',
      body: 'Plus Jakarta Sans',
    },
  },
  {
    id: 'botanical_sage_mesh',
    name: 'Botanical Sage (Mesh)',
    category: 'light',
    is_light: true,
    texture: 'mesh',
    description: 'Refreshing organic mint background with soft ambient gradient mesh',
    palette: {
      background: '#f0fdf4',
      surface: '#ffffff',
      text: '#064e3b',
      accent: '#10b981',
      positive: '#059669',
      negative: '#f43f5e',
    },
    fonts: {
      heading: 'Plus Jakarta Sans',
      body: 'Plus Jakarta Sans',
    },
  },
  {
    id: 'warm_parchment_paper',
    name: 'Warm Linen (Parchment)',
    category: 'light',
    is_light: true,
    texture: 'paper',
    description: 'Comforting bookish linen texture with terracotta amber tones',
    palette: {
      background: '#fefce8',
      surface: '#ffffff',
      text: '#1c1917',
      accent: '#d97706',
      positive: '#15803d',
      negative: '#dc2626',
    },
    fonts: {
      heading: 'Plus Jakarta Sans',
      body: 'Plus Jakarta Sans',
    },
  },
  {
    id: 'executive_grid_light',
    name: 'Executive Grid (Technical)',
    category: 'light',
    is_light: true,
    texture: 'grid',
    description: 'Professional engineering graph grid in high-contrast crisp slate',
    palette: {
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1e293b',
      accent: '#2563eb',
      positive: '#10b981',
      negative: '#ef4444',
    },
    fonts: {
      heading: 'Plus Jakarta Sans',
      body: 'Plus Jakarta Sans',
    },
  },

  // ─── DARK THEMES ─────────────────────────────────────────────────
  {
    id: 'modern_indigo_dots',
    name: 'Modern Indigo (Dots)',
    category: 'dark',
    is_light: false,
    texture: 'dots',
    description: 'Signature midnight slate with subtle dot matrix lighting',
    palette: {
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f8fafc',
      accent: '#6366f1',
      positive: '#10b981',
      negative: '#ef4444',
    },
    fonts: {
      heading: 'Plus Jakarta Sans',
      body: 'Plus Jakarta Sans',
    },
  },
  {
    id: 'emerald_night_mesh',
    name: 'Emerald Night (Mesh)',
    category: 'dark',
    is_light: false,
    texture: 'crosshatch',
    description: 'Deep forest darkness with diagonal weave texture & mint glow',
    palette: {
      background: '#022c22',
      surface: '#064e3b',
      text: '#ecfdf5',
      accent: '#10b981',
      positive: '#34d399',
      negative: '#f87171',
    },
    fonts: {
      heading: 'Plus Jakarta Sans',
      body: 'Plus Jakarta Sans',
    },
  },
  {
    id: 'midnight_cyber_grid',
    name: 'Midnight Cyber (Grid)',
    category: 'dark',
    is_light: false,
    texture: 'grid',
    description: 'Pitch black with glowing amber accents and subtle technical grid',
    palette: {
      background: '#09090b',
      surface: '#18181b',
      text: '#fafafa',
      accent: '#f59e0b',
      positive: '#22c55e',
      negative: '#ef4444',
    },
    fonts: {
      heading: 'Plus Jakarta Sans',
      body: 'Plus Jakarta Sans',
    },
  },
  {
    id: 'deep_galaxy_waves',
    name: 'Deep Galaxy (Waves)',
    category: 'dark',
    is_light: false,
    texture: 'waves',
    description: 'Cosmic deep purple with ambient wave radiance and neon violet accents',
    palette: {
      background: '#1e1b4b',
      surface: '#312e81',
      text: '#faf5ff',
      accent: '#a855f7',
      positive: '#10b981',
      negative: '#f43f5e',
    },
    fonts: {
      heading: 'Plus Jakarta Sans',
      body: 'Plus Jakarta Sans',
    },
  },
  {
    id: 'obsidian_lines_dark',
    name: 'Obsidian Minimal (Lines)',
    category: 'dark',
    is_light: false,
    texture: 'lines',
    description: 'Ultra dark stealth graphite with subtle horizontal ruled scanlines',
    palette: {
      background: '#030712',
      surface: '#111827',
      text: '#f9fafb',
      accent: '#38bdf8',
      positive: '#34d399',
      negative: '#fb7185',
    },
    fonts: {
      heading: 'Plus Jakarta Sans',
      body: 'Plus Jakarta Sans',
    },
  },
];

export function isThemeLight(theme: Theme | undefined): boolean {
  if (!theme || !theme.palette) return false;
  if (theme.is_light !== undefined) return theme.is_light;
  const bg = theme.palette.background?.toLowerCase() || '';
  return bg === '#ffffff' || bg.startsWith('#f') || bg.startsWith('#e');
}

/**
 * Returns CSS properties representing the theme background and texture
 */
export function getThemeTextureStyle(theme: Theme | undefined): React.CSSProperties {
  if (!theme || !theme.palette) {
    return {
      backgroundColor: '#0f172a',
      color: '#f8fafc',
    };
  }

  const isLight = isThemeLight(theme);

  const base: React.CSSProperties = {
    backgroundColor: theme.palette.background,
    color: theme.palette.text,
  };

  const texture = theme.texture || 'none';

  switch (texture) {
    case 'dots':
      return {
        ...base,
        backgroundImage: isLight
          ? 'radial-gradient(rgba(100, 116, 139, 0.22) 1.2px, transparent 1.2px)'
          : 'radial-gradient(rgba(148, 163, 184, 0.18) 1.2px, transparent 1.2px)',
        backgroundSize: '24px 24px',
      };

    case 'grid':
      return {
        ...base,
        backgroundImage: isLight
          ? 'linear-gradient(to right, rgba(148, 163, 184, 0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.16) 1px, transparent 1px)'
          : 'linear-gradient(to right, rgba(255, 255, 255, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.07) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      };

    case 'mesh':
      return {
        ...base,
        backgroundImage: isLight
          ? 'radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.14) 0px, transparent 55%), radial-gradient(at 100% 100%, rgba(2, 132, 199, 0.14) 0px, transparent 55%)'
          : 'radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.2) 0px, transparent 55%), radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.2) 0px, transparent 55%)',
      };

    case 'paper':
      return {
        ...base,
        backgroundImage: isLight
          ? 'radial-gradient(rgba(180, 83, 9, 0.07) 1px, transparent 0), radial-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 0)'
          : 'radial-gradient(rgba(245, 158, 11, 0.07) 1px, transparent 0)',
        backgroundSize: '16px 16px',
      };

    case 'crosshatch':
      return {
        ...base,
        backgroundImage: isLight
          ? 'repeating-linear-gradient(45deg, rgba(148, 163, 184, 0.12) 0, rgba(148, 163, 184, 0.12) 1px, transparent 0, transparent 16px)'
          : 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.05) 0, rgba(255, 255, 255, 0.05) 1px, transparent 0, transparent 18px)',
      };

    case 'waves':
      return {
        ...base,
        backgroundImage: isLight
          ? 'radial-gradient(ellipse at 50% 100%, rgba(99, 102, 241, 0.14), transparent 70%), radial-gradient(ellipse at 10% 0%, rgba(2, 132, 199, 0.1), transparent 60%)'
          : 'radial-gradient(ellipse at 50% 100%, rgba(168, 85, 247, 0.22), transparent 70%), radial-gradient(ellipse at 10% 0%, rgba(99, 102, 241, 0.18), transparent 60%)',
      };

    case 'lines':
      return {
        ...base,
        backgroundImage: isLight
          ? 'repeating-linear-gradient(0deg, rgba(148, 163, 184, 0.12), rgba(148, 163, 184, 0.12) 1px, transparent 1px, transparent 24px)'
          : 'repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.06) 1px, transparent 1px, transparent 24px)',
      };

    case 'none':
    default:
      return base;
  }
}

export function getFieldTextStyle(styles?: Record<string, any>, fieldKey?: string): React.CSSProperties {
  if (!styles || !fieldKey || !styles[fieldKey]) return {};
  const s = styles[fieldKey];
  const res: React.CSSProperties = {};
  if (s.color) res.color = s.color;
  if (s.fontSize) res.fontSize = s.fontSize;
  if (s.fontFamily) res.fontFamily = s.fontFamily;
  if (s.align) res.textAlign = s.align;
  return res;
}
