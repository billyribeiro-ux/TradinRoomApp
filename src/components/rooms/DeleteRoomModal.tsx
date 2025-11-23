/**
 * DeleteRoomModal.tsx — Enterprise Version (Final)
 * --------------------------------------------------
 * - Handles room deletion confirmation with async safety
 * - Unified dark Fluent-style design
 * - Includes ESC key handling, error display, and disable guards
 */

import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
// Fixed: 2025-10-24 - Emergency null/undefined fixes for production
// Microsoft TypeScript standards applied - null → undefined, using optional types


// Fixed: 2025-01-24 - Eradicated 1 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types


interface DeleteRoomModalProps {
  roomTitle: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export function DeleteRoomModal({ roomTitle, onConfirm, onCancel }: DeleteRoomModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const isConfirmValid = confirmText.trim().toUpperCase() === 'DELETE';

  // ⌨️ ESC to close modal safely
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDeleting, onCancel]);

  // 🧭 Confirm Handler
  const handleConfirm = useCallback(async () => {
    if (!isConfirmValid || isDeleting) return;
    setError(undefined);
    setIsDeleting(true);

    try {
      await onConfirm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete room';
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  }, [isConfirmValid, isDeleting, onConfirm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 md:p-6">
      <div className="bg-slate-800 rounded-lg sm:rounded-xl shadow-2xl w-full max-w-full sm:max-w-md border border-slate-700 overflow-hidden animate-fadeIn">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 sm:px-6 py-3 sm:py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Delete Room</h2>
                <p className="text-xs sm:text-sm text-red-100">This action cannot be undone</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-5">
          {error && (
            <div className="bg-red-900/40 border border-red-500/40 text-red-200 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-200 font-medium mb-1">
                  You are about to permanently delete:
                </p>
                <p className="text-base text-white font-semibold break-words">
                  “{roomTitle}”
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-300 font-medium mb-2">This will:</p>
            <ul className="space-y-1.5 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span> Remove all room members immediately
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span> Delete all chat messages and history
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span> Stop all active recordings
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span> Remove all custom settings and assets
              </li>
            </ul>
          </div>

          {/* CONFIRM INPUT */}
          <div>
            <label className="block text-sm text-slate-300 font-medium mb-1">
              Type <span className="text-red-400 font-mono">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isDeleting}
              className="w-full px-3 py-2 text-sm sm:text-base bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50 touch-manipulation"
              placeholder='Type "DELETE" here'
              autoFocus
            />
          </div>

          {/* BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 text-sm sm:text-base bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-slate-300 font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirm}
              disabled={!isConfirmValid || isDeleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm sm:text-base bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Room</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-500 text-center border-t border-slate-700 pt-3">
            This action is permanent and cannot be reversed. All associated data will be lost.
          </p>
        </div>
      </div>
    </div>
  );
}
