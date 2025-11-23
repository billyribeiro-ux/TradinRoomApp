import React, { useEffect, useRef, useState } from 'react';

import { shareService } from '../../sharing/shareService';
import type { Share } from '../../sharing/shareStore';
import { shareStore } from '../../sharing/shareStore';

import { MicToggle } from './MicToggle';
import { ResolutionMenu } from './ResolutionMenu';

export interface ShareDashboardProps { className?: string; tileClassName?: string; controlsClassName?: string; onError?: (err: unknown) => void; }

export const ShareDashboard: React.FC<ShareDashboardProps> = ({ className, tileClassName, controlsClassName, onError }) => {
  const [state, setState] = useState(shareStore.get());
  useEffect(() => shareStore.subscribe(setState), []);
  const shares = state.shares;

  async function onTileClick(s: Share) { try { await shareService.makePrimary(s.id); } catch (e) { onError?.(e); } }
  async function stopShare(id: string) { try { await shareService.stopShare(id); } catch (e) { onError?.(e); } }
  const showGlobalEnd = shares.length === 1;

  return (
    <div className={`${className} flex flex-col`} role="region" aria-label="Screen shares">
      <div role="list" aria-label="Share tiles" className="flex-1 flex flex-col min-h-0">
        {shares.map(s => (
          <ShareTile key={s.id} share={s} className={tileClassName} controlsClassName={controlsClassName} onClick={() => onTileClick(s)} onStop={() => stopShare(s.id)} onError={onError} />
        ))}
      </div>
      {showGlobalEnd && (
        <div className="p-4 flex items-center justify-center gap-4">
          <DoubleConfirmButton ariaLabel="End screen share" label="End screen share" danger onConfirm={() => stopShare(shares[0].id)} />
          <MicToggle />
        </div>
      )}
    </div>
  );
};

const ARMED_WINDOW_MS = 1500;

const ShareTile: React.FC<{ share: Share; className?: string; controlsClassName?: string; onClick: () => void; onStop: () => void; onError?: (e: unknown) => void; }> = ({ share, className, controlsClassName, onClick, onStop, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [maximized, setMaximized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const currentStreamRef = useRef<MediaStream | null>(null);
  
  // Microsoft Pattern: Optimized video stream handling - NO FLICKER
  useEffect(() => { 
    const v = videoRef.current; 
    if (!v || !share.stream) return;
    
    // Only update if stream actually changed (prevent unnecessary reloads)
    if (currentStreamRef.current === share.stream) return;
    
    setIsLoading(true);
    currentStreamRef.current = share.stream;
    
    // Set video properties BEFORE setting srcObject
    v.muted = true; 
    v.playsInline = true;
    v.autoplay = true;
    
    // Use requestAnimationFrame for smooth transition
    const rafId = requestAnimationFrame(() => {
      if (!v) return;
      v.srcObject = share.stream ?? null;
      v.play()
        .then(() => setIsLoading(false))
        .catch((err) => {
          console.error('Video play failed:', err);
          setIsLoading(false);
          onError?.(err);
        });
    });
    
    // Cleanup: cancel pending animation frame and clear video on unmount
    return () => {
      cancelAnimationFrame(rafId);
      if (v && !share.stream) {
        v.srcObject = null;
        currentStreamRef.current = null;
      }
    };
  }, [share.stream, share, onError]);
  async function changeRes(res: { width?: number; height?: number; frameRate?: number }) { try { await shareService.setResolution(share.id, res); } catch (e) { onError?.(e); } }
  function togglePause() { shareService.togglePause(share.id); }
  return (
    <div className={`${className} flex flex-col`} role="listitem" aria-label={share.label}>
      <div 
        onClick={onClick} 
        role="button" 
        aria-label={`Make ${share.label} primary`} 
        tabIndex={0}
        className="flex-1 flex items-center justify-center bg-black min-h-0 cursor-pointer relative"
      >
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <video 
          ref={videoRef} 
          className={`w-full h-full object-contain max-w-full max-h-full transition-opacity duration-200 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
        />
        {share.isPaused && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-l-[30px] border-l-white border-y-[20px] border-y-transparent ml-2" />
            </div>
          </div>
        )}
      </div>
      <div className={controlsClassName} aria-label="Tile controls">
        <span aria-live="polite" className="text-xs font-medium">{share.isPrimary ? 'Primary' : 'Secondary'}</span>
        <button 
          onClick={() => setMaximized(m => !m)} 
          aria-label={maximized ? 'Restore' : 'Maximize'}
          className="px-3 py-1 rounded hover:bg-gray-700 transition-colors text-sm"
        >
          {maximized ? 'Restore' : 'Maximize'}
        </button>
        <ResolutionMenu onSelect={changeRes} />
        <button 
          onClick={togglePause} 
          aria-pressed={share.isPaused} 
          aria-label="Pause or resume video"
          className="px-3 py-1 rounded hover:bg-gray-700 transition-colors text-sm"
        >
          {share.isPaused ? 'Resume' : 'Pause'}
        </button>
        <DoubleConfirmButton ariaLabel="Stop this share" label="Stop" danger onConfirm={onStop} />
      </div>
    </div>
  );
};

const DoubleConfirmButton: React.FC<{ label: string; ariaLabel: string; danger?: boolean; onConfirm: () => void; }> = ({ label, ariaLabel, danger, onConfirm }) => {
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), ARMED_WINDOW_MS); return () => clearTimeout(t); }, [armed]);
  return (
    <button 
      aria-label={ariaLabel} 
      onClick={() => (armed ? onConfirm() : setArmed(true))} 
      aria-pressed={armed} 
      title={armed ? 'Click again to confirm' : undefined} 
      className={`px-3 py-1 rounded transition-colors text-sm ${
        danger 
          ? armed ? 'bg-red-600 text-white' : 'text-red-400 hover:bg-red-900/50' 
          : 'hover:bg-gray-700'
      }`}
    >
      {label}{armed ? ' (confirm)' : ''}
    </button>
  );
};


