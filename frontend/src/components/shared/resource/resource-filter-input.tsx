'use client';

import { Input } from '@/components/ui/input';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { useEffect, useState, useRef, type ChangeEvent } from 'react';

interface ResourceFilterInputProps {
  paramKey: string;
  placeholder?: string;
  type?: 'text' | 'number';
}

export function ResourceFilterInput({
  paramKey,
  placeholder = 'Filter...',
  type = 'text',
}: ResourceFilterInputProps) {
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
    <Input
      type={type}
      placeholder={placeholder}
      className="h-9 w-full lg:w-32"
      value={value}
      onChange={handleChange}
    />
  );
}
