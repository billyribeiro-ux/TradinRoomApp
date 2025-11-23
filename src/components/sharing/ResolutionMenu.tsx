import React, { useState } from 'react';
export interface ResolutionMenuProps { onSelect: (res: { width?: number; height?: number; frameRate?: number }) => void; }
export const ResolutionMenu: React.FC<ResolutionMenuProps> = ({ onSelect }) => {
  const [open, setOpen] = useState(false);
  function choose(w: number, h: number, f: number) { onSelect({ width: w, height: h, frameRate: f }); setOpen(false); }
  return (
    <div aria-haspopup="menu" aria-expanded={open}>
      <button onClick={() => setOpen(o => !o)} aria-label="Open resolution menu">Resolution</button>
      {open && (
        <div role="menu" aria-label="Resolution">
          <button role="menuitem" onClick={() => choose(1280, 720, 30)}>720p</button>
          <button role="menuitem" onClick={() => choose(1920, 1080, 30)}>1080p</button>
          <button role="menuitem" onClick={() => choose(1920, 1080, 60)}>1080p/60</button>
        </div>
      )}
    </div>
  );
};


