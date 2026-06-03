'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import type { PaginationMetaDTO } from '@tfg-horarios/shared';

export interface ResourceInfiniteScrollProps<T> {
  initialItems: T[];
  initialMeta: PaginationMetaDTO;
  loadMore: (page: number) => Promise<{ data: T[]; meta: PaginationMetaDTO }>;
  ItemComponent: React.ComponentType<{ item: T } & any>;
  itemProps?: Record<string, any>;
  keyProp: keyof T;
}

export function ResourceInfiniteScroll<T>({
  initialItems,
  initialMeta,
  loadMore,
  ItemComponent,
  itemProps = {},
  keyProp,
}: ResourceInfiniteScrollProps<T>) {
  const [meta, setMeta] = useState(initialMeta);
  const [items, setItems] = useState<T[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const initialItemsRef = useRef(initialItems);

  useEffect(() => {
    if (initialItems !== initialItemsRef.current) {
      setItems(initialItems);
      setMeta(initialMeta);
      initialItemsRef.current = initialItems;
    }
  }, [initialItems, initialMeta]);

  const handleLoadMore = useCallback(async () => {
    if (loading || meta.page >= meta.totalPages) return;
    setLoading(true);
    try {
      const res = await loadMore(meta.page + 1);
      setItems((prev) => [...prev, ...res.data]);
      setMeta(res.meta);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [meta, loading, loadMore]);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  return (
    <>
      {items.map((item, index) => {
        const key = item[keyProp] ? String(item[keyProp]) : index;
        return (
          <div key={key}>
            <ItemComponent item={item} {...itemProps} />
          </div>
        );
      })}
      {meta.page < meta.totalPages && (
        <div
          ref={observerTarget}
          className="col-span-full flex justify-center items-center py-6 w-full"
        >
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </>
  );
}
