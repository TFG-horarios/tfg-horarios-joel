'use client';

import { cn } from '@/lib/utils';

export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#f4f2ee] dark:bg-zinc-950 transition-colors duration-700" />
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-700',
          'opacity-80 mix-blend-multiply',
          'dark:opacity-40 dark:mix-blend-normal'
        )}
        style={{
          backgroundImage: `
            radial-gradient(at 0% 0%, #9957a8 0px, transparent 60%),
            radial-gradient(at 100% 100%, #7c3aed 0px, transparent 60%)
          `,
          filter: 'blur(100px)',
        }}
      />
    </div>
  );
}
