/**
 * Text Layer Component for Whiteboard
 * Handles text editing overlay
 */

import React, { useEffect, useRef, useState } from 'react';
import { useWhiteboardStore } from '../state/whiteboardStore';

export const TextLayer: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const tool = useWhiteboardStore((state) => state.tool);
  const fontSize = useWhiteboardStore((state) => state.fontSize);
  const fontFamily = useWhiteboardStore((state) => state.fontFamily);
  const color = useWhiteboardStore((state) => state.color);
  const addShape = useWhiteboardStore((state) => state.addShape);

  // Listen for text tool activation
  useEffect(() => {
    if (tool === 'text') {
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-testid="whiteboard-canvas"]')) {
          setPosition({ x: e.clientX, y: e.clientY });
          setIsEditing(true);
          setText('');
        }
      };

      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
    return undefined;
  }, [tool]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commitText();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  const commitText = () => {
    if (text.trim()) {
      // Add text shape to store
      addShape({
        id: `text-${Date.now()}`,
        type: 'text',
        x: position.x,
        y: position.y,
        content: text.trim(),
        color,
        fontSize,
        fontFamily,
        width: 200,
        height: 100,
        scale: 1,
        rotation: 0,
        opacity: 1,
        locked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as any);
    }
    setIsEditing(false);
    setText('');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setText('');
  };

  if (!isEditing) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none z-50"
      data-testid="text-layer"
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitText}
        className="absolute bg-white border-2 border-blue-500 rounded p-2 resize-none pointer-events-auto"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          fontSize: `${fontSize}px`,
          fontFamily,
          color,
          minWidth: '200px',
          minHeight: '50px',
        }}
        placeholder="Type here..."
      />
    </div>
  );
};
