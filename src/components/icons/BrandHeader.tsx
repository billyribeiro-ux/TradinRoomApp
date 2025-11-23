import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  RefreshCw,
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  LogOut,
  Palette,
  Sparkles,
  Settings as SettingsIcon,
  MonitorUp,
  Menu,
} from 'lucide-react';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useFluentIcons } from '../../icons/useFluentIcons';

import { SpotifyButton } from '../../SpotifyButton';
import { MicVolumeIndicator } from '../../features/Mic/MicVolumeIndicator';
import { VolumeControl } from '../../features/audio/VolumeControl';
import { supabase } from '../../lib/supabase';
import { liveKitService } from '../../services/livekit';
import { shareService } from '../../sharing/shareService';
import { useThemeStore } from '../../store/themeStore';
import { useToastStore } from '../../store/toastStore';
import { SidebarMenu } from '../SidebarMenu';

// ============================================================================
// CONSTANTS - Microsoft Enterprise Pattern
// ============================================================================
const PARTICIPANT_POLL_INTERVAL_MS = 1000;
const DROPDOWN_ESCAPE_KEY = 'Escape';

// Responsive size classes - Microsoft Design System (Thinner profile)
const BUTTON_SIZES = {
  base: 'h-8 w-8',        // Mobile portrait
  sm: 'sm:h-9 sm:w-9',    // Mobile landscape
  md: 'md:h-10 md:w-10',  // Tablet
  lg: 'lg:h-11 lg:w-11',  // Small desktop
  xl: 'xl:h-12 xl:w-12',  // Large desktop
  '2xl': '2xl:h-14 2xl:w-14' // 4K displays
} as const;

const ICON_SIZES = {
  base: 'w-4 h-4',
  sm: 'sm:w-5 sm:h-5',
  md: 'md:w-5 md:h-5',
  lg: 'lg:w-6 lg:h-6',
  xl: 'xl:w-6 xl:h-6',
  '2xl': '2xl:w-7 2xl:h-7'
} as const;

const TEXT_SIZES = {
  xs: 'text-xs sm:text-xs md:text-sm',
  sm: 'text-xs sm:text-sm md:text-base',
  base: 'text-sm sm:text-base md:text-lg',
  lg: 'text-base sm:text-lg md:text-xl',
  xl: 'text-lg sm:text-xl md:text-2xl'
} as const;

// ============================================================================
// TYPE DEFINITIONS - Microsoft Enterprise Standards
// ============================================================================
interface BrandHeaderProps {
  onOpenSettings?: () => void;
  onCustomizeClick?: () => void;
  room?: { 
    id?: string; 
    title: string; 
    description?: string | undefined;
  };
  canRecord?: boolean;
  canManageRoom?: boolean;
  isRecording?: boolean;
  isMicEnabled?: boolean;
  cameraEnabled?: boolean;
  isSpeaking?: boolean;
  audioStream?: MediaStream | undefined;
  spotifyConnected?: boolean;
  linkedinConnected?: boolean;
  xConnected?: boolean;
  handleToggleRecording?: () => void;
  handleToggleMic?: () => void;
  handleToggleCamera?: () => void;
  handleLeave?: () => void;
  handleRefresh?: () => void;
  handleSpotifyConnect?: () => void;
  handleSpotifyDisconnect?: () => void;
  handleLinkedInConnect?: () => void;
  handleLinkedInDisconnect?: () => void;
  handleXConnect?: () => void;
  handleXDisconnect?: () => void;
  spotifyLoading?: boolean;
  spotifyConnecting?: boolean;
  showAlertModal?: boolean;
  setShowAlertModal?: (show: boolean) => void;
  showPollModal?: boolean;
  setShowPollModal?: (show: boolean) => void;
  showThemePanel?: boolean;
  setShowThemePanel?: (show: boolean) => void;
  onToggleWhiteboard?: () => void;
  isWhiteboardActive?: boolean;
  linkedinLoading?: boolean;
  linkedinConnecting?: boolean;
  xLoading?: boolean;
  isRefreshing?: boolean;
  onOpenMobileAppInfo?: () => void;
  onOpenConnectivityCheck?: () => void;
  onOpenGeneralSettings?: () => void;
  onOpenArchives?: () => void;
  onManageMutedUsers?: () => void;
  onManageFollowedUsers?: () => void;
  onGetRandomUser?: () => void;
  onOpenUsersPanel?: () => void;
}

// ============================================================================
// UTILITY FUNCTIONS - Microsoft Pattern
// ============================================================================
const getResponsiveButtonClasses = (): string => {
  return Object.values(BUTTON_SIZES).join(' ');
};

const getResponsiveIconClasses = (): string => {
  return Object.values(ICON_SIZES).join(' ');
};

const toggleDropdown = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.stopPropagation();
  const btn = event.currentTarget;
  const menu = btn.nextElementSibling as HTMLUListElement | undefined;
  if (!menu) return;
  
  const isOpen = menu.getAttribute('data-open') === 'true';
  menu.setAttribute('data-open', String(!isOpen));
  btn.setAttribute('aria-expanded', String(!isOpen));
  
  // Update CSS variable for display
  menu.style.setProperty('--menu-display', isOpen ? 'none' : 'block');
};

const closeDropdown = (element: HTMLElement) => {
  const ul = element.closest('ul') as HTMLUListElement | undefined;
  if (ul) {
    ul.setAttribute('data-open', 'false');
    ul.style.setProperty('--menu-display', 'none');
    const btn = ul.previousElementSibling as HTMLButtonElement | undefined;
    btn?.setAttribute('aria-expanded', 'false');
  }
};

// ============================================================================
// MAIN COMPONENT - Microsoft Enterprise Grade
// ============================================================================
export function BrandHeader({
  onOpenSettings,
  onCustomizeClick,
  room,
  canRecord,
  canManageRoom,
  isRecording,
  isMicEnabled,
  cameraEnabled,
  audioStream,
  linkedinConnected,
  xConnected,
  handleToggleRecording,
  handleToggleMic,
  handleToggleCamera,
  handleLeave,
  handleRefresh,
  handleLinkedInConnect,
  handleLinkedInDisconnect,
  handleXConnect,
  handleXDisconnect,
  linkedinLoading,
  linkedinConnecting,
  xLoading,
  isRefreshing,
  setShowThemePanel,
  onOpenMobileAppInfo,
  onOpenConnectivityCheck,
  onOpenGeneralSettings,
  onOpenArchives,
  onManageMutedUsers,
  onManageFollowedUsers,
  onGetRandomUser,
  onOpenUsersPanel,
  onToggleWhiteboard,
  isWhiteboardActive,
}: BrandHeaderProps) {
  const { businessName, logoUrl, colors } = useThemeStore();
  const quickMenuRef = useRef<HTMLDivElement | null>(null);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const { addToast } = useToastStore();
  const firstLetter = useMemo(() => businessName?.charAt(0) ?? 'R', [businessName]);
  const [participantCount, setParticipantCount] = useState(0);

  // ============================================================================
  // PARTICIPANT TRACKING - Microsoft Pattern
  // ============================================================================
  useEffect(() => {
    if (!quickMenuOpen) return;
    const handleClickAway = (event: MouseEvent) => {
      if (!quickMenuRef.current?.contains(event.target as Node)) {
        setQuickMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickAway, true);
    return () => document.removeEventListener('click', handleClickAway, true);
  }, [quickMenuOpen]);

  useEffect(() => {
    const updateParticipantCount = async () => {
      const connectionState = liveKitService.getConnectionState();
      
      if (connectionState.isConnected) {
        const count = connectionState.participants.length + (connectionState.localParticipant ? 1 : 0);
        
        if (import.meta.env.DEV) {
          const participants = connectionState.participants;
          console.debug('[BrandHeader] LiveKit participants:', {
            total: participants.length,
            identities: participants.map(p => p.identity)
          });
        }
        
        setParticipantCount(count);
        return;
      }

      // Fallback to database
      if (room?.id) {
        try {
          const { count, error } = await supabase
            .from('room_memberships')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);
          
          if (error) throw error;
          setParticipantCount(count || 0);
        } catch (error) {
          console.error('[BrandHeader] Failed to get participant count:', error);
        }
      } else {
        setParticipantCount(0);
      }
    };

    updateParticipantCount();
    const interval = setInterval(updateParticipantCount, PARTICIPANT_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [room?.id]);

  // (Screen share toggle removed) Icon shows dropdown only

  // ============================================================================
  // RESPONSIVE CLASSES - Microsoft Pattern
  // ============================================================================
  const buttonClasses = getResponsiveButtonClasses();
  const iconClasses = getResponsiveIconClasses();
  const fi = useFluentIcons();

  return (
    <header
      className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 flex items-center justify-between flex-wrap gap-2"
      style={{ backgroundColor: colors.primary }}
      role="banner"
    >
      {/* LEFT SECTION - Logo & Room Info */}
      <div className="flex items-center gap-2 sm:gap-2 md:gap-3 flex-shrink-0">
        {/* Quick Settings Menu - Microsoft Enterprise Design */}
        <div className="relative" ref={quickMenuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setQuickMenuOpen((prev) => !prev);
            }}
            className={`${buttonClasses} flex items-center justify-center hover:bg-slate-700/50 rounded-lg text-white transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/30`}
            title={quickMenuOpen ? "Close Menu" : "Quick Settings"}
            aria-label={quickMenuOpen ? "Close Menu" : "Quick Settings"}
            aria-haspopup="true"
            aria-expanded={quickMenuOpen}
            type="button"
          >
            {quickMenuOpen ? (
              (() => {
                const I = fi?.ArrowLeft24Regular || fi?.ArrowLeft20Regular;
                if (I) {
                  const C = I as React.ComponentType<Record<string, unknown>>;
                  return <C className={iconClasses} />;
                }
                return <FontAwesomeIcon icon={faArrowLeft} className={iconClasses} />;
              })()
            ) : (
              (() => {
                const I = fi?.LineHorizontal324Regular || fi?.LineHorizontal320Regular;
                if (I) {
                  const C = I as React.ComponentType<Record<string, unknown>>;
                  return <C className={iconClasses} />;
                }
                return <Menu className={iconClasses} />;
              })()
            )}
          </button>

          <SidebarMenu
            isOpen={quickMenuOpen}
            onClose={() => setQuickMenuOpen(false)}
            participantCount={participantCount}
            businessName={businessName}
            firstLetter={firstLetter}
            onOpenMobileAppInfo={onOpenMobileAppInfo}
            onOpenConnectivityCheck={onOpenConnectivityCheck}
            onOpenGeneralSettings={onOpenGeneralSettings}
            onOpenArchives={onOpenArchives}
            onManageMutedUsers={onManageMutedUsers}
            onManageFollowedUsers={onManageFollowedUsers}
            onGetRandomUser={onGetRandomUser}
            onOpenUsersPanel={onOpenUsersPanel}
          />
        </div>

        {/* Logo */}
        <div className="flex items-center gap-1 sm:gap-2">
          {logoUrl ? (
            <img
              key={logoUrl}
              src={`${logoUrl}?t=${Date.now()}`}
              alt={businessName}
              loading="lazy"
              className="h-5 sm:h-6 md:h-7 lg:h-8 w-auto object-contain"
            />
          ) : (
            <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 bg-white/20 rounded flex items-center justify-center text-white font-bold text-xs">
              {firstLetter}
            </div>
          )}
          <span className={`text-white font-semibold truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px] ${TEXT_SIZES.sm}`}>
            {businessName || 'Wilbur'}
          </span>
        </div>

        {/* User Count */}
        <div className="flex items-center gap-1 px-2 py-0.5 sm:py-1 bg-slate-800 rounded-lg select-none">
          {(() => {
            const I = fi?.People24Regular || fi?.People20Regular;
            if (I) {
              const C = I as React.ComponentType<Record<string, unknown>>;
              return <C className="w-3 h-3 sm:w-4 sm:h-4 text-white" />;
            }
            return <Users className="w-3 h-3 sm:w-4 sm:h-4 text-white" />;
          })()}
          <span className={`text-white font-semibold ${TEXT_SIZES.xs}`}>
            {participantCount}
          </span>
        </div>

        {/* Room Info */}
        {room && (
          <div className="hidden sm:block truncate max-w-[150px] md:max-w-[250px]">
            <h1 className={`font-bold text-white truncate ${TEXT_SIZES.base}`}>
              {room.title}
            </h1>
            {room.description && (
              <p className={`text-white truncate ${TEXT_SIZES.xs}`}>
                {room.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* CENTER SPACER */}
      <div className="hidden lg:block flex-1" />

      {/* RIGHT SECTION - Action Buttons */}
      <nav 
        className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end"
        role="navigation"
        aria-label="Room controls"
      >
        {/* Recording Button with Dropdown */}
        {handleToggleRecording && (
          <div className="relative">
            <button
              id="dropdownRecording"
              className={`${buttonClasses} flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/40'
                  : 'hover:bg-slate-700/50 text-white'
              }`}
              title="Recording options"
              aria-label="Recording options"
              aria-haspopup="true"
              aria-expanded="false"
              onClick={toggleDropdown}
              onKeyDown={(e) => {
                if (e.key === DROPDOWN_ESCAPE_KEY) closeDropdown(e.currentTarget);
              }}
            >
              {(() => {
                const I = fi?.Record24Regular || fi?.Record20Regular || fi?.Circle24Regular || fi?.Circle20Regular;
                if (I) {
                  const C = I as React.ComponentType<Record<string, unknown>>;
                  return <C className={`${iconClasses} ${isRecording ? 'animate-pulse' : ''}`} />;
                }
                return (
                  <FontAwesomeIcon
                    icon={['far', 'dot-circle']}
                    className={`${iconClasses} ${isRecording ? 'animate-pulse' : ''}`}
                  />
                );
              })()}
            </button>
            <ul
              className="absolute right-0 mt-2 min-w-[200px] bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-2 z-50 hidden"
              data-open="false"
              style={{ display: 'var(--menu-display, none)' }}
              role="menu"
            >
              <li role="menuitem">
                <button
                  className="w-full text-left px-3 py-2 text-white hover:bg-slate-700 rounded transition-colors"
                  onClick={(e) => {
                    handleToggleRecording();
                    closeDropdown(e.currentTarget);
                  }}
                  disabled={!canRecord}
                >
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>
              </li>
            </ul>
          </div>
        )}

        {/* Spotify Button */}
        <SpotifyButton />

        {/* X (Twitter) Button */}
        <button
          onClick={() => xConnected ? handleXDisconnect?.() : handleXConnect?.()}
          className={`${buttonClasses} flex items-center justify-center rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-white/30 ${
            xConnected
              ? 'bg-blue-600 shadow-md shadow-blue-700/40 text-white'
              : 'hover:bg-slate-700/50 text-white'
          }`}
          title="X (Twitter)"
          aria-label="X (Twitter)"
          disabled={xLoading}
        >
          <FontAwesomeIcon icon={['fab', 'twitter']} className={iconClasses} />
        </button>

        {/* LinkedIn Button */}
        <button
          onClick={() => linkedinConnected ? handleLinkedInDisconnect?.() : handleLinkedInConnect?.()}
          className={`${buttonClasses} flex items-center justify-center rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-white/30 ${
            linkedinConnected
              ? 'bg-blue-600 shadow-md shadow-blue-700/40 text-white'
              : 'hover:bg-slate-700/50 text-white'
          }`}
          title="LinkedIn"
          aria-label="LinkedIn"
          disabled={linkedinLoading || linkedinConnecting}
        >
          <FontAwesomeIcon icon={['fab', 'linkedin']} className={iconClasses} />
        </button>

        {/* Microphone Button */}
        <button
          onClick={() => handleToggleMic?.()}
          className={`${buttonClasses} flex items-center justify-center rounded-lg transition-colors relative focus:outline-none focus:ring-2 focus:ring-white/30 ${
            isMicEnabled
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'hover:bg-slate-700/50 text-white'
          }`}
          title={isMicEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
          aria-label={isMicEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {isMicEnabled ? (
            (() => {
              const I = fi?.Mic24Regular || fi?.Mic20Regular;
              if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className={iconClasses} />; }
              return <Mic className={iconClasses} />;
            })()
          ) : (
            (() => {
              const I = fi?.MicOff24Regular || fi?.MicOff20Regular;
              if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className={iconClasses} />; }
              return <MicOff className={iconClasses} />;
            })()
          )}
          {isMicEnabled && audioStream && (
            <MicVolumeIndicator
              mediaStream={audioStream}
              isActive={isMicEnabled}
            />
          )}
        </button>

        {/* Camera Button */}
        <button
          onClick={() => handleToggleCamera?.()}
          className={`${buttonClasses} flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 ${
            cameraEnabled
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'hover:bg-slate-700/50 text-white'
          }`}
          title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
          aria-label={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {cameraEnabled ? (
            (() => {
              const I = fi?.Camera24Regular || fi?.Camera20Regular || fi?.Video24Regular || fi?.Video20Regular;
              if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className={iconClasses} />; }
              return <Video className={iconClasses} />;
            })()
          ) : (
            (() => {
              const I = fi?.CameraOff24Regular || fi?.CameraOff20Regular || fi?.VideoOff24Regular || fi?.VideoOff20Regular;
              if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className={iconClasses} />; }
              return <VideoOff className={iconClasses} />;
            })()
          )}
        </button>

        {/* Screen Share with Dropdown */}
        <div className="relative">
          <button
            id="dropdownScreenshare"
            className={`${buttonClasses} flex items-center justify-center rounded-lg hover:bg-slate-700/50 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/30`}
            title="Screen Share"
            aria-label="Screen Share options"
            aria-haspopup="true"
            aria-expanded="false"
            onClick={toggleDropdown}
          >
            {(() => {
              const I = fi?.Presenter24Regular || fi?.Presenter20Regular || fi?.ScreenShareStart24Regular || fi?.ScreenShareStart20Regular;
              if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className={iconClasses} />; }
              return <MonitorUp className={iconClasses} />;
            })()}
          </button>
          <ul
            className="absolute right-0 mt-2 min-w-[180px] bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-2 z-50 hidden"
            data-open="false"
            style={{ display: 'var(--menu-display, none)' }}
            role="menu"
          >
            <li role="menuitem">
              <button
                className="w-full text-left px-3 py-2 text-white hover:bg-slate-700 rounded transition-colors"
                onClick={async (e) => {
                  const target = e.currentTarget as HTMLElement;
                  try {
                    await shareService.startShare({ kind: 'display', withSystemAudio: true });
                    addToast?.('Screen capture started', 'info');
                  } catch (err) {
                    addToast?.(err instanceof Error ? err.message : 'Failed to start screen capture', 'error');
                  } finally {
                    closeDropdown(target);
                  }
                }}
              >
                Web Browser (PiP)
              </button>
            </li>
            {/* Divider and heading for virtual cameras */}
            <li role="separator" className="h-px bg-slate-700 my-2" />
            <li className="px-3 py-1 text-xs uppercase tracking-wide text-white">Virtual Cameras</li>
            <li role="menuitem">
              <button
                className="w-full text-left px-3 py-2 text-white hover:bg-slate-700 rounded transition-colors"
                onClick={async (e) => {
                  const btn = e.currentTarget as HTMLButtonElement;
                  const ul = btn.closest('ul');
                  if (!ul) return;
                  // Inject a simple device list below
                  try {
                    const devices = await shareService.discoverVirtualCameras();
                    const listId = 'virtual-cam-list';
                    let container = ul.querySelector(`#${listId}`) as HTMLDivElement | undefined;
                    if (!container) {
                      container = document.createElement('div');
                      container.id = listId;
                      ul.appendChild(container);
                    }
                    container.innerHTML = '';
                    if (!devices.length) {
                      const p = document.createElement('p');
                      p.className = 'text-white px-3 py-2';
                      p.textContent = 'No virtual cameras found';
                      container.appendChild(p);
                    } else {
                      devices.forEach((d) => {
                        const b = document.createElement('button');
                        b.className = 'w-full text-left px-3 py-2 text-white hover:bg-slate-700 rounded transition-colors';
                        b.textContent = d.label || 'Virtual Camera';
                        b.onclick = async () => {
                          try {
                            await shareService.startShare({ kind: 'virtual-camera', label: d.label });
                            addToast?.(`Using ${d.label}`, 'info');
                          } catch (err) {
                            addToast?.(err instanceof Error ? err.message : 'Failed to start virtual camera', 'error');
                          } finally {
                            closeDropdown(b);
                          }
                        };
                        container.appendChild(b);
                      });
                    }
                  } catch (err) {
                    addToast?.(err instanceof Error ? err.message : 'Failed to enumerate cameras', 'error');
                    closeDropdown(btn);
                  }
                }}
              >
                Virtual Cam (OBS/XSplit)
              </button>
            </li>
          </ul>
        </div>

        {/* Volume with Dropdown */}
        <div className="relative">
          <button
            id="dropdownVolume"
            className={`${buttonClasses} flex items-center justify-center rounded-lg hover:bg-slate-700/50 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/30`}
            title="Volume"
            aria-label="Volume controls"
            aria-haspopup="true"
            aria-expanded="false"
            onClick={toggleDropdown}
          >
            {(() => {
              const I = fi?.Speaker224Regular || fi?.Speaker220Regular || fi?.Speaker24Regular || fi?.Speaker20Regular;
              if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className={iconClasses} />; }
              return <FontAwesomeIcon icon={['fas', 'volume-high']} className={iconClasses} />;
            })()}
          </button>
          <ul
            className="absolute right-0 mt-2 min-w-[200px] bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-3 z-50 hidden"
            data-open="false"
            style={{ display: 'var(--menu-display, none)' }}
            role="menu"
          >
            <li role="menuitem">
              <VolumeControl />
            </li>
          </ul>
        </div>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className={`${buttonClasses} flex items-center justify-center hover:bg-slate-700/50 rounded-lg text-white transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/30`}
          title="Settings"
          aria-label="Settings"
        >
          {(() => {
            const I = fi?.Settings24Regular || fi?.Settings20Regular;
            if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className={iconClasses} />; }
            return <SettingsIcon className={iconClasses} />;
          })()}
        </button>

        {/* Customize Button - Admin Only */}
        {canManageRoom && (
          <button
            onClick={onCustomizeClick}
            className={`${buttonClasses} flex items-center justify-center hover:bg-slate-700/50 rounded-lg text-white transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/30`}
            title="Customize Trading Room"
            aria-label="Customize Trading Room"
          >
            {(() => {
              const I = fi?.Color24Regular || fi?.Color20Regular;
              if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className={iconClasses} />; }
              return <Palette className={iconClasses} />;
            })()}
          </button>
        )}

        {/* Whiteboard Button - Admin Only */}
        {canManageRoom && (
          <button
            onClick={onToggleWhiteboard}
            className={`${buttonClasses} flex items-center justify-center ${isWhiteboardActive ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-slate-700/50'} rounded-lg text-white transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/30`}
            title={isWhiteboardActive ? "Whiteboard Active" : "Toggle Whiteboard"}
            aria-label={isWhiteboardActive ? "Whiteboard Active" : "Toggle Whiteboard"}
          >
            <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}

        {/* Theme Button */}
        <button
          onClick={() => setShowThemePanel?.(true)}
          className={`${buttonClasses} flex items-center justify-center hover:bg-slate-700/50 rounded-lg text-white transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/30`}
          title="Theme Settings"
          aria-label="Theme Settings"
        >
          {(() => {
            const I = fi?.Sparkle24Regular || fi?.Sparkle20Regular || fi?.StarEmphasis24Regular || fi?.StarEmphasis20Regular;
            if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className={iconClasses} />; }
            return <Sparkles className={iconClasses} />;
          })()}
        </button>

        {/* Refresh Button with Visible Indicator */}
        <div className="relative">
          <button
            onClick={() => {
              // Refresh button clicked - silent in production
              if (handleRefresh) {
                handleRefresh();
              } else {
                // handleRefresh not defined - silent warning
              }
            }}
            disabled={isRefreshing || !handleRefresh}
            className={`${buttonClasses} flex items-center justify-center ${isRefreshing ? 'bg-blue-600' : 'hover:bg-blue-600/80'} active:bg-blue-700 rounded-lg text-white transition-all duration-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400/50 hover:scale-105`}
            title={isRefreshing ? "Refreshing..." : "Refresh Room"}
            aria-label="Refresh Room"
          >
            {(() => {
              const I = fi?.ArrowClockwise24Regular || fi?.ArrowClockwise20Regular || fi?.ArrowSync24Regular || fi?.ArrowSync20Regular;
              if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className={`${iconClasses} ${isRefreshing ? 'animate-spin text-yellow-300' : 'text-white'} transition-colors`} />; }
              return <RefreshCw className={`${iconClasses} ${isRefreshing ? 'animate-spin text-yellow-300' : 'text-white'} transition-colors`} />;
            })()}
          </button>
          {isRefreshing && (
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <span className="text-xs text-blue-400 font-semibold animate-pulse">Refreshing...</span>
            </div>
          )}
        </div>

        {/* Leave Button - Different styling */}
        <button
          onClick={handleLeave}
          className="flex items-center gap-1 px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500"
          title="Leave Room"
          aria-label="Leave Room"
        >
          {(() => {
            const I = fi?.SignOut24Regular || fi?.SignOut20Regular || fi?.ArrowExit24Regular || fi?.ArrowExit20Regular;
            if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className={iconClasses} />; }
            return <LogOut className={iconClasses} />;
          })()}
        </button>
      </nav>
    </header>
  );
}
