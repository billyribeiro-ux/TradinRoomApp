/**
 * Alerts Feature Types - Microsoft Enterprise Standards
 * =========================================================
 * Strong types for alerts with strict nullability and no any leaks
 */

import type { Alert as DbAlert } from '../../types/database.types';
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export type AlertId = string;
export type AlertPriority = 'low' | 'medium' | 'high' | 'urgent';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'archived';

// ---------------------------------------------------------------------------
// Core Types - Use database Alert as base, extend with UI-specific fields
// ---------------------------------------------------------------------------

export interface AlertAuthor {
  readonly id: string;
  readonly display_name?: string;
  readonly username?: string;
  readonly avatar_url?: string;
  readonly email?: string;
  readonly role?: 'admin' | 'moderator' | 'user';
  // Index signature for Json compatibility
  readonly [key: string]: string | undefined;
}

/**
 * UI Alert type - extends database Alert with computed/UI fields
 * For storage operations, use DbAlert directly
 */
export interface Alert extends Omit<DbAlert, 'author'> {
  // Override author to use proper type instead of Json
  readonly author: AlertAuthor | null;
  // UI-specific computed fields (not persisted)
  readonly priority?: AlertPriority;
  readonly status?: AlertStatus;
  readonly is_pinned?: boolean;
  readonly mentions?: readonly string[];
  readonly attachments?: readonly AlertAttachment[];
}

// Re-export database Alert for direct use
export type { DbAlert };

/**
 * Type guard to check if Json is AlertAuthor
 */
export function isAlertAuthor(author: unknown): author is AlertAuthor {
  if (!author || typeof author !== 'object') return false;
  const obj = author as Record<string, unknown>;
  return typeof obj.id === 'string';
}

/**
 * Convert Json author to AlertAuthor
 */
export function parseAlertAuthor(author: DbAlert['author']): AlertAuthor | null {
  if (!author) return null;
  if (typeof author !== 'object') return null;
  const obj = author as Record<string, unknown>;
  return {
    id: String(obj.id || ''),
    display_name: obj.display_name ? String(obj.display_name) : undefined,
    username: obj.username ? String(obj.username) : undefined,
    avatar_url: obj.avatar_url ? String(obj.avatar_url) : undefined,
    email: obj.email ? String(obj.email) : undefined,
    role: obj.role as AlertAuthor['role'],
  };
}

export interface AlertAttachment {
  readonly id: string;
  readonly type: 'image' | 'video' | 'document';
  readonly url: string;
  readonly name: string;
  readonly size_bytes?: number;
}

// ---------------------------------------------------------------------------
// API & Service Types
// ---------------------------------------------------------------------------

export interface AlertPayload {
  readonly title: string;
  readonly body: string;
  readonly priority?: AlertPriority;
  readonly is_non_trade?: boolean;
  readonly mentions?: readonly string[];
  readonly attachments?: readonly AlertAttachment[];
}

export interface AlertPostResult {
  readonly success: boolean;
  readonly alert?: Alert;
  readonly error?: string;
  readonly validation_errors?: readonly string[];
}

export interface AlertFilters {
  readonly priority?: AlertPriority | 'all';
  readonly status?: AlertStatus | 'all';
  readonly author_id?: string;
  readonly search_term?: string;
  readonly date_range?: {
    readonly start: string;
    readonly end: string;
  };
}

// ---------------------------------------------------------------------------
// UI & State Types
// ---------------------------------------------------------------------------

export interface AlertCounts {
  readonly total: number;
  readonly unread: number;
  readonly by_priority: Record<AlertPriority, number>;
}

export interface AlertListState {
  readonly alerts: readonly Alert[];
  readonly filters: AlertFilters;
  readonly loading: boolean;
  readonly error: string | null;
}

// ---------------------------------------------------------------------------
// Realtime Types
// ---------------------------------------------------------------------------

export interface AlertRealtimeEvent {
  readonly type: 'alert_created' | 'alert_updated' | 'alert_deleted' | 'alert_acknowledged';
  readonly alert_id: AlertId;
  readonly alert?: Alert;
  readonly timestamp: string;
  readonly user_id: string;
}

// ---------------------------------------------------------------------------
// Action Types
// ---------------------------------------------------------------------------

export interface AlertActions {
  readonly fetchAlerts: (roomId: string) => Promise<readonly Alert[]>;
  readonly postAlert: (payload: AlertPayload) => Promise<AlertPostResult>;
  readonly deleteAlert: (alertId: AlertId) => Promise<boolean>;
  readonly acknowledgeAlert: (alertId: AlertId) => Promise<boolean>;
  readonly pinAlert: (alertId: AlertId) => Promise<boolean>;
  readonly updateFilters: (filters: Partial<AlertFilters>) => void;
}

// ---------------------------------------------------------------------------
// Component Props Types
// ---------------------------------------------------------------------------

export interface AlertsListProps {
  readonly alerts: readonly Alert[];
  readonly selectedId?: AlertId;
  readonly onSelect: (alert: Alert) => void;
  readonly onAcknowledge: (alertId: AlertId) => void;
  readonly onDelete: (alertId: AlertId) => Promise<void>;
  readonly onPin: (alertId: AlertId) => void;
  readonly loading?: boolean;
}

export interface AlertItemProps {
  readonly alert: Alert;
  readonly isSelected: boolean;
  readonly onSelect: () => void;
  readonly onAcknowledge: () => void;
  readonly onDelete: () => void;
  readonly onPin: () => void;
  readonly canDelete: boolean;
  readonly canPin: boolean;
  readonly canAcknowledge: boolean;
}

export interface AlertsToolbarProps {
  readonly filters: AlertFilters;
  readonly alertCounts: AlertCounts;
  readonly onFilterChange: (filters: AlertFilters) => void;
  readonly onSearch: (term: string) => void;
  readonly onRefresh: () => void;
  readonly loading?: boolean;
}

// ---------------------------------------------------------------------------
// Error Types
// ---------------------------------------------------------------------------

export interface AlertError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

export type AlertServiceError = AlertError & {
  readonly type: 'validation' | 'network' | 'permission' | 'not_found';
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export type {
  AlertId as Id,
  AlertPriority as Priority,
  AlertStatus as Status,
  AlertAuthor as Author,
  AlertPayload as Payload,
  AlertPostResult as PostResult,
  AlertFilters as Filters,
  AlertCounts as Counts,
  AlertListState as ListState,
  AlertRealtimeEvent as RealtimeEvent,
  AlertActions as Actions,
  AlertsListProps as ListProps,
  AlertItemProps as ItemProps,
  AlertsToolbarProps as ToolbarProps,
  AlertError as Error,
  AlertServiceError as ServiceError,
  AlertMenuItem as MenuItem,
};

// ---------------------------------------------------------------------------
// Utility Functions (SSOT)
// ---------------------------------------------------------------------------

/**
 * SSOT: Alert menu item configuration
 * Defines the structure for alert context menu items
 */
export interface AlertMenuItem {
  readonly icon: IconDefinition; // FontAwesome icon definition
  readonly label: string;
  readonly color: string;
  readonly action: () => void;
}

/**
 * SSOT: Get display name from alert author
 * Priority: display_name > email prefix > username > 'Admin'
 * Use this everywhere to ensure consistent author name display
 */
export function getAuthorDisplayName(author: AlertAuthor | null | undefined): string {
  if (!author) return 'Admin';
  return author.display_name || author.email?.split('@')[0] || author.username || 'Admin';
}
