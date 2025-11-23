import { getRoomAlerts } from '../../services/api';
import type { Alert as DbAlert } from '../../types/database.types';

import type {
  AlertId,
  AlertPayload,
  AlertPostResult,
} from './alerts.types';

/**
 * Fetch alerts for a room (read-only).
 * Uses existing project API: getRoomAlerts(roomId)
 * Returns database Alert type directly
 */
export async function fetchAlerts(roomId: string): Promise<DbAlert[]> {
  if (!roomId) throw new Error('fetchAlerts: roomId is required');
  const raw = await getRoomAlerts(roomId);
  if (!Array.isArray(raw)) return [];
  return raw;
}

/**
 * Post a new alert.
 * NOTE: This is a typed placeholder — wire to your actual API when ready.
 * Keeping the function so downstream code compiles cleanly.
 */
export function postAlert(
  _payload: AlertPayload
): AlertPostResult {
  // TODO: Replace with your real implementation, e.g.:
  // const res = await api.post('/alerts', payload)
  // return { id: res.id, createdAt: res.created_at }
  throw Object.assign(new Error('postAlert not implemented'), {
    code: 'NOT_IMPLEMENTED',
    retryable: false,
  });
}

/**
 * Mark alert as acknowledged/read.
 * NOTE: Typed placeholder — replace with your actual API.
 */
export function ackAlert(_id: AlertId): void {
  // TODO: api.post(`/alerts/${id}/ack`)
  throw Object.assign(new Error('ackAlert not implemented'), {
    code: 'NOT_IMPLEMENTED',
    retryable: false,
  });
}

/**
 * Delete an alert.
 * NOTE: Typed placeholder — replace with your actual API.
 */
export function deleteAlert(_id: AlertId): void {
  // TODO: api.delete(`/alerts/${id}`)
  throw Object.assign(new Error('deleteAlert not implemented'), {
    code: 'NOT_IMPLEMENTED',
    retryable: false,
  });
}
