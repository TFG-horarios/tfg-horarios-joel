'use client';

import { useDroppable } from '@dnd-kit/react';

type DroppableCellProps = {
  id: string;
  children: React.ReactNode;
  className?: string;
};

export function DroppableCell({
  id,
  children,
  className = '',
}: DroppableCellProps) {
  const { isDropTarget, ref } = useDroppable({ id });

  return (
    <div
      ref={ref}
      className={`
        ${className}
        ${isDropTarget ? 'ring-2 ring-primary ring-offset-1 bg-primary/5 shadow-inner' : ''}
        transition-all duration-200
      `}
    >
      {children}
    </div>
  );
}
