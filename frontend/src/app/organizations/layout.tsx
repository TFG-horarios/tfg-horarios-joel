'use client';

import { usePathname } from 'next/navigation';
import { OrganizationHeader } from '@/components/layout/organization-header';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ReactNode } from 'react';

export default function OrganizationLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isListPage =
    pathname === '/organizations' || /^\/organizations\/[^/]+$/.test(pathname);

  return (
    <div className="relative h-screen w-full overflow-hidden text-foreground">
      <div className="flex h-full flex-col gap-2 p-2 lg:gap-3 lg:p-3">
        <div className="relative z-50">
          <OrganizationHeader />
        </div>
        <div className="relative z-10 flex h-full w-full min-h-0 flex-col gap-2 lg:gap-3">
          {isListPage ? (
            <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-3xl border border-border bg-white/70 dark:bg-white/5">
              <ScrollArea className="h-full w-full">
                <div className="p-6 lg:p-8">{children}</div>
              </ScrollArea>
            </main>
          ) : (
            <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
          )}
        </div>
      </div>
    </div>
  );
}
