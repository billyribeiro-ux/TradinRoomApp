// ============================================================================
// TEXT EDITOR - Inline Text Editing with Cursor & Selection
// ============================================================================
// Positioned textarea overlay for text tool with full formatting support
// ============================================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { useWhiteboardStore } from '../state/whiteboardStore';
import { worldToScreen } from '../utils/transform';
import { debug } from '../utils/debug';
import type { WhiteboardPoint } from '../types';

interface TextEditorProps {
  position: WhiteboardPoint;
  initialText?: string;
  nodeId?: string;
  onComplete: (text: string) => void;
  onCancel: () => void;
  onUpdate?: (text: string) => void;
  // Optional viewport dimensions to correctly position overlay relative to canvas
  viewportWidth?: number;
  viewportHeight?: number;
}

export function TextEditor({
  position,
  initialText = '',
  nodeId,
  onComplete,
  onCancel,
  onUpdate,
  viewportWidth,
  viewportHeight,
}: TextEditorProps) {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const viewport = useWhiteboardStore((s) => s.viewport);
  const fontFamily = useWhiteboardStore((s) => s.fontFamily);
  const fontSize = useWhiteboardStore((s) => s.fontSize);
  const fontWeight = useWhiteboardStore((s) => s.fontWeight);
  const fontStyle = useWhiteboardStore((s) => s.fontStyle);
  const textDecoration = useWhiteboardStore((s) => s.textDecoration);
  const color = useWhiteboardStore((s) => s.color);
  
  debug.text('TextEditor mounted', { position, initialText, nodeId });
  
  // Convert world position to screen position, using provided viewport dimensions when available
  const screenPos = worldToScreen(position, {
    ...viewport,
    width: viewportWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1920),
    height: viewportHeight ?? (typeof window !== 'undefined' ? window.innerHeight : 1080),
  } as any);
  
  useEffect(() => {
    // Focus textarea on mount
    if (textareaRef.current) {
      textareaRef.current.focus();
      if (initialText) {
        // Place cursor at end
        textareaRef.current.setSelectionRange(initialText.length, initialText.length);
      }
      debug.text('TextEditor focused', { cursorPosition: initialText.length });
    }
  }, [initialText]);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    
    // Live update if callback provided
    if (onUpdate) {
      onUpdate(newText);
    }
    
    debug.text('Text changed', { text: newText, cursor: e.target.selectionStart });
  }, [onUpdate]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    debug.text('Key down', { key: e.key, meta: e.metaKey, ctrl: e.ctrlKey });
    
    if (e.key === 'Escape') {
      e.preventDefault();
      debug.text('Cancel editing');
      onCancel();
    } else if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      // Plain Enter commits the text
      e.preventDefault();
      debug.text('Complete editing (Enter)', { text });
      onComplete(text);
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      // Cmd/Ctrl+Enter creates new text box
      e.preventDefault();
      debug.text('Complete and new text box', { text });
      onComplete(text);
      // Parent will handle creating new text box
    }
    // Shift+Enter allows newlines
  }, [text, onComplete, onCancel]);
  
  const handleBlur = useCallback(() => {
    debug.text('Blur - auto-commit', { text });
    // Auto-commit on blur
    if (text.trim()) {
      onComplete(text);
    } else {
      onCancel();
    }
  }, [text, onComplete, onCancel]);
  
  // Prevent default scrolling
  useEffect(() => {
    const preventScroll = (e: WheelEvent) => {
      if (textareaRef.current?.contains(e.target as Node)) {
        e.stopPropagation();
      }
    };
    
    document.addEventListener('wheel', preventScroll, { passive: false });
    return () => document.removeEventListener('wheel', preventScroll);
  }, []);
  
  return (
    <div
      className="absolute z-50 wb-text-editor"
      style={{
        left: `${screenPos.x}px`,
        top: `${screenPos.y}px`,
        pointerEvents: 'auto',
      }}
      data-testid="text-editor-overlay"
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="bg-white border-2 border-blue-500 rounded px-2 py-1 outline-none resize-both shadow-lg"
        style={{
          fontFamily,
          fontSize: `${fontSize}px`,
          fontWeight,
          fontStyle,
          textDecoration,
          color,
          minWidth: '150px',
          minHeight: `${fontSize * 1.5}px`,
          maxWidth: '600px',
          lineHeight: '1.4',
        }}
        placeholder="Type text..."
        rows={3}
        data-testid="text-layer"
        data-node-id={nodeId}
      />
      <div className="text-xs text-slate-600 mt-1 bg-white/90 px-2 py-1 rounded shadow">
        <kbd>Enter</kbd>: Commit | <kbd>Shift+Enter</kbd>: New line | <kbd>⌘⏎</kbd>: New box | <kbd>Esc</kbd>: Cancel
      </div>
    </div>
  );
}
