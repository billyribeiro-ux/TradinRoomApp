// ============================================================================
// EMOJI PICKER - Simple Emoji Selection
// ============================================================================
// Lightweight emoji picker for stamp tool
// ============================================================================

import { useState, useCallback } from 'react';
import { debug } from '../utils/debug';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️'],
  'Objects': ['💡', '🔥', '⭐', '✨', '💥', '💯', '✅', '❌', '❗', '❓', '💬', '💭', '🎯', '🎨', '🎭', '🎪'],
  'Symbols': ['❤️', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘'],
};

export function EmojiPicker({ onSelect, onClose, position }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('Smileys');
  
  const handleSelect = useCallback((emoji: string) => {
    debug.emoji('Emoji selected', { emoji });
    onSelect(emoji);
    onClose();
  }, [onSelect, onClose]);
  
  return (
    <div
      className="absolute z-50 bg-white rounded-lg shadow-2xl border border-slate-300 p-3"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '320px',
      }}
      data-testid="emoji-picker"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700">Select Emoji</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close emoji picker"
        >
          ✕
        </button>
      </div>
      
      {/* Category Tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              activeCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* Emoji Grid */}
      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
        {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
          <button
            key={`${emoji}-${index}`}
            onClick={() => handleSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center text-2xl hover:bg-slate-100 rounded transition-colors"
            title={emoji}
            data-testid={`emoji-${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
      
      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-500 text-center">
        Click an emoji to place it on the canvas
      </div>
    </div>
  );
}
