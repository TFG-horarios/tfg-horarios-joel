import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export function useQueryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      if (key !== 'page') {
        params.delete('page');
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const setMultipleFilters = useCallback(
    (filters: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const getFilter = useCallback(
    (key: string) => {
      return searchParams.get(key) || '';
    },
    [searchParams]
  );

  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams();
    const limit = searchParams.get('limit');
    const view = searchParams.get('view');
    
    if (limit) params.set('limit', limit);
    if (view) params.set('view', view);

    const queryString = params.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);
  }, [pathname, router, searchParams]);

  const hasAnyFilter = Array.from(searchParams.keys()).filter(key => !['page', 'limit', 'view'].includes(key)).length > 0;

  return {
    setFilter,
    setMultipleFilters,
    getFilter,
    clearAllFilters,
    hasAnyFilter,
    searchParams,
  };
}
