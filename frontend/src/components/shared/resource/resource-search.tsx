'use client';

import { Input } from '@/components/ui/input';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { Search } from 'lucide-react';
import { useEffect, useState, useRef, type ChangeEvent } from 'react';

interface ResourceSearchProps {
  placeholder?: string;
  paramKey?: string;
}

export function ResourceSearch({
  placeholder = 'Search...',
  paramKey = 'q',
}: ResourceSearchProps) {
  const { getFilter, setFilter } = useQueryFilters();
  const currentFilter = getFilter(paramKey);
  const [value, setValue] = useState(currentFilter);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushedValue = useRef(currentFilter);

  useEffect(() => {
    if (currentFilter !== lastPushedValue.current) {
      setValue(currentFilter);
      lastPushedValue.current = currentFilter;
    }
  }, [currentFilter]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      lastPushedValue.current = newValue || '';
      setFilter(paramKey, newValue || null);
    }, 300);
  };

  return (
    <div className="relative w-full">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        className="h-9 w-full pl-8"
        value={value}
        onChange={handleChange}
      />
    </div>
  );
}
