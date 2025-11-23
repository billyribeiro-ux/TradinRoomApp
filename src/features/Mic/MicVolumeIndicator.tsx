// src/components/MicVolumeIndicator.tsx
import { useEffect, useRef, useState } from 'react';

interface MicVolumeIndicatorProps {
  mediaStream: MediaStream | undefined;
  isActive: boolean;
}

export function MicVolumeIndicator({ mediaStream, isActive }: MicVolumeIndicatorProps) {
  const [volumeLevel, setVolumeLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mediaStream || !isActive) {
      setVolumeLevel(0);
      return;
    }

    const setupAudioAnalysis = async () => {
      try {
        // Create audio context
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        const audioContext = new (AudioContextClass || AudioContext)();
        audioContextRef.current = audioContext;
        
        // Create analyser node
        const analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.8;
        
        // Connect microphone stream to analyser
        const micSource = audioContext.createMediaStreamSource(mediaStream);
        micSourceRef.current = micSource;
        micSource.connect(analyser);
        
        // Start monitoring volume
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const checkVolume = () => {
          if (!analyserRef.current) return;
          
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Calculate average volume
          const sum = dataArray.reduce((acc, val) => acc + val, 0);
          const average = sum / dataArray.length;
          
          // Normalize to 0-100 scale
          const normalized = Math.min(100, (average / 128) * 100);
          
          setVolumeLevel(normalized);
          
          animationFrameRef.current = requestAnimationFrame(checkVolume);
        };
        
        checkVolume();
      } catch (error) {
        console.error('Failed to setup audio analysis:', error);
      }
    };

    setupAudioAnalysis();

    return () => {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (micSourceRef.current) {
        micSourceRef.current.disconnect();
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [mediaStream, isActive]);

  if (!isActive) {
    return undefined;
  }

  // Determine color based on volume level
  const getVolumeColor = () => {
    if (volumeLevel > 70) return 'bg-red-500';
    if (volumeLevel > 40) return 'bg-yellow-500';
    if (volumeLevel > 10) return 'bg-green-500';
    return 'bg-gray-500';
  };

  // Calculate number of active bars (out of 3)
  const activeBars = Math.ceil((volumeLevel / 100) * 3);

  return (
    <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded p-0.5">
      <div className="flex gap-0.5">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={`w-1 transition-all duration-100 ${
              bar <= activeBars ? getVolumeColor() : 'bg-gray-700'
            }`}
            style={{
              height: `${4 + bar * 2}px`,
              opacity: bar <= activeBars ? 1 : 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
}