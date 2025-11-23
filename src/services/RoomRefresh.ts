/**
 * Room Refresh Service
 * Handles room data refresh and synchronization
 */

import { getRoomMessages, getRoomAlerts, getActiveMediaTracks, getUserRoomRole } from './api';

export interface RoomRefreshOptions {
  includeMessages?: boolean;
  includeAlerts?: boolean;
  includeMembers?: boolean;
  includeTracks?: boolean;
}

export interface RoomRefreshResult {
  success: boolean;
  data?: {
    messages?: Array<Record<string, unknown>>;
    alerts?: Array<Record<string, unknown>>;
    tracks?: Array<Record<string, unknown>>;
    role?: Record<string, unknown>;
    refreshedAt?: string;
  };
  error?: string;
}

/**
 * Refresh room data
 * @param roomId - The room ID to refresh
 * @param tenantId - The tenant ID
 * @param userId - The user ID
 * @param options - Refresh options
 * @returns Promise<RoomRefreshResult>
 */
export async function refreshRoom(
  roomId: string,
  tenantId: string,
  userId: string,
  options: RoomRefreshOptions = {}
): Promise<RoomRefreshResult> {
  try {
    console.log('[RoomRefresh] Refreshing room:', { roomId, tenantId, userId, options });

    const refreshData: Record<string, unknown> = {};

    // Refresh messages if requested or default behavior
    if (options.includeMessages !== false) {
      try {
        const messages = await getRoomMessages(roomId);
        refreshData.messages = messages;
      } catch (err) {
        console.warn('[RoomRefresh] Failed to refresh messages:', err);
      }
    }

    // Refresh alerts if requested or default behavior
    // FIXED: Changed getTenantAlerts(tenantId) to getRoomAlerts(roomId)
    // Alerts table uses room_id foreign key, not tenant_id
    if (options.includeAlerts !== false) {
      try {
        const alerts = await getRoomAlerts(roomId);
        refreshData.alerts = alerts;
      } catch (err) {
        console.warn('[RoomRefresh] Failed to refresh alerts:', err);
      }
    }

    // Refresh media tracks if requested or default behavior
    if (options.includeTracks !== false) {
      try {
        const tracks = await getActiveMediaTracks(roomId);
        refreshData.tracks = tracks;
      } catch (err) {
        console.warn('[RoomRefresh] Failed to refresh tracks:', err);
      }
    }

    // Verify user permissions (always done on refresh)
    try {
      const role = await getUserRoomRole(userId, roomId);
      refreshData.role = role;
    } catch (err) {
      console.warn('[RoomRefresh] Failed to refresh role:', err);
    }

    refreshData.refreshedAt = new Date().toISOString();

    const result: RoomRefreshResult = {
      success: true,
      data: refreshData
    };

    console.log('[RoomRefresh] Room refreshed successfully');
    return result;

  } catch (error) {
    console.error('[RoomRefresh] Failed to refresh room:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Refresh specific room data
 * @param roomId - The room ID
 * @param dataType - Type of data to refresh
 * @returns Promise<RoomRefreshResult>
 */
export async function refreshRoomData(
  roomId: string,
  dataType: 'messages' | 'alerts' | 'members' | 'tracks'
): Promise<RoomRefreshResult> {
  try {
    console.log('[RoomRefresh] Refreshing room data:', { roomId, dataType });

    // TODO: Implement specific data refresh logic
    // This should refresh only the specified data type

    return {
      success: true,
      data: {
        refreshedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('[RoomRefresh] Failed to refresh room data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
