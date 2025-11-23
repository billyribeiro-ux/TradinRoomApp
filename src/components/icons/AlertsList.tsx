import * as React from 'react';
import { memo, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faVolumeMute, faBan, faSignOutAlt, faFlag, faAt, faUser, faComments, faBullhorn } from '@fortawesome/free-solid-svg-icons';
import * as Icons from '@fluentui/react-icons';
import { useFluentIcons } from '../../icons/useFluentIcons';

import type { Alert, AlertId, AlertMenuItem } from './alerts.types';
import { getAuthorDisplayName } from './alerts.types';

interface AlertsListProps {
  alerts: ReadonlyArray<Alert>;
  onSelect?: (id: AlertId) => void;
  onAck?: (id: AlertId) => void;
  onDelete?: (id: AlertId) => void;
  // Moderation callbacks
  onMute?: (userId: string, displayName: string) => void;
  onBan?: (userId: string, displayName: string) => void;
  onKick?: (userId: string, displayName: string) => void;
  onReport?: (alertId: AlertId) => void;
  onMention?: (displayName: string) => void;
  onUserInfo?: (userId: string, displayName: string) => void;
  onPrivateChat?: (userId: string, displayName: string) => void;
  onShowToAll?: (alertId: AlertId) => void;

  /**
   * Optional: provide your own renderer to preserve your exact UI/classes.
   * If omitted, a minimal, unstyled fallback is used (safe for dev).
   */
  renderAlert?: (alert: Alert, actions: {
    onSelect?: (id: AlertId) => void;
    onAck?: (id: AlertId) => void;
    onDelete?: (id: AlertId) => void;
  }) => React.ReactElement;
}

/**
 * Pure list component — no side effects, no data fetching, no realtime.
 * Renders exactly what it's given. Safe to memo.
 */
function AlertsListBase({
  alerts,
  onSelect,
  onAck,
  onDelete,
  onMute,
  onBan,
  onKick,
  onReport,
  onMention,
  onUserInfo,
  onPrivateChat,
  onShowToAll,
  renderAlert,
}: AlertsListProps): React.ReactElement {
  const fi = useFluentIcons();
  // State for delete confirmation modal and active menu
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: AlertId; authorName: string; message: string } | null>(null);
  const [activeMenu, setActiveMenu] = useState<{ alertId: AlertId; position: { top: number; left: number } } | null>(null);
  
  // Stable actions object to avoid re-renders of custom renderers
  const actions = useMemo(() => ({ onSelect, onAck, onDelete }), [onSelect, onAck, onDelete]);

  if (alerts.length === 0) {
    // Keep this minimal; your outer wrapper can style empty state
    return <div data-testid="alerts-empty" className="flex items-center justify-center h-full text-slate-500 text-sm p-4">No alerts yet</div>;
  }

  if (renderAlert) {
    return (
      <div data-testid="alerts-list" className="space-y-4 p-4 w-full overflow-x-hidden flex flex-col">
        {alerts.map(a => (
          <div key={a.id} data-alert-id={a.id} className="mr-8">
            {renderAlert(a, actions)}
          </div>
        ))}
      </div>
    );
  }

  // Format date helper
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format full date/time for tooltip
  const formatFullDateTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Minimal fallback (DEV only) — replace with your exact markup if desired
  return (
    <div data-testid="alerts-list" className="space-y-4 p-4 w-full overflow-x-hidden flex flex-col">
      {alerts.map(a => {
        const authorName = getAuthorDisplayName(a.author);
        return (
          <div key={a.id} data-alert-id={a.id} className="bg-slate-700 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors w-full min-w-0 mr-8">
            {/* Header with author and menu */}
            <div className="flex items-center justify-between mb-2 min-w-0 gap-2">
              {/* Grip icon for menu */}
              <div className="relative flex-shrink-0">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    if (activeMenu?.alertId === a.id) {
                      setActiveMenu(null);
                    } else {
                      setActiveMenu({
                        alertId: a.id,
                        position: { top: rect.bottom + 4, left: rect.left }
                      });
                    }
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-600 transition-colors focus:outline-none"
                  aria-label="More options"
                >
                  {(() => {
                    const I = fi?.ReOrderDotsVertical24Regular || fi?.ReOrderDotsVertical20Regular || fi?.MoreVertical24Regular || fi?.MoreVertical20Regular;
                    if (I) { return <I className="w-5 h-5" />; }
                    return <GripVertical className="w-5 h-5" />;
                  })()}
                </button>
              </div>
              
              {/* Author info */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {authorName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-semibold text-sm truncate">{authorName}</div>
                  <time 
                    className="text-slate-400 hover:text-slate-300 text-xs truncate block transition-colors cursor-help"
                    dateTime={a.created_at || ''}
                    title={formatFullDateTime(a.created_at)}
                  >
                    {formatDate(a.created_at)}
                  </time>
                </div>
              </div>
            </div>

            {/* Alert content */}
            <div className="mb-3 min-w-0">
              <h4 className="font-semibold text-white text-base mb-1 break-words">{a.title ?? 'Alert'}</h4>
              {a.body && <div className="text-slate-300 text-sm break-words whitespace-pre-wrap">{a.body}</div>}
            </div>

            {/* Priority badge */}
            {/* COMMENTED OUT: Medium priority badge removed per user request
            {a.priority && (
              <div className="mb-3">
                <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${
                  a.priority === 'urgent' ? 'bg-red-500 text-white' :
                  a.priority === 'high' ? 'bg-orange-500 text-white' :
                  a.priority === 'medium' ? 'bg-yellow-500 text-black' :
                  'bg-gray-500 text-white'
                }`}>
                  {a.priority.toUpperCase()}
                </span>
              </div>
            )}
            */}

            {/* Action buttons */}
            {/* COMMENTED OUT: Open, Mark Read, and Delete buttons removed per user request
            <div className="flex gap-2">
              {onSelect ? (
                <button 
                  onClick={() => onSelect(a.id)} 
                  aria-label="Open alert"
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium"
                >
                  Open
                </button>
              ) : null}
              {onAck ? (
                <button 
                  onClick={() => onAck(a.id)} 
                  disabled={a.status === 'acknowledged'} 
                  aria-label="Acknowledge alert"
                  className={`px-3 py-1.5 text-xs rounded transition-colors font-medium ${
                    a.status === 'acknowledged' 
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {a.status === 'acknowledged' ? 'Read' : 'Mark Read'}
                </button>
              ) : null}
              {onDelete ? (
                <button 
                  onClick={() => onDelete(a.id)} 
                  aria-label="Delete alert"
                  className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors font-medium"
                >
                  Delete
                </button>
              ) : null}
            </div>
            */}
          </div>
        );
      })}
      
      {/* Context Menu Portal */}
      {activeMenu && createPortal(
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActiveMenu(null)}
        >
          <div
            className="absolute bg-slate-800 border border-slate-600 rounded-lg shadow-xl min-w-[200px]"
            style={{ top: activeMenu.position.top, left: activeMenu.position.left }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const alert = alerts.find(a => a.id === activeMenu.alertId);
              if (!alert) return null;
              const authorName = getAuthorDisplayName(alert.author);
              
              const items: AlertMenuItem[] = [
                onDelete && { icon: faTrash, label: 'Delete Message', color: 'text-red-400 hover:bg-red-600/20', action: () => { setDeleteConfirm({ id: alert.id, authorName, message: alert.title || alert.body || '' }); setActiveMenu(null); } },
                onMute && { icon: faVolumeMute, label: 'Mute User', color: 'text-slate-400 hover:bg-slate-600', action: () => { onMute(alert.author?.id || '', authorName); setActiveMenu(null); } },
                onBan && { icon: faBan, label: 'Ban User', color: 'text-red-400 hover:bg-red-600/20', action: () => { onBan(alert.author?.id || '', authorName); setActiveMenu(null); } },
                onKick && { icon: faSignOutAlt, label: 'Kick User', color: 'text-red-400 hover:bg-red-600/20', action: () => { onKick(alert.author?.id || '', authorName); setActiveMenu(null); } },
                onReport && { icon: faFlag, label: 'Report', color: 'text-yellow-400 hover:bg-yellow-600/20', action: () => { onReport(alert.id); setActiveMenu(null); } },
                onMention && { icon: faAt, label: 'Mention User', color: 'text-blue-400 hover:bg-blue-600/20', action: () => { onMention(authorName); setActiveMenu(null); } },
                onUserInfo && { icon: faUser, label: 'User Info', color: 'text-slate-400 hover:bg-slate-600', action: () => { onUserInfo(alert.author?.id || '', authorName); setActiveMenu(null); } },
                onPrivateChat && { icon: faComments, label: 'Private Chat', color: 'text-green-400 hover:bg-green-600/20', action: () => { onPrivateChat(alert.author?.id || '', authorName); setActiveMenu(null); } },
                onShowToAll && { icon: faBullhorn, label: 'Show to All', color: 'text-purple-400 hover:bg-purple-600/20', action: () => { onShowToAll(alert.id); setActiveMenu(null); } },
              ].filter(Boolean) as AlertMenuItem[];
              
              return items.map((item, index) => (
                <button
                  key={index}
                  onClick={item.action}
                  className={`w-full text-left px-4 py-2.5 ${item.color} transition-colors text-sm flex items-center gap-3 ${index < items.length - 1 ? 'border-b border-slate-700' : ''}`}
                >
                  <span className="w-4 flex-shrink-0">
                    {(() => {
                      const m: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>> | undefined> = {
                        [faTrash.iconName]: Icons?.Delete24Regular || Icons?.Delete20Regular,
                        [faVolumeMute.iconName]: Icons?.SpeakerMute24Regular || Icons?.SpeakerMute20Regular,
                        [faBan.iconName]: Icons?.Prohibited24Regular || Icons?.Prohibited20Regular,
                        [faSignOutAlt.iconName]: Icons?.SignOut24Regular || Icons?.SignOut20Regular,
                        [faFlag.iconName]: Icons?.Flag24Regular || Icons?.Flag20Regular,
                        [faAt.iconName]: Icons?.Mention24Regular || Icons?.Mention20Regular,
                        [faUser.iconName]: Icons?.Person24Regular || Icons?.Person20Regular,
                        [faComments.iconName]: Icons?.Chat24Regular || Icons?.Chat20Regular,
                        [faBullhorn.iconName]: Icons?.Megaphone24Regular || Icons?.Megaphone20Regular,
                      };
                      const key = item.icon.iconName;
                      const I = m[key];
                      if (I) { return <I className="w-4 h-4" />; }
                      return <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />;
                    })()}
                  </span>
                  <span>{item.label}</span>
                </button>
              ));
            })()}
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
            onClick={() => setDeleteConfirm(null)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <div 
              className="bg-slate-800 rounded-lg shadow-2xl max-w-md w-full border border-slate-600 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setDeleteConfirm(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Content */}
              <div className="p-6 pt-8">
                <h2 className="text-white text-lg font-normal mb-6 pr-8 leading-relaxed">
                  Are you sure you want to delete this alert by {deleteConfirm.authorName}. text: {deleteConfirm.message}
                </h2>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 px-6 pb-6">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-6 py-2.5 bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors font-medium min-w-[100px]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (onDelete) {
                      onDelete(deleteConfirm.id);
                    }
                    setDeleteConfirm(null);
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium min-w-[100px]"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export const AlertsList = memo(AlertsListBase);
