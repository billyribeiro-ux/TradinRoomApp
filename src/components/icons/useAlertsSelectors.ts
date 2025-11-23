import { useMemo } from 'react';

import { useRoomStore } from '../../store/roomStore';

import type {
  Alert,
  AlertId,
  AlertPriority,
  AlertFilters,
} from './alerts.types';

/**
 * INTERNAL: stable empty defaults to avoid re-allocation
 */
const EMPTY_ALERTS: ReadonlyArray<Alert> = Object.freeze([]);
const EMPTY_FILTERS: Readonly<AlertFilters> = Object.freeze({
  priority: undefined,
  status: undefined,
  author_id: undefined,
  search_term: undefined,
  date_range: undefined,
});

/**
 * Returns the full alerts list from SSOT (read-only).
 * Memoized to avoid re-renders when reference-stable.
 */
export function useAlerts(): ReadonlyArray<Alert> {
  const { alerts } = useRoomStore();
  return useMemo(() => (alerts?.length ? (alerts as unknown as ReadonlyArray<Alert>) : EMPTY_ALERTS), [alerts]);
}

/**
 * Returns a single alert by id (or undefined).
 * Does not mutate state.
 */
export function useAlertById(id: AlertId | null | undefined): Alert | undefined {
  const list = useAlerts();
  return useMemo(() => {
    if (!id) return undefined;
    // prefer strict equality on string ids
    return list.find(a => a.id === id);
  }, [list, id]);
}

/**
 * Returns lightweight counts for UI badges.
 * - total: list length
 * - unread: counts alerts without `acknowledged === true` 
 * - byPriority: map of AlertPriority -> count
 */
export function useAlertCounts(): {
  total: number;
  unread: number;
  byPriority: Partial<Record<AlertPriority, number>>;
} {
  const list = useAlerts();
  return useMemo(() => {
    let unread = 0;
    const byPriority: Partial<Record<AlertPriority, number>> = {};
    for (const a of list) {
      if (a.status !== 'acknowledged') unread++;
      if (a.priority) {
        byPriority[a.priority] = (byPriority[a.priority] ?? 0) + 1;
      }
    }
    return { total: list.length, unread, byPriority };
  }, [list]);
}

/**
 * Reads current alert filters from SSOT if present.
 * If SSOT has no filters yet, returns a stable empty object.
 */
export function useAlertFilters(): Readonly<AlertFilters> {
  // For now, return empty filters until we add filters to the store
  return useMemo(() => EMPTY_FILTERS, []);
}
