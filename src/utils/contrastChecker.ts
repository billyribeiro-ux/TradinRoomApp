/**
 * WCAG Contrast Checker - Microsoft Accessibility Standard
 */

function hexToRgb(hex: string): { r: number; g: number; b: number } | undefined {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : undefined;
}

function getLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    const sRGB = val / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(foreground: string, background: string): number {
  const fgLum = getLuminance(foreground);
  const bgLum = getLuminance(background);
  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWCAG_AA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5;
}

export function getContrastLevel(foreground: string, background: string): {
  ratio: number;
  level: 'AAA' | 'AA' | 'AA Large' | 'Fail';
  passes: boolean;
} {
  const ratio = getContrastRatio(foreground, background);
  
  if (ratio >= 7.0) return { ratio, level: 'AAA', passes: true };
  if (ratio >= 4.5) return { ratio, level: 'AA', passes: true };
  if (ratio >= 3.0) return { ratio, level: 'AA Large', passes: true };
  return { ratio, level: 'Fail', passes: false };
}
