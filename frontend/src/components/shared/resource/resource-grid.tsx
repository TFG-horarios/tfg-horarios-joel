import { memo, type ReactNode } from 'react';

export interface ResourceGridProps<T> {
  items?: T[];
  renderItem?: (item: T) => ReactNode;
  emptyState?: ReactNode;
  keyExtractor?: (item: T) => string | number;
  children?: ReactNode;
}

function ResourceGridBase<T>({
  items,
  renderItem,
  emptyState,
  keyExtractor,
  children,
}: ResourceGridProps<T>) {
  const hasItems = items ? items.length > 0 : false;
  const hasChildren = Boolean(children);

  if (!hasItems && !hasChildren) {
    return <>{emptyState}</>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items &&
        renderItem &&
        items.map((item, index) => {
          const key = keyExtractor ? keyExtractor(item) : index;
          return <div key={key}>{renderItem(item)}</div>;
        })}
      {children}
    </div>
  );
}

export const ResourceGrid = memo(ResourceGridBase) as typeof ResourceGridBase;
