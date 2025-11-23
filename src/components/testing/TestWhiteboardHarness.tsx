/**
 * Test Whiteboard Harness for E2E Testing
 * Provides a deterministic whiteboard environment for Playwright tests
 */

import React, { useEffect, useState } from 'react';
import { WhiteboardCanvasPro } from '../../features/whiteboard/components/WhiteboardCanvasPro';
import { WhiteboardToolbar } from '../../features/whiteboard/components/WhiteboardToolbar';
import { useWhiteboardStore } from '../../features/whiteboard/state/whiteboardStore';
import { TextLayer } from '../../features/whiteboard/components/TextLayer';
import { EmojiPicker } from '../../features/whiteboard/components/EmojiPicker';

export const TestWhiteboardHarness: React.FC = () => {
  const { 
    shapes, 
    tool,
    setTool: _setTool,
    addShape: _addShape,
    updateShape: _updateShape,
    deleteShape: _deleteShape,
    undo: _undo,
    redo: _redo,
    history,
    historyIndex
  } = useWhiteboardStore();

  // State to control emoji picker visibility
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ x: 100, y: 100 });

  // Compute canUndo and canRedo from history state
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Expose store to window for test debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__WB_STORE__ = useWhiteboardStore;
      (window as any).__WB_DEBUG_LAST_ADDED__ = null;
      (window as any).__WB_DEBUG_LAST_UPDATED__ = null;
      (window as any).__WB_DEBUG_UP__ = false;
      (window as any).__WB_DEBUG_TOOL__ = tool;
      (window as any).__WB_DEBUG_BRANCH__ = null;
      (window as any).__WB_DEBUG_ON_DOWN__ = false;
      (window as any).__WB_DEBUG_ON_MOVE__ = null;
      (window as any).__WB_DEBUG_ON_UP__ = null;

      // Track shape additions
      const originalAddShape = useWhiteboardStore.getState().addShape;
      useWhiteboardStore.setState({
        addShape: (shape) => {
          (window as any).__WB_DEBUG_LAST_ADDED__ = shape;
          return originalAddShape(shape);
        }
      });

      // Track shape updates
      const originalUpdateShape = useWhiteboardStore.getState().updateShape;
      useWhiteboardStore.setState({
        updateShape: (id, updates) => {
          (window as any).__WB_DEBUG_LAST_UPDATED__ = { id, ...updates, len: shapes.size };
          return originalUpdateShape(id, updates);
        }
      });
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__WB_STORE__;
        delete (window as any).__WB_DEBUG_LAST_ADDED__;
        delete (window as any).__WB_DEBUG_LAST_UPDATED__;
        delete (window as any).__WB_DEBUG_UP__;
        delete (window as any).__WB_DEBUG_TOOL__;
        delete (window as any).__WB_DEBUG_BRANCH__;
        delete (window as any).__WB_DEBUG_ON_DOWN__;
        delete (window as any).__WB_DEBUG_ON_MOVE__;
        delete (window as any).__WB_DEBUG_ON_UP__;
      }
    };
  }, []);

  // Update debug tool when it changes and handle emoji tool
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__WB_DEBUG_TOOL__ = tool;
    }
    
    // Show emoji picker when emoji tool is selected
    if (tool === 'emoji') {
      // Position the picker in the center of the viewport
      const centerX = window.innerWidth / 2 - 160; // 160 is half the picker width
      const centerY = window.innerHeight / 2 - 200; // Approximate height adjustment
      setEmojiPickerPosition({ x: centerX, y: centerY });
      setShowEmojiPicker(true);
    }
  }, [tool]);

  // Track pointer events for debugging
  useEffect(() => {
    const handlePointerDown = () => {
      if (typeof window !== 'undefined') {
        (window as any).__WB_DEBUG_ON_DOWN__ = true;
        (window as any).__WB_DEBUG_UP__ = false;
      }
    };

    const handlePointerMove = () => {
      if (typeof window !== 'undefined') {
        (window as any).__WB_DEBUG_ON_MOVE__ = 'moved';
      }
    };

    const handlePointerUp = () => {
      if (typeof window !== 'undefined') {
        (window as any).__WB_DEBUG_ON_UP__ = 'up';
        (window as any).__WB_DEBUG_UP__ = true;
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-gray-50 overflow-hidden">
      {/* Whiteboard Canvas - Professional Version */}
      <WhiteboardCanvasPro />

      {/* Text Layer for text editing */}
      <TextLayer />

      {/* Emoji Picker - Only show when needed */}
      {showEmojiPicker && (
        <EmojiPicker 
          onSelect={(emoji) => {
            // Handle emoji selection
            console.log('Emoji selected:', emoji);
            // Add emoji as a text shape
            const emojiShape = {
              id: `emoji-${Date.now()}`,
              type: 'text' as const,
              content: emoji,
              x: emojiPickerPosition.x + 160, // Place near picker
              y: emojiPickerPosition.y + 100,
              color: '#000000',
              opacity: 1,
              fontSize: 48,
              fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif',
              fontWeight: 400,
              fontStyle: 'normal' as const,
              scale: 1,
              rotation: 0,
              locked: false,
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            _addShape(emojiShape as any);
            setShowEmojiPicker(false);
          }}
          onClose={() => {
            // Handle picker close
            console.log('Emoji picker closed');
            setShowEmojiPicker(false);
          }}
          position={emojiPickerPosition}
        />
      )}

      {/* Whiteboard Toolbar */}
      <div className="absolute top-4 left-4 z-50">
        <WhiteboardToolbar 
          onClose={() => {
            // Handle toolbar close
            console.log('Toolbar closed');
          }}
          canManageRoom={true}
        />
      </div>

      {/* History Count Display for Tests */}
      <div 
        className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 z-50"
        data-testid="history-info"
      >
        <div data-testid="history-count">{shapes.size}</div>
        <div className="text-xs text-gray-500">
          {canUndo && <span>Can Undo | </span>}
          {canRedo && <span>Can Redo | </span>}
          Tool: {tool}
        </div>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-2 text-xs z-50">
          <div>Shapes: {shapes.size}</div>
          <div>Tool: {tool}</div>
          <div>Can Undo: {canUndo ? 'Yes' : 'No'}</div>
          <div>Can Redo: {canRedo ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};
