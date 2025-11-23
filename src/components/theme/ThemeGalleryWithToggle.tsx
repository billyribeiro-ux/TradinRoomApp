import React from 'react';

interface ThemeGalleryWithToggleProps {
  onClose?: () => void;
  children?: React.ReactNode;
}

export function ThemeGalleryWithToggle({ onClose: _onClose, children }: ThemeGalleryWithToggleProps): React.ReactElement | undefined {
  return (
    <div>
      {children}
    </div>
  );
}
