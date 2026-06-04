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
    <div className="flex items-center rounded-lg border border-border/50 bg-white/50 p-1 shadow-sm dark:bg-white/5">
      <Button
        variant="ghost"
        size="icon"
        className={`size-8 rounded-md ${currentView === 'grid' ? 'bg-white shadow-sm dark:bg-white/10' : 'hover:bg-transparent text-muted-foreground'}`}
        onClick={() => setView('grid')}
        title="Vista en cuadrícula"
      >
        <LayoutGrid className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`size-8 rounded-md ${currentView === 'table' ? 'bg-white shadow-sm dark:bg-white/10' : 'hover:bg-transparent text-muted-foreground'}`}
        onClick={() => setView('table')}
        title="Vista en tabla"
      >
        <List className="size-4" />
      </Button>
    </div>
  );
}
