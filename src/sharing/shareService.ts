/** shareService orchestrates capture + publish. */
import { rtcClient } from '../rtc/rtcClient';
import { recordingService } from '../services/recordingService';

import type { ShareKind, Resolution } from './shareStore';
import { shareStore } from './shareStore';

export interface StartShareOptions { kind: ShareKind; label?: string; resolution?: Resolution; withSystemAudio?: boolean; makePrimary?: boolean; }
const DEFAULT_RES: Resolution = { width: 1280, height: 720, frameRate: 30 };

function pickLabelFromStream(stream: MediaStream, fallback: string): string {
  const vt = stream.getVideoTracks()[0]; const settings = vt?.getSettings?.() ?? {}; const dims = settings.width && settings.height ? ` ${settings.width}x${settings.height}` : ''; return `${fallback}${dims}`;
}
const getVideoTrack = (s: MediaStream): MediaStreamTrack | undefined => { const t = s.getVideoTracks(); return t.length ? t[0] : undefined; };
const getAudioTrack = (s: MediaStream): MediaStreamTrack | undefined => { const t = s.getAudioTracks(); return t.length ? t[0] : undefined; };

async function acquireDisplay(res: Resolution, withAudio: boolean): Promise<MediaStream> {
  return await navigator.mediaDevices.getDisplayMedia({ video: { width: res.width, height: res.height, frameRate: res.frameRate }, audio: withAudio });
}
async function acquireVirtualCamera(labelHint?: string): Promise<MediaStream> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cams = devices.filter(d => d.kind === 'videoinput');
  const preferred = labelHint 
    ? cams.find(c => c.label.toLowerCase().includes(labelHint.toLowerCase())) ?? cams.find(c => /obs|xsplit|virtual/i.test(c.label)) ?? cams[0]
    : cams.find(c => /obs|xsplit|virtual/i.test(c.label)) ?? cams[0];
  if (!preferred) throw new Error('No video input devices found');
  return await navigator.mediaDevices.getUserMedia({ video: { deviceId: preferred.deviceId ? { exact: preferred.deviceId } : undefined }, audio: false });
}
function onTrackEnded(stream: MediaStream, cb: () => void) { stream.getTracks().forEach(t => t.addEventListener('ended', cb, { once: true })); }

export const shareService = {
  async init() { await rtcClient.get().setMicrophoneEnabled(false); },

  _currentStream: undefined as MediaStream | undefined,
  
  async startShare(opts: StartShareOptions): Promise<string> {
    const res = opts.resolution ?? DEFAULT_RES;
    const stream: MediaStream = opts.kind === 'display'
      ? await acquireDisplay(res, Boolean(opts.withSystemAudio))
      : await acquireVirtualCamera(opts.label);
    const label = opts.label ?? pickLabelFromStream(stream, opts.kind === 'display' ? 'Screen' : 'Virtual Camera');
    const videoTrack = getVideoTrack(stream); if (!videoTrack) { stream.getTracks().forEach(t => t.stop()); throw new Error('No video track captured'); }
    const state = shareStore.get(); const makePrimary = opts.makePrimary ?? (state.shares.length === 0);
    const id = shareStore.addShare({ kind: opts.kind, label, stream, videoTrackId: videoTrack.id, audioTrackId: getAudioTrack(stream)?.id, resolution: res, isPrimary: makePrimary });
    onTrackEnded(stream, () => { shareStore.removeShare(id); });
    if (makePrimary) { await rtcClient.get().publishPrimaryVideoTrack(videoTrack); }
    
    // Store stream reference for recording
    this._currentStream = stream;
    
    return id;
  },

  async stopShare(id: string) {
    const st = shareStore.get(); const target = st.shares.find(s => s.id === id); if (!target) return; target.stream?.getTracks().forEach(t => t.stop()); const wasPrimary = target.isPrimary; shareStore.removeShare(id);
    if (wasPrimary) { const now = shareStore.get(); const nextPrimary = now.primaryId ? now.shares.find(s => s.id === now.primaryId) : undefined; if (nextPrimary) { const vt = nextPrimary.stream ? getVideoTrack(nextPrimary.stream) : undefined; if (vt) await rtcClient.get().replacePrimaryVideoTrack(vt); } else { await rtcClient.get().stopPrimaryVideo(); } }
  },

  async makePrimary(id: string) {
    const st = shareStore.get(); const share = st.shares.find(s => s.id === id); if (!share?.stream) return; const vt = getVideoTrack(share.stream); if (!vt) return; await rtcClient.get().replacePrimaryVideoTrack(vt); shareStore.setPrimary(id);
  },

  async setResolution(id: string, res: Resolution) {
    const st = shareStore.get(); const s = st.shares.find(x => x.id === id); if (!s) throw new Error('Share not found'); s.stream?.getTracks().forEach(t => t.stop());
    const stream = s.kind === 'display' ? await acquireDisplay(res, Boolean(s.audioTrackId)) : await acquireVirtualCamera(s.label);
    const vt = getVideoTrack(stream); if (!vt) throw new Error('No video track after resolution change'); const wasPrimary = s.isPrimary;
    shareStore.updateShare(id, { stream, videoTrackId: vt.id, resolution: res }); onTrackEnded(stream, () => this.stopShare(id)); if (wasPrimary) { await rtcClient.get().replacePrimaryVideoTrack(vt); }
  },

  togglePause(id: string) { const st = shareStore.get(); const s = st.shares.find(x => x.id === id); if (!s?.stream) return; const vt = s.stream.getVideoTracks()[0]; if (!vt) return; const next = !vt.enabled; vt.enabled = next; shareStore.updateShare(id, { isPaused: !next }); },

  async toggleMic(enabled: boolean) { await rtcClient.get().setMicrophoneEnabled(enabled); },

  async discoverVirtualCameras(): Promise<Array<{ deviceId: string; label: string }>> { const devs = await navigator.mediaDevices.enumerateDevices(); return devs.filter(d => d.kind === 'videoinput' && /obs|xsplit|virtual/i.test(d.label)).map(d => ({ deviceId: d.deviceId, label: d.label || 'Virtual Camera' })); },

  async stopAll() { 
    shareStore.stopAllShares(); 
    await rtcClient.get().stopPrimaryVideo(); 
    this._currentStream = undefined;
  },
  
  /**
   * Start recording current screen share
   */
  async startRecording(): Promise<void> {
    if (!this._currentStream) {
      throw new Error('No active screen share to record');
    }
    await recordingService.startRecording(this._currentStream);
  },
  
  /**
   * Stop recording and download
   */
  async stopRecording(): Promise<void> {
    const blob = await recordingService.stopRecording();
    if (blob) {
      recordingService.downloadRecording(blob);
    }
  },
  
  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return recordingService.isCurrentlyRecording();
  },
  
  /**
   * Get current screen share stream
   */
  getCurrentStream(): MediaStream | undefined {
    return this._currentStream;
  },
};


