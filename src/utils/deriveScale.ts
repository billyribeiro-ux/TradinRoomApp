/**
 * Derives a scale factor from container dimensions based on a baseline size
 * @param w Container width
 * @param h Container height
 * @param baseW Baseline width (default 1920)
 * @param baseH Baseline height (default 1080)
 * @returns Scale factor between 0.6 and 1.25
 */
export function deriveScale(w: number, h: number, baseW = 1920, baseH = 1080) {
  const s = Math.max(0.6, Math.min(1.25, Math.min(w / baseW, h / baseH)));
  return Number(s.toFixed(2));
}

