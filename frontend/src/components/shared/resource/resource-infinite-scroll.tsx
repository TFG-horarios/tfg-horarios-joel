'use client';

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  memo,
  type ComponentType,
} from 'react';
import { Loader2 } from 'lucide-react';
import type { PaginationMetaDTO } from '@tfg-horarios/shared';

export interface ResourceInfiniteScrollProps<
  T,
  TItemProps extends object = Record<string, never>,
> {
  initialItems: T[];
  initialMeta: PaginationMetaDTO;
  loadMore: (page: number) => Promise<{ data: T[]; meta: PaginationMetaDTO }>;
  ItemComponent: ComponentType<{ item: T } & TItemProps>;
  itemProps?: TItemProps;
  keyProp: keyof T;
}

function ResourceInfiniteScrollBase<
  T,
  TItemProps extends object = Record<string, never>,
>({
  initialItems,
  initialMeta,
  loadMore,
  ItemComponent,
  itemProps,
  keyProp,
}: ResourceInfiniteScrollProps<T, TItemProps>) {
  const [prevInitialItems, setPrevInitialItems] = useState(initialItems);
  const [meta, setMeta] = useState(initialMeta);
  const [items, setItems] = useState<T[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  if (initialItems !== prevInitialItems) {
    setPrevInitialItems(initialItems);
    setItems(initialItems);
    setMeta(initialMeta);
  }

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

  const handleLoadMoreRef = useRef(handleLoadMore);
  handleLoadMoreRef.current = handleLoadMore;

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleLoadMoreRef.current();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {items.map((item, index) => {
        const key = item[keyProp] ? String(item[keyProp]) : index;
        const props = { item, ...itemProps } as { item: T } & TItemProps;
        return (
          <div key={key}>
            <ItemComponent {...props} />
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

export const ResourceInfiniteScroll = memo(
  ResourceInfiniteScrollBase
) as typeof ResourceInfiniteScrollBase;
