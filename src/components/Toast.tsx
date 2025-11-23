import { XCircle, CheckCircle, Info, X } from 'lucide-react';
import { useEffect } from 'react';
import { useFluentIcons } from '../icons/useFluentIcons';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
  duration?: number;
}

export function Toast({ id, message, type, onClose, duration = 4000 }: ToastProps) {
  const fi = useFluentIcons();
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, onClose, duration]);

  type IconComponent = React.ComponentType<{ className: string }>;

  const typeStyles = {
    success: {
      icon: (() => {
        const I = fi?.CheckmarkCircle24Regular || fi?.CheckmarkCircle20Regular;
        if (I) { const C = I as IconComponent; return <C className="w-5 h-5 text-green-400" />; }
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      })(),
      bg: 'bg-green-600/20 border-green-500/30',
      text: 'text-green-300',
    },
    error: {
      icon: (() => {
        const I = fi?.DismissCircle24Regular || fi?.DismissCircle20Regular;
        if (I) { const C = I as IconComponent; return <C className="w-5 h-5 text-red-400" />; }
        return <XCircle className="w-5 h-5 text-red-400" />;
      })(),
      bg: 'bg-red-600/20 border-red-500/30',
      text: 'text-red-300',
    },
    info: {
      icon: (() => {
        const I = fi?.Info24Regular || fi?.Info20Regular;
        if (I) { const C = I as IconComponent; return <C className="w-5 h-5 text-blue-400" />; }
        return <Info className="w-5 h-5 text-blue-400" />;
      })(),
      bg: 'bg-blue-600/20 border-blue-500/30',
      text: 'text-blue-300',
    },
  }[type];

  return (
    <div
      data-toast-id={id}
      className={`
        ${typeStyles.bg} ${typeStyles.text}
        rounded-lg border backdrop-blur-md px-4 py-3 flex items-center justify-between gap-3
        shadow-lg hover:shadow-xl transition-all duration-300
      `}
    >
      <div className="flex items-center gap-3">
        {typeStyles.icon}
        <p className="text-sm font-medium leading-snug">{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Close toast"
      >
        {(() => {
          const I = fi?.Dismiss24Regular || fi?.Dismiss20Regular;
          if (I) { const C = I as IconComponent; return <C className="w-4 h-4" />; }
          return <X className="w-4 h-4" />;
        })()}
      </button>
    </div>
  );
}
