import type { PaginationMetaDTO } from '@tfg-horarios/shared';
import { ResourceGrid } from './resource-grid';
import { ResourceInfiniteScroll } from './resource-infinite-scroll';
import { ResourcePagination } from './resource-pagination';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ComponentType, ReactNode } from 'react';

export interface ResourceLayoutProps<
  T,
  TGridProps extends object = Record<string, never>,
  TRowProps extends object = Record<string, never>,
  TQuery = unknown,
> {
  view: 'grid' | 'table';
  items: T[];
  meta: PaginationMetaDTO;
  query: TQuery;
  loadMore: (page: number) => Promise<{ data: T[]; meta: PaginationMetaDTO }>;
  emptyState: ReactNode;

  GridItemComponent: ComponentType<{ item: T } & TGridProps>;
  gridItemProps?: TGridProps;

  tableHeaders: ReactNode[];
  TableRowComponent: ComponentType<{ item: T } & TRowProps>;
  tableRowProps?: TRowProps;

  keyProp?: keyof T;
}

export function ResourceLayout<
  T,
  TGridProps extends object = Record<string, never>,
  TRowProps extends object = Record<string, never>,
  TQuery = unknown,
>({
  view,
  items,
  meta,
  query,
  loadMore,
  emptyState,
  GridItemComponent,
  gridItemProps,
  tableHeaders,
  TableRowComponent,
  tableRowProps,
  keyProp = 'id' as keyof T,
}: ResourceLayoutProps<T, TGridProps, TRowProps, TQuery>) {
  if (!items || items.length === 0) {
    return <>{emptyState}</>;
  }

  if (view === 'table') {
    return (
      <div className="flex flex-col gap-4">
        <div
          id="resource-table-container"
          className="overflow-x-auto overflow-y-hidden rounded-xl border border-black/10 bg-transparent shadow-lg shadow-black/10 dark:border-white/10 dark:shadow-black/40"
        >
          <Table className="min-w-[720px]">
            <TableHeader className="bg-black/5 dark:bg-white/5">
              <TableRow>
                {tableHeaders.map((header, index) => (
                  <TableHead
                    key={index}
                    className={`text-foreground font-semibold ${index === tableHeaders.length - 1 ? 'text-right' : ''}`}
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => {
                const key = item[keyProp] ? String(item[keyProp]) : index;
                const props = { item, ...tableRowProps } as {
                  item: T;
                } & TRowProps;
                return <TableRowComponent key={key} {...props} />;
              })}
            </TableBody>
          </Table>
        </div>
        <ResourcePagination page={meta.page} totalPages={meta.totalPages} />
      </div>
    );
  }

  return (
    <ResourceGrid emptyState={emptyState}>
      <ResourceInfiniteScroll
        key={JSON.stringify(query)}
        initialItems={items}
        initialMeta={meta}
        loadMore={loadMore}
        ItemComponent={GridItemComponent}
        itemProps={gridItemProps}
        keyProp={keyProp}
      />
    </ResourceGrid>
  );
}
