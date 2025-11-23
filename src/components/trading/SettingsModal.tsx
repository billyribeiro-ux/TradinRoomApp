// src/components/trading/SettingsModal.tsx
// Microsoft Windows-Style Settings Modal - Enterprise Grade
// ============================================================================
import { X, Settings, Volume2, Video, Monitor, Bell, Save, Shield, RotateCcw, Check, RefreshCw } from 'lucide-react';
import { useFluentIcons } from '../../icons/useFluentIcons';
import { useState, useEffect, useCallback } from 'react';

import { useComponentTelemetry } from '@/lib/telemetry';

import { audioService } from '../../services/audioService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

import { MediaPermissionsDiagnostic } from './MediaPermissionsDiagnostic';



interface SettingsModalProps {
  onClose: () => void;
}

// Microsoft Pattern: Settings interface
interface UserSettings {
  audio: {
    masterVolume: number;
    notificationVolume: number;
    micSensitivity: number;
  };
  video: {
    quality: 'auto' | '1080p' | '720p' | '480p';
    frameRate: 30 | 60;
    hardwareAcceleration: boolean;
  };
  notifications: {
    desktop: boolean;
    sound: boolean;
    alerts: boolean;
    chat: boolean;
  };
  display: {
    theme: 'dark' | 'light' | 'auto';
    compactMode: boolean;
    showTimestamps: boolean;
  };
}

// Microsoft Pattern: Default settings
const DEFAULT_SETTINGS: UserSettings = {
  audio: { masterVolume: 80, notificationVolume: 60, micSensitivity: 50 },
  video: { quality: 'auto', frameRate: 30, hardwareAcceleration: true },
  notifications: { desktop: true, sound: true, alerts: true, chat: true },
  display: { theme: 'dark', compactMode: false, showTimestamps: true },
};

const SETTINGS_KEY = 'wilbur_user_settings';

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { user } = useAuthStore();
  
  return (
    <SettingsModalContent 
      onClose={onClose} 
      userId={user?.id} 
    />
  );
}

function SettingsModalContent({ onClose, userId }: { onClose: () => void; userId?: string }) {
  const fi = useFluentIcons();
  // Microsoft Pattern: Telemetry with Azure fallback
  useComponentTelemetry('SettingsModal');
  
  // Microsoft Pattern: Defensive state initialization
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch (error) {
      console.error('[Settings] LocalStorage parse error:', error);
      return DEFAULT_SETTINGS;
    }
  });

  // Microsoft Pattern: Async operation with circuit breaker
  const loadSettings = useCallback(async () => {
    if (!userId) return;
    
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('[Settings] Load error:', error);
    }
  }, [userId]);

  const { addToast } = useToastStore();
  
  // Microsoft Pattern: Track changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<UserSettings>(settings);

  // Audio Settings
  const [masterVolume, setMasterVolume] = useState(settings.audio.masterVolume);
  const [notificationVolume, setNotificationVolume] = useState(settings.audio.notificationVolume);
  const [micSensitivity, setMicSensitivity] = useState(settings.audio.micSensitivity);

  // Video Settings
  const [videoQuality, setVideoQuality] = useState(settings.video.quality);
  const [frameRate, setFrameRate] = useState(settings.video.frameRate);
  const [hardwareAcceleration, setHardwareAcceleration] = useState(settings.video.hardwareAcceleration);

  // Notification Settings
  const [desktopNotifications, setDesktopNotifications] = useState(settings.notifications.desktop);
  const [soundNotifications, setSoundNotifications] = useState(settings.notifications.sound);
  const [alertNotifications, setAlertNotifications] = useState(settings.notifications.alerts);
  const [chatNotifications, setChatNotifications] = useState(settings.notifications.chat);

  // Display Settings
  const [theme, setTheme] = useState(settings.display.theme);
  const [compactMode, setCompactMode] = useState(settings.display.compactMode);
  const [showTimestamps, setShowTimestamps] = useState(settings.display.showTimestamps);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Track changes
  useEffect(() => {
    const currentSettings = getCurrentSettings();
    const changed = JSON.stringify(currentSettings) !== JSON.stringify(originalSettings);
    setHasUnsavedChanges(changed);
  }, [masterVolume, notificationVolume, micSensitivity, videoQuality, frameRate,
      hardwareAcceleration, desktopNotifications, soundNotifications, alertNotifications,
      chatNotifications, theme, compactMode, showTimestamps, originalSettings]);

  const getCurrentSettings = (): UserSettings => ({
    audio: { masterVolume, notificationVolume, micSensitivity },
    video: { quality: videoQuality, frameRate, hardwareAcceleration },
    notifications: { desktop: desktopNotifications, sound: soundNotifications, alerts: alertNotifications, chat: chatNotifications },
    display: { theme, compactMode, showTimestamps },
  });

  const applySettings = useCallback((settings: UserSettings) => {
    // Apply audio settings
    try {
      if (audioService) {
        // Audio service integration would go here
        console.log('[SettingsModal] Audio settings:', settings.audio);
      }
    } catch (error) {
      console.warn('[SettingsModal] Audio service not available:', error);
    }

    // Apply theme to document
    if (settings.display.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else if (settings.display.theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }

    // Request notification permission if enabled
    if (settings.notifications.desktop && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    console.log('[SettingsModal] Settings applied:', settings);
  }, []);

  // Microsoft Pattern: Apply without closing
  const handleApply = useCallback(() => {
    const settings = getCurrentSettings();
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      applySettings(settings);
      setOriginalSettings(settings);
      setHasUnsavedChanges(false);
      addToast('Settings applied successfully', 'success');
    } catch (error) {
      console.error('[SettingsModal] Failed to save settings:', error);
      addToast('Failed to save settings', 'error');
    }
  }, [getCurrentSettings, applySettings, addToast]);

  // Microsoft Pattern: Save and close
  const handleSave = useCallback(() => {
    handleApply();
    onClose();
  }, [handleApply, onClose]);

  // Microsoft Pattern: Close with unsaved warning
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Do you want to discard them?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  const handleReset = useCallback(() => {
    if (confirm('Reset all settings to default values?')) {
      setMasterVolume(DEFAULT_SETTINGS.audio.masterVolume);
      setNotificationVolume(DEFAULT_SETTINGS.audio.notificationVolume);
      setMicSensitivity(DEFAULT_SETTINGS.audio.micSensitivity);
      setVideoQuality(DEFAULT_SETTINGS.video.quality);
      setFrameRate(DEFAULT_SETTINGS.video.frameRate);
      setHardwareAcceleration(DEFAULT_SETTINGS.video.hardwareAcceleration);
      setDesktopNotifications(DEFAULT_SETTINGS.notifications.desktop);
      setSoundNotifications(DEFAULT_SETTINGS.notifications.sound);
      setAlertNotifications(DEFAULT_SETTINGS.notifications.alerts);
      setChatNotifications(DEFAULT_SETTINGS.notifications.chat);
      setTheme(DEFAULT_SETTINGS.display.theme);
      setCompactMode(DEFAULT_SETTINGS.display.compactMode);
      setShowTimestamps(DEFAULT_SETTINGS.display.showTimestamps);
      addToast('Settings reset to defaults', 'info');
    }
  }, [addToast]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      addToast('Refreshing settings...', 'info');
      await loadSettings();
      addToast('Settings refreshed successfully', 'success');
    } catch (error) {
      console.error('[SettingsModal] Failed to refresh settings:', error);
      addToast('Failed to refresh settings', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [loadSettings, addToast]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-slate-800 rounded-lg sm:rounded-xl shadow-2xl w-full max-w-full sm:max-w-2xl md:max-w-3xl max-h-[95vh] sm:max-h-[90vh] border border-slate-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
                {(() => {
                  const I = fi?.Settings24Regular || fi?.Settings20Regular;
                  if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className="w-5 h-5 sm:w-6 sm:h-6 text-white" />; }
                  return <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />;
                })()}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Settings</h2>
                <p className="text-xs sm:text-sm text-blue-100 hidden sm:block">Customize your experience</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 sm:p-1.5 hover:bg-white/20 rounded-lg transition-colors touch-manipulation"
              title="Close"
            >
              {(() => {
                const I = fi?.Dismiss24Regular || fi?.Dismiss20Regular;
                if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className="w-5 h-5 sm:w-6 sm:h-6 text-white" />; }
                return <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />;
              })()}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Media Permissions Diagnostic */}
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                {(() => {
                  const I = fi?.Shield24Regular || fi?.Shield20Regular;
                  if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />; }
                  return <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />;
                })()}
                <h3 className="text-base sm:text-lg font-semibold text-white">Permissions</h3>
              </div>
              <MediaPermissionsDiagnostic />
            </div>
            {/* Audio Settings */}
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                {(() => {
                  const I = fi?.Speaker224Regular || fi?.Speaker220Regular || fi?.Speaker24Regular || fi?.Speaker20Regular;
                  if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />; }
                  return <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />;
                })()}
                <h3 className="text-base sm:text-lg font-semibold text-white">Audio Settings</h3>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="flex justify-between text-xs sm:text-sm text-slate-300 mb-1.5 sm:mb-2">
                    <span>Master Volume</span>
                    <span>{masterVolume}%</span>
                  </label>
                  <input
                    id="settings-master-volume"
                    name="settings-master-volume"
                    type="range"
                    min="0"
                    max="100"
                    value={masterVolume}
                    onChange={(e) => setMasterVolume(Number(e.target.value))}
                    className="w-full h-2 sm:h-2.5 accent-blue-600 touch-manipulation"
                    aria-label="Master volume"
                  />
                </div>
                <div>
                  <label className="flex justify-between text-xs sm:text-sm text-slate-300 mb-1.5 sm:mb-2">
                    <span>Notification Volume</span>
                    <span>{notificationVolume}%</span>
                  </label>
                  <input
                    id="settings-notification-volume"
                    name="settings-notification-volume"
                    type="range"
                    min="0"
                    max="100"
                    value={notificationVolume}
                    onChange={(e) => setNotificationVolume(Number(e.target.value))}
                    className="w-full h-2 sm:h-2.5 accent-blue-600 touch-manipulation"
                    aria-label="Notification volume"
                  />
                </div>
                <div>
                  <label className="flex justify-between text-xs sm:text-sm text-slate-300 mb-1.5 sm:mb-2">
                    <span>Microphone Sensitivity</span>
                    <span>{micSensitivity}%</span>
                  </label>
                  <input
                    id="settings-mic-sensitivity"
                    name="settings-mic-sensitivity"
                    type="range"
                    min="0"
                    max="100"
                    value={micSensitivity}
                    onChange={(e) => setMicSensitivity(Number(e.target.value))}
                    className="w-full h-2 sm:h-2.5 accent-blue-600 touch-manipulation"
                    aria-label="Microphone sensitivity"
                  />
                </div>
              </div>
            </div>

            {/* Video Settings */}
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                {(() => {
                  const I = fi?.Camera24Regular || fi?.Camera20Regular || fi?.Video24Regular || fi?.Video20Regular;
                  if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />; }
                  return <Video className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />;
                })()}
                <h3 className="text-base sm:text-lg font-semibold text-white">Video Settings</h3>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm text-slate-300 mb-1.5 sm:mb-2">
                    Video Quality
                  </label>
                  <select
                    value={videoQuality}
                    onChange={(e) => setVideoQuality(e.target.value as 'auto' | '1080p' | '720p' | '480p')}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 touch-manipulation"
                  >
                    <option value="auto">Auto (Recommended)</option>
                    <option value="1080p">1080p (Full HD)</option>
                    <option value="720p">720p (HD)</option>
                    <option value="480p">480p (SD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm text-slate-300 mb-1.5 sm:mb-2">
                    Frame Rate
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="frameRate"
                        checked={frameRate === 30}
                        onChange={() => setFrameRate(30)}
                        className="mr-2"
                      />
                      <span className="text-xs sm:text-sm text-white">30 FPS</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="frameRate"
                        checked={frameRate === 60}
                        onChange={() => setFrameRate(60)}
                        className="mr-2"
                      />
                      <span className="text-xs sm:text-sm text-white">60 FPS</span>
                    </label>
                  </div>
                </div>
                <label htmlFor="hardware-acceleration" className="flex items-center gap-2 sm:gap-3 cursor-pointer touch-manipulation">
                  <input
                    id="hardware-acceleration"
                    name="hardware-acceleration"
                    type="checkbox"
                    checked={hardwareAcceleration}
                    onChange={(e) => setHardwareAcceleration(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-slate-300">
                    Enable hardware acceleration
                  </span>
                </label>
              </div>
            </div>

            {/* Notification Settings */}
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                {(() => {
                  const I = fi?.Alert24Regular || fi?.Alert20Regular || fi?.AlertOff24Regular || fi?.AlertOff20Regular;
                  if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />; }
                  return <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />;
                })()}
                <h3 className="text-base sm:text-lg font-semibold text-white">Notifications</h3>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <label htmlFor="desktop-notifications" className="flex items-center gap-2 sm:gap-3 cursor-pointer touch-manipulation">
                  <input
                    id="desktop-notifications"
                    name="desktop-notifications"
                    type="checkbox"
                    checked={desktopNotifications}
                    onChange={(e) => setDesktopNotifications(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-slate-300">
                    Desktop notifications
                  </span>
                </label>
                <label htmlFor="sound-notifications" className="flex items-center gap-2 sm:gap-3 cursor-pointer touch-manipulation">
                  <input
                    id="sound-notifications"
                    name="sound-notifications"
                    type="checkbox"
                    checked={soundNotifications}
                    onChange={(e) => setSoundNotifications(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-slate-300">
                    Sound notifications
                  </span>
                </label>
                <label htmlFor="alert-notifications" className="flex items-center gap-2 sm:gap-3 cursor-pointer touch-manipulation">
                  <input
                    id="alert-notifications"
                    name="alert-notifications"
                    type="checkbox"
                    checked={alertNotifications}
                    onChange={(e) => setAlertNotifications(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-slate-300">
                    Trading alert notifications
                  </span>
                </label>
                <label htmlFor="chat-notifications" className="flex items-center gap-2 sm:gap-3 cursor-pointer touch-manipulation">
                  <input
                    id="chat-notifications"
                    name="chat-notifications"
                    type="checkbox"
                    checked={chatNotifications}
                    onChange={(e) => setChatNotifications(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-slate-300">
                    Chat message notifications
                  </span>
                </label>
              </div>
            </div>

            {/* Display Settings */}
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                {(() => {
                  const I = fi?.Desktop24Regular || fi?.Desktop20Regular || fi?.Display24Regular || fi?.Display20Regular;
                  if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />; }
                  return <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />;
                })()}
                <h3 className="text-base sm:text-lg font-semibold text-white">Display</h3>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm text-slate-300 mb-1.5 sm:mb-2">
                    Theme
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as 'dark' | 'light' | 'auto')}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 touch-manipulation"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>
                <label htmlFor="compact-mode" className="flex items-center gap-2 sm:gap-3 cursor-pointer touch-manipulation">
                  <input
                    id="compact-mode"
                    name="compact-mode"
                    type="checkbox"
                    checked={compactMode}
                    onChange={(e) => setCompactMode(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-slate-300">
                    Compact mode
                  </span>
                </label>
                <label htmlFor="show-timestamps" className="flex items-center gap-2 sm:gap-3 cursor-pointer touch-manipulation">
                  <input
                    id="show-timestamps"
                    name="show-timestamps"
                    type="checkbox"
                    checked={showTimestamps}
                    onChange={(e) => setShowTimestamps(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-slate-300">
                    Show timestamps in chat
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Environment */}
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-slate-700">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            {(() => {
              const I = fi?.Desktop24Regular || fi?.Desktop20Regular;
              if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />; }
              return <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />;
            })()}
            <h3 className="text-base sm:text-lg font-semibold text-white">Environment</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="px-3 py-2 bg-slate-900 rounded-lg border border-slate-700">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 mb-1">Protocol</span>
                <span className="text-sm text-white font-mono">{window.location.protocol}</span>
              </div>
            </div>
            <div className="px-3 py-2 bg-slate-900 rounded-lg border border-slate-700">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 mb-1">Host</span>
                <span className="text-sm text-white font-mono">{window.location.hostname}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Microsoft Windows Style */}
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-slate-900/50 border-t border-slate-700">
          {hasUnsavedChanges && (
            <div className="mb-3 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-500" />
              <span className="text-xs sm:text-sm text-yellow-200">You have unsaved changes</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between">
            <div className="flex gap-2 order-2 sm:order-1">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-600 font-medium rounded-lg transition-colors touch-manipulation disabled:opacity-50"
              >
                {(() => {
                  const I = fi?.ArrowClockwise24Regular || fi?.ArrowClockwise20Regular || fi?.ArrowSync24Regular || fi?.ArrowSync20Regular;
                  if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />; }
                  return <RefreshCw className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />;
                })()}
                <span className="text-white">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-slate-700 hover:bg-slate-600 active:bg-slate-500 font-medium rounded-lg transition-colors touch-manipulation"
              >
                {(() => {
                  const I = fi?.ArrowCounterclockwise24Regular || fi?.ArrowCounterclockwise20Regular || fi?.ArrowReset24Regular || fi?.ArrowReset20Regular;
                  if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className="w-4 h-4 text-white" />; }
                  return <RotateCcw className="w-4 h-4 text-white" />;
                })()}
                <span className="text-white">Reset to Defaults</span>
              </button>
            </div>
            <div className="flex gap-2 sm:gap-3 order-1 sm:order-2">
              <button
                onClick={handleClose}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base bg-slate-700 hover:bg-slate-600 active:bg-slate-500 font-medium rounded-lg transition-colors touch-manipulation"
              >
                <span className="text-white">Cancel</span>
              </button>
              <button
                onClick={handleApply}
                disabled={!hasUnsavedChanges}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-slate-600 font-medium rounded-lg transition-colors touch-manipulation disabled:opacity-50"
              >
                {(() => {
                  const I = fi?.Checkmark24Regular || fi?.Checkmark20Regular;
                  if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className="w-4 h-4 text-white" />; }
                  return <Check className="w-4 h-4 text-white" />;
                })()}
                <span className="text-white">Apply</span>
              </button>
              <button
                onClick={handleSave}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 active:bg-blue-800 font-medium rounded-lg transition-colors touch-manipulation"
              >
                {(() => {
                  const I = fi?.Save24Regular || fi?.Save20Regular;
                  if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className="w-4 h-4 text-white" />; }
                  return <Save className="w-4 h-4 text-white" />;
                })()}
                <span className="text-white">OK</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}