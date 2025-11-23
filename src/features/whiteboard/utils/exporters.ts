// ============================================================================
// EXPORT UTILITIES - PNG/SVG Export
// ============================================================================
// Export whiteboard to various formats
// ============================================================================

import type { ExportOptions } from '../types';

/**
 * Resolve MIME type from export format.
 * Supports PNG (default), JPEG, and WebP.
 */
function resolveMimeType(format: ExportOptions['format'] | undefined): string {
  switch (format) {
    case 'jpeg':
    case 'jpg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'png':
    default:
      return 'image/png';
  }
}

/**
 * Export canvas to a raster image blob (PNG/JPEG/WebP).
 *
 * NOTE:
 * - For 'image/png' most browsers ignore the quality parameter.
 * - For 'image/jpeg' and 'image/webp', quality (0–1) is respected.
 */
export async function exportToPNG(
  canvas: HTMLCanvasElement,
  options: ExportOptions = { format: 'png' }
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const mimeType = resolveMimeType(options.format);
    const quality = options.quality ?? 0.95;

    const callback = (blob: Blob | null) => {
      if (!blob) {
        console.error('exportToPNG: canvas.toBlob returned null');
        resolve(null);
        return;
      }
      resolve(blob);
    };

    // For PNG, omit quality (it is ignored by most browsers anyway)
    if (mimeType === 'image/png') {
      canvas.toBlob(callback, mimeType);
    } else {
      canvas.toBlob(callback, mimeType, quality);
    }
  });
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy canvas to clipboard as PNG (raster)
 */
export async function copyToClipboard(canvas: HTMLCanvasElement): Promise<void> {
  try {
    const blob = await exportToPNG(canvas, { format: 'png' });
    if (!blob) throw new Error('Failed to export canvas');

    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    throw error;
  }
}

/**
 * Get canvas as data URL (PNG/JPEG/WebP)
 *
 * NOTE:
 * - For 'image/png' quality is typically ignored.
 */
export function getDataURL(
  canvas: HTMLCanvasElement,
  options: ExportOptions = { format: 'png' }
): string {
  const mimeType = resolveMimeType(options.format);
  const quality = options.quality ?? 0.95;

  if (mimeType === 'image/png') {
    return canvas.toDataURL(mimeType);
  }

  return canvas.toDataURL(mimeType, quality);
}

/**
 * Export to SVG by embedding the current canvas raster as an <image>.
 *
 * This is not a true vector export, but provides a resolution-independent
 * container that scales with DPI.
 */
export function exportToSVG(
  canvas: HTMLCanvasElement,
  options: ExportOptions = { format: 'svg' }
): string {
  const width = canvas.width;
  const height = canvas.height;
  const dpi = options.dpi ?? 96;
  const scale = dpi / 96;

  const svgWidth = width * scale;
  const svgHeight = height * scale;

  // Get canvas as data URL and embed in SVG
  const dataUrl = canvas.toDataURL('image/png');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image width="${width}" height="${height}" xlink:href="${dataUrl}"/>
</svg>`;

  return svg;
}

/**
 * Download SVG as file
 */
export function downloadSVG(svg: string, filename: string): void {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  downloadBlob(blob, filename);
}
