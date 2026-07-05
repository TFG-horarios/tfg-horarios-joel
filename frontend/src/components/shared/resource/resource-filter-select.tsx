'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { useTranslations } from 'next-intl';

interface Option {
  label: string;
  value: string;
}

interface ResourceFilterSelectProps {
  paramKey: string;
  placeholder?: string;
  options: Option[];
  clearable?: boolean;
  clearLabel?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function ResourceFilterSelect({
  paramKey,
  placeholder,
  options,
  clearable = true,
  clearLabel,
  searchable = false,
  searchPlaceholder,
  emptyMessage,
}: ResourceFilterSelectProps) {
  const t = useTranslations('Common.filters');
  const { getFilter, setFilter } = useQueryFilters();
  const resolvedPlaceholder = placeholder ?? t('filter');
  const resolvedClearLabel = clearLabel ?? t('all');
  const resolvedSearchPlaceholder = searchPlaceholder ?? t('search');
  const resolvedEmptyMessage = emptyMessage ?? t('empty');
  const value = getFilter(paramKey) || 'all';
  const [open, setOpen] = useState(false);

  const handleValueChange = (newValue: string) => {
    if (newValue === 'all') {
      setFilter(paramKey, null);
    } else {
      setFilter(paramKey, newValue);
    }
  };

  if (searchable) {
    const displayValue =
      value === 'all'
        ? clearable
          ? resolvedClearLabel
          : resolvedPlaceholder
        : options.find((opt) => opt.value === value)?.label ||
          resolvedPlaceholder;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="w-full lg:w-fit lg:min-w-[180px] justify-between font-normal h-9 px-3 py-2 border border-border bg-card text-card-foreground cursor-pointer hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:text-foreground dark:hover:bg-input/50"
          >
            <div className="flex items-center gap-1 overflow-hidden">
              <span className="text-muted-foreground truncate shrink-0">
                {resolvedPlaceholder}:
              </span>
              <span className="truncate">{displayValue}</span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto min-w-[var(--radix-popover-trigger-width)] max-w-[300px] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder={resolvedSearchPlaceholder} />
            <CommandList>
              <CommandEmpty>{resolvedEmptyMessage}</CommandEmpty>
              <CommandGroup>
                {clearable && (
                  <CommandItem
                    value="all"
                    data-state={value === 'all' ? 'checked' : 'unchecked'}
                    onSelect={() => {
                      handleValueChange('all');
                      setOpen(false);
                    }}
                  >
                    <span className="break-words">{resolvedClearLabel}</span>
                  </CommandItem>
                )}
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    data-state={
                      option.value === value ? 'checked' : 'unchecked'
                    }
                    onSelect={() => {
                      handleValueChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <span className="break-words">{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger
        size="lg"
        className="w-full lg:w-fit lg:min-w-[180px] bg-card"
      >
        <div className="flex items-center gap-1 overflow-hidden">
          <span className="text-muted-foreground truncate">
            {resolvedPlaceholder}:
          </span>
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent position="popper">
        {clearable && <SelectItem value="all">{resolvedClearLabel}</SelectItem>}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
