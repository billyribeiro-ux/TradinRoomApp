/**
 * Type Guards - Runtime Type Validation
 * Layer: Utility
 * Dependencies: database.types.ts, domain.types.ts
 * 
 * Purpose: Provide runtime validation to ensure unknown data
 * matches expected TypeScript types. Critical for safe data
 * transformations from API responses.
 * 
 * Status: SURGICAL REPAIR - FILE #1
 */

import type { User, Room, ChatMessage, Alert, RoomMembership } from '../types/database.types'
import type { AppUser, AppRoom, UserPermissions } from '../types/domain.types'

// ============================================================================
// DATABASE TYPE GUARDS
// ============================================================================

/**
 * Type guard for User (from database)
 * Validates that unknown data matches the users table schema
 */
export function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.role === 'string' &&
    (obj.role === 'admin' || obj.role === 'member') &&
    typeof obj.created_at === 'string'
  )
}

/**
 * Type guard for Room (from database)
 */
export function isRoom(value: unknown): value is Room {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.id === 'string' &&
    typeof obj.tenant_id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.created_by === 'string' &&
    typeof obj.created_at === 'string'
  )
}

/**
 * Type guard for ChatMessage (from database)
 */
export function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.id === 'string' &&
    typeof obj.room_id === 'string' &&
    typeof obj.user_id === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.created_at === 'string'
  )
}

/**
 * Type guard for Alert (from database)
 */
export function isAlert(value: unknown): value is Alert {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.id === 'string' &&
    typeof obj.room_id === 'string' &&
    typeof obj.created_by === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.created_at === 'string'
  )
}

/**
 * Type guard for RoomMembership
 */
export function isRoomMembership(value: unknown): value is RoomMembership {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.id === 'string' &&
    typeof obj.room_id === 'string' &&
    typeof obj.user_id === 'string' &&
    typeof obj.role === 'string' &&
    typeof obj.created_at === 'string'
  )
}

// ============================================================================
// APPLICATION TYPE GUARDS
// ============================================================================

/**
 * Type guard for AppUser (Enhanced User with permissions)
 */
export function isAppUser(value: unknown): value is AppUser {
  if (!isUser(value)) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.displayName === 'string' &&
    typeof obj.role === 'string' &&
    (obj.role === 'admin' || obj.role === 'member')
  )
}

/**
 * Type guard for AppRoom (Enhanced Room)
 */
export function isAppRoom(value: unknown): value is AppRoom {
  if (!isRoom(value)) {
    return false
  }

  return true
}

/**
 * Type guard for UserPermissions
 */
export function isUserPermissions(value: unknown): value is UserPermissions {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.canManageRooms === 'boolean' &&
    typeof obj.canManageUsers === 'boolean' &&
    typeof obj.canBroadcast === 'boolean' &&
    typeof obj.canScreenShare === 'boolean' &&
    typeof obj.canSendAlerts === 'boolean' &&
    typeof obj.canUploadFiles === 'boolean' &&
    typeof obj.canDeleteMessages === 'boolean' &&
    typeof obj.canModerateChat === 'boolean' &&
    typeof obj.canPinnedMessages === 'boolean' &&
    typeof obj.canAccessAdminPanel === 'boolean'
  )
}

// ============================================================================
// ARRAY TYPE GUARDS
// ============================================================================

/**
 * Check if value is an array of Users
 */
export function isUserArray(value: unknown): value is User[] {
  return Array.isArray(value) && (value.length === 0 || value.every(isUser))
}

/**
 * Check if value is an array of Rooms
 */
export function isRoomArray(value: unknown): value is Room[] {
  return Array.isArray(value) && (value.length === 0 || value.every(isRoom))
}

/**
 * Check if value is an array of ChatMessages
 */
export function isChatMessageArray(value: unknown): value is ChatMessage[] {
  return Array.isArray(value) && (value.length === 0 || value.every(isChatMessage))
}

/**
 * Check if value is an array of AppUsers
 */
export function isAppUserArray(value: unknown): value is AppUser[] {
  return Array.isArray(value) && (value.length === 0 || value.every(isAppUser))
}

// ============================================================================
// UTILITY TYPE GUARDS
// ============================================================================

/**
 * Check if value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Check if array is non-empty
 */
export function isNonEmptyArray<T>(value: T[]): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0
}

/**
 * Check if string is non-empty
 */
export function isNonEmptyString(value: string): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Check if value is an Error object
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error
}

/**
 * Assert that a value should never occur (exhaustive type checking)
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
 * Check if value is a valid URL
 */
export function isValidURL(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

/**
 * Check if value is a valid ISO date string
 */
export function isValidISODate(value: string): boolean {
  const date = new Date(value)
  return !isNaN(date.getTime()) && value.includes('T')
}

