/**
 * Theme Validator - Microsoft Enterprise Pattern
 */

import type { ThemeDraft } from '../store/themeStore';

function isValidColor(color: unknown): boolean {
  if (typeof color !== 'string') return false;
  return /^#[0-9A-F]{6}$/i.test(color) || /^#[0-9A-F]{3}$/i.test(color);
}

function validateColors(colors: unknown): boolean {
  if (!colors || typeof colors !== 'object') return false;
  
  const requiredColors = ['primary', 'secondary', 'accent', 'background', 'text'];
  const colorObj = colors as Record<string, unknown>;
  
  return requiredColors.every(key => key in colorObj && isValidColor(colorObj[key]));
}

export function validateTheme(themeJson: unknown): themeJson is ThemeDraft {
  if (!themeJson || typeof themeJson !== 'object') {
    console.error('[ThemeValidator] Theme is not an object');
    return false;
  }
  
  const theme = themeJson as Record<string, unknown>;
  
  if (!validateColors(theme.colors)) {
    console.error('[ThemeValidator] Invalid colors');
    return false;
  }
  
  return true;
}

export function sanitizeTheme(themeJson: unknown): ThemeDraft | undefined {
  if (!validateTheme(themeJson)) {
    return undefined;
  }
  
  return themeJson;
}
