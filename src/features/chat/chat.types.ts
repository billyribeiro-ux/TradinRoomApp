/**
 * Chat Feature Types - Microsoft Enterprise Standards
 * =========================================================
 * Strict types for chat with no any/non-null assertions
 * SSR-safe, readonly where appropriate
 */

import { LoadingState } from '../../components/chat/constants';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export type ChatMessageId = string;
export type ChatUserId = string;
export type ChatRoomId = string;
export type ChatContentType = 'text' | 'image' | 'file' | 'gif' | 'emoji';

// ---------------------------------------------------------------------------
// UI Types
// ---------------------------------------------------------------------------

export interface RoleStyle {
  textColor: string;
  bgColor: string;
  ringClass: string;
  badge?: string;
}

export interface LoadingStates {
  messages: LoadingState;
  sending: LoadingState;
  deleting: Set<string>;
  pinning: Set<string>;
  uploading: LoadingState;
}

export interface UploadProgress {
  percentage: number;
  bytesUploaded: number;
  totalBytes: number;
  fileName: string;
}

// ---------------------------------------------------------------------------
// Core Types
// ---------------------------------------------------------------------------

export interface ChatUser {
  readonly id: ChatUserId;
  readonly display_name?: string;
  readonly email?: string;
  readonly avatar_url?: string;
  readonly role?: 'admin' | 'moderator' | 'user';
}

export interface ChatAttachment {
  readonly id: string;
  readonly type: 'image' | 'file';
  readonly url: string;
  readonly name: string;
  readonly size_bytes?: number;
  readonly mime_type?: string;
}

export interface ChatMessage {
  readonly id: ChatMessageId;
  readonly room_id: ChatRoomId;
  readonly user_id: ChatUserId;
  readonly user?: ChatUser;
  readonly content: string;
  readonly content_type: ChatContentType | null;
  readonly file_url?: string | null;
  readonly is_off_topic?: boolean | null;
  readonly is_deleted?: boolean | null;
  readonly deleted_at?: string | null;
  readonly deleted_by?: string | null;
  readonly pinned_at?: string | null;
  readonly pinned_by?: string | null;
  readonly created_at: string | null;
  readonly user_role?: string | null;
}

// ---------------------------------------------------------------------------
// API & Service Types
// ---------------------------------------------------------------------------

export interface ChatSendPayload {
  readonly content: string;
  readonly content_type?: ChatContentType;
  readonly file_url?: string;
  readonly is_off_topic?: boolean;
}

export interface ChatSendResult {
  readonly success: boolean;
  readonly message?: ChatMessage;
  readonly error?: string;
  readonly temp_id?: string;
}

export interface ChatUploadResult {
  readonly success: boolean;
  readonly url?: string;
  readonly error?: string;
}

export interface ChatFilters {
  readonly search_term?: string;
  readonly user_id?: ChatUserId;
  readonly content_type?: ChatContentType;
  readonly is_off_topic?: boolean;
  readonly date_range?: {
    readonly start: string;
    readonly end: string;
  };
}

// ---------------------------------------------------------------------------
// State Types
// ---------------------------------------------------------------------------

export interface ChatState {
  readonly messages: readonly ChatMessage[];
  readonly pending: readonly PendingMessage[];
  readonly filters: ChatFilters;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly lastReadAt: string | null;
}

export interface PendingMessage {
  readonly temp_id: string;
  readonly payload: ChatSendPayload;
  readonly timestamp: string;
  readonly retries: number;
  readonly status: 'pending' | 'sending' | 'failed';
}

// ---------------------------------------------------------------------------
// Realtime Types
// ---------------------------------------------------------------------------

export interface ChatRealtimeEvent {
  readonly type: 'message_created' | 'message_updated' | 'message_deleted';
  readonly message_id: ChatMessageId;
  readonly message?: ChatMessage;
  readonly timestamp: string;
}

// ---------------------------------------------------------------------------
// Error Types
// ---------------------------------------------------------------------------

export interface ChatError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly retryable: boolean;
}

export type ChatServiceError = ChatError & {
  readonly type: 'validation' | 'network' | 'permission' | 'not_found' | 'rate_limit' | 'payload_too_large';
};

// ---------------------------------------------------------------------------
// Action Types
// ---------------------------------------------------------------------------

export interface ChatActions {
  readonly init: (roomId: ChatRoomId) => Promise<void>;
  readonly dispose: () => void;
  readonly send: (payload: ChatSendPayload) => Promise<ChatSendResult>;
  readonly ack: (messageId: ChatMessageId) => Promise<void>;
  readonly upload: (file: File) => Promise<ChatUploadResult>;
  readonly deleteMessage: (messageId: ChatMessageId) => Promise<void>;
  readonly pinMessage: (messageId: ChatMessageId, pinned: boolean) => Promise<void>;
  readonly setFilters: (filters: Partial<ChatFilters>) => void;
}

// ---------------------------------------------------------------------------
// Hook Return Types
// ---------------------------------------------------------------------------

export interface UseChatActionsReturn {
  readonly init: () => Promise<void>;
  readonly dispose: () => void;
  readonly send: (payload: ChatSendPayload) => Promise<ChatSendResult>;
  readonly ack: (messageId: ChatMessageId) => Promise<void>;
  readonly upload: (file: File) => Promise<ChatUploadResult>;
  readonly deleteMessage: (messageId: ChatMessageId) => Promise<void>;
  readonly pinMessage: (messageId: ChatMessageId, pinned: boolean) => Promise<void>;
  readonly setFilters: (filters: Partial<ChatFilters>) => void;
}

export interface UseChatSelectorsReturn {
  readonly messages: readonly ChatMessage[];
  readonly pending: readonly PendingMessage[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly filters: ChatFilters;
  readonly mainMessages: readonly ChatMessage[];
  readonly offTopicMessages: readonly ChatMessage[];
  readonly pinnedMessages: readonly ChatMessage[];
}

// ---------------------------------------------------------------------------
// Upload Configuration
// ---------------------------------------------------------------------------

export interface ChatUploadConfig {
  readonly maxSizeBytes: number;
  readonly allowedMimeTypes: readonly string[];
  readonly bucket: string;
}

export const DEFAULT_UPLOAD_CONFIG: ChatUploadConfig = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: Object.freeze([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
  bucket: 'chat-uploads',
};

// ---------------------------------------------------------------------------
// Retry Configuration
// ---------------------------------------------------------------------------

export interface RetryConfig {
  readonly maxRetries: number;
  readonly delays: readonly number[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  delays: Object.freeze([200, 800, 2000]), // exponential backoff
};
