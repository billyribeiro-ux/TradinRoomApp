/** approvalService - in-memory pub/sub for share approvals. */
import type { ShareKind } from './shareStore';
import { shareStore } from './shareStore';
type ID = string; type Handler = (payload: { requestId: ID; participantId: ID; kind: ShareKind }) => void;
const subs: Set<Handler> = new Set();
export const approvalService = {
  requestShare(participantId: ID, kind: ShareKind): ID { const id = shareStore.addRequest({ participantId, kind }); subs.forEach(h => h({ requestId: id, participantId, kind })); return id; },
  onRequest(handler: Handler) { subs.add(handler); return () => subs.delete(handler); },
  approve(requestId: ID) { shareStore.setRequestStatus(requestId, 'approved'); },
  deny(requestId: ID) { shareStore.setRequestStatus(requestId, 'denied'); },
  clear(requestId: ID) { shareStore.removeRequest(requestId); },
};


