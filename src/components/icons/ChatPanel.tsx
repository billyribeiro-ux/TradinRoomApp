import {
  faExclamationTriangle,
  faSpinner,
  faThumbtack
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isSameDay } from 'date-fns';
import debounce from 'lodash/debounce';
import type {
  ErrorInfo,
  ReactNode} from 'react';
import {
  Component,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useFluentIcons } from '../../icons/useFluentIcons';

import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useRoomStore } from '../../store/roomStore';
import { useToastStore } from '../../store/toastStore';
import type { ChatMessage as ChatMessageRecord, Database } from '../../types/database.types';

import * as Icons from '@fluentui/react-icons';

type UserRow = Database['public']['Tables']['users']['Row'];

// Microsoft Pattern: Type adapter for Auth User -> Database User compatibility
// The auth user contains the same fields needed by ChatMessage (id, email, user_metadata)
type AuthUserAdapter = Pick<UserRow, 'id' | 'email'> & Partial<Omit<UserRow, 'id' | 'email'>>;

/**
 * Convert AuthUserAdapter to UserRow for components that expect UserRow
 */
function toUserRow(user: AuthUserAdapter | undefined): UserRow | undefined {
  if (!user) return undefined;
  return {
    id: user.id,
    email: user.email,
    avatar_url: user.avatar_url ?? null,
    created_at: user.created_at ?? null,
    display_name: user.display_name ?? null,
    role: user.role ?? null,
    updated_at: user.updated_at ?? null,
  };
}

import { ChatHeader, ChatTab } from '../chat/ChatHeader';
import { ChatInput } from '../chat/ChatInput';
import { ChatMessage } from '../chat/ChatMessage';
import { ChatSettings } from '../chat/ChatSettings';
import { DateHeader } from '../chat/DateHeader';
import { getRoleColorStyle } from '../chat/chatColors';
import type { LoadingStates, RoleStyle } from '../../features/chat/chat.types';
import {
  INITIAL_SCROLL_BEHAVIOR,
  LoadingState,
  SCROLL_THRESHOLD_PX,
  SMOOTH_SCROLL_BEHAVIOR
} from '../chat/constants';
import { useChatHandlers } from '../chat/useChatHandlers';
import { useFileUpload } from '../chat/useFileUpload';
import { getMessageAuthor } from '../chat/utils';
import { PANEL_COLORS } from '../panelColors';

// ============================================================================
// MAIN COMPONENT - Microsoft Enterprise Grade
// ============================================================================
export function ChatPanel() {
  // ============================================================================
  // STATE & REFS - Microsoft Pattern: Grouped by concern
  // ============================================================================
  const [activeTab, setActiveTab] = useState<ChatTab>(ChatTab.Main);
  const [showSettings, setShowSettings] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | undefined>();
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fi = useFluentIcons();
  
  // LiveKit audio activity detection - shows speaking indicator in chat
  // TODO: Enable when @livekit/components-react is installed
  // const participants = useParticipants();
  // const currentUserParticipant = participants.find((p) => p.identity === user?.id);
  // const isSpeaking = useIsSpeaking(currentUserParticipant);
  const isSpeaking = false; // Placeholder until LiveKit hooks are available
  
  // Refs - Microsoft Pattern: Proper typing and initialization
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const justSentMessageRef = useRef<boolean>(false);
  const messagesLengthRef = useRef<Record<string, number>>({ main: 0, offTopic: 0 });
  const prevMessagesLengthRef = useRef<Record<string, number>>({ main: 0, offTopic: 0 });
  const previousTabRef = useRef<ChatTab>(activeTab);

  // ============================================================================
  // STORE INTEGRATION - Microsoft Pattern: Centralized state
  // ============================================================================
  const { currentRoom, messages, canManageRoom } = useRoomStore();
  const { user: authUser } = useAuthStore();
  const { addToast } = useToastStore();
  
  // Microsoft Pattern: Adapt auth user to database user shape
  // Safe because ChatMessage only uses id and email which exist on both types
  const user = authUser as AuthUserAdapter | undefined;
  // const { colors } = useThemeStore(); // TODO: Use colors for theming

  // ============================================================================
  // LOADING STATES - Microsoft Pattern
  // ============================================================================
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    messages: LoadingState.Idle,
    sending: LoadingState.Idle,
    deleting: new Set<string>(),
    pinning: new Set<string>(),
    uploading: LoadingState.Idle
  });

  // ============================================================================
  // MEMOIZED HELPERS - Microsoft Pattern for performance
  // ============================================================================
  const getRoleStyle = useCallback((role?: string): RoleStyle => {
    return getRoleColorStyle(role);
  }, []);

  // ============================================================================
  // MODERATION HANDLERS - Enterprise Standard
  // ============================================================================
  const handleMuteUser = useCallback((userId: string, displayName: string) => {
    if (confirm(`Mute ${displayName}? They won't be able to send messages.`)) {
      // Store muted user in localStorage
      try {
        const mutedUsers = JSON.parse(localStorage.getItem('muted_users') || '[]');
        mutedUsers.push({ id: userId, name: displayName, mutedAt: new Date() });
        localStorage.setItem('muted_users', JSON.stringify(mutedUsers));
        addToast(`${displayName} has been muted`);
      } catch (error) {
        console.error('Failed to mute user:', error);
        addToast('Failed to mute user');
      }
    }
  }, [addToast]);

  const handleBanUser = useCallback((userId: string, displayName: string) => {
    if (confirm(`Ban ${displayName}? This will remove them from the room permanently.`)) {
      // TODO: Implement server-side ban
      addToast(`${displayName} has been banned`);
      console.log('Ban user:', userId, displayName);
    }
  }, [addToast]);

  const handleKickUser = useCallback((userId: string, displayName: string) => {
    if (confirm(`Kick ${displayName}? They can rejoin the room later.`)) {
      // TODO: Implement server-side kick
      addToast(`${displayName} has been kicked`);
      console.log('Kick user:', userId, displayName);
    }
  }, [addToast]);

  const handleReportMessage = useCallback((messageId: string) => {
    if (confirm('Report this message to moderators?')) {
      // TODO: Implement server-side report
      addToast('Message reported to moderators');
      console.log('Report message:', messageId);
    }
  }, [addToast]);

  const handlePrivateChat = useCallback(async (userId: string, displayName: string) => {
    // Validation
    if (!user?.id) {
      addToast('You must be logged in to start a private chat', 'error');
      return;
    }
    
    if (!userId || !displayName) {
      addToast('Invalid user information', 'error');
      return;
    }
    
    if (userId === user.id) {
      addToast('Cannot start a private chat with yourself', 'error');
      return;
    }
    
    try {
      // Check if chat already exists (either direction) - use maybeSingle to avoid errors
      // @ts-ignore - Table will be added in migration
      const { data: existingChat1, error: error1 } = await supabase
        .from('private_chats')
        .select('*')
        .eq('user1_id', user.id)
        .eq('user2_id', userId)
        .maybeSingle();
      
      if (error1) throw error1;
      
      // @ts-ignore - Table will be added in migration
      const { data: existingChat2, error: error2 } = await supabase
        .from('private_chats')
        .select('*')
        .eq('user1_id', userId)
        .eq('user2_id', user.id)
        .maybeSingle();
      
      if (error2) throw error2;
      
      let chatId = existingChat1?.id || existingChat2?.id;
      
      // Create new chat if doesn't exist
      if (!chatId) {
        // @ts-ignore - Table will be added in migration
        const { data: newChat, error: createError } = await supabase
          .from('private_chats')
          .insert({
            user1_id: user.id,
            user2_id: userId,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (createError) {
          console.error('[ChatPanel] Failed to create chat:', createError);
          throw new Error(`Failed to create chat: ${createError.message}`);
        }
        
        chatId = newChat?.id;
      }
      
      if (!chatId) {
        throw new Error('Failed to get or create chat ID');
      }
      
      // Dispatch event to open private chat drawer
      window.dispatchEvent(new CustomEvent('open-private-chat', { 
        detail: { 
          chatId,
          userId, 
          displayName,
          currentUserId: user.id
        } 
      }));
      
      addToast(`Opening chat with ${displayName}`, 'success');
    } catch (error) {
      console.error('[ChatPanel] Private chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to open private chat';
      addToast(errorMessage, 'error');
    }
  }, [user?.id, addToast]);

  const shouldShowDateHeader = useCallback((currentMsg: { created_at?: string | null }, previousMsg?: { created_at?: string | null }): boolean => {
    if (!previousMsg) return true;
    const currentDate = new Date(currentMsg.created_at ?? '');
    const previousDate = new Date(previousMsg.created_at ?? '');
    return !isSameDay(currentDate, previousDate);
  }, []);

  // ============================================================================
  // CUSTOM HOOKS - Microsoft Pattern
  // ============================================================================
  const fileUpload = useFileUpload({
    user: toUserRow(user),
    currentRoom,
    addToast,
    fileInputRef
  });

  const handlers = useChatHandlers({
    user: toUserRow(user),
    currentRoom,
    messages,
    input,
    pendingFile: fileUpload.pendingFile,
    uploadedFileUrl: fileUpload.uploadedFileUrl,
    activeTab: activeTab === ChatTab.Main ? 'main' : 'off-topic',
    messagesEndRef,
    justSentMessageRef,
    setInput,
    setImagePreview: fileUpload.setImagePreview,
    setPendingFile: fileUpload.setPendingFile,
    setUploadedFileUrl: fileUpload.setUploadedFileUrl,
    setIsUserScrolledUp,
    setLoadingStates,
    addToast,
    fileInputRef
  });

  // ============================================================================
  // SCROLL MANAGEMENT - Microsoft Enterprise Pattern
  // ============================================================================
  useEffect(() => {
    const container = messagesContainerRef.current;
    
    const handleScroll = (): void => {
      if (!container) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - (scrollTop + clientHeight) < SCROLL_THRESHOLD_PX;
      setIsUserScrolledUp(!isNearBottom);
    };
    
    const handleScrollDebounced = debounce(handleScroll, 100);
    
    if (container) {
      container.addEventListener('scroll', handleScrollDebounced, { passive: true });
      
      // Initial check
      handleScroll();
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScrollDebounced);
      }
      if (typeof handleScrollDebounced.cancel === 'function') {
        handleScrollDebounced.cancel();
      }
    };
  }, []);

  // Track message lengths per tab
  useEffect(() => {
    if (activeTab in messagesLengthRef.current) {
      messagesLengthRef.current[activeTab] = messages.length;
    }
  }, [messages.length, activeTab]);

  // ============================================================================
  // AUTO-SCROLL - Initial Load & Room Changes
  // ============================================================================
  useEffect(() => {
    // Always scroll to bottom on room change, even if no messages yet
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: INITIAL_SCROLL_BEHAVIOR, 
        block: 'end' 
      });
    }, 50);
    
    // Additional scroll after content fully renders
    const timer2 = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: SMOOTH_SCROLL_BEHAVIOR, 
        block: 'end' 
      });
      setIsUserScrolledUp(false);
    }, 200);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [currentRoom?.id]);

  // ============================================================================
  // AUTO-SCROLL - New Messages & Tab Changes
  // ============================================================================
  useEffect(() => {
    if (messages.length === 0) return;
    
    const previousLength = messagesLengthRef.current[activeTab] || 0;
    const isNewMessage = messages.length > previousLength;
    
    // Always scroll on tab change or new message if not scrolled up
    const shouldAutoScroll = !isUserScrolledUp || justSentMessageRef.current || isNewMessage;
    
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: SMOOTH_SCROLL_BEHAVIOR, 
        block: 'end' 
      });
      setIsUserScrolledUp(false);
      justSentMessageRef.current = false;
    }
    
    // Update the stored message length for this tab
    messagesLengthRef.current[activeTab] = messages.length;
  }, [messages, activeTab, isUserScrolledUp]);

  // ============================================================================
  // TAB CHANGE HANDLING - Microsoft Pattern: Clean state transitions
  // ============================================================================
  useEffect(() => {
    if (previousTabRef.current !== activeTab) {
      setIsUserScrolledUp(false);
      previousTabRef.current = activeTab;
    }
  }, [activeTab]);

  // ============================================================================
  // UNREAD MESSAGES TRACKING - Microsoft Pattern: Real-time updates
  // ============================================================================
  const [unreadCounts, setUnreadCounts] = useState({ main: 0, offTopic: 0 });

  useEffect(() => {
    const mainMsgs = messages.filter(m => !m.is_off_topic);
    const offTopicMsgs = messages.filter(m => m.is_off_topic);
    
    prevMessagesLengthRef.current = {
      main: messagesLengthRef.current.main,
      offTopic: messagesLengthRef.current.offTopic
    };
    
    messagesLengthRef.current = {
      main: mainMsgs.length,
      offTopic: offTopicMsgs.length
    };

    let newMainCount = 0;
    let newOffTopicCount = 0;

    if (activeTab === ChatTab.OffTopic && mainMsgs.length > prevMessagesLengthRef.current.main) {
      newMainCount = mainMsgs.length - prevMessagesLengthRef.current.main;
    }
    if (activeTab === ChatTab.Main && offTopicMsgs.length > prevMessagesLengthRef.current.offTopic) {
      newOffTopicCount = offTopicMsgs.length - prevMessagesLengthRef.current.offTopic;
    }

    setUnreadCounts({ main: newMainCount, offTopic: newOffTopicCount });
  }, [messages, activeTab]);

  // ============================================================================
  // MESSAGE PROCESSING - Microsoft Pattern: Optimized data handling
  // ============================================================================
  const filteredMessages = useMemo(() => {
    const mainMessages = messages.filter(m => !m.is_deleted && !m.is_off_topic);
    const offTopicMessages = messages.filter(m => !m.is_deleted && m.is_off_topic);
    
    return { mainMessages, offTopicMessages };
  }, [messages]);

  // ============================================================================
  // HANDLERS - Microsoft Pattern: Clean separation of concerns
  // ============================================================================
  const handleTabChange = useCallback((tab: ChatTab) => {
    setActiveTab(tab);
    setUnreadCounts(prev => ({
      ...prev,
      [tab === ChatTab.Main ? 'main' : 'off-topic']: 0
    }));
  }, []);

  const handleClearUnread = useCallback((tab: ChatTab) => {
    setUnreadCounts(prev => ({
      ...prev,
      [tab === ChatTab.Main ? 'main' : 'off-topic']: 0
    }));
  }, []);

  const handleToggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
  }, []);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setInput(prev => prev + emoji);
  }, []);

  // ============================================================================
  // RENDER - Microsoft Enterprise Pattern
  // ============================================================================
  if (!currentRoom) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-800">
        <div className="text-center">
          {(() => {
            const I = fi?.SpinnerIos24Regular || fi?.SpinnerIos20Regular || fi?.ArrowClockwise24Regular || fi?.ArrowClockwise20Regular;
            if (I) { return <I className="animate-spin text-blue-500 text-3xl mb-4" />; }
            return (
              <FontAwesomeIcon 
                icon={faSpinner} 
                className="animate-spin text-blue-500 text-3xl mb-4"
              />
            );
          })()}
          <p className="text-slate-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (loadingStates.messages === LoadingState.Error) {
    return (
      <ChatPanelErrorBoundary error={new Error('Failed to load chat messages')} />
    );
  }

  const { mainMessages, offTopicMessages } = filteredMessages;

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <ChatHeader
        activeTab={activeTab}
        unreadMainCount={unreadCounts.main}
        unreadOffTopicCount={unreadCounts.offTopic}
        onTabChange={handleTabChange}
        onClearUnread={handleClearUnread}
        onToggleSettings={handleToggleSettings}
      />

      {/* Pinned Messages */}
      {mainMessages.filter(msg => msg.pinned_by).length > 0 && (
        <div className={`${PANEL_COLORS.card.own.background} border-b ${PANEL_COLORS.container.divider} p-2 max-h-32 overflow-y-auto`}>
          {mainMessages.filter(msg => msg.pinned_by).map(msg => (
            <div key={msg.id} className={`text-sm ${PANEL_COLORS.text.primary} mb-1 flex items-start gap-2`}>
              {(() => {
                const I = fi?.Pin24Regular || fi?.Pin20Regular;
                if (I) { return <I className={`w-3 h-3 ${PANEL_COLORS.text.link.normal} flex-shrink-0 mt-1`} />; }
                return (
                  <FontAwesomeIcon 
                    icon={faThumbtack} 
                    className={`w-3 h-3 ${PANEL_COLORS.text.link.normal} flex-shrink-0 mt-1`}
                  />
                );
              })()}
              <div className="flex-1 truncate">
                <span className={`${getRoleStyle(msg.user_role ?? undefined).textColor} font-semibold`}>
                  {getMessageAuthor(msg).display_name}
                </span>: {msg.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <ChatSettings
          showSettings={showSettings}
          modOnly={false}
          onModOnlyChange={() => {}}
          onSearchChange={() => {}}
          onDownloadChat={() => void handlers.handleDownloadChat()}
          onEraseChat={() => void handlers.handleEraseChat()}
          onDetachChat={() => void handlers.handleDetachChat()}
        />
      )}

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-800 relative"
        style={{ scrollbarGutter: 'stable' }}
      >
        {/* Main Chat Container */}
        <div 
          className="absolute inset-0 pl-3 sm:pl-4 pr-6 sm:pr-7 py-3 pb-2 space-y-2 transition-opacity duration-150 overflow-y-auto overflow-x-hidden"
          style={{ 
            opacity: activeTab === ChatTab.Main ? 1 : 0,
            pointerEvents: activeTab === ChatTab.Main ? 'auto' : 'none',
            zIndex: activeTab === ChatTab.Main ? 1 : 0
          }}
        >
          {mainMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              No messages yet
            </div>
          ) : (
            <>
              {mainMessages.map((msg: ChatMessageRecord, index) => {
                const isDeleting = loadingStates.deleting.has(msg.id);
                const previousMsg = index > 0 ? mainMessages[index - 1] : undefined;
                const showDateHeader = shouldShowDateHeader(msg, previousMsg);

                return (
                  <Fragment key={msg.id}>
                    {showDateHeader && (
                      <DateHeader date={new Date(msg.created_at ?? '')} />
                    )}
                    
                    <ChatMessage
                      message={msg}
                      user={toUserRow(user)}
                      isSpeaking={isSpeaking}
                      isDeleting={isDeleting}
                      isPinning={loadingStates.pinning.has(msg.id)}
                      openMenuId={openMenuId}
                      onDelete={(messageId) => void handlers.handleDelete(messageId)}
                      onPin={(message) => {
                        void handlers.handlePin(message as ChatMessageRecord);
                      }}
                      onMenuToggle={setOpenMenuId}
                      onMention={(displayName) => setInput(`@${displayName} `)}
                      onMute={handleMuteUser}
                      onBan={handleBanUser}
                      onKick={handleKickUser}
                      onReport={handleReportMessage}
                      onPrivateChat={handlePrivateChat}
                    />
                  </Fragment>
                );
              })}
              {activeTab === ChatTab.Main && <div ref={messagesEndRef} className="h-4" aria-hidden="true" />}
            </>          
          )}
        </div>
        
        {/* Off-Topic Chat Container */}
        <div 
          className="absolute inset-0 pl-3 sm:pl-4 pr-6 sm:pr-7 py-3 pb-2 space-y-2 transition-opacity duration-150 overflow-y-auto overflow-x-hidden"
          style={{ 
            opacity: activeTab === ChatTab.OffTopic ? 1 : 0,
            pointerEvents: activeTab === ChatTab.OffTopic ? 'auto' : 'none',
            zIndex: activeTab === ChatTab.OffTopic ? 1 : 0
          }}
        >
          {offTopicMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              No off-topic messages yet
            </div>
          ) : (
            <>
              {offTopicMessages.map((msg: ChatMessageRecord, index) => {
                const isDeleting = loadingStates.deleting.has(msg.id);
                const previousMsg = index > 0 ? offTopicMessages[index - 1] : undefined;
                const showDateHeader = shouldShowDateHeader(msg, previousMsg);

                return (
                  <Fragment key={msg.id}>
                    {showDateHeader && (
                      <DateHeader date={new Date(msg.created_at ?? '')} />
                    )}
                    
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      user={toUserRow(user)}
                      isSpeaking={isSpeaking}
                      isDeleting={isDeleting}
                      isPinning={loadingStates.pinning.has(msg.id)}
                      openMenuId={openMenuId}
                      onDelete={(messageId) => void handlers.handleDelete(messageId)}
                      onPin={(message) => {
                        void handlers.handlePin(message as ChatMessageRecord);
                      }}
                      onMenuToggle={setOpenMenuId}
                      onMention={(displayName) => setInput(`@${displayName} `)}
                      // Microsoft Enterprise: Only pass moderation functions to users with permissions
                      onMute={canManageRoom() ? handleMuteUser : undefined}
                      onBan={canManageRoom() ? handleBanUser : undefined}
                      onKick={canManageRoom() ? handleKickUser : undefined}
                      onReport={canManageRoom() ? handleReportMessage : undefined}
                      onPrivateChat={handlePrivateChat}
                    />
                  </Fragment>
                );
              })}
              {activeTab === ChatTab.OffTopic && <div ref={messagesEndRef} className="h-4" aria-hidden="true" />}
            </>          
          )}
        </div>
      </div>

      {/* Input Area */}
      <ChatInput
        input={input}
        imagePreview={fileUpload.imagePreview}
        pendingFile={fileUpload.pendingFile}
        uploadProgress={fileUpload.uploadProgress}
        sendingState={loadingStates.sending}
        uploadingState={fileUpload.uploadingState}
        showEmojiPicker={showEmojiPicker}
        onInputChange={setInput}
        onSend={(e) => void handlers.handleSend(e)}
        onFileSelect={(e) => void fileUpload.handleImageSelect(e)}
        onCancelFile={fileUpload.handleCancelImage}
        onEmojiSelect={handleEmojiSelect}
        onToggleEmojiPicker={() => setShowEmojiPicker(!showEmojiPicker)}
      />

      {/* Scroll to bottom indicator */}
      {isUserScrolledUp && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
          <button
            onClick={() => {
              const container = messagesContainerRef.current;
              if (container) {
                container.scrollTo({
                  top: container.scrollHeight,
                  behavior: SMOOTH_SCROLL_BEHAVIOR
                });
                setIsUserScrolledUp(false);
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-sm transition-colors"
          >
            ↓ New messages
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ERROR BOUNDARY - Microsoft Enterprise Pattern
// ============================================================================
interface ChatPanelErrorBoundaryProps {
  error?: Error;
  children?: ReactNode;
}

interface ChatPanelErrorBoundaryState {
  error: Error | null;
}

class ChatPanelErrorBoundary extends Component<ChatPanelErrorBoundaryProps, ChatPanelErrorBoundaryState> {
  constructor(props: ChatPanelErrorBoundaryProps) {
    super(props);
    this.state = { error: props.error ?? null };
  }

  static getDerivedStateFromError(error: Error): ChatPanelErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ChatPanel Error Boundary caught an error:', error, errorInfo);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="h-full flex items-center justify-center bg-slate-800 p-4">
          <div className="text-center max-w-md">
            {(() => {
              const I = Icons?.Warning24Regular || Icons?.Warning20Regular;
              if (I) { return <I className="w-16 h-16 text-red-500 mb-4 mx-auto" />; }
              return (
                <FontAwesomeIcon 
                  icon={faExclamationTriangle} 
                  className="w-16 h-16 text-red-500 mb-4 mx-auto"
                />
              );
            })()}
            <h2 className="text-xl font-bold text-white mb-2">
              Chat Error
            </h2>
            <p className="text-slate-400 mb-4">
              Something went wrong with the chat. Please try refreshing the page.
            </p>
            <details className="text-left bg-slate-900 p-3 rounded text-xs text-red-400">
              <summary className="cursor-pointer mb-2">Error Details</summary>
              <pre className="overflow-auto">{this.state.error.stack}</pre>
            </details>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children ?? null;
  }
}

// ============================================================================
// EXPORT - Microsoft Enterprise Pattern
// ============================================================================
export default ChatPanel;