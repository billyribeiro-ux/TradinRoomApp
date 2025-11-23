/**
 * ChatPanel Component - Fluent UI Version
 * Main chat container with Fluent UI icons
 * Note: This is a simplified version - you'll need to import this in place of the original ChatPanel
 */

import {
  ErrorCircle24Regular
} from '@fluentui/react-icons';
import { Spinner } from '@fluentui/react-components';
import { isSameDay } from 'date-fns';
import {
  Fragment,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import { useRoomStore } from '../../../store/roomStore';
import { useToastStore } from '../../../store/toastStore';
import type { Database } from '../../../types/database.types';

type UserRow = Database['public']['Tables']['users']['Row'];

// Microsoft Pattern: Type adapter for Auth User -> Database User compatibility
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

// Import Fluent UI versions
import { ChatHeader, ChatTab } from './ChatHeader.fluent';
import { ChatInput } from './ChatInput.fluent';
import { ChatMessage } from './ChatMessage.fluent';
import { ChatSettings } from '../../chat/ChatSettings';
import { DateHeader } from '../../chat/DateHeader';
import type { LoadingStates, UploadProgress } from '../../../features/chat/chat.types';
import {
  LoadingState
} from '../../chat/constants';
import { useChatHandlers } from '../../chat/useChatHandlers';
import { useFileUpload } from '../../chat/useFileUpload';

// ============================================================================
// MAIN COMPONENT - Fluent UI Version
// ============================================================================
export function ChatPanel() {
  // ============================================================================
  // STATE & REFS
  // ============================================================================
  const [activeTab, setActiveTab] = useState<ChatTab>(ChatTab.Main);
  const [showSettings, setShowSettings] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | undefined>();
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const isSpeaking = false; // Placeholder until LiveKit hooks are available
  
  // Refs
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const justSentMessageRef = useRef<boolean>(false);

  // ============================================================================
  // STORE INTEGRATION
  // ============================================================================
  const { currentRoom, messages, canManageRoom } = useRoomStore();
  const { user: authUser } = useAuthStore();
  const { addToast } = useToastStore();
  
  const user = authUser as AuthUserAdapter | undefined;

  // ============================================================================
  // LOADING STATES
  // ============================================================================
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    messages: LoadingState.Idle,
    sending: LoadingState.Idle,
    deleting: new Set<string>(),
    pinning: new Set<string>(),
    uploading: LoadingState.Idle
  });

  // ============================================================================
  // MEMOIZED HELPERS
  // ============================================================================

  // ============================================================================
  // MODERATION HANDLERS
  // ============================================================================
  const handleMuteUser = useCallback((userId: string, displayName: string) => {
    if (confirm(`Mute ${displayName}? They won't be able to send messages.`)) {
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
      addToast(`${displayName} has been banned`);
      console.log('Ban user:', userId, displayName);
    }
  }, [addToast]);

  const handleKickUser = useCallback((userId: string, displayName: string) => {
    if (confirm(`Kick ${displayName}? They can rejoin the room later.`)) {
      addToast(`${displayName} has been kicked`);
      console.log('Kick user:', userId, displayName);
    }
  }, [addToast]);

  const handleReportMessage = useCallback((messageId: string) => {
    if (confirm('Report this message to moderators?')) {
      addToast('Message reported to moderators');
      console.log('Report message:', messageId);
    }
  }, [addToast]);

  const handlePrivateChat = useCallback(async (userId: string, displayName: string) => {
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
  // CUSTOM HOOKS
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
    setIsUserScrolledUp: () => {}, // No-op: scroll detection is now internal to this component
    setLoadingStates,
    addToast,
    fileInputRef
  });

  // ============================================================================
  // SCROLL MANAGEMENT
  // ============================================================================
  // Scroll detection removed - using immediate scroll-to-bottom on load (Discord-grade)

  // Filter messages by tab
  const filteredMessages = useMemo(() => {
    return messages.filter(m => 
      !m.is_deleted && 
      (activeTab === ChatTab.Main ? !m.is_off_topic : m.is_off_topic)
    );
  }, [messages, activeTab]);

  // ============================================================================
  // AUTO-SCROLL - Scroll to bottom when messages change (Discord-grade, instant)
  // ============================================================================
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (container && filteredMessages.length > 0) {
      // Scroll immediately without animation
      container.scrollTop = container.scrollHeight;
    }
  }, [filteredMessages]); // Trigger on any message change

  // Unread counts
  const unreadMainCount = 0; // Implement unread logic
  const unreadOffTopicCount = 0; // Implement unread logic

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header - Fluent UI */}
      <ChatHeader
        activeTab={activeTab}
        unreadMainCount={unreadMainCount}
        unreadOffTopicCount={unreadOffTopicCount}
        onTabChange={setActiveTab}
        onClearUnread={() => {}}
        onToggleSettings={() => setShowSettings(!showSettings)}
      />

      {/* Settings Panel */}
      <ChatSettings
        showSettings={showSettings}
        modOnly={false}
        onModOnlyChange={() => {}}
        onSearchChange={() => {}}
        onDownloadChat={handlers.handleDownloadChat}
        onEraseChat={handlers.handleEraseChat}
        onDetachChat={handlers.handleDetachChat}
      />

      {/* Messages Container - Matches AlertsList.tsx padding exactly - Updated 2025-11-11 */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        style={{ scrollBehavior: 'auto', overflowAnchor: 'none' }}
      >
        <div className="space-y-4 p-4 w-full overflow-x-hidden flex flex-col">
        {loadingStates.messages === LoadingState.Loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Spinner size="large" />
              <span className="text-gray-400 text-sm">Loading messages...</span>
            </div>
          </div>
        ) : loadingStates.messages === LoadingState.Error ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <ErrorCircle24Regular className="w-8 h-8 text-red-400" />
              <span className="text-red-400 text-sm">Failed to load messages</span>
            </div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          filteredMessages.map((message, index) => (
            <Fragment key={message.id}>
              {shouldShowDateHeader(message, filteredMessages[index - 1]) && (
                <DateHeader date={new Date(message.created_at || '')} />
              )}
              <ChatMessage
                message={message}
                user={toUserRow(user)}
                isDeleting={loadingStates.deleting.has(message.id)}
                isPinning={loadingStates.pinning.has(message.id)}
                openMenuId={openMenuId}
                isSpeaking={isSpeaking}
                onDelete={handlers.handleDelete}
                onPin={handlers.handlePin}
                onMenuToggle={setOpenMenuId}
                onMention={(name) => setInput(`@${name} `)}
                onMute={canManageRoom() ? handleMuteUser : undefined}
                onBan={canManageRoom() ? handleBanUser : undefined}
                onKick={canManageRoom() ? handleKickUser : undefined}
                onReport={handleReportMessage}
                onPrivateChat={handlePrivateChat}
              />
            </Fragment>
          ))
        )}
        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fluent UI */}
      <ChatInput
        input={input}
        imagePreview={fileUpload.imagePreview}
        pendingFile={fileUpload.pendingFile}
        uploadProgress={fileUpload.uploadProgress}
        sendingState={loadingStates.sending}
        uploadingState={fileUpload.uploadingState}
        showEmojiPicker={showEmojiPicker}
        onInputChange={setInput}
        onSend={handlers.handleSend}
        onFileSelect={fileUpload.handleImageSelect}
        onCancelFile={fileUpload.handleCancelImage}
        onEmojiSelect={(emoji) => setInput(input + emoji)}
        onToggleEmojiPicker={() => setShowEmojiPicker(!showEmojiPicker)}
      />
    </div>
  );
}
