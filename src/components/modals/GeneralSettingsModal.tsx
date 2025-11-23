// ============================================================================
// GENERAL SETTINGS MODAL - Microsoft Enterprise Standard
// ============================================================================
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface GeneralSettingsModalProps {
  onClose: () => void;
}

type ColorTheme = 'light' | 'dark';
type RoomLayout = 'left' | 'top' | 'right' | 'bottom';

interface SettingsState {
  colorTheme: ColorTheme;
  roomLayout: RoomLayout;
  pmLogsRight: boolean;
  textColor: string;
  usernameColor: string;
  backgroundColor: string;
  tickerColor: string;
  textSize: number;
  dontDisturb: boolean;
  startRecordingSound: boolean;
  stopRecordingSound: boolean;
  recordingPreview: boolean;
  videoEnabled: boolean;
}

const DEFAULT_SETTINGS: SettingsState = {
  colorTheme: 'light',
  roomLayout: 'left',
  pmLogsRight: false,
  textColor: '#000000',
  usernameColor: '#0066cc',
  backgroundColor: '#ffffff',
  tickerColor: '#333333',
  textSize: 13,
  dontDisturb: false,
  startRecordingSound: true,
  stopRecordingSound: true,
  recordingPreview: true,
  videoEnabled: true,
};

export function GeneralSettingsModal({ onClose }: GeneralSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'app' | 'alert' | 'chat' | 'presenter'>('app');
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('general_settings');
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem('general_settings', JSON.stringify(settings));
      window.dispatchEvent(new CustomEvent('settings-updated', { detail: settings }));
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const handleRemoveWindows = () => {
    console.log('Removing webcam/screen preview windows');
  };

  const handleEditInfo = () => {
    console.log('Edit my info and avatar');
  };

  const handleGetToken = () => {
    console.log('Get my token');
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700">
          <h2 className="text-lg sm:text-xl font-bold text-white">General Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 border-b border-slate-700 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('app')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'app'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            App Settings
          </button>
          <button
            onClick={() => setActiveTab('alert')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'alert'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Alert Settings
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Chat Settings
          </button>
          <button
            onClick={() => setActiveTab('presenter')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'presenter'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Presenter Settings
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Color Theme */}
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              🎨 Choose Color Theme:
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="colorTheme"
                  checked={settings.colorTheme === 'light'}
                  onChange={() => setSettings({ ...settings, colorTheme: 'light' })}
                  className="w-5 h-5 text-green-600 accent-green-600"
                />
                <span className="text-white font-medium">LIGHT THEME</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="colorTheme"
                  checked={settings.colorTheme === 'dark'}
                  onChange={() => setSettings({ ...settings, colorTheme: 'dark' })}
                  className="w-5 h-5 text-slate-400 accent-slate-400"
                />
                <span className="text-slate-300">Dark Theme</span>
              </label>
            </div>
          </div>

          {/* Room Layout */}
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              📐 Room Layout:
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="roomLayout"
                  checked={settings.roomLayout === 'left'}
                  onChange={() => setSettings({ ...settings, roomLayout: 'left' })}
                  className="w-5 h-5 text-green-600 accent-green-600"
                />
                <span className="text-white font-medium">CHAT AND ALERTS LEFT</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="roomLayout"
                  checked={settings.roomLayout === 'top'}
                  onChange={() => setSettings({ ...settings, roomLayout: 'top' })}
                  className="w-5 h-5 text-slate-400 accent-slate-400"
                />
                <span className="text-slate-300">Chat and Alerts top</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="roomLayout"
                  checked={settings.roomLayout === 'right'}
                  onChange={() => setSettings({ ...settings, roomLayout: 'right' })}
                  className="w-5 h-5 text-slate-400 accent-slate-400"
                />
                <span className="text-slate-300">Chat and Alerts right</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="roomLayout"
                  checked={settings.roomLayout === 'bottom'}
                  onChange={() => setSettings({ ...settings, roomLayout: 'bottom' })}
                  className="w-5 h-5 text-slate-400 accent-slate-400"
                />
                <span className="text-slate-300">Chat and Alerts bottom</span>
              </label>
            </div>
          </div>

          {/* PM Logs */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                checked={settings.pmLogsRight}
                onChange={() => setSettings({ ...settings, pmLogsRight: !settings.pmLogsRight })}
                className="w-5 h-5 text-slate-400 accent-slate-400"
              />
              <span className="text-slate-300">PM logs on the right</span>
            </label>
          </div>

          {/* Colors & Size */}
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              🎨 Colors & Size:
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  id="text-color"
                  name="text-color"
                  type="color"
                  value={settings.textColor}
                  onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                  className="w-12 h-8 rounded border-2 border-slate-600 cursor-pointer"
                  aria-label="Text color"
                />
                <span className="text-slate-300">Text Color</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="username-color"
                  name="username-color"
                  type="color"
                  value={settings.usernameColor}
                  onChange={(e) => setSettings({ ...settings, usernameColor: e.target.value })}
                  className="w-12 h-8 rounded border-2 border-slate-600 cursor-pointer"
                  aria-label="Username color"
                />
                <span className="text-slate-300">Username Color</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="background-color"
                  name="background-color"
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                  className="w-12 h-8 rounded border-2 border-slate-600 cursor-pointer"
                  aria-label="Background color"
                />
                <span className="text-slate-300">Background Color</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="ticker-color"
                  name="ticker-color"
                  type="color"
                  value={settings.tickerColor}
                  onChange={(e) => setSettings({ ...settings, tickerColor: e.target.value })}
                  className="w-12 h-8 rounded border-2 border-slate-600 cursor-pointer"
                  aria-label="Ticker color"
                />
                <span className="text-slate-300">Ticker Color</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="text-size"
                  name="text-size"
                  type="number"
                  value={settings.textSize}
                  onChange={(e) => setSettings({ ...settings, textSize: parseInt(e.target.value) || 13 })}
                  min="8"
                  max="24"
                  className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white"
                  aria-label="Text size"
                />
                <span className="text-slate-300">Text Size</span>
              </div>
            </div>
          </div>

          {/* Do Not Disturb */}
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              🔕 Do not disturb:
            </h3>
            <div className="space-y-2">
              <label htmlFor="dont-disturb" className="flex items-center gap-3 cursor-pointer">
                <input
                  id="dont-disturb"
                  name="dont-disturb"
                  type="checkbox"
                  checked={settings.dontDisturb}
                  onChange={(e) => setSettings({ ...settings, dontDisturb: e.target.checked })}
                  className="w-5 h-5 rounded accent-slate-400"
                />
                <span className="text-slate-300">Don't Disturb</span>
              </label>
              <label htmlFor="start-recording-sound" className="flex items-center gap-3 cursor-pointer">
                <input
                  id="start-recording-sound"
                  name="start-recording-sound"
                  type="checkbox"
                  checked={settings.startRecordingSound}
                  onChange={(e) => setSettings({ ...settings, startRecordingSound: e.target.checked })}
                  className="w-5 h-5 rounded accent-green-600"
                />
                <span className="text-white font-medium">START RECORDING SOUND ON</span>
              </label>
              <label htmlFor="stop-recording-sound" className="flex items-center gap-3 cursor-pointer">
                <input
                  id="stop-recording-sound"
                  name="stop-recording-sound"
                  type="checkbox"
                  checked={settings.stopRecordingSound}
                  onChange={(e) => setSettings({ ...settings, stopRecordingSound: e.target.checked })}
                  className="w-5 h-5 rounded accent-green-600"
                />
                <span className="text-white font-medium">STOP RECORDING SOUND ON</span>
              </label>
              <label htmlFor="recording-preview" className="flex items-center gap-3 cursor-pointer">
                <input
                  id="recording-preview"
                  name="recording-preview"
                  type="checkbox"
                  checked={settings.recordingPreview}
                  onChange={(e) => setSettings({ ...settings, recordingPreview: e.target.checked })}
                  className="w-5 h-5 rounded accent-green-600"
                />
                <span className="text-white font-medium">RECORDING PREVIEW ON</span>
              </label>
            </div>
          </div>

          {/* Video */}
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              💬 Disable/Enable Video:
            </h3>
            <label htmlFor="video-enabled" className="flex items-center gap-3 cursor-pointer">
              <input
                id="video-enabled"
                name="video-enabled"
                type="checkbox"
                checked={settings.videoEnabled}
                onChange={(e) => setSettings({ ...settings, videoEnabled: e.target.checked })}
                className="w-5 h-5 rounded accent-green-600"
              />
              <span className="text-white font-medium">VIDEO ENABLED</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <button
              onClick={handleRemoveWindows}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Remove webcam/screenpreview windows
            </button>
            <button
              onClick={handleEditInfo}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              👤 Edit my Info and Avatar
            </button>
            <button
              onClick={handleGetToken}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              👤 Get my token
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700 bg-slate-900/50">
          <button
            onClick={handleReset}
            className="px-6 py-2 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-semibold rounded-lg transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
