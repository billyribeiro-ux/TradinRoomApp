import React, { useState } from 'react';

import { shareService } from '../../sharing/shareService';
export const MicToggle: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  async function toggle() { const next = !enabled; await shareService.toggleMic(next); setEnabled(next); }
  return (
    <button onClick={toggle} aria-pressed={enabled} aria-label="Toggle microphone">{enabled ? 'Mic On' : 'Mic Off'}</button>
  );
};


