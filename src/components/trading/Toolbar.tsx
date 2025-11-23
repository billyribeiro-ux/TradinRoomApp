/**
 * Toolbar Widget - Microsoft Enterprise Standards
 * =========================================================
 * Media controls toolbar with memoization for performance
 */

import { memo } from 'react';

import type { ToolbarProps } from './types';

export const Toolbar = memo<ToolbarProps>(function Toolbar({
  isMicEnabled,
  isCameraEnabled,
  isScreenSharing,
  isRecording,
  canRecord,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleRecording,
  onOpenSettings,
  onOpenWhiteboard,
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-slate-800 border-b border-slate-700">
      {/* Microphone Toggle */}
      <button
        onClick={() => void onToggleMic()}
        className={`px-4 py-2 rounded transition-colors ${
          isMicEnabled
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
        aria-label={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
        title={isMicEnabled ? 'Mute (M)' : 'Unmute (M)'}
      >
        {isMicEnabled ? '🎤 Mic On' : '🔇 Mic Off'}
      </button>

      {/* Camera Toggle */}
      <button
        onClick={() => void onToggleCamera()}
        className={`px-4 py-2 rounded transition-colors ${
          isCameraEnabled
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gray-600 hover:bg-gray-700 text-white'
        }`}
        aria-label={isCameraEnabled ? 'Stop camera' : 'Start camera'}
        title={isCameraEnabled ? 'Stop Camera (V)' : 'Start Camera (V)'}
      >
        {isCameraEnabled ? '📹 Camera On' : '📷 Camera Off'}
      </button>

      {/* Screen Share Toggle */}
      <button
        onClick={() => void onToggleScreenShare()}
        className={`px-4 py-2 rounded transition-colors ${
          isScreenSharing
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-600 hover:bg-gray-700 text-white'
        }`}
        aria-label={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        title={isScreenSharing ? 'Stop Sharing (S)' : 'Share Screen (S)'}
      >
        {isScreenSharing ? '🖥️ Sharing' : '📺 Share'}
      </button>

      {/* Recording Toggle - Only if user has permission */}
      {canRecord && (
        <button
          onClick={() => void onToggleRecording()}
          className={`px-4 py-2 rounded transition-colors ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          title={isRecording ? 'Stop Recording (R)' : 'Start Recording (R)'}
        >
          {isRecording ? '⏺️ Recording' : '⏺️ Record'}
        </button>
      )}

      {/* Whiteboard Button */}
      <button
        onClick={onOpenWhiteboard}
        className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white transition-colors"
        aria-label="Open whiteboard"
        title="Whiteboard (W)"
      >
        ✏️ Whiteboard
      </button>

      {/* Settings Button */}
      <button
        onClick={onOpenSettings}
        className="ml-auto px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white transition-colors"
        aria-label="Open settings"
        title="Settings (,)"
      >
        ⚙️ Settings
      </button>
    </div>
  );
});
