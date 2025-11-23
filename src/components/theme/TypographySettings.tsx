import { Type } from 'lucide-react';
import { useEffect } from 'react';

import { useThemeStore } from '../../store/themeStore';

/**
 * Font options for typography selection
 */
const FONT_OPTIONS = [
  { value: 'system-ui, -apple-system, sans-serif', label: 'System Default' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'Poppins, sans-serif', label: 'Poppins' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
];

/**
 * TypographySettings Component
 * ---------------------------
 * Allows users to customize typography settings.
 * - Font family selector
 * - Base and heading font sizes
 * - Font weights (normal/bold)
 * - Live preview
 * - Applies changes to CSS variables and theme store
 */
export function TypographySettings() {
  const { typography, setTypography } = useThemeStore();

  // Live sync font family to CSS variable for preview
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-font', typography.fontFamily);
    root.style.setProperty('--font-size-base', typography.fontSizeBase);
    root.style.setProperty('--font-size-heading', typography.fontSizeHeading);
  }, [typography]);

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypography({
      ...typography,
      fontFamily: e.target.value,
    });
  };

  const handleFontSizeBaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTypography({
      ...typography,
      fontSizeBase: e.target.value,
    });
  };

  const handleFontSizeHeadingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTypography({
      ...typography,
      fontSizeHeading: e.target.value,
    });
  };

  const handleFontWeightNormalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypography({
      ...typography,
      fontWeightNormal: e.target.value,
    });
  };

  const handleFontWeightBoldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypography({
      ...typography,
      fontWeightBold: e.target.value,
    });
  };

  return (
    <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-5 space-y-6">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Type className="w-5 h-5 text-blue-400" />
        Typography
      </h3>

      {/* Font Family */}
      <div>
        <label
          htmlFor="fontFamily"
          className="block text-sm text-slate-400 mb-2"
        >
          Font Family
        </label>
        <select
          id="fontFamily"
          value={typography.fontFamily}
          onChange={handleFontFamilyChange}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {FONT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">
          Base font for all text elements
        </p>
      </div>

      {/* Font Sizes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="fontSizeBase"
            className="block text-sm text-slate-400 mb-2"
          >
            Base Font Size
          </label>
          <input
            id="fontSizeBase"
            type="text"
            value={typography.fontSizeBase}
            onChange={handleFontSizeBaseChange}
            placeholder="16px"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-500 mt-1">Body text size</p>
        </div>

        <div>
          <label
            htmlFor="fontSizeHeading"
            className="block text-sm text-slate-400 mb-2"
          >
            Heading Font Size
          </label>
          <input
            id="fontSizeHeading"
            type="text"
            value={typography.fontSizeHeading}
            onChange={handleFontSizeHeadingChange}
            placeholder="24px"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-500 mt-1">Header text size</p>
        </div>
      </div>

      {/* Font Weights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="fontWeightNormal"
            className="block text-sm text-slate-400 mb-2"
          >
            Normal Weight
          </label>
          <select
            id="fontWeightNormal"
            value={typography.fontWeightNormal}
            onChange={handleFontWeightNormalChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="300">Light (300)</option>
            <option value="400">Normal (400)</option>
            <option value="500">Medium (500)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="fontWeightBold"
            className="block text-sm text-slate-400 mb-2"
          >
            Bold Weight
          </label>
          <select
            id="fontWeightBold"
            value={typography.fontWeightBold}
            onChange={handleFontWeightBoldChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="600">Semi-Bold (600)</option>
            <option value="700">Bold (700)</option>
            <option value="800">Extra Bold (800)</option>
          </select>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-6 p-5 bg-slate-800 rounded-lg border border-slate-700">
        <p className="text-sm text-slate-400 mb-3">Typography Preview</p>
        <div style={{ fontFamily: typography.fontFamily }}>
          <h2
            style={{
              fontSize: typography.fontSizeHeading,
              fontWeight: typography.fontWeightBold,
            }}
            className="text-white mb-2"
          >
            Heading Text Sample
          </h2>
          <p
            style={{
              fontSize: typography.fontSizeBase,
              fontWeight: typography.fontWeightNormal,
            }}
            className="text-slate-300"
          >
            This is body text using your selected typography settings. The quick brown fox jumps over the lazy dog.
          </p>
        </div>
      </div>
    </div>
  );
}
