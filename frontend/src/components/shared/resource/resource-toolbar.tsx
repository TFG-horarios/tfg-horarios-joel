export interface ResourceToolbarProps {
  search?: React.ReactNode;
  filters?: React.ReactNode;
}

export async function ResourceToolbar({
  search,
  filters,
}: ResourceToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1 w-full">
      {search && <div className="w-full flex-1 sm:max-w-md">{search}</div>}
      {filters && <div className="flex items-center gap-2">{filters}</div>}
    </div>
  );
}
