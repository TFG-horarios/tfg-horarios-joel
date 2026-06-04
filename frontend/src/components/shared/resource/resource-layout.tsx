import * as React from 'react';
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

export interface ResourceLayoutProps<T> {
  view: 'grid' | 'table';
  items: T[];
  meta: PaginationMetaDTO;
  query: any;
  loadMore: (page: number) => Promise<{ data: T[]; meta: PaginationMetaDTO }>;
  emptyState: React.ReactNode;
  
  GridItemComponent: React.ComponentType<{ item: T } & any>;
  gridItemProps?: Record<string, any>;
  
  tableHeaders: React.ReactNode[];
  TableRowComponent: React.ComponentType<{ item: T } & any>;
  tableRowProps?: Record<string, any>;
  
  keyProp?: keyof T;
}

export function ResourceLayout<T>({
  view,
  items,
  meta,
  query,
  loadMore,
  emptyState,
  GridItemComponent,
  gridItemProps = {},
  tableHeaders,
  TableRowComponent,
  tableRowProps = {},
  keyProp = 'id' as keyof T,
}: ResourceLayoutProps<T>) {
  if (!items || items.length === 0) {
    return <>{emptyState}</>;
  }

  if (view === 'table') {
    return (
      <div className="flex flex-col gap-4">
        <div id="resource-table-container" className="rounded-xl border border-black/10 shadow-lg shadow-black/10 dark:border-white/10 dark:shadow-black/40 overflow-hidden bg-transparent">
          <Table>
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
                return (
                  <TableRowComponent key={key} item={item} {...tableRowProps} />
                );
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
