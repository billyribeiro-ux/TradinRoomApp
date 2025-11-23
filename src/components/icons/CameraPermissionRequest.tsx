// src/components/CameraPermissionRequestModal.tsx
import { Video, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';

import { cameraPermissions } from '../../lib/cameraPermissions';
// Fixed: 2025-01-24 - Eradicated 1 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types


interface CameraPermissionRequestModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onDenied: () => void;
}

export function CameraPermissionRequestModal({
  onClose,
  onSuccess,
  onDenied,
}: CameraPermissionRequestModalProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    setError(undefined);

    console.log('[CameraPermissionRequestModal] Requesting camera permission...');

    try {
      const result = await cameraPermissions.requestCameraPermission();
      console.log('[CameraPermissionRequestModal] Permission result:', result);

      if (result) {
        console.log('[CameraPermissionRequestModal] Permission granted, calling onSuccess');
        onSuccess();
      } else {
        console.log('[CameraPermissionRequestModal] Permission denied, calling onDenied');
        onDenied();
      }
    } catch (err) {
      console.error('[CameraPermissionRequestModal] Error requesting permission:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to request camera permission';
      setError(errorMessage);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Camera Access Required</h2>
              <p className="text-sm text-blue-100">Enable your camera for video features</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <Lock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-blue-200 font-medium mb-1">Your Privacy Matters</p>
              <p className="text-xs text-blue-300/90">
                We'll only access your camera when you explicitly enable it. You can turn it off anytime.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-slate-300 font-medium">What you'll be able to do:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Share your video with other participants</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Use camera in the trading room</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Preview your camera in settings</span>
              </li>
            </ul>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <div className="pt-2 space-y-3">
            <button
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-lg"
            >
              {isRequesting ? 'Requesting Permission...' : 'Allow Camera Access'}
            </button>

            <button
              onClick={onClose}
              disabled={isRequesting}
              className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 disabled:cursor-not-allowed text-slate-300 font-medium rounded-lg transition-colors"
            >
              Not Now
            </button>
          </div>

          <p className="text-xs text-slate-500 text-center">
            A browser prompt will appear asking for camera permission
          </p>
        </div>
      </div>
    </div>
  );
}