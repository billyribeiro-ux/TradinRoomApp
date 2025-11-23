import React from 'react';

interface ThemeButtonProps {
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function ThemeButton({ onClick, children, className }: ThemeButtonProps): React.ReactElement | undefined {
  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
}
