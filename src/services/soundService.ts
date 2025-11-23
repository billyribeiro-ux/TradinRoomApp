// Fixed: 2025-10-24 - Emergency null/undefined fixes for production
// Microsoft TypeScript standards applied - null → undefined, using optional types


// Fixed: 2025-01-24 - Eradicated 1 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types

/**
 * Sound Service - Audio management for Revolution Trading Room
 * Handles sound effects, notifications, and audio feedback
 */

export interface SoundConfig {
  enabled: boolean;
  volume: number;
  masterVolume: number;
}

class SoundService {
  private config: SoundConfig = {
    enabled: true,
    volume: 0.7,
    masterVolume: 1.0,
  };

  private audioContext: AudioContext | undefined  = undefined;
  private sounds: Map<string, AudioBuffer> = new Map();

  constructor() {
    this.initializeAudioContext();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext not supported:', error);
    }
  }

  public async playSound(soundName: string, volume: number = 1.0): Promise<void> {
    if (!this.config.enabled || !this.audioContext) {
      return;
    }

    try {
      const buffer = this.sounds.get(soundName);
      if (!buffer) {
        console.warn(`Sound "${soundName}" not found`);
        return;
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = volume * this.config.volume * this.config.masterVolume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  public setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }

  public setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
  }

  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  public getConfig(): SoundConfig {
    return { ...this.config };
  }
}

// Singleton instance
const soundService = new SoundService();

export const initializeSoundService = async (): Promise<void> => {
  // Initialize sound service
  console.log('Sound service initialized');
};

export const getSoundService = (): SoundService => soundService;

export default soundService;

// ============================================================
// Category helpers gated by sound preferences (Volume panel)
// ============================================================
import { useSoundStore } from '../store/soundStore';

function getLinearVolume(): number {
  const { volume } = useSoundStore.getState();
  return Math.max(0, Math.min(1, volume / 100));
}

function shouldSuppress(categoryEnabled: boolean): boolean {
  const { effectiveMuted } = useSoundStore.getState();
  return effectiveMuted || !categoryEnabled;
}

export async function playAlert(soundName: string = 'alert'): Promise<void> {
  const { alertsEnabled } = useSoundStore.getState();
  if (shouldSuppress(alertsEnabled)) return;
  await getSoundService().playSound(soundName, getLinearVolume());
}

export async function playQA(soundName: string = 'qa'): Promise<void> {
  const { qaEnabled } = useSoundStore.getState();
  if (shouldSuppress(qaEnabled)) return;
  await getSoundService().playSound(soundName, getLinearVolume());
}

export async function playNTA(soundName: string = 'nta'): Promise<void> {
  const { ntaEnabled } = useSoundStore.getState();
  if (shouldSuppress(ntaEnabled)) return;
  await getSoundService().playSound(soundName, getLinearVolume());
}

export async function playChat(soundName: string = 'chat'): Promise<void> {
  const { chatEnabled } = useSoundStore.getState();
  if (shouldSuppress(chatEnabled)) return;
  await getSoundService().playSound(soundName, getLinearVolume());
}
