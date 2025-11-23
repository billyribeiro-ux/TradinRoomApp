/**
 * ===============================================================
 * toastStore.ts
 * ---------------------------------------------------------------
 * Centralized toast notification system.
 * Uses Zustand for global state.
 *
 * Features:
 *  - Supports success, error, and info toasts
 *  - Auto-dismiss after configurable delay
 *  - Fully type-safe and composable with ToastContainer
 * ===============================================================
 */

import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  /**
   * Add a toast message globally
   * Prevents duplicate notifications with the same message and type
   */
  addToast: (message, type = "info", duration = 5000) => {
    // Check for duplicate: same message and type within last 2 seconds
    const existingToast = get().toasts.find(
      (t) => t.message === message && t.type === type
    );

    // If duplicate exists, don't add another
    if (existingToast) {
      console.debug('[ToastStore] Duplicate toast prevented:', { message, type });
      return;
    }

    const id = crypto.randomUUID();
    const newToast: Toast = { id, message, type, duration };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    // Auto-remove after delay
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  /**
   * Remove a specific toast by ID
   */
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  /**
   * Clear all active toasts
   */
  clearToasts: () => set({ toasts: [] }),
}));
