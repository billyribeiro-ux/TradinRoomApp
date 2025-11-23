/**
 * ===============================================================
 * ToastContainer.tsx
 * ---------------------------------------------------------------
 * Renders all toast messages from the toastStore.
 * Smooth Fluent fade-in/out animations via Tailwind.
 * ===============================================================
 */

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, XCircle, X } from "lucide-react";

import { useToastStore } from "../store/toastStore";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-900/90',
          border: 'border-green-700',
          iconColor: 'text-green-400',
          Icon: CheckCircle,
        };
      case 'error':
        return {
          bg: 'bg-red-900/90',
          border: 'border-red-700',
          iconColor: 'text-red-400',
          Icon: XCircle,
        };
      case 'warning':
        return {
          bg: 'bg-yellow-900/90',
          border: 'border-yellow-700',
          iconColor: 'text-yellow-400',
          Icon: AlertCircle,
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-900/90',
          border: 'border-blue-700',
          iconColor: 'text-blue-400',
          Icon: Info,
        };
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => {
          const styles = getTypeStyles(toast.type);
          const Icon = styles.Icon;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.25 }}
              className={`
                ${styles.bg} ${styles.border}
                border backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg text-white
                flex items-center gap-3
              `}
            >
              <Icon className={`w-5 h-5 ${styles.iconColor}`} />
              <span className="text-sm font-medium flex-1 text-white">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
