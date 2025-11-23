/** Share state store (evented). */
export type ID = string;
export type ShareKind = 'display' | 'virtual-camera';

export interface Resolution { width?: number; height?: number; frameRate?: number; }
export interface Share {
  id: ID; kind: ShareKind; label: string; stream: MediaStream | undefined;
  videoTrackId?: string; audioTrackId?: string; isPrimary: boolean; isPaused: boolean;
  resolution: Resolution; createdAt: number;
}
export type Role = 'owner' | 'moderator' | 'viewer';
export interface Participant { id: ID; role: Role; audioMuted: boolean; videoMuted: boolean; }
export type RequestStatus = 'pending' | 'approved' | 'denied';
export interface ShareRequest { id: ID; participantId: ID; kind: ShareKind; status: RequestStatus; createdAt: number; }

export interface ShareState { shares: Share[]; participants: Participant[]; requests: ShareRequest[]; primaryId: ID | undefined; }

type Listener = (s: ShareState) => void; const listeners: Set<Listener> = new Set();
// MediaStream and other web media types cannot be structuredCloned. Build a snapshot manually.
function snapshotShare(s: Share): Share {
  return { ...s, stream: s.stream };
}
function snapshotState(): ShareState {
  return {
    shares: state.shares.map(snapshotShare),
    participants: state.participants.map(p => ({ ...p })),
    requests: state.requests.map(r => ({ ...r })),
    primaryId: state.primaryId,
  };
}
const uid = (): ID => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `id_${Math.random().toString(36).slice(2,10)}_${Date.now()}`);

const state: ShareState = { shares: [], participants: [], requests: [], primaryId: undefined };
const notify = () => { const snap = snapshotState(); listeners.forEach(l => l(snap)); };

export const shareStore = {
  subscribe(fn: Listener) { listeners.add(fn); fn(snapshotState()); return () => { listeners.delete(fn); }; },
  get(): ShareState { return snapshotState(); },

  addShare(s: Omit<Share, 'id' | 'createdAt' | 'isPaused' | 'isPrimary'> & { id?: ID; isPrimary?: boolean }): ID {
    const id = s.id ?? uid();
    const share: Share = { id, kind: s.kind, label: s.label, stream: s.stream, videoTrackId: s.videoTrackId, audioTrackId: s.audioTrackId, isPrimary: Boolean(s.isPrimary ?? false), isPaused: false, resolution: s.resolution, createdAt: Date.now() };
    state.shares.push(share); if (share.isPrimary) state.primaryId = share.id; notify(); return id;
  },
  removeShare(id: ID) {
    const idx = state.shares.findIndex(s => s.id === id); if (idx >= 0) {
      const [removed] = state.shares.splice(idx, 1); removed.stream?.getTracks().forEach(t => t.stop());
      if (state.primaryId === id) { state.primaryId = state.shares.length ? state.shares[0].id : undefined; if (state.shares.length) state.shares[0].isPrimary = true; }
      notify();
    }
  },
  updateShare(id: ID, patch: Partial<Share>) { const s = state.shares.find(x => x.id === id); if (!s) return; Object.assign(s, patch); notify(); },
  setPrimary(id: ID) { if (state.primaryId === id) return; state.shares.forEach(s => (s.isPrimary = s.id === id)); state.primaryId = id; notify(); },
  stopAllShares() { state.shares.forEach(s => s.stream?.getTracks().forEach(t => t.stop())); state.shares = []; state.primaryId = undefined; notify(); },

  upsertParticipant(p: Participant) { const i = state.participants.findIndex(x => x.id === p.id); if (i >= 0) state.participants[i] = p; else state.participants.push(p); notify(); },
  setParticipantMuted(id: ID, audioMuted: boolean) { const p = state.participants.find(x => x.id === id); if (!p) return; p.audioMuted = audioMuted; notify(); },

  addRequest(r: Omit<ShareRequest, 'id' | 'status' | 'createdAt'> & { id?: ID; status?: RequestStatus }): ID { const id = r.id ?? uid(); const req: ShareRequest = { id, participantId: r.participantId, kind: r.kind, status: r.status ?? 'pending', createdAt: Date.now() }; state.requests.push(req); notify(); return id; },
  setRequestStatus(id: ID, status: RequestStatus) { const rq = state.requests.find(x => x.id === id); if (!rq) return; rq.status = status; notify(); },
  removeRequest(id: ID) { const i = state.requests.findIndex(x => x.id === id); if (i >= 0) { state.requests.splice(i, 1); notify(); } },
};


