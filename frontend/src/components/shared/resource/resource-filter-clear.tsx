'use client';

import { Button } from '@/components/ui/button';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ResourceFilterClear() {
  const { clearAllFilters, hasAnyFilter } = useQueryFilters();
  const t = useTranslations('Common.actions');

  if (!hasAnyFilter) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={clearAllFilters}
      className="h-9 px-2 lg:px-3 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground dark:hover:text-white transition-colors duration-200"
    >
      <X className="mr-2 h-4 w-4" />
      {t('resetFilters') || 'Limpiar filtros'}
    </Button>
  );
}
