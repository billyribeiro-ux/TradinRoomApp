import { Eye, Sun, Moon, Palette } from 'lucide-react';
import { useState } from 'react';

import { useThemeStore } from '../store/themeStore';

export function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { setColors } = useThemeStore();

  const palettes = [
    { name: 'Dark', icon: Moon, colors: { primary: '#2563eb', background: '#0f172a', text: '#f8fafc' } },
    { name: 'Light', icon: Sun, colors: { primary: '#2563eb', background: '#ffffff', text: '#1e293b' } },
    { name: 'Blue', icon: Palette, colors: { primary: '#3b82f6', background: '#1e3a8a', text: '#dbeafe' } },
    { name: 'Green', icon: Palette, colors: { primary: '#10b981', background: '#064e3b', text: '#d1fae5' } },
    { name: 'Purple', icon: Palette, colors: { primary: '#8b5cf6', background: '#3c1547', text: '#e9d5ff' } },
    { name: 'Orange', icon: Palette, colors: { primary: '#f97316', background: '#7c2d12', text: '#fed7aa' } },
  ];

  const applyPalette = (palette: typeof palettes[0]) => {
    setColors({
      primary: palette.colors.primary,
      secondary: palette.colors.primary,
      accent: palette.colors.primary,
      background: palette.colors.background,
      surface: palette.colors.background,
      text: palette.colors.text,
      textSecondary: palette.colors.text,
      border: palette.colors.primary,
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      textPrimary: palette.colors.text,
      textMuted: palette.colors.text,
      backgroundPrimary: palette.colors.background,
      backgroundSecondary: palette.colors.background,
    });
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:scale-110"
        title="Theme Switcher"
      >
        <Eye className="w-5 h-5" />
      </button>

      {/* Palette Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-16 right-0 bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-4 w-64 z-50 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Color Themes
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {palettes.map((palette) => {
                const Icon = palette.icon;
                return (
                  <button
                    key={palette.name}
                    onClick={() => applyPalette(palette)}
                    className="p-3 rounded-lg border-2 transition-all hover:scale-105 flex flex-col items-center gap-2"
                    style={{
                      backgroundColor: palette.colors.background,
                      borderColor: palette.colors.primary,
                    }}
                    title={palette.name}
                  >
                    <Icon className="w-5 h-5" style={{ color: palette.colors.text }} />
                    <span className="text-xs font-medium" style={{ color: palette.colors.text }}>
                      {palette.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

