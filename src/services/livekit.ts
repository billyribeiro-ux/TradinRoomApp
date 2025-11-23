/**
 * LiveKit Service
 * Wrapper for livekit-client library to manage WebRTC connections
 */

import type { RemoteParticipant, RemoteTrack, RemoteTrackPublication} from 'livekit-client';
import { Room, RoomEvent, ConnectionState as LiveKitConnectionState } from 'livekit-client';

import { getLiveKitServerUrl, isLiveKitEnabled as checkLiveKitEnabled } from './livekitToken';
import { FEATURES } from '../config/features';

export interface LiveKitConnectionOptions {
  enableAudio?: boolean;
  enableVideo?: boolean;
  adaptiveStream?: boolean;
}

export interface LiveKitServiceState {
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

class LiveKitService {
  private room: Room | undefined;
  private serverUrl: string | undefined;
  private lastError: string | undefined;
  private isConnectingFlag: boolean = false;

  constructor() {
    // Initialize server URL if LiveKit is enabled
    try {
      if (FEATURES.ENABLE_LIVEKIT && checkLiveKitEnabled()) {
        this.serverUrl = getLiveKitServerUrl();
      } else if (!FEATURES.ENABLE_LIVEKIT) {
        console.info('[LiveKitService] LiveKit disabled via feature flag');
        this.serverUrl = undefined;
      }
    } catch (error) {
      console.warn('[LiveKitService] LiveKit not configured:', error);
      this.serverUrl = undefined;
    }
  }

  /**
   * Check if LiveKit is enabled and configured
   */
  isEnabled(): boolean {
    return checkLiveKitEnabled() && !!this.serverUrl;
  }

  /**
   * Connect to a LiveKit room
   * @param roomName - Name of the room to join
   * @param participantIdentity - Unique identity of the participant
   * @param token - LiveKit access token
   * @param options - Connection options
   */
  async connect(token: string, options: LiveKitConnectionOptions = {}): Promise<Room> {
    if (!FEATURES.ENABLE_LIVEKIT) {
      throw new Error('LiveKit is disabled. Enable FEATURES.ENABLE_LIVEKIT in config/features.ts');
    }
    
    if (this.isConnectingFlag) {
      throw new Error('Already connecting');
    }

    if (!this.serverUrl) {
      throw new Error('LiveKit server URL not configured');
    }

    try {
      // Reset error state
      this.lastError = undefined;
      this.isConnectingFlag = true;

      // Disconnect from any existing room first
      if (this.room) {
        await this.disconnect();
      }

      // Create new room instance
      this.room = new Room({
        adaptiveStream: options.adaptiveStream ?? true,
        dynacast: true,
        // Enable audio/video based on options
      });

      // Set up event listeners
      this.setupEventListeners();

      // Connect to room
      await this.room.connect(this.serverUrl, token, {
        // Enable local audio/video tracks if requested
        autoSubscribe: true,
      });

      this.isConnectingFlag = false;
      this.lastError = undefined;
      
      return this.room;
    } catch (error) {
      this.isConnectingFlag = false;
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      this.lastError = errorMessage;
      console.error('[LiveKitService] Connection failed:', error);
      this.room = undefined;
      throw error;
    }
  }

  /**
   * Disconnect from the current room
   */
  async disconnect(): Promise<void> {
    if (this.room) {
      try {
        await this.room.disconnect();
        // Disconnected silently
      } catch (error) {
        console.error('[LiveKitService] Disconnect error:', error);
      } finally {
        this.room = undefined;
      }
    }
  }

  /**
   * Get the current room instance
   */
  getRoom(): Room | undefined {
    return this.room;
  }

  /**
   * Check if currently connected to a room
   */
  isConnected(): boolean {
    return this.room?.state === LiveKitConnectionState.Connected;
  }

  /**
   * Get current connection state
   * Returns detailed connection state for UI components
   */
  getConnectionState(): LiveKitServiceState {
    if (!this.room) {
      return {
        isConnecting: this.isConnectingFlag,
        isConnected: false,
        error: this.lastError,
        participants: [],
        localParticipant: undefined,
      };
    }

    // Determine connection state from room.state
    const roomState = this.room.state;
    const isConnecting = this.isConnectingFlag || 
                        roomState === LiveKitConnectionState.Connecting || 
                        roomState === LiveKitConnectionState.Reconnecting;
    const isConnected = roomState === LiveKitConnectionState.Connected;

    // Get remote participants
    const participants = Array.from(this.room.remoteParticipants.values()).map(p => ({
      identity: p.identity,
      name: p.name,
      metadata: p.metadata,
    }));

    // Get local participant
    const localParticipant = this.room.localParticipant ? {
      identity: this.room.localParticipant.identity,
      name: this.room.localParticipant.name,
      metadata: this.room.localParticipant.metadata,
    } : undefined;

    return {
      isConnecting,
      isConnected,
      error: this.lastError,
      participants,
      localParticipant,
    };
  }

  /**
   * Setup event listeners for the room
   */
  private setupEventListeners(): void {
    if (!this.room) return;

    this.room.on(RoomEvent.Connected, () => {
      // Room connected silently
    });

    this.room.on(RoomEvent.Disconnected, () => {
      this.isConnectingFlag = false;
      // Room disconnected silently
    });

    this.room.on(RoomEvent.ParticipantConnected, (_participant: RemoteParticipant) => {
      // Participant connected silently
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (_participant: RemoteParticipant) => {
      // Participant disconnected silently
    });

    this.room.on(RoomEvent.TrackSubscribed, (_track: RemoteTrack, _publication: RemoteTrackPublication, _participant: RemoteParticipant) => {
      // Track subscribed silently
    });

    this.room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, _publication: RemoteTrackPublication, _participant: RemoteParticipant) => {
      track.detach();
    });

    this.room.on(RoomEvent.ConnectionQualityChanged, (_quality, _participant) => {
      // Connection quality changed silently
    });

    this.room.on(RoomEvent.Reconnecting, () => {
      this.isConnectingFlag = true;
      this.lastError = undefined;
      // Reconnecting silently
    });

    this.room.on(RoomEvent.Reconnected, () => {
      this.isConnectingFlag = false;
      this.lastError = undefined;
      // Reconnected silently
    });

    // Track connection state changes
    this.room.on(RoomEvent.ConnectionStateChanged, (state: LiveKitConnectionState) => {
      // Update connecting flag based on connection state
      if (state === LiveKitConnectionState.Connected) {
        this.isConnectingFlag = false;
        this.lastError = undefined;
      } else if (state === LiveKitConnectionState.Disconnected || 
                 state === LiveKitConnectionState.Connecting || 
                 state === LiveKitConnectionState.Reconnecting) {
        // Keep isConnectingFlag true for connecting/reconnecting states
        if (state === LiveKitConnectionState.Disconnected) {
          this.isConnectingFlag = false;
        } else {
          this.isConnectingFlag = true;
        }
      }
      // Connection state changed silently
    });

    this.room.on(RoomEvent.RoomMetadataChanged, (_metadata) => {
      // Room metadata changed silently
    });
  }
}

// Export singleton instance
export const liveKitService = new LiveKitService();
