// ============================================================================
// KEYBOARD SHORTCUTS - Whiteboard Hotkeys
// ============================================================================
// Handles keyboard shortcuts for whiteboard operations
// ============================================================================

import { useEffect } from 'react';
import { useWhiteboardStore } from '../state/whiteboardStore';

export function useKeyboardShortcuts(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If focus is inside an input, textarea, contentEditable, or the whiteboard text editor,
      // do not process global shortcuts to avoid interfering with typing.
      const active = document.activeElement as HTMLElement | null;
      const target = (e.target as HTMLElement) || active;
      const isEditable = !!(
        target && (
          target.closest('.wb-text-editor') ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'INPUT' ||
          target.isContentEditable
        )
      );
      if (isEditable) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Cmd/Ctrl + Z
      if (cmdOrCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useWhiteboardStore.getState().undo();
        return;
      }

      // Redo: Cmd/Ctrl + Shift + Z (Mac) or Ctrl + Y (Windows)
      if ((cmdOrCtrl && e.key === 'z' && e.shiftKey) || (cmdOrCtrl && e.key === 'y')) {
        e.preventDefault();
        useWhiteboardStore.getState().redo();
        return;
      }

      // Bold: Cmd/Ctrl + B
      if (cmdOrCtrl && e.key === 'b') {
        e.preventDefault();
        useWhiteboardStore.getState().toggleBold();
        return;
      }

      // Font Size Up: Cmd/Ctrl + =
      if (cmdOrCtrl && e.key === '=') {
        e.preventDefault();
        const store = useWhiteboardStore.getState();
        store.setFontSize(Math.min(128, store.fontSize + 2));
        return;
      }

      // Font Size Down: Cmd/Ctrl + -
      if (cmdOrCtrl && e.key === '-') {
        e.preventDefault();
        const store = useWhiteboardStore.getState();
        store.setFontSize(Math.max(8, store.fontSize - 2));
        return;
      }

      // Tool shortcuts
      if (!cmdOrCtrl && !e.shiftKey && !e.altKey) {
        const store = useWhiteboardStore.getState();
        
        switch (e.key.toLowerCase()) {
          case 'v':
            e.preventDefault();
            store.setTool('select');
            break;
          case 'h':
            e.preventDefault();
            store.setTool('hand');
            break;
          case 'p':
            e.preventDefault();
            store.setTool('pen');
            break;
          case 'e':
            e.preventDefault();
            store.setTool('eraser');
            break;
          case 'r':
            e.preventDefault();
            store.setTool('rectangle');
            break;
          case 'c':
            e.preventDefault();
            store.setTool('circle');
            break;
          case 'l':
            e.preventDefault();
            store.setTool('line');
            break;
          case 'a':
            e.preventDefault();
            store.setTool('arrow');
            break;
          case 't':
            e.preventDefault();
            store.setTool('text');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);
}
