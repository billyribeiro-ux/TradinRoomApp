// ============================================================================
// SCREEN SHARE TABS COMPONENT - Microsoft Enterprise Standard
// Shows tabs for each shared screen with preview thumbnails
// ============================================================================

import { faDesktop, faTimes, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { memo } from 'react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
interface ScreenShare {
  id: string;
  name: string;
  stream: MediaStream;
  thumbnail?: string;
}

interface ScreenShareTabsProps {
  screens: ScreenShare[];
  activeScreenId?: string;
  onScreenSelect: (screenId: string) => void;
  onScreenRemove: (screenId: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ScreenShareTabs = memo<ScreenShareTabsProps>(function ScreenShareTabs({
  screens,
  activeScreenId,
  onScreenSelect,
  onScreenRemove
}) {
  if (screens.length === 0) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-slate-900/50 border-b border-slate-700 overflow-x-auto">
      {screens.map((screen, index) => {
        const isActive = screen.id === activeScreenId;
        
        return (
          <button
            key={screen.id}
            onClick={() => onScreenSelect(screen.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              isActive
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {/* Screen Preview Thumbnail */}
            <div className="relative w-12 h-8 bg-slate-800 rounded overflow-hidden flex-shrink-0">
              {screen.thumbnail ? (
                <img 
                  src={screen.thumbnail} 
                  alt={`${screen.name} preview`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FontAwesomeIcon 
                    icon={faDesktop} 
                    className="text-slate-500 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Screen Name */}
            <span className="text-sm font-medium whitespace-nowrap">
              {screen.name || `Screen ${index + 1}`}
            </span>

            {/* Dropdown Arrow */}
            <FontAwesomeIcon 
              icon={faChevronDown} 
              className="text-xs ml-1"
            />

            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onScreenRemove(screen.id);
              }}
              className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
              aria-label={`Remove ${screen.name}`}
            >
              <FontAwesomeIcon 
                icon={faTimes} 
                className="text-xs"
              />
            </button>
          </button>
        );
      })}
    </div>
  );
});

// Display name for React DevTools
ScreenShareTabs.displayName = 'ScreenShareTabs';