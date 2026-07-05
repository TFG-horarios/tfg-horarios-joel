'use client';

import { memo, type ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/react';

type DroppableCellProps = {
  id: string;
  children: ReactNode;
  className?: string;
  dropState?: 'neutral' | 'valid' | 'invalid';
};

export const DroppableCell = memo(function DroppableCell({
  id,
  children,
  className = '',
  dropState = 'neutral',
}: DroppableCellProps) {
  const { isDropTarget, ref } = useDroppable({ id });
  const dropTargetClass =
    dropState === 'invalid'
      ? 'ring-2 ring-destructive ring-offset-1 bg-destructive/5 shadow-inner'
      : dropState === 'valid'
        ? 'ring-2 ring-emerald-500 ring-offset-1 bg-emerald-500/5 shadow-inner'
        : 'ring-2 ring-primary ring-offset-1 bg-primary/5 shadow-inner';

  return (
    <div
      ref={ref}
      className={`
        ${className}
        ${isDropTarget ? dropTargetClass : ''}
        transition-colors duration-75
      `}
    >
      {children}
    </div>
  );
});
