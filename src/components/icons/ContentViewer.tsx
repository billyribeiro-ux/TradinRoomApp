// Fixed: 2025-01-24 - Eradicated 1 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types

import { Files } from 'lucide-react';
import { useState, useEffect } from 'react';

import { shareStore } from '../../sharing/shareStore';
import { ScreenShareTabs } from '../sharing/ScreenShareTabs';
import { ShareDashboard } from '../sharing/ShareDashboard';
import { NotesView } from "../trading/NotesView";
import { useRoomStore } from '../../store/roomStore';

interface ContentViewerProps {
  activeTab?: 'screens' | 'notes' | 'files';
  onTabChange?: (tab: 'screens' | 'notes' | 'files') => void;
  addToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function ContentViewer({ activeTab = 'screens', addToast }: ContentViewerProps) {
  const currentTab = activeTab;
  const [shareState, setShareState] = useState(shareStore.get());
  const [activeScreenId, setActiveScreenId] = useState<string | undefined>();
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const room = useRoomStore((s) => s.currentRoom);
  
  useEffect(() => {
    const unsubscribe = shareStore.subscribe(setShareState);
    return unsubscribe;
  }, []);

  // Listen for notes:new event from TradingRoomLayout
  useEffect(() => {
    const handleNotesNew = () => {
      setShowNewNoteModal(true);
    };
    window.addEventListener('notes:new', handleNotesNew);
    return () => window.removeEventListener('notes:new', handleNotesNew);
  }, []);

  // Set first screen as active by default
  useEffect(() => {
    if (shareState.shares.length > 0 && !activeScreenId) {
      setActiveScreenId(shareState.shares[0].id);
    }
  }, [shareState.shares, activeScreenId]);

  const handleScreenRemove = (screenId: string) => {
    // TODO: Implement screen removal logic
    console.log('Remove screen:', screenId);
    addToast?.('Screen sharing stopped', 'info');
  };

  return (
    <div className="flex flex-col h-full w-full overflow-visible">
      {currentTab === 'screens' && (
        shareState.shares.length > 0 ? (
          <>
            <ScreenShareTabs 
              screens={shareState.shares
                .filter(share => share.stream) // Only show shares with active streams
                .map((share, index) => ({
                  id: share.id,
                  name: share.label || `Screen ${index + 1}`,
                  stream: share.stream!,
                  thumbnail: undefined // TODO: Generate thumbnail from stream
                }))}
            
              activeScreenId={activeScreenId}
              onScreenSelect={setActiveScreenId}
              onScreenRemove={handleScreenRemove}
            />
            <ShareDashboard 
              className="flex-1 flex flex-col h-full"
              tileClassName="flex-1 relative bg-black min-h-0"
              controlsClassName="absolute bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur p-2 flex items-center gap-2 text-sm z-10"
              onError={(err) => {
                console.error('ShareDashboard error:', err);
                addToast?.('Screen share error', 'error');
              }}
            />
          </>
        ) : (
          <div className="flex items-center justify-center min-h-full p-4 sm:p-6 md:p-8 lg:p-12">
            <div className="text-center">
              <div className="text-slate-400 text-sm sm:text-base lg:text-lg mb-4">
                No screens are being shared
              </div>
              <p className="text-slate-500 text-xs sm:text-sm">
                Start screen sharing from the header to display content here
              </p>
            </div>
          </div>
        )
      )}
      {currentTab === 'notes' && room && (
        <NotesView 
          roomId={room.id} 
          roomName={room.name}
          showNewNoteModal={showNewNoteModal}
          onShowNewNoteModal={setShowNewNoteModal}
        />
      )}
      {currentTab === 'files' && (
        <div className="flex items-center justify-center min-h-full p-4 sm:p-6 md:p-8 lg:p-12">
          <div className="text-center max-w-2xl w-full">
            <Files className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 sm:mb-6 text-slate-400" />
            <h2 className="text-white font-semibold text-lg sm:text-xl md:text-2xl mb-2 sm:mb-4">
              Files
            </h2>
            <p className="text-slate-400 text-sm sm:text-base lg:text-lg">
              Files functionality coming soon. Upload and manage your files here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
