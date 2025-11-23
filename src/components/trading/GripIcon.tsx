interface GripIconProps {
  orientation: 'vertical' | 'horizontal';
  className?: string;
}

export function GripIcon({ orientation, className }: GripIconProps) {
  const orientationClass =
    orientation === 'vertical' ? 'as-gutter-vertical' : 'as-gutter-horizontal';
  return (
    <div className={`${orientationClass} ${className ?? ''}`}>
      <div className="as-split-gutter-icon" />
    </div>
  );
}


