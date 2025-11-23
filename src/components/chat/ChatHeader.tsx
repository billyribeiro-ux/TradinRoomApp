/**
 * ChatHeader Component - Microsoft Enterprise Pattern
 * Displays chat navigation with tabs, settings, and responsive design
 * SSOT Pattern: FontAwesome icons, clean responsive classes, no external color imports
 */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faCog, faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { COLOR_THEME } from '../panelColors';

export enum ChatTab {
  Main = 'main',
  OffTopic = 'off-topic'
}

interface ChatHeaderProps {
  activeTab: ChatTab;
  unreadMainCount: number;
  unreadOffTopicCount: number;
  onTabChange: (tab: ChatTab) => void;
  onClearUnread: (tab: ChatTab) => void;
  onToggleSettings: () => void;
}

export function ChatHeader({
  activeTab,
  unreadMainCount,
  unreadOffTopicCount,
  onTabChange,
  onClearUnread,
  onToggleSettings
}: ChatHeaderProps) {
  return (
    <header 
      className="flex items-center relative flex-shrink-0 text-white px-2 sm:px-3 py-2 mb-1 overflow-hidden"
      style={{ backgroundColor: COLOR_THEME.header.chat.background }}
      role="banner"
    >
      {/* Cyan line at very bottom like a divider */}
      <div 
        className="absolute bottom-3 left-1/2 -translate-x-1/2 w-3/5 h-px max-w-[300px]"
        style={{ backgroundColor: COLOR_THEME.header.chat.underline }}
      />
      {/* Left icon (chat bubble) - Intrinsic width */}
      <div className="flex-shrink-0 pb-2">
        <FontAwesomeIcon 
          icon={faComments} 
          className="text-white w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5"
          aria-hidden="true"
        />
      </div>
      
      {/* Center container for tabs - Auto-centered with flex-1 */}
      <div className="flex items-end justify-center pb-1.5 flex-1 px-1">
        <button
          onClick={() => {
            onTabChange(ChatTab.Main);
            onClearUnread(ChatTab.Main);
          }}
          className={`font-bold whitespace-nowrap text-xs sm:text-sm md:text-base px-2 py-1 focus:outline-none relative ${
            activeTab === ChatTab.Main 
              ? 'rounded-t -bottom-px pb-1' 
              : 'bottom-0 hover:bg-[#659BF8]'
          }`}
          style={{
            color: COLOR_THEME.header.chat.text,
            backgroundColor: activeTab === ChatTab.Main ? COLOR_THEME.header.chat.activeTab : 'transparent'
          }}
          role="tab"
          aria-selected={activeTab === ChatTab.Main}
        >
          Main
          {unreadMainCount > 0 && activeTab !== ChatTab.Main && (
            <span className="ml-1 text-white text-xs font-bold">
              {unreadMainCount}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            onTabChange(ChatTab.OffTopic);
            onClearUnread(ChatTab.OffTopic);
          }}
          className={`font-bold whitespace-nowrap text-xs sm:text-sm md:text-base px-2 py-1 focus:outline-none relative ${
            activeTab === ChatTab.OffTopic 
              ? 'rounded-t -bottom-px pb-1' 
              : 'bottom-0 hover:bg-[#659BF8]'
          }`}
          style={{
            color: COLOR_THEME.header.chat.text,
            backgroundColor: activeTab === ChatTab.OffTopic ? COLOR_THEME.header.chat.activeTab : 'transparent'
          }}
          role="tab"
          aria-selected={activeTab === ChatTab.OffTopic}
        >
          Off Topic
          {unreadOffTopicCount > 0 && activeTab === ChatTab.OffTopic && (
            <span className="ml-1 text-white text-xs font-bold">
              {unreadOffTopicCount}
            </span>
          )}
        </button>
      </div>
      
      {/* Right: Settings toggle - Intrinsic width */}
      <div 
        className="flex items-center justify-end gap-1.5 cursor-pointer flex-shrink-0 pb-2 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        onClick={onToggleSettings}
        role="button"
        aria-label="Toggle settings"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggleSettings()}
      >
        <FontAwesomeIcon 
          icon={faCog} 
          className="w-3.5 h-3.5 sm:w-4 sm:h-4"
          style={{ color: COLOR_THEME.header.chat.icon }}
        />
        <FontAwesomeIcon 
          icon={faCaretDown} 
          className="w-2.5 h-2.5"
          style={{ color: COLOR_THEME.header.chat.icon }}
        />
      </div>
    </header>
  );
}
