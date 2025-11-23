/**
 * ChatHeader Component - Fluent UI Version
 * Displays chat navigation with tabs, settings, and responsive design
 * Uses Microsoft Fluent UI icons for modern design
 */
import {
  ChatMultiple24Regular,
  Settings24Regular,
  ChevronDown20Regular
} from '@fluentui/react-icons';
import { CHAT_COLORS } from '../../chatColors';

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
      className="flex items-center relative flex-shrink-0 text-white px-4 py-3 overflow-hidden"
      style={{ backgroundColor: CHAT_COLORS.header.background, borderBottom: `1px solid ${CHAT_COLORS.header.border}` }}
      role="banner"
    >
      {/* Cyan line at very bottom like a divider */}
      <div 
        className="absolute bottom-3 left-1/2 -translate-x-1/2 w-3/5 h-px max-w-[300px]"
        style={{ backgroundColor: CHAT_COLORS.header.underline }}
      />
      
      {/* Left icon (chat bubble) - WHITE */}
      <div className="flex-shrink-0 pb-2">
        <ChatMultiple24Regular 
          className="text-white w-5 h-5"
          aria-hidden="true"
        />
      </div>
      
      {/* Center container for tabs - Auto-centered with flex-1 */}
      <div className="flex items-center justify-center flex-1 px-1 gap-2">
        <button
          onClick={() => {
            onTabChange(ChatTab.Main);
            onClearUnread(ChatTab.Main);
          }}
          className={`font-bold whitespace-nowrap text-xs sm:text-sm md:text-base px-2 py-1 focus:outline-none relative transition-all duration-200 rounded-md ${
            activeTab === ChatTab.Main 
              ? 'rounded-t -bottom-px pb-1' 
              : 'bottom-0 hover:bg-[#659BF8]'
          }`}
          style={{
            color: CHAT_COLORS.header.text,
            backgroundColor: activeTab === ChatTab.Main ? CHAT_COLORS.header.activeTab : 'transparent'
          }}
          role="tab"
          aria-selected={activeTab === ChatTab.Main}
        >
          <span className="relative" style={{ color: CHAT_COLORS.header.text }}>
            Main
            {unreadMainCount > 0 && activeTab !== ChatTab.Main && (
              <span className="absolute -top-2 -right-3 px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse shadow-lg">
                {unreadMainCount}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => {
            onTabChange(ChatTab.OffTopic);
            onClearUnread(ChatTab.OffTopic);
          }}
          className={`font-bold whitespace-nowrap text-xs sm:text-sm md:text-base px-2 py-1 focus:outline-none relative transition-all duration-200 rounded-md ${
            activeTab === ChatTab.OffTopic 
              ? 'rounded-t -bottom-px pb-1' 
              : 'bottom-0 hover:bg-[#659BF8]'
          }`}
          style={{
            color: CHAT_COLORS.header.text,
            backgroundColor: activeTab === ChatTab.OffTopic ? CHAT_COLORS.header.activeTab : 'transparent'
          }}
          role="tab"
          aria-selected={activeTab === ChatTab.OffTopic}
        >
          <span className="relative" style={{ color: CHAT_COLORS.header.text }}>
            Off Topic
            {unreadOffTopicCount > 0 && activeTab !== ChatTab.OffTopic && (
              <span className="absolute -top-2 -right-3 px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse shadow-lg">
                {unreadOffTopicCount}
              </span>
            )}
          </span>
        </button>
      </div>
      
      {/* Right: Settings toggle - Fluent Style with Rotation */}
      <div 
        className="group flex items-center justify-end gap-1.5 cursor-pointer flex-shrink-0 pb-2 p-1.5 hover:bg-white/10 rounded-xl transition-all duration-200"
        onClick={onToggleSettings}
        role="button"
        aria-label="Toggle settings"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggleSettings()}
      >
        <Settings24Regular 
          className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"
          style={{ color: CHAT_COLORS.header.icon }}
        />
        <ChevronDown20Regular 
          className="w-2.5 h-2.5 group-hover:translate-y-0.5 transition-transform duration-200"
          style={{ color: CHAT_COLORS.header.icon }}
        />
      </div>
    </header>
  );
}
