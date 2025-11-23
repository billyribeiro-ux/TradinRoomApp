import * as React from 'react';
import { useEffect, useCallback, useMemo, useRef, useLayoutEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTrash, faBell, faSearch } from '@fortawesome/free-solid-svg-icons';
import { useFluentIcons } from '../../icons/useFluentIcons';

import type { Alert, AlertId, AlertPayload } from './alerts.types';
import { useAlertsActions } from './useAlertsActions';
import { useAlerts } from './useAlertsSelectors';


interface AlertsPanelEntryProps {
  roomId: string | null | undefined;
  ListComponent: React.ComponentType<{
    alerts: ReadonlyArray<Alert>;
    onSelect?: (id: AlertId) => void;
    onAck?: (id: AlertId) => void;
    onDelete?: (id: AlertId) => void;
    onMute?: (userId: string, displayName: string) => void;
    onBan?: (userId: string, displayName: string) => Promise<void>;
    onKick?: (userId: string, displayName: string) => Promise<void>;
    onReport?: (alertId: AlertId) => Promise<void>;
    onMention?: (displayName: string) => void;
    onUserInfo?: (userId: string, displayName: string) => Promise<void>;
    onPrivateChat?: (userId: string, displayName: string) => Promise<void>;
    onShowToAll?: (alertId: AlertId) => Promise<void>;
  }>;
  ToolbarComponent?: React.ComponentType<{
    counts?: { total: number; unread: number };
    onSearch?: (q: string) => void;
    onFilterChange?: (filters: Record<string, unknown>) => void;
    onPollClick?: () => void;
    onPostAlertClick?: () => void;
    onSettingsClick?: () => void;
  }>;
  ComposerComponent?: React.ComponentType<{ 
    onSubmit: (payload: AlertPayload) => void;
    isOpen?: boolean;
    onClose?: () => void;
  }>;
  onSelectAlert?: (id: AlertId) => void;
  isResizing?: boolean; // Track when vertical resize is happening
  // Moderation handlers
  onMute?: (userId: string, displayName: string) => void;
  onBan?: (userId: string, displayName: string) => Promise<void>;
  onKick?: (userId: string, displayName: string) => Promise<void>;
  onReport?: (alertId: AlertId) => Promise<void>;
  onMention?: (displayName: string) => void;
  onUserInfo?: (userId: string, displayName: string) => Promise<void>;
  onPrivateChat?: (userId: string, displayName: string) => Promise<void>;
  onShowToAll?: (alertId: AlertId) => Promise<void>;
}

export function AlertsPanelEntry({
  roomId,
  ListComponent,
  ToolbarComponent,
  ComposerComponent,
  onSelectAlert,
  isResizing = false,
  onMute,
  onBan,
  onKick,
  onReport,
  onMention,
  onUserInfo,
  onPrivateChat,
  onShowToAll,
}: AlertsPanelEntryProps): React.ReactElement {
  const fi = useFluentIcons();
  // Read-only alerts list from SSOT
  const alerts = useAlerts();

  // Actions (fetch, realtime, send, ack, delete)
  const { initAlerts, startRealtime, stopRealtime, sendAlert, acknowledge, remove } =
    useAlertsActions(roomId);

  // Start once when roomId is available; stop on unmount/room change
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    void (async () => {
      await initAlerts();
      if (!cancelled) startRealtime();
    })();
    return () => {
      cancelled = true;
      stopRealtime();
    };
  }, [roomId, initAlerts, startRealtime, stopRealtime]);

  // Simple event handlers for your list UI
  const handleSelect = useCallback((id: AlertId) => onSelectAlert?.(id), [onSelectAlert]);
  const handleAck = useCallback((id: AlertId) => { acknowledge(id); }, [acknowledge]);
  const handleDelete = useCallback((id: AlertId) => { remove(id); }, [remove]);
  const handleSubmit = useCallback((payload: AlertPayload) => { sendAlert(payload); }, [sendAlert]);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [modOnly, setModOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Search and filter handlers for toolbar
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q.toLowerCase().trim());
  }, []);

  const handleFilterChange = useCallback((filters: Record<string, unknown>) => {
    if (typeof filters.modOnly === 'boolean') {
      setModOnly(filters.modOnly);
    }
  }, []);

  // Settings handlers
  const handleToggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
  }, []);

  const handleDownloadAlerts = useCallback(() => {
    try {
      const alertsData = JSON.stringify(alerts, null, 2);
      const blob = new Blob([alertsData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alerts-${roomId}-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download alerts:', error);
    }
  }, [alerts, roomId]);

  const handleEraseAlerts = useCallback(async () => {
    if (!roomId) return;
    
    const confirmed = confirm(
      `Are you sure you want to erase ALL ${alerts.length} alerts? This cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      // Delete all alerts one by one
      const deletePromises = alerts.map(alert => remove(alert.id));
      await Promise.all(deletePromises);
      
      console.log('[AlertsPanel] Successfully erased all alerts');
    } catch (error) {
      console.error('[AlertsPanel] Failed to erase alerts:', error);
      alert('Failed to erase all alerts. Please try again.');
    }
  }, [alerts, remove, roomId]);

  const handleDetachAlerts = useCallback(() => {
    if (!roomId) return;
    
    try {
      // Open alerts in a new window
      const width = 800;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
      const detachedWindow = window.open(
        `/detached-alerts?roomId=${roomId}`,
        'DetachedAlerts',
        features
      );
      
      if (!detachedWindow) {
        alert('Failed to open detached window. Please allow popups for this site.');
      } else {
        console.log('[AlertsPanel] Opened detached alerts window');
      }
    } catch (error) {
      console.error('[AlertsPanel] Failed to detach alerts:', error);
      alert('Failed to open detached window.');
    }
  }, [roomId]);

  // Filter alerts based on search and modOnly
  const filteredAlerts = useMemo(() => {
    let filtered = alerts;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(alert => {
        const title = alert.title?.toLowerCase() || '';
        const body = alert.body?.toLowerCase() || '';
        const author = alert.author && typeof alert.author === 'object' ? alert.author as unknown as Record<string, unknown> : null;
        const authorName = author?.display_name ? String(author.display_name).toLowerCase() : '';
        return title.includes(searchQuery) || body.includes(searchQuery) || authorName.includes(searchQuery);
      });
    }

    // Apply moderator-only filter
    if (modOnly) {
      filtered = filtered.filter(alert => {
        const role = alert.author_role?.toLowerCase();
        return role === 'admin' || role === 'moderator';
      });
    }

    return filtered;
  }, [alerts, searchQuery, modOnly]);

  // Optional counts for a toolbar badge (based on filtered alerts)
  const counts = useMemo(() => {
    let unread = 0;
    for (const a of filteredAlerts) if (a.status !== 'acknowledged') unread++;
    return { total: filteredAlerts.length, unread };
  }, [filteredAlerts]);

  // Scroll container ref for managing scroll position during resize
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Ultra-responsive scroll to bottom during resize
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isResizing) return;

    // Disable smooth scrolling for instant response
    const originalScrollBehavior = container.style.scrollBehavior;
    container.style.scrollBehavior = 'auto';
    
    // Function to scroll to bottom
    const scrollToBottom = () => {
      if (container) {
        const maxScroll = container.scrollHeight - container.clientHeight;
        if (maxScroll > 0) {
          container.scrollTop = maxScroll;
        }
      }
    };
    
    // Immediate scroll
    scrollToBottom();
    
    // ResizeObserver for height changes
    const resizeObserver = new ResizeObserver(() => {
      scrollToBottom();
    });
    resizeObserver.observe(container);
    
    // RAF loop for continuous updates (catches any missed events)
    const loop = () => {
      scrollToBottom();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    
    return () => {
      resizeObserver.disconnect();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      container.style.scrollBehavior = originalScrollBehavior;
    };
  }, [isResizing]);

  // Scroll to bottom when new alerts arrive - always show newest at bottom
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (container && alerts.length > 0) {
      // Use RAF to ensure DOM has updated
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    }
  }, [alerts]); // Trigger on any alert change, not just count

  // AlertsSettings component (inline)
  const AlertsSettings = ({ showSettings: show }: { showSettings: boolean }) => {
    if (!show) return null;
    return (
      <section 
        className="bg-slate-800 border-b border-slate-700 p-3 space-y-2"
        role="region"
        aria-label="Alerts settings"
      >
        <div className="relative">
          {(() => {
            const I = fi?.Search24Regular || fi?.Search20Regular;
            if (I) { return <I className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />; }
            return (
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"
              />
            );
          })()}
          <input
            id="alerts-search"
            name="alerts-search"
            type="text"
            placeholder="Search alerts..."
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            aria-label="Search alerts"
            autoComplete="off"
          />
        </div>

        <label htmlFor="mod-only-alerts" className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-white transition-colors">
          <input
            id="mod-only-alerts"
            name="mod-only-alerts"
            type="checkbox"
            checked={modOnly}
            onChange={(e) => setModOnly(e.target.checked)}
            className="rounded border-slate-600 bg-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <span>Show moderator alerts only</span>
        </label>

        <button
          onClick={handleDownloadAlerts}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {(() => {
            const I = fi?.ArrowDownload24Regular || fi?.ArrowDownload20Regular;
            if (I) { return <I className="w-4 h-4" />; }
            return <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />;
          })()}
          Download Alerts History
        </button>

        <button
          onClick={handleEraseAlerts}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors w-full focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {(() => {
            const I = fi?.Delete24Regular || fi?.Delete20Regular;
            if (I) { return <I className="w-4 h-4" />; }
            return <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />;
          })()}
          Erase All Alerts
        </button>

        <button
          onClick={handleDetachAlerts}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {(() => {
            const I = fi?.Alert24Regular || fi?.Alert20Regular || fi?.AlertOn24Regular || fi?.AlertOn20Regular;
            if (I) { return <I className="w-4 h-4" />; }
            return <FontAwesomeIcon icon={faBell} className="w-4 h-4" />;
          })()}
          Detach Chat & Alerts
        </button>
      </section>
    );
  };

  return (
    <div className="flex flex-col h-full w-full relative">
      <div className="flex-shrink-0">
        {ToolbarComponent ? React.createElement(ToolbarComponent, { 
          counts: counts, 
          onSearch: handleSearch, 
          onFilterChange: handleFilterChange,
          onSettingsClick: handleToggleSettings
        }) : null}
      </div>
      {showSettings && (
        <div className="absolute top-[60px] left-0 right-0 z-50">
          <AlertsSettings showSettings={showSettings} />
        </div>
      )}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative" 
        style={{ 
          overflowAnchor: 'none', // Disable browser scroll anchoring
          scrollBehavior: 'auto' // Instant scroll, no smooth animation
        }}
      >
        <div className="pr-2 sm:pr-3 py-3 pb-2 space-y-2">
          {React.createElement(ListComponent, { 
            alerts, 
            onSelect: handleSelect, 
            onAck: handleAck, 
            onDelete: handleDelete,
            onMute,
            onBan,
            onKick,
            onReport,
            onMention,
            onUserInfo,
            onPrivateChat,
            onShowToAll,
          })}
        </div>
      </div>
      {ComposerComponent ? (
        <div className="flex-shrink-0">
          {React.createElement(ComposerComponent, { onSubmit: handleSubmit, isOpen: false, onClose: () => {} })}
        </div>
      ) : null}
    </div>
  );
}
