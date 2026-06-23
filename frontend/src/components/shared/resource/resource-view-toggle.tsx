'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTransition } from 'react';

export interface ResourceViewToggleProps {
  viewKey: string;
  defaultView?: 'grid' | 'table';
}

export function ResourceViewToggle({
  viewKey,
  defaultView = 'grid',
}: ResourceViewToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentView = searchParams?.get('view') || defaultView;

  const setView = (view: 'grid' | 'table') => {
    document.cookie = `${viewKey}=${view}; path=/; max-age=31536000; SameSite=Lax`;

    const params = new URLSearchParams(searchParams?.toString() || '');
    if (params.has('view')) {
      params.delete('view');
    }
    params.delete('page');

    const newQueryString = params.toString();
    const newUrl = `${pathname}${newQueryString ? `?${newQueryString}` : ''}`;

    startTransition(() => {
      router.replace(newUrl, { scroll: false });
      router.refresh();
    });
  };

  return (
    <div className="flex h-9 items-center rounded-lg border border-border bg-card p-0.5 dark:bg-input/30 p-1">
      <Button
        variant="ghost"
        size="icon"
        className={`size-6 rounded-md cursor-pointer ${currentView === 'grid' ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-transparent text-muted-foreground'}`}
        onClick={() => setView('grid')}
        title="Vista en cuadrícula"
      >
        <LayoutGrid className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`size-6 rounded-md cursor-pointer ${currentView === 'table' ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-transparent text-muted-foreground'}`}
        onClick={() => setView('table')}
        title="Vista en tabla"
      >
        <List className="size-4" />
      </Button>
    </div>
  );
}
