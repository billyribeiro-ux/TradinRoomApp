/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { subscribeToRoomAlerts } from '../../services/realtime';

import type { Alert, AlertId } from './alerts.types';

/**
 * Normalized realtime event shapes for alerts.
 * Map your provider payloads to exactly these kinds before they
 * reach any stateful code.
 */
export type AlertRealtimeEvent =
  | { kind: 'alert.created'; alert: Alert }
  | { kind: 'alert.updated'; alert: Alert }
  | { kind: 'alert.deleted'; id: AlertId };

/**
 * Adapter to map raw provider payloads into AlertRealtimeEvent.
 * Keep this small and pure—adjust only if upstream payload shapes change.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
function mapRawToAlertEvent(raw: any): AlertRealtimeEvent | null {
  if (!raw || typeof raw !== 'object') return null;

  // common shapes seen from Supabase/realtime or custom sockets:
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const type = String(raw.type ?? raw.event ?? raw.kind ?? '').toLowerCase();

  // normalize fields
  const normalizedAlert: Alert | null =
    raw.alert
      ? {
          id: String(raw.alert.id),
          title: String(raw.alert.title ?? ''),
          body: String(raw.alert.message ?? raw.alert.body ?? ''),
          author: (raw.alert.author) ?? null,
          author_id: String(raw.alert.author_id ?? raw.alert.user_id ?? ''),
          author_role: String(raw.alert.author_role ?? ''),
          priority: (raw.alert.priority) ?? 'medium',
          status: (raw.alert.status) ?? 'active',
          created_at: String(raw.alert.created_at ?? raw.alert.createdAt ?? new Date().toISOString()),
          is_non_trade: Boolean(raw.alert.is_non_trade ?? false),
          is_pinned: Boolean(raw.alert.pinned ?? false),
          has_legal_disclosure: Boolean(raw.alert.has_legal_disclosure ?? false),
          legal_disclosure_text: String(raw.alert.legal_disclosure_text ?? ''),
          room_id: String(raw.alert.room_id ?? raw.alert.roomId ?? ''),
          type: String(raw.alert.type ?? ''),
          attachments: Array.isArray(raw.alert.attachments) ? raw.alert.attachments : undefined,
          mentions: Array.isArray(raw.alert.mentions) ? raw.alert.mentions : undefined,
        }
      : null;

  // route by normalized type
  switch (type) {
    case 'insert':
    case 'create':
    case 'alert.created':
      return normalizedAlert ? { kind: 'alert.created', alert: normalizedAlert } : null;

    case 'update':
    case 'modify':
    case 'alert.updated':
      return normalizedAlert ? { kind: 'alert.updated', alert: normalizedAlert } : null;

    case 'delete':
    case 'remove':
    case 'alert.deleted': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const id =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        raw.id ??
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        raw.alert_id ??
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        raw.alertId ??
        (normalizedAlert ? normalizedAlert.id : undefined);
      return id ? { kind: 'alert.deleted', id: String(id) } : null;
    }

    default:
      return null;
  }
}

/**
 * Subscribe to alerts realtime for a room.
 * Returns a cleanup function. No state writes—pure event bridge.
 */
export function subscribeAlertsRealtime(
  roomId: string,
  onEvent: (ev: AlertRealtimeEvent) => void
): () => void {
  if (!roomId) throw new Error('subscribeAlertsRealtime: roomId is required');
  if (typeof onEvent !== 'function') throw new Error('onEvent must be a function');

  // Under the hood, use your project's realtime subscribe.
  // If it returns an unsubscribe, forward it; otherwise provide a safe no-op.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - Temporary ignore until we check the actual signature
  const unsubscribeMaybe = subscribeToRoomAlerts(roomId, (raw: unknown) => {
    const ev = mapRawToAlertEvent(raw);
    if (ev) onEvent(ev);
  });

  if (typeof unsubscribeMaybe === 'function') {
    return unsubscribeMaybe;
  }

  // Fallback no-op cleanup if upstream didn't give one
  return () => {};
}
