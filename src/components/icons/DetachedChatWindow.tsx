// NOTE: DetachedChatWindow uses an isolated alertsHeight state; it does not write to main TradingRoom sizes.
import { GripHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useAuthStore } from '../../store/authStore';
import { useRoomStore } from '../../store/roomStore';
import { useThemeStore } from '../../store/themeStore';

import { AlertsPanelEntry } from './AlertsPanel.entry';
import { AlertsList } from './AlertsList';
import { AlertsToolbar } from './AlertsToolbar';
import { AlertsComposerAdapter } from './AlertsComposer.adapter';
import { ChatPanel } from './ChatPanel';

export function DetachedChatWindow() {
  const { colors } = useThemeStore();
  const { currentRoom } = useRoomStore();
  const user = useAuthStore(state => state.user);
  const [alertsHeight, setAlertsHeight] = useState(50);

  useEffect(() => {
    document.title = `${currentRoom?.title || 'Trading Room'} - Chat & Alerts`;
  }, [currentRoom]);

  if (!currentRoom || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <header
        className="px-6 py-3 border-b border-slate-700 flex items-center justify-between"
        style={{ backgroundColor: colors.secondary }}
      >
        <h1 className="text-xl font-bold text-white">
          {currentRoom.title} - Chat & Alerts
        </h1>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors"
        >
          Close Window
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 border-r border-slate-700 flex flex-col">
          <div
            className="overflow-hidden"
            style={{ height: `${alertsHeight}%` }}
          >
            <AlertsPanelEntry
              roomId={currentRoom?.id}
              ListComponent={AlertsList}
              ToolbarComponent={AlertsToolbar}
              ComposerComponent={AlertsComposerAdapter}
            />
          </div>

          <div
            className="h-1 bg-slate-700/30 backdrop-blur-sm cursor-row-resize hover:bg-blue-500/50 transition-colors group flex items-center justify-center border-y border-white/10"
            onMouseDown={(e) => {
              e.preventDefault();
              const startY = e.clientY;
              const startHeight = alertsHeight;

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaY = moveEvent.clientY - startY;
                const containerHeight = window.innerHeight - 64;
                const deltaPercent = (deltaY / containerHeight) * 100;
                const newHeight = Math.max(20, Math.min(80, startHeight + deltaPercent));
                setAlertsHeight(newHeight);
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
              document.body.style.cursor = 'row-resize';
              document.body.style.userSelect = 'none';
            }}
          >
            <GripHorizontal className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition-colors opacity-0 group-hover:opacity-100" />
          </div>

          <div
            className="overflow-hidden flex-1"
            style={{ height: `${100 - alertsHeight}%` }}
          >
            <ChatPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
