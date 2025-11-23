import { Video, Mic, CheckCircle, XCircle, AlertCircle, Lock } from 'lucide-react';
import { useFluentIcons } from '../../icons/useFluentIcons';
import { useState, useEffect } from 'react';

import { cameraPermissions } from '../../lib/cameraPermissions';
import { microphonePermissions } from '../../lib/microphonePermissions';

interface DiagnosticInfo {
  camera: {
    supported: boolean;
    secureContext: boolean;
    status: string;
    error?: string;
  };
  microphone: {
    supported: boolean;
    secureContext: boolean;
    status: string;
    error?: string;
  };
  browser: string;
  protocol: string;
  hostname: string;
}

export function MediaPermissionsDiagnostic() {
  const fi = useFluentIcons();
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo | undefined>(undefined);
  const [isChecking, setIsChecking] = useState(false);

  const runDiagnostics = async () => {
    setIsChecking(true);

    try {
      const cameraStatus = await cameraPermissions.checkPermissionStatus();
      const micStatus = await microphonePermissions.checkPermissionStatus();
      const secureContext = cameraPermissions.checkSecureContext();

      setDiagnostics({
        camera: {
          supported: cameraStatus.isSupported,
          secureContext: cameraStatus.isSecureContext,
          status: cameraStatus.status,
          error: !cameraStatus.isSupported ? 'Not supported' : undefined,
        },
        microphone: {
          supported: micStatus.isSupported,
          secureContext: micStatus.isSecureContext,
          status: micStatus.status,
          error: !micStatus.isSupported ? 'Not supported' : undefined,
        },
        browser: cameraPermissions.getBrowserName(),
        protocol: secureContext.protocol,
        hostname: window.location.hostname,
      });
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  if (!diagnostics) {
    return undefined;
  }

  const StatusIcon = ({ status, supported }: { status: string; supported: boolean }) => {
    if (!supported) {
      const I = fi?.DismissCircle24Regular || fi?.DismissCircle20Regular;
      if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className="w-5 h-5 text-red-400" />; }
      return <XCircle className="w-5 h-5 text-red-400" />;
    }
    if (status === 'granted') {
      const I = fi?.CheckmarkCircle24Regular || fi?.CheckmarkCircle20Regular;
      if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className="w-5 h-5 text-green-400" />; }
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
    if (status === 'denied') {
      const I = fi?.DismissCircle24Regular || fi?.DismissCircle20Regular;
      if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className="w-5 h-5 text-red-400" />; }
      return <XCircle className="w-5 h-5 text-red-400" />;
    }
    const I = fi?.Warning24Regular || fi?.Warning20Regular;
    if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className="w-5 h-5 text-yellow-400" />; }
    return <AlertCircle className="w-5 h-5 text-yellow-400" />;
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Media Permissions Status</h3>
        <button
          onClick={runDiagnostics}
          disabled={isChecking}
          className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded transition-colors"
        >
          {isChecking ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg">
          {(() => {
            const I = fi?.Camera24Regular || fi?.Camera20Regular || fi?.Video24Regular || fi?.Video20Regular;
            if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className="w-5 h-5 text-blue-400 mt-0.5" />; }
            return <Video className="w-5 h-5 text-blue-400 mt-0.5" />;
          })()}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">Camera</span>
              <StatusIcon status={diagnostics.camera.status} supported={diagnostics.camera.supported} />
            </div>
            <p className="text-xs text-slate-400">
              Status: {diagnostics.camera.status}
              {diagnostics.camera.error && ` - ${diagnostics.camera.error}`}
            </p>
            {!diagnostics.camera.secureContext && (
              <p className="text-xs text-red-400 mt-1">⚠️ Requires HTTPS</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg">
          {(() => {
            const I = fi?.Mic24Regular || fi?.Mic20Regular;
            if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className="w-5 h-5 text-green-400 mt-0.5" />; }
            return <Mic className="w-5 h-5 text-green-400 mt-0.5" />;
          })()}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">Microphone</span>
              <StatusIcon status={diagnostics.microphone.status} supported={diagnostics.microphone.supported} />
            </div>
            <p className="text-xs text-slate-400">
              Status: {diagnostics.microphone.status}
              {diagnostics.microphone.error && ` - ${diagnostics.microphone.error}`}
            </p>
            {!diagnostics.microphone.secureContext && (
              <p className="text-xs text-red-400 mt-1">⚠️ Requires HTTPS</p>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-700">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Environment</h4>
          <div className="space-y-1 text-xs text-slate-400">
            <p>Browser: <span className="text-white capitalize">{diagnostics.browser}</span></p>
            <p>Protocol: <span className="text-white">{diagnostics.protocol}</span></p>
            <p>Host: <span className="text-white">{diagnostics.hostname}</span></p>
            {diagnostics.protocol !== 'https:' && diagnostics.hostname !== 'localhost' && (
              <div className="flex items-start gap-2 mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                {(() => {
                  const I = fi?.LockClosed24Regular || fi?.LockClosed20Regular || fi?.LockShield24Regular || fi?.LockShield20Regular;
                  if (I) { const C = I as React.ComponentType<Record<string, unknown>>; return <C className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />; }
                  return <Lock className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />;
                })()}
                <p className="text-yellow-300">Camera and microphone require HTTPS or localhost</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
