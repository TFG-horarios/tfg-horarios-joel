'use client';

export interface ResourceToolbarProps {
  search?: React.ReactNode;
  filters?: React.ReactNode;
}

export function ResourceToolbar({ search, filters }: ResourceToolbarProps) {
  return (
    <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-end">
      {search && (
        <div className="w-full min-w-0 lg:w-72 lg:flex-none">{search}</div>
      )}
      {filters && <div className="w-full min-w-0 lg:flex-1">{filters}</div>}
    </div>
  );
}
