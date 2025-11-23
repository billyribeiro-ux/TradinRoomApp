import React, { useEffect, useState } from 'react';

import { approvalService } from '../../sharing/approvalService';
import { shareStore } from '../../sharing/shareStore';

export const ApprovalDialog: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [requestId, setRequestId] = useState<string | undefined>(undefined);
  const [participantId, setParticipantId] = useState<string | undefined>(undefined);
  const [kind, setKind] = useState<'display' | 'virtual-camera' | undefined>(undefined);

  useEffect(() => {
    const off = approvalService.onRequest(({ requestId, participantId, kind }) => {
      setRequestId(requestId);
      setParticipantId(participantId);
      setKind(kind);
      setVisible(true);
    });
    return () => { off(); };
  }, []);

  function approve() { if (!requestId) return; approvalService.approve(requestId); setVisible(false); }
  function deny() { if (!requestId) return; approvalService.deny(requestId); setVisible(false); }
  useEffect(() => { if (!visible && requestId) { approvalService.clear(requestId); } }, [visible, requestId]);

  if (!visible || !requestId || !participantId || !kind) return undefined as unknown as React.ReactElement;
  const p = shareStore.get().participants.find(x => x.id === participantId);
  const name = p ? `${p.id} (${p.role})` : participantId;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="approval-title">
      <h3 id="approval-title">Share Request</h3>
      <p><strong>{name}</strong> is requesting to share <code>{kind}</code>.</p>
      <div>
        <button onClick={approve} autoFocus>Approve</button>
        <button onClick={deny}>Deny</button>
      </div>
    </div>
  );
};


