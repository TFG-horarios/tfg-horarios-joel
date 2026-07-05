'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function OrganizationContentFrame({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isListPage =
    pathname === '/organizations' || /^\/organizations\/[^/]+$/.test(pathname);

  if (!isListPage) {
    return <div className="min-h-0 flex-1 overflow-hidden">{children}</div>;
  }

  return (
    <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-3xl border border-border bg-white/70 dark:bg-white/5">
      <ScrollArea className="h-full w-full">
        <div className="p-6 lg:p-8">{children}</div>
      </ScrollArea>
    </main>
  );
}
