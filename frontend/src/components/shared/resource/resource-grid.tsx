export interface ResourceGridProps<T = any> {
  items?: T[];
  renderItem?: (item: T) => React.ReactNode;
  emptyState?: React.ReactNode;
  keyExtractor?: (item: T) => string | number;
  children?: React.ReactNode;
}

export function ResourceGrid<T = any>({
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
