import { useCallback, useEffect, useRef } from 'react';

import { useToastStore } from '../../store/toastStore';
import { useTradingRoomState } from '../trading/useTradingRoomState';
import type { Alert as DbAlert } from '../../types/database.types';

import {
  subscribeAlertsRealtime,
  type AlertRealtimeEvent,
} from './alerts.realtime';
import {
  fetchAlerts,
  postAlert,
  ackAlert,
  deleteAlert as deleteAlertApi,
} from './alerts.service';
import type {
  AlertId,
  AlertPayload,
} from './alerts.types';
import { useAlerts } from './useAlertsSelectors';

/**
 * Minimal, predictable update helpers - work with database Alert type
 */
function upsertById(list: ReadonlyArray<DbAlert>, next: DbAlert): DbAlert[] {
  const idx = list.findIndex(a => a.id === next.id);
  if (idx === -1) return [...list, next]; // Append at end - newest at bottom
  const copy = list.slice();
  copy[idx] = next;
  return copy;
}

function removeById(list: ReadonlyArray<DbAlert>, id: AlertId): DbAlert[] {
  const idx = list.findIndex(a => a.id === id);
  if (idx === -1) return list.slice();
  const copy = list.slice();
  copy.splice(idx, 1);
  return copy;
}

/**
 * React hook that exposes typed alert actions.
 * - Reads current list through a ref (no stale closures)
 * - Writes via SSOT setter (no duplicate state stores)
 * - Side-effects limited to API/realtime + toasts
 */
export function useAlertsActions(roomId: string | null | undefined): {
  initAlerts: () => Promise<void>;
  startRealtime: () => void;
  stopRealtime: () => void;
  sendAlert: (payload: AlertPayload) => void;
  acknowledge: (id: AlertId) => void;
  remove: (id: AlertId) => void;
} {
  const { addToast } = useToastStore();
  const { setAlerts } = useTradingRoomState();

  // Current list (kept fresh in a ref for safe optimistic updates)
  const alerts = useAlerts();
  const alertsRef = useRef<ReadonlyArray<DbAlert>>(alerts);
  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);

  // Realtime subscription handle
  const unsubRef = useRef<null | (() => void)>(null);

  /**
   * Initialize from API (idempotent)
   */
  const initAlerts = useCallback(async () => {
    if (!roomId) return;
    try {
      const items = await fetchAlerts(roomId);
      setAlerts(items);
    } catch (err) {
      addToast('Failed to load alerts');
      // keep existing list as-is
    }
  }, [roomId, setAlerts, addToast]);

  /**
   * Internal: apply normalized realtime event to SSOT
   */
  const applyRealtime = useCallback((ev: AlertRealtimeEvent) => {
    const current = alertsRef.current;
    switch (ev.kind) {
      case 'alert.created': {
        setAlerts(upsertById(current, ev.alert));
        break;
      }
      case 'alert.updated': {
        setAlerts(upsertById(current, ev.alert));
        break;
      }
      case 'alert.deleted': {
        setAlerts(removeById(current, ev.id));
        break;
      }
      default:
        // no-op for unknown kinds
        break;
    }
  }, [setAlerts]);

  /**
   * Start realtime (idempotent). Safe to call multiple times.
   */
  const startRealtime = useCallback(() => {
    if (!roomId) return;
    // Stop any previous subscription first (defensive)
    if (unsubRef.current) {
      try { unsubRef.current(); } catch { /* noop */ }
      unsubRef.current = null;
    }
    unsubRef.current = subscribeAlertsRealtime(roomId, applyRealtime);
  }, [roomId, applyRealtime]);

  /**
   * Stop realtime (safe if already stopped)
   */
  const stopRealtime = useCallback(() => {
    if (unsubRef.current) {
      try { unsubRef.current(); } catch { /* noop */ }
      unsubRef.current = null;
    }
  }, []);

  /**
   * Send (optimistic). Rolls back on failure.
   */
  const sendAlert = useCallback((payload: AlertPayload) => {
    // Generate a temp client id to avoid collisions
    const tempId = `tmp_${Date.now()}`;
    const optimistic: DbAlert = {
      id: tempId,
      title: payload.title,
      body: payload.body ?? null,
      author: null,
      author_id: null,
      author_role: null,
      created_at: new Date().toISOString(),
      is_non_trade: payload.is_non_trade ?? null,
      has_legal_disclosure: null,
      legal_disclosure_text: null,
      room_id: roomId ?? '',
      type: null,
    };

    const before = alertsRef.current;
    setAlerts([...before, optimistic]); // Append at end - newest at bottom

    try {
      const result = postAlert(payload);
      // Replace temp with real if API returns id/timestamp
      const committed: DbAlert = {
        ...optimistic,
        id: String(result.alert?.id ?? tempId),
        created_at: result.alert?.created_at ?? optimistic.created_at,
      };
      setAlerts(upsertById(before, committed));
      addToast('Alert posted');
    } catch (err) {
      // rollback
      setAlerts(before.slice());
      addToast('Failed to post alert');
      throw err;
    }
  }, [setAlerts, addToast, roomId]);

  /**
   * Acknowledge/read (optimistic)
   */
  const acknowledge = useCallback((id: AlertId) => {
    const before = alertsRef.current;
    const target = before.find(a => a.id === id);
    if (!target) return;

    // Note: Database Alert doesn't have status field, so we just call the API
    // The realtime subscription will update the UI when the server confirms
    
    try {
      ackAlert(id);
    } catch (err) {
      // rollback not needed since we didn't optimistically update
      setAlerts(before.slice());
      addToast('Failed to acknowledge alert');
    }
  }, [setAlerts, addToast]);

  /**
   * Delete (optimistic)
   */
  const remove = useCallback((id: AlertId) => {
    const before = alertsRef.current;
    if (!before.some(a => a.id === id)) return;

    setAlerts(removeById(before, id));

    try {
      deleteAlertApi(id);
    } catch (err) {
      // rollback
      setAlerts(before.slice());
      addToast('Failed to delete alert');
    }
  }, [setAlerts, addToast]);

  /**
   * Auto-clean realtime on unmount
   */
  useEffect(() => {
    return () => {
      if (unsubRef.current) {
        try { unsubRef.current(); } catch { /* noop */ }
        unsubRef.current = null;
      }
    };
  }, []);

  return {
    // reads are in selectors; actions here:
    initAlerts,
    startRealtime,
    stopRealtime,
    sendAlert,
    acknowledge,
    remove,
  };
}
