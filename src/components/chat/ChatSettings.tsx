/**
 * ChatSettings Component - Microsoft Enterprise Pattern
 * Settings panel with download, erase, and detach chat functions
 */

import {
  faDownload,
  faTrash,
  faComments,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { PANEL_COLORS } from '../panelColors';

interface ChatSettingsProps {
  showSettings: boolean;
  modOnly: boolean;
  onModOnlyChange: (value: boolean) => void;
  onSearchChange: (value: string) => void;
  onDownloadChat: () => void;
  onEraseChat: () => void;
  onDetachChat: () => void;
}

export function ChatSettings({
  showSettings,
  modOnly,
  onModOnlyChange,
  onSearchChange,
  onDownloadChat,
  onEraseChat,
  onDetachChat
}: ChatSettingsProps) {
  if (!showSettings) return null;

  return (
    <section 
      className={`${PANEL_COLORS.card.background} border-b ${PANEL_COLORS.container.divider} p-3 space-y-2`}
      role="region"
      aria-label="Chat settings"
    >
      <div className="relative">
        <FontAwesomeIcon 
          icon={faSearch} 
          className={`absolute left-3 top-1/2 -translate-y-1/2 ${PANEL_COLORS.text.secondary} w-4 h-4`}
        />
        <input
          id="chat-search"
          name="chat-search"
          type="text"
          placeholder="Search messages..."
          onChange={(e) => onSearchChange(e.target.value)}
          className={`w-full pl-10 pr-3 py-2 ${PANEL_COLORS.input.background} border ${PANEL_COLORS.input.border} rounded ${PANEL_COLORS.text.primary} ${PANEL_COLORS.text.placeholder} focus:outline-none focus:ring-2 ${PANEL_COLORS.input.focus.ring} text-sm`}
          aria-label="Search messages"
          autoComplete="off"
        />
      </div>

      <label htmlFor="mod-only" className={`flex items-center gap-2 text-sm ${PANEL_COLORS.text.secondary} cursor-pointer hover:${PANEL_COLORS.text.primary} transition-colors`}>
        <input
          id="mod-only"
          name="mod-only"
          type="checkbox"
          checked={modOnly}
          onChange={(e) => onModOnlyChange(e.target.checked)}
          className={`rounded ${PANEL_COLORS.input.border} ${PANEL_COLORS.buttons.primary.background} focus:ring-2 ${PANEL_COLORS.input.focus.ring}`}
        />
        <span>Show moderator messages only</span>
      </label>

      <button
        onClick={onDownloadChat}
        className={`flex items-center gap-2 px-3 py-2 ${PANEL_COLORS.buttons.secondary.background} ${PANEL_COLORS.buttons.secondary.hover} ${PANEL_COLORS.text.primary} rounded text-sm transition-colors w-full focus:outline-none focus:ring-2 ${PANEL_COLORS.input.focus.ring}`}
      >
        <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
        Download Chat History
      </button>

      <button
        onClick={onEraseChat}
        className={`flex items-center gap-2 px-3 py-2 ${PANEL_COLORS.buttons.danger.background} ${PANEL_COLORS.buttons.danger.hover} ${PANEL_COLORS.text.primary} rounded text-sm transition-colors w-full focus:outline-none focus:ring-2 focus:ring-red-500`}
      >
        <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
        Erase All Chat
      </button>

      <button
        onClick={onDetachChat}
        className={`flex items-center gap-2 px-3 py-2 ${PANEL_COLORS.buttons.secondary.background} ${PANEL_COLORS.buttons.secondary.hover} ${PANEL_COLORS.text.primary} rounded text-sm transition-colors w-full focus:outline-none focus:ring-2 ${PANEL_COLORS.input.focus.ring}`}
      >
        <FontAwesomeIcon icon={faComments} className="w-4 h-4" />
        Detach Chat & Alerts
      </button>
    </section>
  );
}
