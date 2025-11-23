/**
 * Daily.co Service
 * Wrapper for Daily.co video/audio API
 * Drop-in replacement for LiveKit with better free tier
 */

import type { DailyCall, DailyParticipant, DailyEventObjectParticipant, DailyEventObjectParticipantLeft } from '@daily-co/daily-js';
import DailyIframe from '@daily-co/daily-js';
import { FEATURES } from '../config/features';

export interface DailyConnectionOptions {
  enableAudio?: boolean;
  enableVideo?: boolean;
  userName?: string;
}

export interface DailyServiceState {
  isConnecting: boolean;
  isConnected: boolean;
  error?: string;
  participants: Array<{
    identity: string;
    name?: string;
    metadata?: string;
  }>;
  localParticipant?: {
    identity: string;
    name?: string;
    metadata?: string;
  };
}

class DailyService {
  private callObject: DailyCall | undefined;
  private isConnectingFlag: boolean = false;
  private lastError: string | undefined;

  constructor() {
    if (!FEATURES.ENABLE_LIVEKIT) {
      console.info('[DailyService] Video/audio disabled via feature flag');
    }
  }

  /**
   * Check if Daily.co is enabled
   */
  isEnabled(): boolean {
    return FEATURES.ENABLE_LIVEKIT; // Reuse same flag
  }

  /**
   * Connect to a Daily.co room
   * @param roomUrl - Daily.co room URL (e.g., https://your-domain.daily.co/room-name)
   * @param token - Optional Daily.co meeting token
   * @param options - Connection options
   */
  async connect(roomUrl: string, token?: string, options: DailyConnectionOptions = {}): Promise<DailyCall> {
    if (!FEATURES.ENABLE_LIVEKIT) {
      throw new Error('Video/audio is disabled. Enable FEATURES.ENABLE_LIVEKIT in config/features.ts');
    }

    if (this.isConnectingFlag) {
      throw new Error('Already connecting');
    }

    try {
      this.lastError = undefined;
      this.isConnectingFlag = true;

      // Create Daily call object
      this.callObject = DailyIframe.createCallObject({
        audioSource: options.enableAudio !== false,
        videoSource: options.enableVideo !== false,
      });

      // Set up event listeners
      this.setupEventListeners();

      // Join the room
      const joinOptions: Record<string, unknown> = {
        url: roomUrl,
        userName: options.userName,
      };

      if (token) {
        joinOptions.token = token;
      }

      await this.callObject.join(joinOptions);

      this.isConnectingFlag = false;
      console.log('[DailyService] Connected successfully');
      return this.callObject;

    } catch (error) {
      this.isConnectingFlag = false;
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      this.lastError = errorMessage;
      console.error('[DailyService] Connection failed:', error);
      this.callObject = undefined;
      throw error;
    }
  }

  /**
   * Set up event listeners for Daily.co events
   */
  private setupEventListeners() {
    if (!this.callObject) return;

    this.callObject
      .on('joined-meeting', () => {
        console.log('[DailyService] Joined meeting');
      })
      .on('left-meeting', () => {
        console.log('[DailyService] Left meeting');
      })
      .on('participant-joined', (event: DailyEventObjectParticipant) => {
        console.log('[DailyService] Participant joined:', event.participant.user_name);
      })
      .on('participant-left', (event: DailyEventObjectParticipantLeft) => {
        console.log('[DailyService] Participant left:', event.participant.user_name);
      })
      .on('error', (error: unknown) => {
        console.error('[DailyService] Error:', error);
        this.lastError = (error as { errorMsg?: string }).errorMsg || 'Unknown error';
      });
  }

  /**
   * Disconnect from the current room
   */
  async disconnect(): Promise<void> {
    if (this.callObject) {
      try {
        await this.callObject.leave();
        await this.callObject.destroy();
      } catch (error) {
        console.error('[DailyService] Disconnect error:', error);
      } finally {
        this.callObject = undefined;
      }
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): DailyServiceState {
    if (!this.callObject) {
      return {
        isConnecting: this.isConnectingFlag,
        isConnected: false,
        error: this.lastError,
        participants: [],
      };
    }

    const meetingState = this.callObject.meetingState();
    const participants = this.callObject.participants();
    const localParticipant = participants.local;

    return {
      isConnecting: meetingState === 'joining-meeting',
      isConnected: meetingState === 'joined-meeting',
      error: this.lastError,
      participants: Object.values(participants)
        .filter(p => !p.local)
        .map(p => ({
          identity: p.user_id || p.session_id,
          name: p.user_name,
          metadata: JSON.stringify(p),
        })),
      localParticipant: localParticipant ? {
        identity: localParticipant.user_id || localParticipant.session_id,
        name: localParticipant.user_name,
        metadata: JSON.stringify(localParticipant),
      } : undefined,
    };
  }

  /**
   * Get the Daily call object for advanced usage
   */
  getCallObject(): DailyCall | undefined {
    return this.callObject;
  }

  /**
   * Toggle local audio
   */
  async setMicrophoneEnabled(enabled: boolean): Promise<void> {
    if (!this.callObject) {
      throw new Error('Not connected');
    }
    await this.callObject.setLocalAudio(enabled);
  }

  /**
   * Toggle local video
   */
  async setCameraEnabled(enabled: boolean): Promise<void> {
    if (!this.callObject) {
      throw new Error('Not connected');
    }
    await this.callObject.setLocalVideo(enabled);
  }

  /**
   * Start screen sharing
   */
  async startScreenShare(): Promise<void> {
    if (!this.callObject) {
      throw new Error('Not connected');
    }
    await this.callObject.startScreenShare();
  }

  /**
   * Stop screen sharing
   */
  async stopScreenShare(): Promise<void> {
    if (!this.callObject) {
      throw new Error('Not connected');
    }
    await this.callObject.stopScreenShare();
  }

  /**
   * Get all participants
   */
  getParticipants(): DailyParticipant[] {
    if (!this.callObject) {
      return [];
    }
    return Object.values(this.callObject.participants());
  }

  /**
   * Get local participant
   */
  getLocalParticipant(): DailyParticipant | undefined {
    if (!this.callObject) {
      return undefined;
    }
    return this.callObject.participants().local;
  }
}

// Export singleton instance
export const dailyService = new DailyService();
