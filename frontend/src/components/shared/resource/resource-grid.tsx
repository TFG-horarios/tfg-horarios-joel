export interface ResourceGridProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyState: React.ReactNode;
  keyExtractor?: (item: T) => string | number;
}

export async function ResourceGrid<T>({
  items,
  renderItem,
  emptyState,
  keyExtractor,
}: ResourceGridProps<T>) {
  if (items.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => {
        const key = keyExtractor ? keyExtractor(item) : index;
        return <div key={key}>{renderItem(item)}</div>;
      })}
    </div>
  );
}
