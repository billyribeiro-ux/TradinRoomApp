// ============================================================================
// AUDIO ACTIVITY DETECTION HOOK - Microsoft Enterprise Standard
// Detects when user is actively speaking based on audio levels
// ============================================================================

import { useState, useEffect, useRef } from 'react';

// ============================================================================
// CONSTANTS
// ============================================================================
const AUDIO_THRESHOLD = -50; // dB threshold for speech detection
const SMOOTHING_TIME_CONSTANT = 0.8;
const FFT_SIZE = 512;

// ============================================================================
// HOOK
// ============================================================================

/**
 * Detects audio activity from a MediaStream
 * 
 * @param audioStream - MediaStream from microphone
 * @param isMicEnabled - Whether microphone is enabled
 * @returns boolean indicating if user is actively speaking
 */
export function useAudioActivity(
  audioStream: MediaStream | null,
  isMicEnabled: boolean
): boolean {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Early return if no stream or mic disabled
    if (!audioStream || !isMicEnabled) {
      setIsSpeaking(false);
      return;
    }

    // Create audio context and analyser
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const audioContext = new (AudioContextClass || AudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(audioStream);
      
      analyser.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT;
      analyser.fftSize = FFT_SIZE;
      
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Analyze audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const checkAudioLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        
        // Convert to dB (approximate)
        const db = 20 * Math.log10(average / 255);
        
        // Update speaking state based on threshold
        setIsSpeaking(db > AUDIO_THRESHOLD);
        
        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };
      
      checkAudioLevel();
    } catch (error) {
      console.error('[useAudioActivity] Failed to create audio analyser:', error);
      setIsSpeaking(false);
    }

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioStream, isMicEnabled]);

  return isSpeaking;
}