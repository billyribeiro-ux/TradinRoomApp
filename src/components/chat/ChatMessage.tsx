/**
 * ChatMessage Component - Microsoft Enterprise Pattern
 * Renders individual chat messages with actions and role styling
 */

import { 
  faThumbtack, 
  faTrash, 
  faReply, 
  faExternalLinkAlt,
  faBan,
  faVolumeMute,
  faUserSlash,
  faCopy,
  faFlag,
  faComments
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GripVertical } from 'lucide-react';

import type { Database } from '../../types/database.types';
import { MessageType, UserRoleType } from './constants';
import { getMessageAuthor } from './utils';

type ChatMessageRow = Database['public']['Tables']['chatmessages']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];

// Helper function to check if URL is a video
const isVideoUrl = (url: string): boolean => {
  return /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(url);
};

// Helper function to check if URL is an image
const isImageUrl = (url: string): boolean => {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
};

// Helper function to check if URL is a PDF
const isPdfUrl = (url: string): boolean => {
  return /\.pdf$/i.test(url);
};

// URL type checking functions
export interface ChatMessageProps {
  message: ChatMessageRow & { user?: UserRow };
  user: UserRow | undefined;
  isDeleting: boolean;
  isPinning: boolean;
  openMenuId: string | undefined;
  isSpeaking?: boolean;
  onDelete: (messageId: string) => void;
  onPin: (message: ChatMessageRow) => void;
  onMenuToggle: (menuId: string | undefined) => void;
  onMention: (displayName: string) => void;
  onMute?: (userId: string, displayName: string) => void;
  onBan?: (userId: string, displayName: string) => void;
  onKick?: (userId: string, displayName: string) => void;
  onReport?: (messageId: string) => void;
  onPrivateChat?: (userId: string, displayName: string) => Promise<void>;
}

export function ChatMessage({
  message,
  user,
  isDeleting,
  isPinning,
  openMenuId,
  isSpeaking = false,
  onDelete,
  onPin,
  onMenuToggle,
  onMention,
  onMute,
  onBan,
  onKick,
  onReport,
  onPrivateChat
}: ChatMessageProps) {
  const author = getMessageAuthor(message);
  const isOwnMessage = message.user_id === user?.id;
  const isMenuOpen = openMenuId === message.id;

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    onDelete(message.id);
    onMenuToggle(undefined);
  };

  const handlePinClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    onPin(message);
  };

  const handleMention = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    const author = getMessageAuthor(message);
    onMention(author?.display_name || 'User');
  };

  const handleMenuToggle = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    onMenuToggle(message.id === openMenuId ? undefined : message.id);
  };

  // Event handlers

  // Format date like alerts
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <article className="group relative mb-2" role="article" aria-label="Chat message">
      {/* Message Content - Microsoft Enterprise Style */}
      <div
        className={`rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 transition-colors break-words min-w-0 bg-slate-700 border border-slate-600 hover:border-slate-500 ${
          isDeleting ? 'opacity-50 pointer-events-none' : ''
        } ${message.pinned_by ? 'ring-1 ring-blue-500/40' : ''}`}
      >
        <div className="flex items-start gap-2 sm:gap-3 mb-1.5">
          {/* Avatar Section - Compact */}
          <figure className="flex-shrink-0">
            <div 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs sm:text-sm font-semibold"
              role="img"
              aria-label={`${author.display_name} avatar`}
            >
              {author.display_name?.charAt(0).toUpperCase() || '?'}
            </div>
          </figure>

          {/* Author Info - Optimized */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-white text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                {author.display_name || author.email?.split('@')[0] || `User ${author.id.slice(0, 8)}`}
              </span>
              {message.pinned_by && (
                <FontAwesomeIcon 
                  icon={faThumbtack} 
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400 flex-shrink-0"
                  title="Pinned message"
                  aria-label="Pinned"
                />
              )}
              {isSpeaking && (
                <span 
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0"
                  title="Speaking"
                  aria-label="User is speaking" 
                />
              )}
              <time 
                className="text-slate-400 text-[10px] sm:text-xs flex-shrink-0"
                dateTime={new Date(message.created_at || '').toISOString()}
              >
                {formatDate(message.created_at || '')}
              </time>
            </div>
          </div>

          {/* Actions Menu - Microsoft Enterprise */}
          <nav className="relative flex-shrink-0" data-message-menu aria-label="Message actions">
            <button
              type="button"
              onClick={handleMenuToggle}
              className="text-slate-400 hover:text-white p-0.5 sm:p-1 rounded hover:bg-slate-600 transition-colors focus:outline-none focus:ring-0 touch-manipulation"
              aria-label="Message options"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              data-message-menu
            >
              <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            {isMenuOpen && (
              <menu
                className="absolute right-0 top-6 sm:top-8 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 min-w-[160px] sm:min-w-[180px] py-1"
                role="menu"
                onClick={(e) => e.stopPropagation()}
                data-message-menu
              >
                {/* Mention */}
                <li role="none">
                  <button
                    type="button"
                    onClick={handleMention}
                    className="w-full px-3 py-1.5 text-left text-xs sm:text-sm text-white hover:bg-slate-600 transition-colors flex items-center gap-2 touch-manipulation"
                    role="menuitem"
                  >
                    <FontAwesomeIcon icon={faReply} className="w-3 h-3 flex-shrink-0" />
                    <span>Mention</span>
                  </button>
                </li>
                
                {/* Private Chat */}
                {onPrivateChat && !isOwnMessage && (
                  <li role="none">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPrivateChat(message.user_id, author.display_name || 'User');
                        onMenuToggle(undefined);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs sm:text-sm text-green-400 hover:bg-slate-600 transition-colors flex items-center gap-2 touch-manipulation"
                      role="menuitem"
                    >
                      <FontAwesomeIcon icon={faComments} className="w-3 h-3 flex-shrink-0" />
                      <span>Private Chat</span>
                    </button>
                  </li>
                )}
                
                {/* Copy Message */}
                <li role="none">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(message.content);
                      onMenuToggle(undefined);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs sm:text-sm text-white hover:bg-slate-600 transition-colors flex items-center gap-2 touch-manipulation"
                    role="menuitem"
                  >
                    <FontAwesomeIcon icon={faCopy} className="w-3 h-3 flex-shrink-0" />
                    <span>Copy</span>
                  </button>
                </li>
                
                {/* Pin/Unpin */}
                <li role="none">
                  <button
                    type="button"
                    onClick={handlePinClick}
                    disabled={isPinning}
                    className="w-full px-3 py-1.5 text-left text-xs sm:text-sm text-white hover:bg-slate-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    role="menuitem"
                  >
                    <FontAwesomeIcon icon={faThumbtack} className="w-3 h-3 flex-shrink-0" />
                    <span>{message.pinned_by ? 'Unpin' : 'Pin'}</span>
                  </button>
                </li>
                  
                  {/* Moderation Actions - Only for other users */}
                  {!isOwnMessage && onMute && (
                    <li role="none">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMute(message.user_id, author.display_name || 'User');
                          onMenuToggle(undefined);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs sm:text-sm text-yellow-400 hover:bg-slate-600 transition-colors flex items-center gap-2 touch-manipulation"
                        role="menuitem"
                      >
                        <FontAwesomeIcon icon={faVolumeMute} className="w-3 h-3 flex-shrink-0" />
                        <span>Mute</span>
                      </button>
                    </li>
                  )}
                  
                  {!isOwnMessage && onKick && (
                    <li role="none">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onKick(message.user_id, author.display_name || 'User');
                          onMenuToggle(undefined);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs sm:text-sm text-orange-400 hover:bg-slate-600 transition-colors flex items-center gap-2 touch-manipulation"
                        role="menuitem"
                      >
                        <FontAwesomeIcon icon={faUserSlash} className="w-3 h-3 flex-shrink-0" />
                        <span>Kick</span>
                      </button>
                    </li>
                  )}
                  
                  {!isOwnMessage && onBan && (
                    <li role="none">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onBan(message.user_id, author.display_name || 'User');
                          onMenuToggle(undefined);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs sm:text-sm text-red-400 hover:bg-slate-600 transition-colors flex items-center gap-2 touch-manipulation"
                        role="menuitem"
                      >
                        <FontAwesomeIcon icon={faBan} className="w-3 h-3 flex-shrink-0" />
                        <span>Ban</span>
                      </button>
                    </li>
                  )}
                  
                  {/* Report */}
                  {!isOwnMessage && onReport && (
                    <li role="none">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReport(message.id);
                          onMenuToggle(undefined);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs sm:text-sm text-red-400 hover:bg-slate-600 transition-colors flex items-center gap-2 touch-manipulation"
                        role="menuitem"
                      >
                        <FontAwesomeIcon icon={faFlag} className="w-3 h-3 flex-shrink-0" />
                        <span>Report</span>
                      </button>
                    </li>
                  )}
                  
                  {/* Delete - Only for own messages or admins */}
                  {(isOwnMessage || (message?.user_role && message.user_role !== UserRoleType.Member)) && (
                    <li role="none" className="border-t border-slate-600 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full px-3 py-1.5 text-left text-xs sm:text-sm text-red-400 hover:bg-red-600/20 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                        role="menuitem"
                      >
                        <FontAwesomeIcon icon={faTrash} className="w-3 h-3 flex-shrink-0" />
                        <span>Delete</span>
                      </button>
                    </li>
                  )}
              </menu>
            )}
          </nav>
        </div>

        {/* Content Section - Microsoft Enterprise */}
        <div className="ml-9 sm:ml-11">
          {/* Message Content */}
          <p className="text-slate-300 text-xs sm:text-sm mb-1 break-words overflow-wrap-anywhere max-w-full">
            {message.content}
          </p>

          {/* Media Content - Microsoft Professional Style */}
          {message.content_type === MessageType.Image && message.file_url && (
            <div className="mb-2 w-full max-w-full overflow-hidden">
              {isImageUrl(message.file_url) ? (
                <a
                  href={message.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block cursor-pointer group"
                  aria-label="Open image in new tab"
                >
                  <img
                    src={message.file_url}
                    alt="Shared image"
                    className="w-full max-w-full h-auto object-contain rounded-lg border border-slate-600 group-hover:border-slate-500 transition-colors"
                    loading="lazy"
                    style={{ maxWidth: '100%', maxHeight: '300px' }}
                  />
                </a>
              ) : (
                <a
                  href={message.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Open link in new tab"
                >
                  <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3 h-3" />
                  <span className="truncate max-w-[200px]">Open link</span>
                </a>
              )}
            </div>
          )}

          {/* File Content - Microsoft Professional Style */}
          {message.content_type === MessageType.File && message.file_url && (
            <div className="mb-2">
              {isPdfUrl(message.file_url) ? (
                <a 
                  href={message.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Open PDF in new tab"
                >
                  <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3.5 h-3.5" />
                  <span>Open PDF</span>
                </a>
              ) : isVideoUrl(message.file_url) ? (
                <video 
                  controls 
                  className="max-w-full h-auto rounded-lg border border-slate-600"
                  src={message.file_url}
                  style={{ maxHeight: '300px' }}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <a 
                  href={message.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Download file"
                >
                  <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3.5 h-3.5" />
                  <span>Download file</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}