import { X, Settings, Palette, Upload, Download, RotateCcw, Save, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useThemeStore } from "../../store/themeStore";
import { useToastStore } from "../../store/toastStore";

import { AccentGradientSettings } from "./AccentGradientSettings";
import { AdvancedBrandingSettingsPhase2, AdvancedBrandingSettingsPhase3 } from "./AdvancedBrandingSettings";
import { BrandingSettings } from "./BrandingSettings";
import { TypographySettings } from "./TypographySettings";


interface ThemeSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ThemeSettingsPanel — Fluent right-drawer
 * ----------------------------------------
 * • Central hub for theme customization
 * • Handles import/export/reset directly via themeStore
 * • Updates all CSS vars in real-time
 */
export function ThemeSettingsPanel({ isOpen, onClose }: ThemeSettingsPanelProps) {
  const { colors, currentTheme, saveTheme, importTheme, exportTheme, resetTheme } = useThemeStore();
  const { addToast } = useToastStore();
  const [saving, setSaving] = useState(false);

  // 🔹 Live sync colors to CSS variables
  useEffect(() => {
    if (!colors) return;
    const root = document.documentElement;
    root.style.setProperty("--color-bg-primary", colors.backgroundPrimary);
    root.style.setProperty("--color-bg-secondary", colors.backgroundSecondary);
    root.style.setProperty("--color-bg-accent", colors.accent);
    root.style.setProperty("--color-text-primary", colors.textPrimary);
    root.style.setProperty("--color-text-secondary", colors.textSecondary);
    root.style.setProperty("--color-border", colors.border);
  }, [colors]);

  // 🔹 ESC to close, scroll-lock body
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // 🔹 Add body class for visual HUD effects
  useEffect(() => {
    document.body.classList.toggle("theme-panel-open", isOpen);
  }, [isOpen]);

  /**
   * Handle saving theme to database
   */
  const handleSave = async () => {
    if (!currentTheme) {
      addToast('No theme to save', 'error');
      return;
    }

    setSaving(true);
    try {
      await saveTheme(currentTheme);
      addToast('Theme saved successfully', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save theme';
      addToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>

      {/* Drawer */}
      <aside
        className={`absolute top-0 right-0 h-full bg-slate-900/95 backdrop-blur-2xl border-l border-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.6)] transform-gpu transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] flex flex-col overflow-y-auto ${
          isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
        style={{
          width:
            window.innerWidth < 640
              ? "100vw"
              : window.innerWidth < 1024
              ? "min(480px, 80vw)"
              : "clamp(420px, 30vw, 520px)",
          color: colors.textPrimary,
        }}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 z-10 bg-gradient-to-b from-slate-900/95 to-slate-900/80 backdrop-blur-xl shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Theme & Branding</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-blue-600/20 focus:ring-2 focus:ring-blue-600/40"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-10">
          <section>
            <h3 className="text-base font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-400" /> Brand Identity
            </h3>
            <BrandingSettings />
          </section>

          <section>
            <AdvancedBrandingSettingsPhase2 onClose={() => {}} />
          </section>

          <section>
            <AdvancedBrandingSettingsPhase3 onClose={() => {}} />
          </section>

          <section>
            <TypographySettings />
          </section>

          <section>
            <AccentGradientSettings />
          </section>
        </div>

        {/* Footer Toolbar */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-700 bg-slate-900/50">
          {/* Import */}
          <label
            htmlFor="import-theme"
            className="cursor-pointer px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Import
            <input
              id="import-theme"
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const text = await file.text();
                  const themeJson = JSON.parse(text) as Record<string, unknown>;
                  importTheme(themeJson);
                  addToast("Theme imported successfully", "success");
                } catch (error) {
                  const message = error instanceof Error ? error.message : "Failed to import theme file";
                  addToast(message, "error");
                }
                e.target.value = "";
              }}
            />
          </label>

          {/* Export */}
          <button
            onClick={() => {
              try {
                const themeJson = exportTheme();
                const blob = new Blob([JSON.stringify(themeJson, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `theme-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                addToast('Theme exported successfully', 'success');
              } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to export theme';
                addToast(message, 'error');
              }
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export
          </button>

          {/* Save Theme */}
          <button
            onClick={handleSave}
            disabled={saving || !currentTheme}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Theme
              </>
            )}
          </button>

          {/* Reset */}
          <button
            onClick={() => {
              const confirmReset = window.confirm(
                "Reset to default theme? This will erase all custom colors and fonts."
              );
              if (confirmReset) resetTheme();
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </aside>
    </div>
  );
}
