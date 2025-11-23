/**
 * ChatMessage Component - Fluent UI Version
 * Renders individual chat messages with actions and role styling
 * Uses Microsoft Fluent UI icons for modern design
 */

import { 
  Pin24Regular,
  Pin24Filled,
  Delete24Regular,
  ArrowReply24Regular,
  Open24Regular,
  Prohibited24Regular,
  MicOff24Regular,
  PersonDelete24Regular,
  Copy24Regular,
  Flag24Regular,
  ChatMultiple24Regular,
  Navigation24Regular
} from '@fluentui/react-icons';
import React, { useEffect, useRef, useState } from 'react';

import type { Database } from '../../../types/database.types';
import { MessageType } from '../constants';
import { getMessageAuthor } from '../utils';

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
  
  // Smart menu positioning - flip upward if would be cut off
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<'bottom' | 'top'>('bottom');
  
  useEffect(() => {
    if (isMenuOpen && menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - menuRect.top;
      const menuHeight = menuRef.current.offsetHeight;
      
      // If menu would be cut off at bottom, flip it upward
      if (spaceBelow < menuHeight + 20) {
        setMenuPosition('top');
      } else {
        setMenuPosition('bottom');
      }
    }
  }, [isMenuOpen]);

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
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format full date/time for tooltip
  const formatFullDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <article className="group relative mb-2" role="article" aria-label="Chat message">
      {/* Message Content - Fluent Design */}
      <div
        className={`rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 transition-all duration-200 break-words min-w-0 bg-slate-700 border border-slate-600 hover:border-slate-500 hover:shadow-lg ${
          isDeleting ? 'opacity-50 pointer-events-none' : ''
        } ${message.pinned_by ? 'ring-2 ring-blue-500/40 shadow-blue-500/20' : ''}`}
      >
        <div className="flex items-start gap-2 sm:gap-3 mb-1.5">
          {/* Avatar Section - Compact */}
          <figure className="flex-shrink-0">
            <div 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs sm:text-sm font-semibold ring-2 ring-slate-600"
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
                <Pin24Filled className="w-3 h-3 text-blue-400" aria-label="Pinned message" />
              )}
              <time 
                className="text-xs text-gray-400 hover:text-gray-300 transition-colors cursor-help" 
                dateTime={message.created_at || ''}
                title={formatFullDateTime(message.created_at || '')}
              >
                {formatDate(message.created_at || '')}
              </time>
            </div>

            {/* Message Content */}
            <div className="mt-1">
              {message.content_type === MessageType.Image && message.file_url ? (
                <div className="mt-2">
                  {message.content && (
                    <p className="text-sm text-gray-200 mb-2">{message.content}</p>
                  )}
                  <img
                    src={message.file_url}
                    alt="Shared image"
                    className="max-w-full max-h-96 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors cursor-pointer"
                    onClick={() => message.file_url && window.open(message.file_url, '_blank')}
                  />
                </div>
              ) : message.content_type === MessageType.File && message.file_url ? (
                <div className="mt-2">
                  {message.content && (
                    <p className="text-sm text-gray-200 mb-2">{message.content}</p>
                  )}
                  {message.file_url && isPdfUrl(message.file_url) ? (
                    <a
                      href={message.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-all duration-200 hover:scale-105"
                    >
                      <Open24Regular className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-200 group-hover:text-white">Open PDF</span>
                    </a>
                  ) : message.file_url && isImageUrl(message.file_url) ? (
                    <img
                      src={message.file_url}
                      alt="Shared image"
                      className="max-w-full max-h-96 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors cursor-pointer"
                      onClick={() => message.file_url && window.open(message.file_url, '_blank')}
                    />
                  ) : message.file_url && isVideoUrl(message.file_url) ? (
                    <video
                      controls
                      className="max-w-full h-auto rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                      src={message.file_url}
                      style={{ maxHeight: '300px' }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : message.file_url ? (
                    <a
                      href={message.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-all duration-200 hover:scale-105"
                    >
                      <Open24Regular className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-200 group-hover:text-white">View File</span>
                    </a>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}
            </div>
          </div>

          {/* Menu Toggle - Fluent Style (Thinner) */}
          <button
            onClick={handleMenuToggle}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-600 rounded-lg transition-all duration-200 hover:scale-110"
            aria-label="Message actions"
            aria-expanded={isMenuOpen}
          >
            <Navigation24Regular className="w-3.5 h-3.5 text-gray-400 hover:text-white transition-colors" />
          </button>
        </div>

        {/* Action Menu - Fluent Design with Smart Positioning */}
        {isMenuOpen && (
          <div 
            ref={menuRef}
            className={`absolute right-0 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl min-w-[200px] overflow-hidden animate-in fade-in duration-200 ${
              menuPosition === 'top' 
                ? 'bottom-full mb-1 slide-in-from-bottom-2' 
                : 'top-full mt-1 slide-in-from-top-2'
            }`}
          >
            {/* Quick Actions */}
            <div className="p-1">
              <button
                onClick={handlePinClick}
                disabled={isPinning}
                className="group w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700 rounded-lg transition-all duration-200 text-left"
              >
                {message.pinned_by ? (
                  <Pin24Filled className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                ) : (
                  <Pin24Regular className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                )}
                <span className="text-sm text-gray-300 group-hover:text-white">
                  {message.pinned_by ? 'Unpin' : 'Pin'}
                </span>
              </button>

              <button
                onClick={handleMention}
                className="group w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700 rounded-lg transition-all duration-200 text-left"
              >
                <ArrowReply24Regular className="w-5 h-5 text-gray-400 group-hover:text-green-400 transition-colors" />
                <span className="text-sm text-gray-300 group-hover:text-white">Reply</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(message.content || '');
                  onMenuToggle(undefined);
                }}
                className="group w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700 rounded-lg transition-all duration-200 text-left"
              >
                <Copy24Regular className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                <span className="text-sm text-gray-300 group-hover:text-white">Copy</span>
              </button>
            </div>

            {/* Moderation Actions */}
            {!isOwnMessage && (onMute || onBan || onKick) && (
              <>
                <div className="h-px bg-slate-700 my-1" />
                <div className="p-1">
                  {onMute && (
                    <button
                      onClick={() => {
                        onMute(message.user_id, author.display_name || 'User');
                        onMenuToggle(undefined);
                      }}
                      className="group w-full flex items-center gap-3 px-3 py-2.5 hover:bg-yellow-500/10 rounded-lg transition-all duration-200 text-left"
                    >
                      <MicOff24Regular className="w-5 h-5 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                      <span className="text-sm text-gray-300 group-hover:text-yellow-400">Mute</span>
                    </button>
                  )}

                  {onKick && (
                    <button
                      onClick={() => {
                        onKick(message.user_id, author.display_name || 'User');
                        onMenuToggle(undefined);
                      }}
                      className="group w-full flex items-center gap-3 px-3 py-2.5 hover:bg-orange-500/10 rounded-lg transition-all duration-200 text-left"
                    >
                      <PersonDelete24Regular className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
                      <span className="text-sm text-gray-300 group-hover:text-orange-400">Kick</span>
                    </button>
                  )}

                  {onBan && (
                    <button
                      onClick={() => {
                        onBan(message.user_id, author.display_name || 'User');
                        onMenuToggle(undefined);
                      }}
                      className="group w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-500/10 rounded-lg transition-all duration-200 text-left"
                    >
                      <Prohibited24Regular className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
                      <span className="text-sm text-gray-300 group-hover:text-red-400">Ban</span>
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Additional Actions */}
            <div className="h-px bg-slate-700 my-1" />
            <div className="p-1">
              {onPrivateChat && !isOwnMessage && (
                <button
                  onClick={async () => {
                    await onPrivateChat(message.user_id, author.display_name || 'User');
                    onMenuToggle(undefined);
                  }}
                  className="group w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700 rounded-lg transition-all duration-200 text-left"
                >
                  <ChatMultiple24Regular className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  <span className="text-sm text-gray-300 group-hover:text-white">Private Chat</span>
                </button>
              )}

              {onReport && (
                <button
                  onClick={() => {
                    onReport(message.id);
                    onMenuToggle(undefined);
                  }}
                  className="group w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700 rounded-lg transition-all duration-200 text-left"
                >
                  <Flag24Regular className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  <span className="text-sm text-gray-300 group-hover:text-white">Report</span>
                </button>
              )}

              {isOwnMessage && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="group w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-500/10 rounded-lg transition-all duration-200 text-left"
                >
                  <Delete24Regular className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
                  <span className="text-sm text-gray-300 group-hover:text-red-400">Delete</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
