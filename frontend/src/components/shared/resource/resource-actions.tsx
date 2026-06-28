'use client';

import type { ReactNode } from 'react';

export interface ResourceActionsProps {
  children: ReactNode;
}

export function ResourceActions({ children }: ResourceActionsProps) {
  return (
    <div className="flex items-center gap-2 shrink-0 justify-end">
      {children}
    </div>
  );
}
