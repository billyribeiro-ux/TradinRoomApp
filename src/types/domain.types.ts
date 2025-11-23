/**
 * Domain Types - Application Layer Types
 * Layer: Application Domain Models
 * Dependencies: database.types.ts
 * 
 * Purpose: Application-specific types that extend database types
 * with business logic, UI requirements, and application state.
 */

import type { 
  User, 
  Room, 
  ChatMessage, 
  RoomMembership,
  Alert
} from './database.types'

// ============================================================================
// APPLICATION USER TYPES
// ============================================================================

/**
 * Application User - Enhanced User with role and permissions
 * This extends the database User type with application logic
 */
export interface AppUser extends User {
  displayName: string
  role: 'admin' | 'member'
  permissions?: UserPermissions
  isOnline?: boolean
  lastSeen?: string
  metadata?: Record<string, unknown>
}

/**
 * User Permissions based on role
 */
export interface UserPermissions {
  canManageRooms: boolean
  canManageUsers: boolean
  canBroadcast: boolean
  canScreenShare: boolean
  canSendAlerts: boolean
  canUploadFiles: boolean
  canDeleteMessages: boolean
  canModerateChat: boolean
  canPinnedMessages: boolean
  canAccessAdminPanel: boolean
}

/**
 * User Role Type
 */
export type UserRole = 'admin' | 'member'

/**
 * Profile Status Type
 */
export type ProfileStatus = 'active' | 'suspended' | 'deleted'

// ============================================================================
// APPLICATION ROOM TYPES
// ============================================================================

/**
 * Application Room - Enhanced Room with additional context
 */
export interface AppRoom extends Room {
  memberCount?: number
  activeMembers?: AppUser[]
  lastMessage?: ChatMessage
  unreadCount?: number
  isJoined?: boolean
}

/**
 * Room with Full Context including members, messages, etc.
 */
export interface RoomWithContext extends Room {
  members: (RoomMembership & {
    user: Pick<User, 'id' | 'email' | 'display_name' | 'avatar_url' | 'role'>
  })[]
  recentMessages: ChatMessage[]
  alerts: Alert[]
}

// ============================================================================
// CHAT MESSAGE TYPES
// ============================================================================

/**
 * Chat Message with User Context
 */
export interface ChatMessageWithUser extends ChatMessage {
  user: Pick<User, 'id' | 'email' | 'display_name' | 'avatar_url' | 'role'>
}

/**
 * Content Type for Messages
 */
export type ContentType = 'text' | 'image' | 'file'

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API Response Envelope
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
  timestamp?: string
}

/**
 * API Error Structure
 */
export interface ApiError {
  code: string
  message: string
  details?: unknown
  stack?: string
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ============================================================================
// REACT EVENT HANDLER TYPES
// ============================================================================

/**
 * Common React Event Handler Type Aliases
 * These make component prop types cleaner and more maintainable
 */
export type ButtonClickHandler = React.MouseEventHandler<HTMLButtonElement>
export type DivClickHandler = React.MouseEventHandler<HTMLDivElement>
export type InputChangeHandler = React.ChangeEventHandler<HTMLInputElement>
export type TextAreaChangeHandler = React.ChangeEventHandler<HTMLTextAreaElement>
export type SelectChangeHandler = React.ChangeEventHandler<HTMLSelectElement>
export type FormSubmitHandler = React.FormEventHandler<HTMLFormElement>
export type KeyPressHandler = React.KeyboardEventHandler<HTMLElement>

/**
 * File Input Change Handler
 */
export type FileInputChangeHandler = React.ChangeEventHandler<HTMLInputElement> & {
  (event: React.ChangeEvent<HTMLInputElement>): void
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make properties nullable
 */
export type Nullable<T> = T | null

/**
 * Make properties optional
 */
export type Optional<T> = T | undefined

/**
 * Make properties optional and nullable
 */
export type Maybe<T> = T | null | undefined

/**
 * Deep partial - makes all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Deep readonly - makes all properties readonly recursively
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/**
 * Extract Promise return type
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T

// ============================================================================
// THEME TYPES
// ============================================================================

/**
 * Complete Theme Configuration
 * This must match the theme store structure exactly
 */
export interface CompleteThemeConfig {
  // Primary colors
  primary: string
  secondary: string
  accent: string
  
  // Background colors
  background: string
  surface: string
  backgroundPrimary: string
  backgroundSecondary: string
  
  // Text colors
  text: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  
  // UI colors
  border: string
  success: string
  warning: string
  error: string
  info: string
}

/**
 * Font Configuration
 */
export interface FontConfig {
  fontFamily: string
  fontSize: string
  fontWeight: string
  lineHeight: string
  fontSizeBase: string
  fontSizeHeading: string
  fontWeightNormal: string
  fontWeightBold: string
}

/**
 * Icon Configuration
 */
export interface IconConfig {
  iconTheme: string
  iconSize: string
  iconColor: string
  style: string
  size: string
  roomIcon: string
}

/**
 * Animation Configuration
 */
export interface AnimationConfig {
  duration: string
  easing: string
  reduceMotion: boolean
}

// ============================================================================
// LIVEKIT TYPES
// ============================================================================

/**
 * LiveKit Connection Configuration
 */
export interface LiveKitConnectionConfig {
  url: string
  token: string
  roomName: string
}

/**
 * LiveKit Participant
 */
export interface LiveKitParticipant {
  identity: string
  name: string
  isSpeaking: boolean
  isMuted: boolean
  isScreenSharing: boolean
  isLocal: boolean
  metadata?: Record<string, unknown>
  joinedAt?: Date
  tracks?: {
    audio?: unknown
    video?: unknown
  }
}

/**
 * LiveKit Room State
 */
export interface LiveKitRoomState {
  name: string
  isConnected: boolean
  participants: LiveKitParticipant[]
  localParticipant: LiveKitParticipant | null
  metadata?: Record<string, unknown>
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

/**
 * Base Component Props - Common props for all components
 */
export interface BaseComponentProps {
  className?: string
  testId?: string
  id?: string
}

/**
 * Component with children
 */
export interface WithChildren {
  children: React.ReactNode
}

/**
 * Loading state props
 */
export interface WithLoading {
  isLoading: boolean
  loadingText?: string
}

/**
 * Error state props
 */
export interface WithError {
  error: Error | null
  onRetry?: () => void
}

/**
 * Combined Loading and Error props
 */
export interface WithLoadingAndError extends WithLoading, WithError {}

// ============================================================================
// FILE OPERATION TYPES
// ============================================================================

/**
 * Room File Type (from database)
 */
export interface RoomFile {
  id: string
  room_id: string
  user_id: string
  created_at: string
  updated_at: string
  file_url: string
  folder_name: string
  filename: string
  file_type?: string
  file_size: number
  mime_type: string
}

/**
 * File Upload Progress
 */
export interface FileUploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

/**
 * File Type Categories
 */
export type FileTypeCategory = 'file' | 'image' | 'sound'

// ============================================================================
// SEARCH AND FILTER TYPES
// ============================================================================

/**
 * Room Filter Options
 */
export interface RoomFilters {
  tenant_id?: string
  created_by?: string
  is_active?: boolean
  search?: string
}

/**
 * Chat Message Filter Options
 */
export interface ChatMessageFilters {
  room_id?: string
  user_id?: string
  user_role?: UserRole
  content_type?: ContentType
  is_deleted?: boolean
  is_off_topic?: boolean
  pinned?: boolean
  search?: string
}

/**
 * User Filter Options
 */
export interface UserFilters {
  role?: UserRole
  status?: ProfileStatus
  search?: string
}

// ============================================================================
// REALTIME TYPES
// ============================================================================

/**
 * Realtime Event Types
 */
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

/**
 * Realtime Payload Structure
 */
export interface RealtimePayload<T = unknown> {
  schema: string
  table: string
  commit_timestamp: string
  eventType: RealtimeEvent
  new: T
  old: T
  errors: string[]
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form Field Configuration
 */
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio'
  placeholder?: string
  required?: boolean
  validation?: (value: string) => string | undefined
  options?: Array<{ label: string; value: string }>
}

/**
 * Form State
 */
export interface FormState {
  values: Record<string, string>
  errors: Record<string, string>
  touched: Record<string, boolean>
  isValid: boolean
  isSubmitting: boolean
}

// ============================================================================
// STORAGE TYPES
// ============================================================================

/**
 * Storage File Metadata
 */
export interface StorageFile {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string
  metadata: Record<string, unknown>
}

// ============================================================================
// TYPE GUARDS HELPERS
// ============================================================================

/**
 * Type guard to check if value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Type guard to check if array is non-empty
 */
export function isNonEmptyArray<T>(value: T[]): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0
}

/**
 * Type guard to check if string is non-empty
 */
export function isNonEmptyString(value: string): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Assert never - for exhaustive checking
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`)
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Validation Error
 */
export interface ValidationError {
  field: string
  message: string
  value?: unknown
}

