import * as React from 'react';
import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faQuestionCircle, faPlusCircle, faCog, faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { useFluentIcons } from '../../icons/useFluentIcons';

interface Counts { total: number; unread: number }

interface AlertsToolbarProps {
  counts?: Counts;
  /** Fired when user types a search query */
  onSearch?: (q: string) => void;
  /** Fired when filters change; you can extend this shape as needed */
  onFilterChange?: (filters: Record<string, unknown>) => void;
  /** Fired when Poll button is clicked */
  onPollClick?: () => void;
  /** Fired when Post Alert button is clicked */
  onPostAlertClick?: () => void;
  /** Fired when Settings button is clicked */
  onSettingsClick?: () => void;
}

/**
 * Pure presentational toolbar for Alerts.
 * - Displays bell icon, action buttons (Poll, Post Alert), and settings
 * - Fully responsive using standard Tailwind breakpoints.
 */
function AlertsToolbarBase({
  counts,
  onSearch,
  onFilterChange,
  onPollClick,
  onPostAlertClick,
  onSettingsClick,
}: AlertsToolbarProps): React.ReactElement {
  const fi = useFluentIcons();
  // Unused props kept for API compatibility
  void counts;
  void onSearch;
  void onFilterChange;

  return (
    <div
      data-testid="alerts-toolbar"
      className="flex items-center justify-between px-4 py-3 text-white flex-shrink-0"
      style={{ backgroundColor: '#3B82F6', borderBottom: '1px solid #6C99C8' }}
    >
      {/* Left: Bell icon + Alerts text */}
      <div className="flex items-center gap-3">
        {(() => {
          const I = fi?.Alert24Regular || fi?.Alert20Regular || fi?.AlertOn24Regular || fi?.AlertOn20Regular;
          if (I) { return <I className="text-white w-5 h-5" aria-label="Alerts" />; }
          return (
            <FontAwesomeIcon
              icon={faBell}
              className="text-white w-5 h-5"
              aria-label="Alerts"
            />
          );
        })()}
        <span className="text-white font-bold text-lg">
          Alerts
        </span>
      </div>

      {/* Right: Poll, Post Alert, and Settings buttons */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onPollClick}
          className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-1.5 rounded transition-colors"
          aria-label="Create poll"
        >
          {(() => {
            const I = fi?.QuestionCircle24Regular || fi?.QuestionCircle20Regular;
            if (I) { return <I className="text-white w-5 h-5" />; }
            return (
              <FontAwesomeIcon
                icon={faQuestionCircle}
                className="text-white w-5 h-5"
              />
            );
          })()}
          <span className="text-white text-base">Poll</span>
        </button>

        <button
          type="button"
          onClick={onPostAlertClick}
          className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-1.5 rounded transition-colors"
          aria-label="Post alert"
        >
          {(() => {
            const I = fi?.AddCircle24Regular || fi?.AddCircle20Regular || fi?.Add24Regular || fi?.Add20Regular;
            if (I) { return <I className="text-white w-5 h-5" />; }
            return (
              <FontAwesomeIcon
                icon={faPlusCircle}
                className="text-white w-5 h-5"
              />
            );
          })()}
          <span className="text-white text-base">Post Alert</span>
        </button>

        <button
          type="button"
          onClick={onSettingsClick}
          className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-1.5 rounded transition-colors"
          aria-label="Toggle settings"
        >
          {(() => {
            const I = fi?.Settings24Regular || fi?.Settings20Regular;
            if (I) { return <I className="text-white w-5 h-5" />; }
            return <FontAwesomeIcon icon={faCog} className="text-white w-5 h-5" />;
          })()}
          {(() => {
            const I = fi?.CaretDown24Regular || fi?.CaretDown20Regular || fi?.ChevronDown24Regular || fi?.ChevronDown20Regular;
            if (I) { return <I className="text-white w-3 h-3" />; }
            return <FontAwesomeIcon icon={faCaretDown} className="text-white w-3 h-3" />;
          })()}
        </button>
      </div>
    </div>
  );
}

export const AlertsToolbar = memo(AlertsToolbarBase);
export type { AlertsToolbarProps };

// FIXED: Add a default export to prevent import/export mix-up errors
export default AlertsToolbar;
