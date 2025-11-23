import { Video, VideoOff, AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cameraPermissions } from '../../lib/cameraPermissions';
// Fixed: 2025-10-24 - React component type fixes
// Microsoft TypeScript standards - proper ref and element types


// Fixed: 2025-10-24 - Emergency null/undefined fixes for production
// Microsoft TypeScript standards applied - null → undefined, using optional types


// Fixed: 2025-01-24 - Eradicated 3 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types


interface CameraPreviewProps {
  deviceId: string | undefined;
}

export function CameraPreview({ deviceId }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (!deviceId) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(undefined);
      }
      return;
    }

    const startCamera = async () => {
      setIsLoading(true);
      setError(undefined);
      setPermissionDenied(false);

      try {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: { exact: deviceId },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err) {
        console.error('Failed to start camera preview:', err);

        if (err instanceof Error && err.name === 'NotAllowedError') {
          setPermissionDenied(true);
          setError('Camera permission denied');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to access camera');
        }
      } finally {
        setIsLoading(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [deviceId]);

  if (!deviceId) {
    return (
      <div className="w-full aspect-video bg-slate-700 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <VideoOff className="w-12 h-12 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No camera selected</p>
        </div>
      </div>
    );
  }

  if (error) {
    if (permissionDenied) {
      const browser = cameraPermissions.getBrowserName();
      const instructions = cameraPermissions.getBrowserInstructions(browser);
      return (
        <div className="w-full aspect-video bg-slate-700 rounded-lg flex items-center justify-center border-2 border-yellow-500/50">
          <div className="text-center px-6 py-4 max-w-md">
            <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <p className="text-sm text-yellow-400 font-semibold mb-2">Permission Required</p>
            <p className="text-xs text-slate-300 mb-3">
              Camera access is blocked. {instructions}
            </p>
            <p className="text-xs text-slate-400">
              After granting permission, refresh this page or close and reopen settings.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full aspect-video bg-slate-700 rounded-lg flex items-center justify-center border-2 border-red-500/50">
        <div className="text-center px-4">
          <VideoOff className="w-12 h-12 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-400 mb-1">Camera Error</p>
          <p className="text-xs text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-slate-900 rounded-lg overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="flex items-center gap-2">
            <Video className="w-6 h-6 text-blue-400 animate-pulse" />
            <span className="text-sm text-slate-400">Loading camera...</span>
          </div>
        </div>
      )}
      <video
        ref={videoRef as React.RefObject<HTMLVideoElement>}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
    </div>
  );
}
