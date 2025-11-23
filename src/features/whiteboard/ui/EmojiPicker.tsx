// ============================================================================
// EMOJI PICKER - In-App Emoji Selection Panel
// ============================================================================
// Keyboard accessible emoji picker with categories
// No external prompts, fully in-app
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { EMOJI_FONT_STACK } from '../types';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔'],
  'Gestures': ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  'Objects': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸'],
  'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺'],
  'Food': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔'],
};

export function EmojiPicker({ onSelect, onClose, position }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('Smileys');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const pickerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, EMOJI_CATEGORIES[activeCategory].length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 8, EMOJI_CATEGORIES[activeCategory].length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 8, 0));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const emoji = EMOJI_CATEGORIES[activeCategory][focusedIndex];
        if (emoji) {
          onSelect(emoji);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [activeCategory, focusedIndex, onSelect, onClose]);
  
  // Close on click outside
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  
  // Reset focused index when category changes
  useEffect(() => {
    setFocusedIndex(0);
  }, [activeCategory]);
  
  const handleEmojiClick = useCallback((emoji: string) => {
    onSelect(emoji);
  }, [onSelect]);
  
  return (
    <div
      ref={pickerRef}
      className="fixed z-[300] bg-white rounded-xl shadow-2xl border border-slate-300 p-4"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        maxWidth: '360px',
        fontFamily: EMOJI_FONT_STACK,
      }}
      data-testid="emoji-picker"
      role="dialog"
      aria-label="Emoji Picker"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">Choose Emoji</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded p-1"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Category Tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-2">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              activeCategory === category
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* Emoji Grid */}
      <div
        ref={gridRef}
        className="grid grid-cols-8 gap-1 max-h-64 overflow-y-auto"
        role="grid"
      >
        {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
          <button
            key={`${emoji}-${index}`}
            onClick={() => handleEmojiClick(emoji)}
            className={`w-10 h-10 flex items-center justify-center text-2xl rounded-lg transition-all hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              index === focusedIndex ? 'bg-blue-50 ring-2 ring-blue-400' : ''
            }`}
            title={emoji}
            role="gridcell"
            tabIndex={index === focusedIndex ? 0 : -1}
          >
            {emoji}
          </button>
        ))}
      </div>
      
      {/* Footer hint */}
      <div className="mt-3 pt-2 border-t border-slate-200 text-xs text-slate-500">
        Use arrow keys to navigate, Enter to select, Esc to close
      </div>
    </div>
  );
}
