/**
 * rtcClient.ts
 * Headless RTC adapter with a safe Noop default and an optional LiveKit adapter.
 */

export interface RtcClient {
  publishPrimaryVideoTrack(track: MediaStreamTrack): Promise<void>;
  stopPrimaryVideo(): Promise<void>;
  setMicrophoneEnabled(enabled: boolean): Promise<void>;
  replacePrimaryVideoTrack(track: MediaStreamTrack): Promise<void>;
}

class NoopClient implements RtcClient {
  async publishPrimaryVideoTrack(_: MediaStreamTrack): Promise<void> { return; }
  async stopPrimaryVideo(): Promise<void> { return; }
  async setMicrophoneEnabled(_enabled: boolean): Promise<void> { return; }
  async replacePrimaryVideoTrack(_: MediaStreamTrack): Promise<void> { return; }
}

class RtcClientHolder {
  private client: RtcClient = new NoopClient();
  set(client: RtcClient) { this.client = client; }
  get(): RtcClient { return this.client; }
}

export const rtcClient = new RtcClientHolder();

export interface LiveKitRoomLike { localParticipant: LiveKitLocalParticipantLike; }
export interface LiveKitLocalParticipantLike {
  publishTrack(track: MediaStreamTrack): Promise<unknown>;
  unpublishTrack(track: MediaStreamTrack): void;
  setMicrophoneEnabled(enabled: boolean): Promise<void>;
}

export function createLiveKitRtcClient(room: LiveKitRoomLike): RtcClient {
  let currentTrack: MediaStreamTrack | undefined = undefined;
  return {
    async publishPrimaryVideoTrack(track: MediaStreamTrack) {
      if (currentTrack) {
        await this.replacePrimaryVideoTrack(track);
        return;
      }
      await room.localParticipant.publishTrack(track);
      currentTrack = track;
    },
    async stopPrimaryVideo() {
      if (currentTrack !== undefined) {
        room.localParticipant.unpublishTrack(currentTrack);
        currentTrack.stop();
        currentTrack = undefined;
      }
    },
    async setMicrophoneEnabled(enabled: boolean) {
      await room.localParticipant.setMicrophoneEnabled(enabled);
    },
    async replacePrimaryVideoTrack(track: MediaStreamTrack) {
      if (currentTrack) {
        room.localParticipant.unpublishTrack(currentTrack);
        currentTrack.stop();
      }
      await room.localParticipant.publishTrack(track);
      currentTrack = track;
    },
  };
}


