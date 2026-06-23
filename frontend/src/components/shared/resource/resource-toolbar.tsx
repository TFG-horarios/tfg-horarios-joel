'use client';

import React, { type ReactNode, useState } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface ResourceToolbarProps {
  search?: ReactNode;
  filters?: ReactNode;
  viewToggle?: ReactNode;
  actions?: ReactNode;
}

function getFilterElements(node: ReactNode): React.ReactElement[] {
  const elements: React.ReactElement[] = [];

  React.Children.forEach(node, (child) => {
    if (React.isValidElement(child)) {
      const element = child as React.ReactElement<{
        children?: React.ReactNode;
        paramKey?: string;
      }>;
      if (element.type === React.Fragment) {
        elements.push(...getFilterElements(element.props.children));
      } else {
        elements.push(child);
      }
    }
  });

  return elements;
}

export function ResourceToolbar({
  search,
  filters,
  viewToggle,
  actions,
}: ResourceToolbarProps) {
  const searchParams = useSearchParams();
  const [openDesktop, setOpenDesktop] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);

  const filterElements = getFilterElements(filters).map(
    (el) => el as React.ReactElement<{ paramKey?: string }>
  );
  const actualFilters = filterElements.filter((el) => el.props.paramKey);
  const clearButton = filterElements.find((el) => !el.props.paramKey);

  const getActiveCount = (elements: React.ReactElement[]) => {
    let count = 0;
    elements.forEach((el) => {
      const typedEl = el as React.ReactElement<{ paramKey?: string }>;
      const paramKey = typedEl.props.paramKey;
      if (paramKey) {
        const val = searchParams.get(paramKey);
        if (val && val !== 'all' && val !== '') {
          count++;
        }
      }
    });
    return count;
  };

  const totalActiveCount = getActiveCount(actualFilters);

  const isThresholdExceeded = actualFilters.length > 3;
  const primaryFilters = isThresholdExceeded
    ? actualFilters.slice(0, 2)
    : actualFilters;
  const secondaryFilters = isThresholdExceeded ? actualFilters.slice(2) : [];

  const activeSecondaryCount = getActiveCount(secondaryFilters);
  const hasActiveSecondary = activeSecondaryCount > 0;
  const hasActiveTotal = totalActiveCount > 0;

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 w-full pb-4 border-b border-border/50">
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        {search && <div className="w-full sm:w-72 flex-none">{search}</div>}

        {actualFilters.length > 0 && (
          <>
            <div className="hidden md:flex flex-wrap items-center gap-2">
              {primaryFilters}

              {isThresholdExceeded && (
                <Popover open={openDesktop} onOpenChange={setOpenDesktop}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        'h-9 gap-2 cursor-pointer font-normal border bg-card text-card-foreground hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:text-foreground dark:hover:bg-input/50',
                        hasActiveSecondary
                          ? 'bg-brand-purple-bg text-brand-purple border-brand-purple-border hover:bg-brand-purple-hover dark:hover:bg-brand-purple-hover'
                          : 'border-border'
                      )}
                    >
                      <SlidersHorizontal className="h-4 w-4 shrink-0" />
                      <span>Filtros</span>
                      {hasActiveSecondary && (
                        <span className="font-semibold">
                          ({activeSecondaryCount})
                        </span>
                      )}
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-4" align="start">
                    <div className="flex flex-col gap-3">
                      <div className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">
                        Filtros Adicionales
                      </div>
                      <div className="flex flex-col gap-3">
                        {secondaryFilters.map((el, idx) => (
                          <div
                            key={idx}
                            className="w-full [&_button]:!w-full [&_button]:lg:!w-full [&_input]:!w-full [&_input]:lg:!w-full [&_select]:!w-full [&_.select-trigger]:!w-full [&_div]:!w-full"
                          >
                            {el}
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {clearButton}
            </div>

            <div className="flex md:hidden items-center gap-2 w-full sm:w-auto">
              <Popover open={openMobile} onOpenChange={setOpenMobile}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full sm:w-auto h-9 gap-2 cursor-pointer font-normal border bg-card text-card-foreground hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:text-foreground dark:hover:bg-input/50',
                      hasActiveTotal
                        ? 'bg-brand-purple-bg text-brand-purple border-brand-purple-border hover:bg-brand-purple-hover dark:hover:bg-brand-purple-hover'
                        : 'border-border'
                    )}
                  >
                    <SlidersHorizontal className="h-4 w-4 shrink-0" />
                    <span>Filtros</span>
                    {hasActiveTotal && (
                      <span className="font-semibold">
                        ({totalActiveCount})
                      </span>
                    )}
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[calc(100vw-2rem)] sm:w-80 p-4"
                  align="start"
                >
                  <div className="flex flex-col gap-3">
                    <div className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">
                      Filtros
                    </div>
                    <div className="flex flex-col gap-3">
                      {actualFilters.map((el, idx) => (
                        <div
                          key={idx}
                          className="w-full [&_button]:!w-full [&_button]:lg:!w-full [&_input]:!w-full [&_input]:lg:!w-full [&_select]:!w-full [&_.select-trigger]:!w-full [&_div]:!w-full"
                        >
                          {el}
                        </div>
                      ))}
                    </div>
                    {clearButton && (
                      <div className="border-t border-border/50 pt-2 mt-1 flex justify-end">
                        {clearButton}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}
      </div>

      {(viewToggle || actions) && (
        <div className="flex items-center gap-2 flex-none">
          {viewToggle}
          {actions}
        </div>
      )}
    </div>
  );
}
