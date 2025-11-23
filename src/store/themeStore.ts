/**
 * Theme store using Zustand
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { themeRepository } from '../repositories/themeRepository';

import { useAuthStore } from './authStore';
// Emergency fix: Define missing types locally
export interface ThemeDraft {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  accentColor?: string;
  logoUrl?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    textPrimary: string;
    textMuted: string;
    backgroundPrimary: string;
    backgroundSecondary: string;
  };
  uiStyle: {
    borderRadius: number;
    spacing: number;
    fontSize: string;
    fontFamily: string;
    iconTheme: string;
  };
  motion: {
    type?: string;
    duration: string;
    easing: string;
    reduceMotion: boolean;
  };
}

export interface Theme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  accentColor?: string;
  logoUrl?: string;
  created_at: string;
  updated_at: string;
}
// Fixed: 2025-01-24 - Eradicated 6 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types


export interface ThemeState {
  // Theme data
  currentTheme: ThemeDraft | undefined;
  themes: Theme[];
  isLoading: boolean;
  error: string | undefined;
  
  // Theme identity (separate from brand)
  themeName: string;
  setThemeName: (name: string) => void;
  
  // Theme opacity controls overall UI opacity (0-100)
  themeOpacity: number;
  setThemeOpacity: (opacity: number) => void;

  // Theme actions
  setCurrentTheme: (theme: ThemeDraft | undefined) => void;
  setThemes: (themes: Theme[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
  
  // Theme management
  saveTheme: (theme: ThemeDraft) => Promise<void>;
  loadTheme: (themeId: string) => Promise<void>;
  deleteTheme: (themeId: string) => Promise<void>;
  applyTheme: (theme: ThemeDraft) => void;
  resetTheme: () => void;
  
  // Theme building
  buildThemeJson: (theme: ThemeDraft) => Record<string, unknown>;
  applyThemeByJson: (themeJson: Record<string, unknown>) => void;
  
  // Theme restoration
  restoreLastTheme: () => void;
  
  // Theme properties (for backward compatibility)
  colors: ThemeDraft['colors'];
  setColors: (colors: ThemeDraft['colors']) => void;
  uiStyle: ThemeDraft['uiStyle'];
  setUIStyle: (uiStyle: ThemeDraft['uiStyle']) => void;
  motion: ThemeDraft['motion'];
  setMotion: (motion: ThemeDraft['motion']) => void;
  businessName: string;
  setBusinessName: (name: string) => void;
  logoUrl: string | undefined;
  setLogoUrl: (url: string | undefined) => void;
  
  // Additional properties for AdvancedBrandSettings
  typography: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    fontSizeBase: string;
    fontSizeHeading: string;
    fontWeightNormal: string;
    fontWeightBold: string;
  };
  setTypography: (typography: ThemeState['typography']) => void;
  icons: {
    iconTheme: string;
    iconSize: string;
    iconColor: string;
    style: string;
    size: string;
    roomIcon: string;
  };
  setIcons: (icons: ThemeState['icons']) => void;
  
  // Theme import/export
  importTheme: (themeJson: Record<string, unknown>) => void;
  exportTheme: () => Record<string, unknown>;
}

// Default theme
const defaultTheme: ThemeDraft = {
  primaryColor: '#3B82F6',
  secondaryColor: '#6B7280',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  borderColor: '#E5E7EB',
  accentColor: '#F59E0B',
  logoUrl: undefined,
  colors: {
    primary: '#3B82F6',
    secondary: '#6B7280',
    accent: '#F59E0B',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    textPrimary: '#1F2937',
    textMuted: '#9CA3AF',
    backgroundPrimary: '#FFFFFF',
    backgroundSecondary: '#F9FAFB'
  },
  uiStyle: {
    borderRadius: 8,
    spacing: 16,
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    iconTheme: 'outline'
  },
  motion: {
    duration: '0.2s',
    easing: 'ease-in-out',
    reduceMotion: false
  }
};

export const useThemeStore = create<ThemeState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentTheme: defaultTheme,
    themes: [],
    isLoading: false,
    error: undefined,
    themeOpacity: 100,
    colors: defaultTheme.colors,
    uiStyle: defaultTheme.uiStyle,
    motion: defaultTheme.motion,
    themeName: 'Default Theme',
    businessName: 'Wilbur',
    logoUrl: undefined,
    typography: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      fontWeight: '400',
      lineHeight: '1.5',
      fontSizeBase: '14px',
      fontSizeHeading: '24px',
      fontWeightNormal: '400',
      fontWeightBold: '700'
    },
    icons: {
      iconTheme: 'outline',
      iconSize: '16px',
      iconColor: '#6B7280',
      style: 'outline',
      size: '16px',
      roomIcon: 'Radio'
    },

    // Theme actions
    setCurrentTheme: (theme) => set({ currentTheme: theme }),
    setThemes: (themes) => set({ themes }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),

    // Theme management
    saveTheme: async (theme) => {
      set({ isLoading: true, error: undefined });
      try {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) {
          throw new Error('User not authenticated');
        }

        const themeJson = get().buildThemeJson(theme);
        const themeName = get().themeName || 'My Theme';

        // Check if user has existing themes
        const existingThemes = await themeRepository.getThemesByUser(userId);
        const existing = existingThemes.find(t => t.name === themeName);

        if (existing) {
          // Update existing theme
          const updated = await themeRepository.updateTheme(existing.id, {
            name: themeName,
            theme_json: themeJson as any,
            description: `Theme updated at ${new Date().toLocaleString()}`
          });

          if (import.meta.env.DEV) {
            console.debug('[themeStore] Theme updated:', updated.id);
          }
        } else {
          // Create new theme
          const created = await themeRepository.createTheme({
            userId,
            name: themeName,
            description: `Theme created at ${new Date().toLocaleString()}`,
            themeJson: themeJson as any
          });

          if (import.meta.env.DEV) {
            console.debug('[themeStore] Theme created:', created.id);
          }
        }

        // Update local state
        set({ currentTheme: theme, isLoading: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save theme';
        console.error('[themeStore] Error saving theme:', error);
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    loadTheme: async (themeId) => {
      set({ isLoading: true, error: undefined });
      try {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) {
          throw new Error('User not authenticated');
        }

        const themes = await themeRepository.getThemesByUser(userId);
        const theme = themes.find(t => t.id === themeId);
        
        if (!theme) {
          throw new Error('Theme not found');
        }

        // Apply theme from JSON
        get().applyThemeByJson(theme.theme_json as Record<string, unknown>);

        // Update local state without overwriting brand
        set({ isLoading: false, themeName: theme.name });

        if (import.meta.env.DEV) {
          console.debug('[themeStore] Theme loaded:', themeId);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load theme';
        console.error('[themeStore] Error loading theme:', error);
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    deleteTheme: async (themeId) => {
      set({ isLoading: true, error: undefined });
      try {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) {
          throw new Error('User not authenticated');
        }

        await themeRepository.deleteTheme(themeId, userId);

        // Remove from local themes array
        const themes = get().themes.filter(t => t.id !== themeId);
        set({ themes, isLoading: false });

        if (import.meta.env.DEV) {
          console.debug('[themeStore] Theme deleted:', themeId);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete theme';
        console.error('[themeStore] Error deleting theme:', error);
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    applyTheme: (theme) => {
      set({ currentTheme: theme });
      
      // Batch DOM updates for better performance - Microsoft Pattern
      requestAnimationFrame(() => {
        const root = document.documentElement;
        const { style } = root;
        
        // Batch all CSS variable updates
        const updates: [string, string][] = [
          ['--color-primary', theme.colors.primary],
          ['--color-secondary', theme.colors.secondary],
          ['--color-accent', theme.colors.accent],
          ['--color-background', theme.colors.background],
          ['--color-surface', theme.colors.surface],
          ['--color-text', theme.colors.text],
          ['--color-text-secondary', theme.colors.textSecondary],
          ['--color-border', theme.colors.border],
          ['--color-success', theme.colors.success],
          ['--color-warning', theme.colors.warning],
          ['--color-error', theme.colors.error],
          ['--color-info', theme.colors.info],
        ];
        
        // Apply all updates in one batch (reduces layout thrashing)
        updates.forEach(([property, value]) => {
          style.setProperty(property, value);
        });
        
        // Apply theme opacity
        const opacityPercent = get().themeOpacity;
        const clamped = Math.max(0, Math.min(100, opacityPercent));
        style.setProperty('--theme-opacity', String(clamped / 100));
      });
    },

    resetTheme: () => {
      set({ currentTheme: defaultTheme });
      get().applyTheme(defaultTheme);
    },

    // Theme building
    buildThemeJson: (theme) => {
      return {
        colors: theme.colors,
        uiStyle: theme.uiStyle,
        motion: theme.motion,
        typography: get().typography,
        icons: get().icons,
        businessName: get().businessName,
        logoUrl: get().logoUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    },

    applyThemeByJson: (themeJson) => {
      const colors = themeJson.colors as Record<string, unknown>;
      const theme: ThemeDraft = {
        primaryColor: (typeof colors?.primary === 'string' ? colors.primary : '#3B82F6'),
        secondaryColor: (typeof colors?.secondary === 'string' ? colors.secondary : '#6B7280'),
        backgroundColor: (typeof colors?.background === 'string' ? colors.background : '#FFFFFF'),
        textColor: (typeof colors?.text === 'string' ? colors.text : '#1F2937'),
        borderColor: (typeof colors?.border === 'string' ? colors.border : '#E5E7EB'),
        accentColor: (typeof colors?.accent === 'string' ? colors.accent : '#F59E0B'),
        logoUrl: (typeof themeJson.logoUrl === 'string' ? themeJson.logoUrl : undefined),
        colors: themeJson.colors as ThemeDraft['colors'],
        uiStyle: themeJson.uiStyle as ThemeDraft['uiStyle'],
        motion: themeJson.motion as ThemeDraft['motion']
      };
      set({ currentTheme: theme });
      
      // Apply typography and icons if present
      if (themeJson.typography && typeof themeJson.typography === 'object') {
        const typography = themeJson.typography as Record<string, unknown>;
        if (typography.fontFamily || typography.fontSizeBase || typography.fontSizeHeading) {
          get().setTypography({
            fontFamily: typeof typography.fontFamily === 'string' ? typography.fontFamily : get().typography.fontFamily,
            fontSize: typeof typography.fontSizeBase === 'string' ? typography.fontSizeBase : get().typography.fontSizeBase,
            fontWeight: typeof typography.fontWeightNormal === 'string' ? typography.fontWeightNormal : get().typography.fontWeight,
            lineHeight: typeof typography.lineHeight === 'string' ? typography.lineHeight : get().typography.lineHeight,
            fontSizeBase: typeof typography.fontSizeBase === 'string' ? typography.fontSizeBase : get().typography.fontSizeBase,
            fontSizeHeading: typeof typography.fontSizeHeading === 'string' ? typography.fontSizeHeading : get().typography.fontSizeHeading,
            fontWeightNormal: typeof typography.fontWeightNormal === 'string' ? typography.fontWeightNormal : get().typography.fontWeightNormal,
            fontWeightBold: typeof typography.fontWeightBold === 'string' ? typography.fontWeightBold : get().typography.fontWeightBold
          });
        }
      }
      
      if (themeJson.icons && typeof themeJson.icons === 'object') {
        const icons = themeJson.icons as Record<string, unknown>;
        if (icons.style || icons.size || icons.roomIcon) {
          get().setIcons({
            iconTheme: typeof icons.iconTheme === 'string' ? icons.iconTheme : get().icons.iconTheme,
            iconSize: typeof icons.iconSize === 'string' ? icons.iconSize : get().icons.iconSize,
            iconColor: typeof icons.iconColor === 'string' ? icons.iconColor : get().icons.iconColor,
            style: typeof icons.style === 'string' ? icons.style : get().icons.style,
            size: typeof icons.size === 'string' ? icons.size : get().icons.size,
            roomIcon: typeof icons.roomIcon === 'string' ? icons.roomIcon : get().icons.roomIcon
          });
        }
      }
      
      get().applyTheme(theme);
    },

    // Theme restoration
    restoreLastTheme: () => {
      const lastTheme = localStorage.getItem('lastTheme');
      if (lastTheme) {
        try {
          const theme = JSON.parse(lastTheme);
          get().applyThemeByJson(theme);
        } catch (error) {
          console.error('Failed to restore last theme:', error);
        }
      }
    },

    // Theme properties
    setColors: (colors) => {
      const currentTheme = get().currentTheme;
      if (currentTheme) {
        const updatedTheme = { ...currentTheme, colors };
        set({ currentTheme: updatedTheme, colors });
        get().applyTheme(updatedTheme);
      }
    },

    setUIStyle: (uiStyle) => {
      const currentTheme = get().currentTheme;
      if (currentTheme) {
        const updatedTheme = { ...currentTheme, uiStyle };
        set({ currentTheme: updatedTheme, uiStyle });
        get().applyTheme(updatedTheme);
      }
    },

    setMotion: (motion) => {
      const currentTheme = get().currentTheme;
      if (currentTheme) {
        const updatedTheme = { ...currentTheme, motion };
        set({ currentTheme: updatedTheme, motion });
        get().applyTheme(updatedTheme);
      }
    },

    setThemeName: (name) => set({ themeName: name }),
    setBusinessName: (name) => set({ businessName: name }),
    setLogoUrl: (url) => set({ logoUrl: url }),
    
    // Additional setters for AdvancedBrandSettings
    setTypography: (typography) => set({ typography }),
    setIcons: (icons) => set({ icons }),
    
    // Theme import/export
    importTheme: (themeJson) => {
      get().applyThemeByJson(themeJson);
    },
    
    exportTheme: () => {
      const currentTheme = get().currentTheme;
      if (!currentTheme) {
        return {};
      }
      return get().buildThemeJson(currentTheme);
    },

    // Theme opacity setter updates CSS custom property
    setThemeOpacity: (opacity) => {
      const clamped = Math.max(0, Math.min(100, opacity));
      set({ themeOpacity: clamped });
      document.documentElement.style.setProperty('--theme-opacity', String(clamped / 100));
    }
  }))
);