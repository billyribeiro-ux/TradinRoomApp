// ============================================================================
// POINTER UTILITIES - SSOT for pointer coordinate extraction (L65 hardened)
// ============================================================================
// Single source of truth for converting DOM pointer events to canvas-relative
// logical CSS pixels. Eliminates per-tool drift.
// ============================================================================

/**
 * Get pointer position in canvas-relative logical CSS pixels.
 * SSOT for all pointer event handling.
 */
export function getPointerInCanvas(
  e: PointerEvent | MouseEvent,
  el: HTMLElement
): { x: number; y: number } {
  const rect = el.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }; // logical CSS px
}
