/**
 * Trading Room Layout - Pure JSX Component
 * =========================================================
 * Pure layout component with no side-effects or business logic
 * Preserves all DOM structure, classNames, ids, and data-testids exactly
 *
 * FINAL FIX: Added `overflow-hidden` to the alerts-panel section
 * to force its content to scroll instead of just clipping.
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Settings } from 'lucide-react';
import { useFluentIcons } from '../../icons/useFluentIcons';
import { PollModal } from '../../features/PollModal';
import { PostAlertModal } from '../../features/PostAlertModal';
import { ThemeOpacityControl } from '../../features/theme/ThemeOpacityControl';
import { AlertsPanelEntry } from '../icons/AlertsPanel.entry';
import { AlertsList } from '../icons/AlertsList';
import { AlertsToolbar } from '../icons/AlertsToolbar';
import { AlertsComposerAdapter } from '../icons/AlertsComposer.adapter';
import { AlertNotification } from '../alerts/AlertNotification';
import { BrandHeader } from '../icons/BrandHeader';
import { CameraWindow } from '../icons/CameraWindow';
import { ChatPanel } from '../icons/ChatPanel';
import { ContentViewer } from '../icons/ContentViewer';
import { ThemeSettingsPanel } from '../theme/ThemeSettingsPanel';
import { PrivateChatModal } from '../modals/PrivateChatModal';
import { AdvancedBrandingSettings } from '../theme/AdvancedBrandingSettings';
import { GeneralSettingsModal } from '../modals/GeneralSettingsModal';
// import { useRoomStore } from '../../store/roomStore'; // Not used

import { HorizontalResizeHandle } from './HorizontalResizeHandle';
import { VerticalResizeHandle } from './VerticalResizeHandle';
import { WhiteboardSurface } from '../../features/whiteboard/components/WhiteboardSurface';
import { WhiteboardCanvasPro } from '../../features/whiteboard/components/WhiteboardCanvasPro';
import { WhiteboardToolbar } from '../../features/whiteboard/components/WhiteboardToolbar';
import type { TradingRoomLayoutProps } from './types';

export function TradingRoomLayout({
  state,
  handlers,
  refs,
}: TradingRoomLayoutProps) {
  const fi = useFluentIcons();
  type AlertNotificationProps = React.ComponentProps<typeof AlertNotification>;
  const [activeAlertNotification] = useState<AlertNotificationProps['alert'] | null>(null);

  // Private chat state
  const [activePrivateChat, setActivePrivateChat] = useState<{
    chatId: string;
    userId: string;
    displayName: string;
    currentUserId: string;
  } | null>(null);

  // Notes dropdown state
  const [showNotesDropdown, setShowNotesDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const notesButtonRef = useRef<HTMLButtonElement>(null);

  // Listen for private chat events
  useEffect(() => {
    const handleOpenPrivateChat = (event: CustomEvent) => {
      const { chatId, userId, displayName, currentUserId } = event.detail;
      setActivePrivateChat({ chatId, userId, displayName, currentUserId });
    };

    window.addEventListener('open-private-chat', handleOpenPrivateChat as EventListener);
    return () => {
      window.removeEventListener('open-private-chat', handleOpenPrivateChat as EventListener);
    };
  }, []);

  // Safety check for room data
  if (!state.room) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading room...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={refs.containerRef}
      className="relative flex flex-col h-screen w-full overflow-hidden transition-colors duration-500"
      style={state.containerStyle}
      data-trading-room
    >
      {/* ====== HEADER BAR ====== */}
      <BrandHeader
        room={{ id: state.room.id, title: state.room.title, description: state.room.description || '' }}
        canRecord={state.canRecord}
        canManageRoom={state.canManageRoom}
        isRecording={state.isRecording}
        isMicEnabled={state.isMicEnabled}
        cameraEnabled={state.cameraEnabled}
        audioStream={state.audioStream || undefined}
        spotifyConnected={state.spotifyConnected}
        linkedinConnected={state.linkedinConnected}
        xConnected={state.xConnected}
        onCustomizeClick={handlers.handleCustomizeClick}
        onOpenSettings={handlers.handleOpenSettings}
        onToggleWhiteboard={handlers.onWhiteboardOpen}
        isWhiteboardActive={state.isWhiteboardActive}
        handleLeave={handlers.handleLeave}
        handleRefresh={handlers.handleRefresh}
        isRefreshing={state.isRefreshing}
        handleToggleMic={handlers.handleToggleMic}
        handleToggleCamera={handlers.handleToggleCamera}
        handleToggleRecording={handlers.handleToggleRecording}
        handleSpotifyConnect={handlers.handleSpotifyConnect}
        handleSpotifyDisconnect={handlers.handleSpotifyDisconnect}
        handleLinkedInConnect={handlers.handleLinkedInConnect}
        handleLinkedInDisconnect={handlers.handleLinkedInDisconnect}
        handleXConnect={handlers.handleXConnect}
        handleXDisconnect={handlers.handleXDisconnect}
      />

      {/* ====== ALERT NOTIFICATION BANNER ====== */}
      {/* Alert notification disabled */}
      {activeAlertNotification && (
        <AlertNotification
          alert={activeAlertNotification}
          onClose={() => {/* disabled */}}
          autoHideDuration={5000}
        />
      )}

      {/* ====== CONNECTIVITY CHECK MODAL ====== */}
      {state.showConnectivityCheck && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handlers.handleCloseConnectivityCheck}>
          <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Network Connectivity Test</h2>
            <p className="text-slate-300 mb-4">Test your connection to our media servers to ensure optimal call quality.</p>
            <div className="space-y-3 mb-6">
              <div className="bg-slate-700 rounded-lg p-4 flex items-center justify-between">
                <span className="text-white font-semibold">STUN Server Connectivity</span>
                <div className="w-3 h-3 rounded-full bg-slate-500"></div>
              </div>
              <div className="bg-slate-700 rounded-lg p-4 flex items-center justify-between">
                <span className="text-white font-semibold">TURN Server Connectivity</span>
                <div className="w-3 h-3 rounded-full bg-slate-500"></div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                ▶ Start Test
              </button>
              <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                📋 Copy Results
              </button>
              <button onClick={handlers.handleCloseConnectivityCheck} className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile App Info Modal - Placeholder */}
      {state.showMobileAppInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handlers.handleCloseMobileAppInfo}>
          <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Mobile App Info</h2>
            <p className="text-slate-300 mb-4">Download our mobile app for the best experience on iOS and Android devices.</p>
            <div className="space-y-3 mb-6">
              <a href="#" className="block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center">
                📱 Download for iOS
              </a>
              <a href="#" className="block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center">
                🤖 Download for Android
              </a>
            </div>
            <button onClick={handlers.handleCloseMobileAppInfo} className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Close
            </button>
          </div>
        </div>
      )}

      {/* ====== MAIN FLUENT LAYOUT ====== */}
      <main className="relative flex flex-1 overflow-hidden">
        {/* ---- LEFT PANEL (Alerts + Chat) ---- */}
        <aside
          data-testid="left-panel"
          ref={refs.leftPanelRef}
          className="relative z-20 flex flex-col bg-slate-800 shadow-lg border-r border-slate-700"
          style={{ 
            width: `${state.leftPanelWidth || 480}px`,
            minWidth: '280px',
            // Match container clamp headroom; container still enforces the true limit
            maxWidth: '70vw'
          }}
        >
          {/* Alerts Section */}
          <section
            data-testid="alerts-panel"
            aria-label="Trading Alerts"
            // ⭐⭐⭐ REAL FIX: Removed overflow-hidden ⭐⭐⭐
            // overflow-hidden was clipping content from OUTSIDE the scroll container
            // This prevented scroll adjustments when resizing
            // The internal scroll container in AlertsPanelEntry handles overflow properly
            className="flex-shrink-0 border-b border-slate-700 relative z-10 bg-slate-800"
            style={{ 
              height: `${state.alertsHeight || 300}px`, 
              minHeight: '120px'
            }}
          >
            <AlertsPanelEntry
              roomId={state.room?.id}
              ListComponent={AlertsList}
              ToolbarComponent={(props) => (
                <AlertsToolbar
                  {...props}
                  onPollClick={handlers.handleShowPollModalOpen}
                  onPostAlertClick={handlers.handleShowAlertModalOpen}
                />
              )}
              ComposerComponent={AlertsComposerAdapter}
              isResizing={state.isResizingVertical}
              onMute={handlers.handleMuteUser}
              onBan={handlers.handleBanUser}
              onKick={handlers.handleKickUser}
              onReport={handlers.handleReportAlert}
              onMention={handlers.handleMentionUser}
              onUserInfo={handlers.handleUserInfo}
              onPrivateChat={handlers.handlePrivateChat}
              onShowToAll={handlers.handleShowToAll}
            />
          </section>

          {/* Horizontal Resizer (Controls Vertical Split) */}
          <HorizontalResizeHandle
            onPointerDown={handlers.handleVerticalResizeDown}
            role="separator"
            ariaOrientation="horizontal"
            ariaValueMin={120}
            ariaValueMax={Math.round((state.size?.h ?? 0) * 0.6)}
            ariaValueNow={state.alertsHeight}
            // side="right" // This prop was removed for linting
            onKeyboardDelta={handlers.handleKeyboardResize}
            onKeyboardHome={() => handlers.handleKeyboardSnap('min')}
            onKeyboardEnd={() => handlers.handleKeyboardSnap('max')}
          />

          {/* Chat Section */}
          <section
            data-testid="chat-panel"
            aria-label="Chat"
            className="flex-1 overflow-hidden flex flex-col bg-slate-800"
            style={{ 
              minHeight: '200px', 
              maxHeight: 'calc(100% - 120px)',
              borderTop: 'none' 
            }}
          >
            <ChatPanel />
          </section>

          {/* Vertical Resizer (Controls Horizontal Split) */}
          <VerticalResizeHandle
            onPointerDown={handlers.handleLeftResizeStart}
            role="separator"
            ariaOrientation="vertical"
            ariaValueMin={280}
            ariaValueMax={600}
            ariaValueNow={state.leftPanelWidth}
            onKeyboardDelta={handlers.handleKeyboardResize}
            onKeyboardHome={() => handlers.handleKeyboardSnap('min')}
            onKeyboardEnd={() => handlers.handleKeyboardSnap('max')}
            side="right"
          />
        </aside>

        {/* ---- MAIN CONTENT AREA ---- */}
        <div
          data-testid="video-stage"
          className="flex-1 flex flex-col min-w-0 bg-slate-900"
          style={{ transition: 'all 0.2s ease' }}
        >
          {/* Tabs Navigation */}
          <nav 
            role="tablist" 
            aria-label="Content tabs" 
            className="flex items-center justify-center gap-3 p-3 sm:p-4 border-b border-slate-700 bg-slate-800 text-sm sm:text-base"
          >
            <button 
              role="tab" 
              aria-selected={state.contentTab === 'screens'}
              onClick={() => handlers.onTabChange('screens')}
              className={`px-4 py-2 rounded-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.8),0_8px_16px_rgba(0,0,0,0.3)] text-white font-semibold text-base ${
                state.contentTab === 'screens' ? 'fluent-tab-active' : 'fluent-tab'
              }`}
            >
              Screens
            </button>
            <div className="relative">
              <button
                ref={notesButtonRef}
                role="tab" 
                aria-selected={state.contentTab === 'notes'}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  const isChevron = target.closest('.chevron-toggle');
                  
                  if (isChevron) {
                    // Chevron clicked - toggle dropdown only
                    const newState = !showNotesDropdown;
                    setShowNotesDropdown(newState);
                    
                    if (newState && notesButtonRef.current) {
                      const rect = notesButtonRef.current.getBoundingClientRect();
                      setDropdownPosition({
                        top: rect.bottom + 4,
                        left: rect.left
                      });
                    }
                  } else {
                    // Button clicked - switch tab only
                    handlers.onTabChange('notes');
                  }
                }}
                className={`px-4 py-2 rounded-lg transition-all text-white font-semibold text-base flex items-center gap-2 ${
                  state.contentTab === 'notes' ? 'fluent-tab-active' : 'fluent-tab hover:bg-blue-900/30'
                }`}
              >
                <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm3 3h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/>
                </svg>
                Notes
                <span className="settings-toggle cursor-pointer hover:opacity-80 transition-opacity">
                  {(() => {
                    const I = fi?.Settings24Regular || fi?.Settings20Regular;
                    if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className="w-5 h-5 text-white" />; }
                    return <Settings className="w-5 h-5 text-white" strokeWidth={2.5} />;
                  })()}
                </span>
                <span className="chevron-toggle cursor-pointer">
                  {(() => {
                    const I = fi?.ChevronDown24Regular || fi?.ChevronDown20Regular || fi?.CaretDown24Regular || fi?.CaretDown20Regular;
                    if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className={`w-5 h-5 text-white transition-transform duration-300 ${showNotesDropdown ? 'rotate-180' : ''}`} />; }
                    return <ChevronDown className={`w-5 h-5 text-white transition-transform duration-300 ${showNotesDropdown ? 'rotate-180' : ''}`} style={{ strokeWidth: 3 }} />;
                  })()}
                </span>
              </button>

            </div>
            <button 
              role="tab" 
              aria-selected={state.contentTab === 'files'}
              onClick={() => handlers.onTabChange('files')}
              className={`px-4 py-2 rounded-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.8),0_8px_16px_rgba(0,0,0,0.3)] text-white font-semibold text-base ${
                state.contentTab === 'files' ? 'fluent-tab-active' : 'fluent-tab'
              }`}
            >
              Files
            </button>
          </nav>

          {/* Main Content Viewer */}
          <div className="flex-1 min-h-0 relative">
            <ContentViewer activeTab={state.contentTab} onTabChange={handlers.onTabChange} />
            
            {/* Whiteboard - Professional Architecture with Surface + CanvasPro + Toolbar */}
            {state.isWhiteboardActive && state.size && state.size.w > 0 && state.size.h > 0 && (
              <>
                <div className="absolute inset-0 z-50 pointer-events-none">
                  <WhiteboardSurface 
                    width={state.size.w} 
                    height={state.size.h}
                    className="pointer-events-auto"
                  >
                    <WhiteboardCanvasPro 
                      width={state.size.w}
                      height={state.size.h}
                      canAnnotate={state.canManageRoom}
                    />
                  </WhiteboardSurface>
                </div>
                {/* Toolbar outside Surface to prevent overflow:hidden clipping */}
                {state.canManageRoom && (
                  <WhiteboardToolbar 
                    onClose={handlers.onWhiteboardClose}
                    canManageRoom={state.canManageRoom}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* ====== FLOATING WINDOWS & MODALS ====== */}
      <CameraWindow
        stream={state.cameraStream || undefined}
        isActive={state.cameraEnabled && state.showCameraWindow}
        onClose={handlers.handleCameraWindowClose}
      />

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <ThemeOpacityControl />
      </div>

      {/* Post Alert Modal - Only show if explicitly opened by user */}
      {state.showAlertModal && <PostAlertModal onClose={handlers.handleShowAlertModalClose} />}
      {state.showPollModal && <PollModal onClose={handlers.handleShowPollModalClose} />}

      <ThemeSettingsPanel
        isOpen={state.showThemePanel}
        onClose={handlers.handleThemePanelClose}
      />

      {/* Branding Settings Modal */}
      {state.showBranding && (
        <AdvancedBrandingSettings
          onClose={() => handlers.setShowBranding(false)}
        />
      )}

      {/* General Settings Modal */}
      {state.showSettings && (
        <GeneralSettingsModal
          onClose={() => handlers.setShowSettings(false)}
        />
      )}

      {/* Private Chat Drawer */}
      {activePrivateChat && (
        <PrivateChatModal
          chatId={activePrivateChat.chatId}
          userId={activePrivateChat.userId}
          userName={activePrivateChat.displayName}
          currentUserId={activePrivateChat.currentUserId}
          onClose={() => setActivePrivateChat(null)}
        />
      )}

      {/* Resize Overlay (Visual Feedback) */}
      {(state.isResizingLeft || state.isResizingVertical) && (
        <div className="fixed inset-0 z-40 bg-blue-500/10 pointer-events-none" />
      )}

      {/* Notes Dropdown - Portaled to document.body to escape overflow-hidden */}
      {showNotesDropdown && state.contentTab === 'notes' && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <div 
            className="fixed inset-0 z-[499]"
            onClick={() => setShowNotesDropdown(false)}
          />
          {/* Dropdown menu */}
          <div 
            role="menu" 
            className="fixed z-[500] bg-slate-800 border border-slate-600 rounded-md shadow-xl min-w-[160px]"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`
            }}
            aria-label="Notes menu"
          >
            <button
              role="menuitem"
              onClick={() => {
                const event = new CustomEvent('notes:new');
                window.dispatchEvent(event);
                setShowNotesDropdown(false);
              }}
              className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-200 hover:bg-slate-700 font-semibold text-sm transition-colors"
            >
              <span className="text-lg font-bold text-gray-300">+</span>
              New Note
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}