// ============================================================================
// CLEAR BOARD MODAL - In-App Confirmation for Clear All
// ============================================================================
// Replaces browser confirm() with accessible in-app modal
// ============================================================================

import { useEffect } from 'react';

interface ClearBoardModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function ClearBoardModal({ onConfirm, onCancel }: ClearBoardModalProps) {
  // Handle Escape and Enter keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onConfirm();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [onConfirm, onCancel]);
  
  return (
    <div
      className="wb-presenter-only fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
      data-testid="clear-board-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
        data-testid="clear-board-modal"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 id="clear-modal-title" className="text-lg font-semibold text-slate-900 mb-2">
              Clear Whiteboard
            </h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to clear all drawings, text, and emojis? This action can be undone with Cmd/Ctrl+Z.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                data-testid="clear-cancel"
                autoFocus
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                data-testid="clear-confirm"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
