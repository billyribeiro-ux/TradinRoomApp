// src/components/CameraPermissionDeniedModal.tsx
/* ORIGINAL CODE START — reason: Unused imports causing TS6133 warnings
   Date: 2025-01-21 21:00:00
*/
// import { Video, AlertTriangle, RefreshCw, X, ExternalLink } from 'lucide-react';
/* ORIGINAL CODE END */

// FIX NOTE – TS6133 unused variable corrected: Comment out unused imports
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const Video  = undefined; /* UNUSED IMPORT – preserved for reference */
// eslint-disable-next-line @typescript-eslint/no-unused-vars  
// const ExternalLink  = undefined; /* UNUSED IMPORT – preserved for reference */
import { cameraPermissions } from '../../lib/cameraPermissions';
// Fixed: 2025-01-24 - Eradicated 2 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types


interface CameraPermissionDeniedModalProps {
  onClose: () => void;
  onRetry: () => void;
}

export function CameraPermissionDeniedModal({
  onClose,
  onRetry,
}: CameraPermissionDeniedModalProps) {
  const browser = cameraPermissions.getBrowserName();
  const browserInstructions = cameraPermissions.getBrowserInstructions(browser);
  const secureContext = cameraPermissions.checkSecureContext();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Camera Access Denied</h2>
              <p className="text-sm text-red-100">Permission was blocked</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <X className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-200 font-medium mb-1">Camera Access Blocked</p>
              <p className="text-xs text-red-300/90">
                {!secureContext.isSecure
                  ? 'Camera access requires a secure HTTPS connection. Please use HTTPS to enable camera features.'
                  : 'Your browser or system settings have blocked camera access. You\'ll need to update your permissions to use camera features.'}
              </p>
            </div>
          </div>

          {!secureContext.isSecure ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-300 font-medium">To fix this issue:</p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>Access this site via HTTPS instead of HTTP</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>Or use localhost for development</span>
                </li>
              </ul>
              <div className="bg-slate-700/50 rounded p-2 mt-2">
                <p className="text-xs text-slate-400 font-mono">Current: {secureContext.protocol}//{window.location.host}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-300 font-medium">How to fix this ({browser}):</p>
              <div className="p-3 bg-slate-700/30 rounded-lg">
                <p className="text-sm text-slate-300">{browserInstructions}</p>
              </div>
              <ol className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">1.</span>
                  <span>Look for the camera/lock icon in your browser's address bar</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">2.</span>
                  <span>Click it and change camera permissions to "Allow"</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">3.</span>
                  <span>Click "Try Again" below to request permission again</span>
                </li>
              </ol>
            </div>
          )}

          {secureContext.isSecure && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-xs text-amber-200">
                <strong className="text-amber-100">Still having issues?</strong> Check your operating system's privacy settings to ensure the browser has permission to access the camera.
              </p>
            </div>
          )}

          <div className="pt-2 space-y-3">
            <button
              onClick={onRetry}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Try Again</span>
            </button>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-slate-500 text-center">
            Camera access is required for video features in the trading room
          </p>
        </div>
      </div>
    </div>
  );
}