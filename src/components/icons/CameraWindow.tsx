// src/components/CameraWindow.tsx
import { X, Minimize2, Maximize2, Video, Mic, MicOff } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// Vendor-prefixed CSS properties - using type assertions for non-standard properties

interface CameraWindowProps {
  stream: MediaStream | undefined;
  isActive: boolean;
  onClose: () => void;
}

export function CameraWindow({ stream, isActive, onClose }: CameraWindowProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
    
    return () => {
      // Cleanup: video element will be unmounted, no need to clear srcObject
      if (videoRef.current && stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Handle mute/unmute
  useEffect(() => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [stream, isMuted]);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start dragging if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) return;
    
    e.preventDefault();
    
    // Microsoft pattern: Prevent text selection during drag
    const bodyStyle = document.body.style as CSSStyleDeclaration & {
      userSelect: string;
      webkitUserSelect: string;
      mozUserSelect: string;
      msUserSelect: string;
    };
    bodyStyle.userSelect = 'none';
    bodyStyle.webkitUserSelect = 'none'; // Safari/Chrome
    bodyStyle.mozUserSelect = 'none';    // Firefox
    bodyStyle.msUserSelect = 'none';     // IE/Edge
    
    try {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    } catch (error) {
      // Ensure cleanup runs even if state update fails
      bodyStyle.userSelect = '';
      bodyStyle.webkitUserSelect = '';
      bodyStyle.mozUserSelect = '';
      bodyStyle.msUserSelect = '';
      throw error;
    }
  };

  useEffect(() => {
    if (!isDragging) return;
    
    let rafId: number | null = null;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      // Cancel previous frame to prevent jank
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      rafId = requestAnimationFrame(() => {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        // Keep window within viewport bounds
        const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 320);
        const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 240);

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      });
    };

    const handleMouseUp = () => {
      try {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      } catch {
        // Ignore rAF cancellation errors
      }
      
      setIsDragging(false);
    };
    
    const handleMouseLeave = () => {
      // Cancel drag if mouse leaves window
      try {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      } catch {
        // Ignore rAF cancellation errors
      }
      
      setIsDragging(false);
    };

    try {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { once: true });
      document.addEventListener('mouseleave', handleMouseLeave, { once: true });
    } catch (error) {
      // Ensure cleanup runs even if event attachment fails
      handleMouseUp();
      throw error;
    }

    return () => {
      try {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);
        
        // Reset body styles
        const bodyStyle = document.body.style as CSSStyleDeclaration & {
          userSelect: string;
          webkitUserSelect: string;
          mozUserSelect: string;
          msUserSelect: string;
        };
        bodyStyle.userSelect = '';
        bodyStyle.webkitUserSelect = '';
        bodyStyle.mozUserSelect = '';
        bodyStyle.msUserSelect = '';
        
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [isDragging, dragStart]);

  if (!isActive || !stream) {
    return undefined;
  }

  return (
    <div
      ref={containerRef}
      className={`fixed z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl transition-all ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      } ${isMinimized ? 'w-48' : 'w-80'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-medium text-white">Your Camera</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <MicOff className="w-3 h-3 text-red-400" />
            ) : (
              <Mic className="w-3 h-3 text-slate-400" />
            )}
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? (
              <Maximize2 className="w-3 h-3 text-slate-400" />
            ) : (
              <Minimize2 className="w-3 h-3 text-slate-400" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-600/20 rounded transition-colors group"
            title="Close camera"
          >
            <X className="w-3 h-3 text-slate-400 group-hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Video Preview */}
      {!isMinimized && (
        <div className="relative bg-black rounded-b-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-60 object-cover"
          />
          
          {/* Status Overlay */}
          <div className="absolute bottom-2 left-2 flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-red-600/90 backdrop-blur-sm rounded text-white">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-xs font-medium">Live</span>
            </div>
            {isMuted && (
              <div className="px-2 py-1 bg-slate-800/90 backdrop-blur-sm rounded">
                <MicOff className="w-3 h-3 text-red-400" />
              </div>
            )}
          </div>

          {/* Video Settings Info */}
          {stream && (
            <div className="absolute top-2 right-2">
              <div className="px-2 py-1 bg-slate-800/90 backdrop-blur-sm rounded">
                <span className="text-xs text-slate-300">
                  {stream.getVideoTracks()[0]?.getSettings().width || 0} × {stream.getVideoTracks()[0]?.getSettings().height || 0}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Minimized State */}
      {isMinimized && (
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            <span className="text-xs text-slate-400">Camera active</span>
          </div>
          {isMuted && <MicOff className="w-3 h-3 text-red-400" />}
        </div>
      )}
    </div>
  );
}