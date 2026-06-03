'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQueryFilters } from '@/hooks/use-query-filters';

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
}

export function ResourceFilterSelect({
  paramKey,
  placeholder = 'Filter...',
  options,
  clearable = true,
  clearLabel = 'All',
}: ResourceFilterSelectProps) {
  const { getFilter, setFilter } = useQueryFilters();
  const value = getFilter(paramKey) || 'all';

  const handleValueChange = (newValue: string) => {
    if (newValue === 'all') {
      setFilter(paramKey, null);
    } else {
      setFilter(paramKey, newValue);
    }
  };

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full lg:w-[180px]">
        <div className="flex items-center gap-1 overflow-hidden">
          <span className="text-muted-foreground truncate">{placeholder}:</span>
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {clearable && <SelectItem value="all">{clearLabel}</SelectItem>}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
