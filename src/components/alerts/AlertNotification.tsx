import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';

interface AlertNotificationProps {
  alert: {
    id: string;
    title: string;
    author: {
      display_name?: string;
      username?: string;
    };
  };
  onClose: () => void;
  autoHideDuration?: number; // milliseconds
}

/**
 * Orange alert notification banner that appears at top of screen
 * Matches the design from the screenshot
 */
export function AlertNotification({ 
  alert, 
  onClose, 
  autoHideDuration = 5000 
}: AlertNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for fade out animation
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoHideDuration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const authorName = alert.author?.display_name || alert.author?.username || 'Unknown';

  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-2xl px-4 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-red-600 rounded-lg shadow-2xl px-6 py-4 flex items-center gap-4 border-2 border-red-700">
        {/* Warning Icon */}
        <div className="flex-shrink-0">
          <FontAwesomeIcon 
            icon={faExclamationTriangle} 
            className="text-white text-3xl" 
          />
        </div>

        {/* Alert Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-lg leading-tight">
            Alert from @{authorName}
          </h3>
          <p className="text-white font-semibold text-base mt-1 break-words">
            {alert.title}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-white hover:text-red-200 transition-colors p-1"
          aria-label="Close notification"
        >
          <FontAwesomeIcon icon={faTimes} className="text-xl" />
        </button>
      </div>
    </div>
  );
}
