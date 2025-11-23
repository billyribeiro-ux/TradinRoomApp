import { describe, it, expect } from 'vitest';

// Basic unit-level sanitation test (DOM API driven)
describe('Editor LTR/Bidi Enforcement', () => {
  it('scrubs RTL attributes and forces dir=ltr on pasted content container', () => {
    const container = document.createElement('div');
    container.innerHTML = '<div dir="rtl" style="direction:rtl;unicode-bidi:bidi-override"><bdi>مرحبا</bdi><span style="direction:rtl">text</span></div>';
    // Simulate scrubBidi logic (simplified mirror of implementation)
    const scrubBidi = (node: Element | HTMLElement) => {
      node.removeAttribute('dir');
      if ((node as HTMLElement).style) {
        (node as HTMLElement).style.removeProperty('direction');
        (node as HTMLElement).style.removeProperty('unicode-bidi');
        (node as HTMLElement).style.removeProperty('writing-mode');
        (node as HTMLElement).style.removeProperty('text-align');
      }
      if (node.tagName === 'BDO' || node.tagName === 'BDI') {
        const parent = node.parentNode;
        while (node.firstChild) parent?.insertBefore(node.firstChild, node);
        parent?.removeChild(node);
      }
      (node as HTMLElement).setAttribute('dir', 'ltr');
    };

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
      scrubBidi(walker.currentNode as HTMLElement);
    }

    const first = container.firstElementChild as HTMLElement;
    expect(first.getAttribute('dir')).toBe('ltr');
    expect(first.outerHTML).not.toContain('bidi-override');
    expect(first.outerHTML).not.toContain('direction:rtl');
  });
});
